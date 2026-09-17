"use client";

import { useRef, useMemo, useCallback } from "react";
import * as Phaser from "phaser";
import { PhaserEmbed } from "./phaser-embed";
import { useThemedPalette } from "./_use-themed-palette";

export interface MazeCollectible {
  label: string;
  color?: string;
}

export interface MazeGameProps {
  size?: number;
  collectibles?: MazeCollectible[];
  fogOfWar?: boolean;
  height?: string;
  className?: string;
  onComplete?: (result: { time: number; collected: number }) => void;
}

const C = {
  bg: 0x060518,
  wall: 0x1e1a40,
  floor: 0x0c0a20,
  player: 0x22d3ee,
  exit: 0x4ade80,
  collectible: 0xfbbf24,
  fog: 0x060518,
  visited: 0x100e22,
  minimap: 0x0e0c24,
  minimapWall: 0x2d2760,
  purple: 0x818cf8,
  text: 0xf3f4f6,
};

// Cell states: walls on each side
interface MazeCell {
  row: number;
  col: number;
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
  visited: boolean;
}

class MazeScene extends Phaser.Scene {
  private gridSize!: number;
  private collectibleDefs!: MazeCollectible[];
  private useFog!: boolean;
  private onComplete?: MazeGameProps["onComplete"];

  private maze: MazeCell[][] = [];
  private cellPx = 0;
  private offsetX = 0;
  private offsetY = 0;
  private playerRow = 0;
  private playerCol = 0;
  private playerSprite!: Phaser.GameObjects.Arc;
  private exitSprite!: Phaser.GameObjects.Arc;
  private collected = 0;
  private totalCollectibles = 0;
  private startTime = 0;
  private moving = false;

  private wallGraphics!: Phaser.GameObjects.Graphics;
  private fogTiles: Phaser.GameObjects.Rectangle[][] = [];
  private revealedSet = new Set<string>();
  private collectibleSprites: Map<string, { sprite: Phaser.GameObjects.Arc; label: Phaser.GameObjects.Text }> = new Map();

  // Minimap
  private minimapGfx!: Phaser.GameObjects.Graphics;
  private minimapDot!: Phaser.GameObjects.Arc;
  private minimapSize = 0;

  // HUD
  private timerText!: Phaser.GameObjects.Text;
  private collectText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "MazeScene" });
  }

  init(data: { size: number; collectibles: MazeCollectible[]; fog: boolean; onComplete?: MazeGameProps["onComplete"] }) {
    this.gridSize = data.size;
    this.collectibleDefs = data.collectibles;
    this.useFog = data.fog;
    this.onComplete = data.onComplete;
    this.maze = [];
    this.collected = 0;
    this.totalCollectibles = 0;
    this.moving = false;
    this.fogTiles = [];
    this.revealedSet = new Set();
    this.collectibleSprites = new Map();
  }

  create() {
    this.startTime = Date.now();
    const w = this.scale.width;
    const h = this.scale.height;
    const hudH = 48;
    const minimapPad = 10;

    this.minimapSize = Math.min(100, h * 0.18);
    const availW = w - this.minimapSize - minimapPad * 3;
    const availH = h - hudH - minimapPad * 2;
    this.cellPx = Math.floor(Math.min(availW / this.gridSize, availH / this.gridSize));
    this.offsetX = Math.floor((availW - this.gridSize * this.cellPx) / 2) + minimapPad;
    this.offsetY = hudH + Math.floor((availH - this.gridSize * this.cellPx) / 2);

    this.generateMaze();
    this.placeCollectibles();
    this.drawMaze();
    this.drawMinimap(w, hudH, minimapPad);

    // Player
    this.playerRow = 0;
    this.playerCol = 0;
    const px = this.offsetX + this.cellPx / 2;
    const py = this.offsetY + this.cellPx / 2;
    this.playerSprite = this.add.circle(px, py, this.cellPx * 0.3, C.player).setDepth(10);

    // Exit marker
    const ex = this.offsetX + (this.gridSize - 1) * this.cellPx + this.cellPx / 2;
    const ey = this.offsetY + (this.gridSize - 1) * this.cellPx + this.cellPx / 2;
    this.exitSprite = this.add.circle(ex, ey, this.cellPx * 0.25, C.exit, 0.4).setStrokeStyle(2, C.exit).setDepth(5);
    this.tweens.add({ targets: this.exitSprite, scale: 1.2, duration: 800, yoyo: true, repeat: -1, ease: "Sine.inOut" });

    // Fog of war
    if (this.useFog) {
      for (let r = 0; r < this.gridSize; r++) {
        this.fogTiles[r] = [];
        for (let c = 0; c < this.gridSize; c++) {
          const fx = this.offsetX + c * this.cellPx + this.cellPx / 2;
          const fy = this.offsetY + r * this.cellPx + this.cellPx / 2;
          this.fogTiles[r][c] = this.add.rectangle(fx, fy, this.cellPx + 2, this.cellPx + 2, C.fog).setDepth(15);
        }
      }
      this.revealAround(0, 0);
    }

    // HUD
    this.add.rectangle(w / 2, hudH / 2, w, hudH, 0x0e0c24).setDepth(20);
    this.add.rectangle(w / 2, hudH, w, 1, 0x2d2760, 0.5).setDepth(20);

    this.timerText = this.add.text(16, hudH / 2, "0:00", {
      fontFamily: "system-ui, sans-serif", fontSize: "12px", fontStyle: "bold", color: "#22D3EE",
    }).setOrigin(0, 0.5).setDepth(21);

    this.collectText = this.add.text(100, hudH / 2, "", {
      fontFamily: "system-ui, sans-serif", fontSize: "12px", fontStyle: "bold", color: "#FBBF24",
    }).setOrigin(0, 0.5).setDepth(21);

    this.hintText = this.add.text(w / 2, hudH / 2, "Arrow keys or WASD to move", {
      fontFamily: "system-ui, sans-serif", fontSize: "10px", color: "#4B5563",
    }).setOrigin(0.5, 0.5).setDepth(21);

    this.updateHUD();

    // Keyboard
    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => this.handleKey(e));

    // Timer
    this.time.addEvent({ delay: 500, loop: true, callback: () => this.updateTimer() });
  }

  private generateMaze() {
    // Initialize grid
    for (let r = 0; r < this.gridSize; r++) {
      this.maze[r] = [];
      for (let c = 0; c < this.gridSize; c++) {
        this.maze[r][c] = { row: r, col: c, walls: { top: true, right: true, bottom: true, left: true }, visited: false };
      }
    }

    // Recursive backtracker
    const stack: MazeCell[] = [];
    const start = this.maze[0][0];
    start.visited = true;
    stack.push(start);

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = this.getUnvisitedNeighbors(current);

      if (neighbors.length === 0) {
        stack.pop();
      } else {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        this.removeWall(current, next);
        next.visited = true;
        stack.push(next);
      }
    }
  }

  private getUnvisitedNeighbors(cell: MazeCell): MazeCell[] {
    const { row, col } = cell;
    const neighbors: MazeCell[] = [];
    if (row > 0 && !this.maze[row - 1][col].visited) neighbors.push(this.maze[row - 1][col]);
    if (row < this.gridSize - 1 && !this.maze[row + 1][col].visited) neighbors.push(this.maze[row + 1][col]);
    if (col > 0 && !this.maze[row][col - 1].visited) neighbors.push(this.maze[row][col - 1]);
    if (col < this.gridSize - 1 && !this.maze[row][col + 1].visited) neighbors.push(this.maze[row][col + 1]);
    return neighbors;
  }

  private removeWall(a: MazeCell, b: MazeCell) {
    const dr = b.row - a.row;
    const dc = b.col - a.col;
    if (dr === -1) { a.walls.top = false; b.walls.bottom = false; }
    if (dr === 1) { a.walls.bottom = false; b.walls.top = false; }
    if (dc === -1) { a.walls.left = false; b.walls.right = false; }
    if (dc === 1) { a.walls.right = false; b.walls.left = false; }
  }

  private placeCollectibles() {
    const positions = new Set<string>();
    positions.add("0,0");
    positions.add(`${this.gridSize - 1},${this.gridSize - 1}`);

    const items = this.collectibleDefs.slice(0, Math.min(this.collectibleDefs.length, Math.floor(this.gridSize * this.gridSize * 0.12)));
    this.totalCollectibles = items.length;

    items.forEach((item) => {
      let r: number, c: number, key: string;
      do {
        r = Math.floor(Math.random() * this.gridSize);
        c = Math.floor(Math.random() * this.gridSize);
        key = `${r},${c}`;
      } while (positions.has(key));
      positions.add(key);

      const color = item.color ? Phaser.Display.Color.HexStringToColor(item.color).color : C.collectible;
      const cx = this.offsetX + c * this.cellPx + this.cellPx / 2;
      const cy = this.offsetY + r * this.cellPx + this.cellPx / 2;

      const sprite = this.add.circle(cx, cy, this.cellPx * 0.15, color, 0.8).setDepth(6);
      const label = this.add.text(cx, cy + this.cellPx * 0.25, item.label, {
        fontFamily: "system-ui, sans-serif", fontSize: "7px", color: "#FBBF24", align: "center",
      }).setOrigin(0.5, 0).setDepth(6);

      this.tweens.add({ targets: sprite, scale: 1.3, duration: 600, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      this.collectibleSprites.set(key, { sprite, label });
    });
  }

  private drawMaze() {
    this.wallGraphics = this.add.graphics().setDepth(4);
    this.wallGraphics.lineStyle(2, C.wall);

    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const cell = this.maze[r][c];
        const x = this.offsetX + c * this.cellPx;
        const y = this.offsetY + r * this.cellPx;

        // Floor
        this.add.rectangle(x + this.cellPx / 2, y + this.cellPx / 2, this.cellPx, this.cellPx, C.floor).setDepth(1);

        if (cell.walls.top) { this.wallGraphics.moveTo(x, y); this.wallGraphics.lineTo(x + this.cellPx, y); }
        if (cell.walls.right) { this.wallGraphics.moveTo(x + this.cellPx, y); this.wallGraphics.lineTo(x + this.cellPx, y + this.cellPx); }
        if (cell.walls.bottom) { this.wallGraphics.moveTo(x, y + this.cellPx); this.wallGraphics.lineTo(x + this.cellPx, y + this.cellPx); }
        if (cell.walls.left) { this.wallGraphics.moveTo(x, y); this.wallGraphics.lineTo(x, y + this.cellPx); }
      }
    }
    this.wallGraphics.strokePath();
  }

  private drawMinimap(sceneW: number, hudH: number, pad: number) {
    const mx = sceneW - this.minimapSize - pad;
    const my = hudH + pad;
    const cellMini = this.minimapSize / this.gridSize;

    this.add.rectangle(mx + this.minimapSize / 2, my + this.minimapSize / 2, this.minimapSize + 4, this.minimapSize + 4, C.minimap).setStrokeStyle(1, 0x2d2760).setDepth(18);

    this.minimapGfx = this.add.graphics().setDepth(19);
    this.minimapGfx.lineStyle(1, C.minimapWall, 0.5);

    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const cell = this.maze[r][c];
        const x = mx + c * cellMini;
        const y = my + r * cellMini;
        if (cell.walls.top) { this.minimapGfx.moveTo(x, y); this.minimapGfx.lineTo(x + cellMini, y); }
        if (cell.walls.right) { this.minimapGfx.moveTo(x + cellMini, y); this.minimapGfx.lineTo(x + cellMini, y + cellMini); }
        if (cell.walls.bottom) { this.minimapGfx.moveTo(x, y + cellMini); this.minimapGfx.lineTo(x + cellMini, y + cellMini); }
        if (cell.walls.left) { this.minimapGfx.moveTo(x, y); this.minimapGfx.lineTo(x, y + cellMini); }
      }
    }
    this.minimapGfx.strokePath();

    // Exit on minimap
    this.add.circle(mx + (this.gridSize - 0.5) * cellMini, my + (this.gridSize - 0.5) * cellMini, cellMini * 0.3, C.exit, 0.6).setDepth(19);

    // Player dot on minimap
    this.minimapDot = this.add.circle(mx + cellMini / 2, my + cellMini / 2, cellMini * 0.4, C.player).setDepth(19);
  }

  private revealAround(row: number, col: number) {
    const radius = 2;
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        const r = row + dr;
        const c = col + dc;
        if (r < 0 || r >= this.gridSize || c < 0 || c >= this.gridSize) continue;
        const key = `${r},${c}`;
        if (this.revealedSet.has(key)) continue;
        this.revealedSet.add(key);

        const dist = Math.abs(dr) + Math.abs(dc);
        if (dist <= radius) {
          this.fogTiles[r]?.[c]?.destroy();
        } else if (dist <= radius + 1) {
          this.fogTiles[r]?.[c]?.setAlpha(0.6);
        }
      }
    }
  }

  private handleKey(e: KeyboardEvent) {
    if (this.moving) return;
    let dr = 0, dc = 0;
    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") dr = -1;
    else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") dr = 1;
    else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") dc = -1;
    else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") dc = 1;
    else return;

    e.preventDefault();
    const cell = this.maze[this.playerRow][this.playerCol];
    if (dr === -1 && cell.walls.top) return;
    if (dr === 1 && cell.walls.bottom) return;
    if (dc === -1 && cell.walls.left) return;
    if (dc === 1 && cell.walls.right) return;

    this.playerRow += dr;
    this.playerCol += dc;
    this.moving = true;

    const nx = this.offsetX + this.playerCol * this.cellPx + this.cellPx / 2;
    const ny = this.offsetY + this.playerRow * this.cellPx + this.cellPx / 2;

    this.tweens.add({
      targets: this.playerSprite, x: nx, y: ny, duration: 80, ease: "Sine.Out",
      onComplete: () => {
        this.moving = false;
        this.checkCell();
      },
    });

    // Update minimap dot
    const mmCellSize = this.minimapSize / this.gridSize;
    const mmBaseX = this.minimapDot.x - this.playerCol * mmCellSize;
    const mmBaseY = this.minimapDot.y - this.playerRow * mmCellSize;
    this.minimapDot.setPosition(
      mmBaseX + this.playerCol * mmCellSize + (dc * mmCellSize),
      mmBaseY + this.playerRow * mmCellSize + (dr * mmCellSize)
    );

    if (this.useFog) this.revealAround(this.playerRow, this.playerCol);
    this.hintText.setVisible(false);
  }

  private checkCell() {
    const key = `${this.playerRow},${this.playerCol}`;

    // Collectible
    const c = this.collectibleSprites.get(key);
    if (c) {
      c.sprite.destroy();
      c.label.destroy();
      this.collectibleSprites.delete(key);
      this.collected++;
      this.updateHUD();
    }

    // Exit
    if (this.playerRow === this.gridSize - 1 && this.playerCol === this.gridSize - 1) {
      this.showVictory();
    }
  }

  private updateHUD() {
    this.collectText.setText(`Items: ${this.collected}/${this.totalCollectibles}`);
  }

  private updateTimer() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    this.timerText.setText(`${m}:${s.toString().padStart(2, "0")}`);
  }

  private showVictory() {
    const w = this.scale.width;
    const h = this.scale.height;
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);

    this.input.keyboard?.removeAllListeners();
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.85).setDepth(30);

    this.add.text(w / 2, h / 2 - 50, "Maze Complete!", {
      fontFamily: "system-ui, sans-serif", fontSize: "28px", fontStyle: "bold", color: "#4ADE80",
    }).setOrigin(0.5).setDepth(31);

    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    this.add.text(w / 2, h / 2, `${m}:${s.toString().padStart(2, "0")}  •  ${this.collected}/${this.totalCollectibles} collected`, {
      fontFamily: "system-ui, sans-serif", fontSize: "14px", color: "#9CA3AF",
    }).setOrigin(0.5).setDepth(31);

    const bg = this.add.rectangle(w / 2, h / 2 + 50, 150, 44, C.purple).setInteractive({ useHandCursor: true }).setDepth(32);
    this.add.text(w / 2, h / 2 + 50, "Play Again", {
      fontFamily: "system-ui, sans-serif", fontSize: "14px", fontStyle: "bold", color: "#FFFFFF",
    }).setOrigin(0.5).setDepth(32);
    bg.on("pointerdown", () => this.scene.restart({
      size: this.gridSize, collectibles: this.collectibleDefs, fog: this.useFog, onComplete: this.onComplete,
    }));

    this.onComplete?.({ time: elapsed, collected: this.collected });
  }
}

export function MazeGame({ size = 12, collectibles = [], fogOfWar = true, height = "540px", className, onComplete }: MazeGameProps) {
  const cbRef = useRef(onComplete);
  cbRef.current = onComplete;
  const palette = useThemedPalette(C, ({ brand }) => ({ player: brand[0] }));

  const config = useMemo((): Phaser.Types.Core.GameConfig => ({
    type: Phaser.AUTO, backgroundColor: "#060518", scene: MazeScene,
    input: { mouse: { preventDefaultWheel: false } },
  }), []);

  const handleReady = useCallback((game: Phaser.Game) => {
    game.scene.start("MazeScene", {
      size, collectibles, fog: fogOfWar,
      onComplete: (r: { time: number; collected: number }) => cbRef.current?.(r),
    });
  }, [size, collectibles, fogOfWar]);

  return <PhaserEmbed key={palette.cacheKey} config={config} height={height} className={className} onReady={handleReady} />;
}
