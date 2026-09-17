"use client";

import { useRef, useMemo, useCallback } from "react";
import * as Phaser from "phaser";
import { PhaserEmbed } from "./phaser-embed";
import { useThemedPalette } from "./_use-themed-palette";

export interface PipeConnectProps {
  gridSize?: number;
  difficulty?: "easy" | "medium" | "hard";
  height?: string;
  className?: string;
  onComplete?: (result: { time: number; moves: number }) => void;
}

const C = {
  bg: 0x060518,
  cell: 0x0c0a20,
  cellBorder: 0x1a1640,
  pipe: 0x818cf8,
  pipeGlow: 0x22d3ee,
  filled: 0x22d3ee,
  source: 0x4ade80,
  sink: 0xf87171,
  text: 0xf3f4f6,
  muted: 0x6b7280,
  surface: 0x0e0c24,
  border: 0x2d2760,
  purple: 0x818cf8,
};

// Pipe types: openings [top, right, bottom, left]
type Openings = [boolean, boolean, boolean, boolean];

const PIPE_TYPES: { name: string; openings: Openings }[] = [
  { name: "straight-h", openings: [false, true, false, true] },
  { name: "straight-v", openings: [true, false, true, false] },
  { name: "bend-tr", openings: [true, true, false, false] },
  { name: "bend-rb", openings: [false, true, true, false] },
  { name: "bend-bl", openings: [false, false, true, true] },
  { name: "bend-lt", openings: [true, false, false, true] },
  { name: "tee-trb", openings: [true, true, true, false] },
  { name: "tee-rbl", openings: [false, true, true, true] },
  { name: "tee-blt", openings: [true, false, true, true] },
  { name: "tee-ltr", openings: [true, true, false, true] },
  { name: "cross", openings: [true, true, true, true] },
];

function rotateOpenings(o: Openings): Openings {
  return [o[3], o[0], o[1], o[2]];
}

interface PipeCell {
  row: number;
  col: number;
  openings: Openings;
  correctOpenings: Openings;
  rotation: number;
  isSource: boolean;
  isSink: boolean;
  isEmpty: boolean;
  container?: Phaser.GameObjects.Container;
  gfx?: Phaser.GameObjects.Graphics;
  connected: boolean;
}

class PipeScene extends Phaser.Scene {
  private gridSize!: number;
  private difficulty!: string;
  private onComplete?: PipeConnectProps["onComplete"];
  private grid: PipeCell[][] = [];
  private cellPx = 0;
  private offsetX = 0;
  private offsetY = 0;
  private moves = 0;
  private startTime = 0;
  private solved = false;

  private movesText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "PipeScene" });
  }

  init(data: { gridSize: number; difficulty: string; onComplete?: PipeConnectProps["onComplete"] }) {
    this.gridSize = data.gridSize;
    this.difficulty = data.difficulty;
    this.onComplete = data.onComplete;
    this.grid = [];
    this.moves = 0;
    this.solved = false;
  }

  create() {
    this.startTime = Date.now();
    const w = this.scale.width;
    const h = this.scale.height;
    const hudH = 48;

    const availSize = Math.min(w - 32, h - hudH - 32);
    this.cellPx = Math.floor(availSize / this.gridSize);
    this.offsetX = Math.floor((w - this.gridSize * this.cellPx) / 2);
    this.offsetY = hudH + Math.floor((h - hudH - this.gridSize * this.cellPx) / 2);

    this.generatePuzzle();
    this.drawGrid();

    // HUD
    this.add.rectangle(w / 2, hudH / 2, w, hudH, C.surface).setDepth(20);
    this.add.rectangle(w / 2, hudH, w, 1, C.border, 0.5).setDepth(20);

    this.timerText = this.add.text(16, hudH / 2, "0:00", {
      fontFamily: "system-ui, sans-serif", fontSize: "12px", fontStyle: "bold", color: "#22D3EE",
    }).setOrigin(0, 0.5).setDepth(21);

    this.movesText = this.add.text(100, hudH / 2, "Moves: 0", {
      fontFamily: "system-ui, sans-serif", fontSize: "12px", fontStyle: "bold", color: "#FBBF24",
    }).setOrigin(0, 0.5).setDepth(21);

    this.statusText = this.add.text(w / 2, hudH / 2, "Click tiles to rotate pipes", {
      fontFamily: "system-ui, sans-serif", fontSize: "10px", color: "#4B5563",
    }).setOrigin(0.5, 0.5).setDepth(21);

    // Timer
    this.time.addEvent({ delay: 500, loop: true, callback: () => this.updateTimer() });
  }

  private generatePuzzle() {
    // Step 1: Generate a solved path from source to sink using DFS
    const source = { row: 0, col: 0 };
    const sink = { row: this.gridSize - 1, col: this.gridSize - 1 };

    // Initialize grid
    for (let r = 0; r < this.gridSize; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.gridSize; c++) {
        this.grid[r][c] = {
          row: r, col: c,
          openings: [false, false, false, false],
          correctOpenings: [false, false, false, false],
          rotation: 0,
          isSource: r === source.row && c === source.col,
          isSink: r === sink.row && c === sink.col,
          isEmpty: false,
          connected: false,
        };
      }
    }

    // Use a random spanning tree to create the solution
    const visited = new Set<string>();
    const stack: [number, number][] = [[0, 0]];
    visited.add("0,0");

    while (stack.length > 0) {
      const [cr, cc] = stack[stack.length - 1];
      const neighbors: [number, number, number][] = []; // [row, col, direction]

      const dirs: [number, number, number][] = [[cr - 1, cc, 0], [cr, cc + 1, 1], [cr + 1, cc, 2], [cr, cc - 1, 3]];
      for (const [nr, nc, d] of dirs) {
        if (nr >= 0 && nr < this.gridSize && nc >= 0 && nc < this.gridSize && !visited.has(`${nr},${nc}`)) {
          neighbors.push([nr, nc, d]);
        }
      }

      if (neighbors.length === 0) {
        stack.pop();
      } else {
        const [nr, nc, d] = neighbors[Math.floor(Math.random() * neighbors.length)];
        visited.add(`${nr},${nc}`);
        stack.push([nr, nc]);

        // Connect cells
        this.grid[cr][cc].correctOpenings[d] = true;
        const opposite = [2, 3, 0, 1][d];
        this.grid[nr][nc].correctOpenings[opposite] = true;
      }
    }

    // Copy correct openings and randomize rotations
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const cell = this.grid[r][c];
        cell.openings = [...cell.correctOpenings] as Openings;

        // Random rotations (1-3 clockwise turns)
        const rotations = Math.floor(Math.random() * 4);
        for (let i = 0; i < rotations; i++) {
          cell.openings = rotateOpenings(cell.openings);
          cell.rotation += 90;
        }
      }
    }
  }

  private drawGrid() {
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const cell = this.grid[r][c];
        const cx = this.offsetX + c * this.cellPx + this.cellPx / 2;
        const cy = this.offsetY + r * this.cellPx + this.cellPx / 2;

        const container = this.add.container(cx, cy);

        // Background
        const bg = this.add.rectangle(0, 0, this.cellPx - 2, this.cellPx - 2, C.cell)
          .setStrokeStyle(1, C.cellBorder)
          .setInteractive({ useHandCursor: true });

        container.add(bg);

        // Draw pipe
        const gfx = this.add.graphics();
        container.add(gfx);
        cell.gfx = gfx;
        cell.container = container;

        this.drawPipe(cell);

        // Source/sink markers
        if (cell.isSource) {
          const marker = this.add.circle(0, 0, this.cellPx * 0.15, C.source).setDepth(2);
          container.add(marker);
        }
        if (cell.isSink) {
          const marker = this.add.circle(0, 0, this.cellPx * 0.15, C.sink).setDepth(2);
          container.add(marker);
        }

        bg.on("pointerdown", () => {
          if (this.solved) return;
          cell.openings = rotateOpenings(cell.openings);
          cell.rotation += 90;
          this.moves++;
          this.movesText.setText(`Moves: ${this.moves}`);
          this.drawPipe(cell);
          this.checkSolution();
        });
      }
    }
  }

  private drawPipe(cell: PipeCell) {
    const gfx = cell.gfx;
    if (!gfx) return;
    gfx.clear();

    const half = this.cellPx / 2;
    const pipeW = this.cellPx * 0.22;
    const color = cell.connected ? C.filled : C.pipe;
    const alpha = cell.connected ? 0.9 : 0.5;

    gfx.fillStyle(color, alpha);

    // Center hub
    gfx.fillRect(-pipeW / 2, -pipeW / 2, pipeW, pipeW);

    // Extensions
    if (cell.openings[0]) gfx.fillRect(-pipeW / 2, -half, pipeW, half - pipeW / 2); // top
    if (cell.openings[1]) gfx.fillRect(pipeW / 2, -pipeW / 2, half - pipeW / 2, pipeW); // right
    if (cell.openings[2]) gfx.fillRect(-pipeW / 2, pipeW / 2, pipeW, half - pipeW / 2); // bottom
    if (cell.openings[3]) gfx.fillRect(-half, -pipeW / 2, half - pipeW / 2, pipeW); // left

    // Glow outline for connected
    if (cell.connected) {
      gfx.lineStyle(1, C.pipeGlow, 0.3);
      if (cell.openings[0]) gfx.strokeRect(-pipeW / 2, -half, pipeW, half - pipeW / 2);
      if (cell.openings[1]) gfx.strokeRect(pipeW / 2, -pipeW / 2, half - pipeW / 2, pipeW);
      if (cell.openings[2]) gfx.strokeRect(-pipeW / 2, pipeW / 2, pipeW, half - pipeW / 2);
      if (cell.openings[3]) gfx.strokeRect(-half, -pipeW / 2, half - pipeW / 2, pipeW);
    }
  }

  private checkSolution() {
    // BFS from source, following connected openings
    const visited = new Set<string>();
    const queue: [number, number][] = [[0, 0]];
    visited.add("0,0");

    // Reset connected state
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        this.grid[r][c].connected = false;
      }
    }
    this.grid[0][0].connected = true;

    const dirMap: [number, number][] = [[-1, 0], [0, 1], [1, 0], [0, -1]];
    const opposites = [2, 3, 0, 1];

    while (queue.length > 0) {
      const [cr, cc] = queue.shift()!;
      const cell = this.grid[cr][cc];

      for (let d = 0; d < 4; d++) {
        if (!cell.openings[d]) continue;
        const [dr, dc] = dirMap[d];
        const nr = cr + dr;
        const nc = cc + dc;
        const key = `${nr},${nc}`;

        if (nr < 0 || nr >= this.gridSize || nc < 0 || nc >= this.gridSize) continue;
        if (visited.has(key)) continue;

        const neighbor = this.grid[nr][nc];
        if (neighbor.openings[opposites[d]]) {
          visited.add(key);
          neighbor.connected = true;
          queue.push([nr, nc]);
        }
      }
    }

    // Redraw all pipes with updated connected state
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        this.drawPipe(this.grid[r][c]);
      }
    }

    // Check if sink is connected
    if (this.grid[this.gridSize - 1][this.gridSize - 1].connected) {
      // Also check all cells are connected (perfect solution)
      let allConnected = true;
      for (let r = 0; r < this.gridSize; r++) {
        for (let c = 0; c < this.gridSize; c++) {
          if (!this.grid[r][c].connected) { allConnected = false; break; }
        }
        if (!allConnected) break;
      }

      if (allConnected) {
        this.solved = true;
        this.time.delayedCall(300, () => this.showVictory());
      }
    }
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

    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.85).setDepth(30);

    this.add.text(w / 2, h / 2 - 50, "Flow Connected!", {
      fontFamily: "system-ui, sans-serif", fontSize: "28px", fontStyle: "bold", color: "#22D3EE",
    }).setOrigin(0.5).setDepth(31);

    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    this.add.text(w / 2, h / 2, `${m}:${s.toString().padStart(2, "0")}  •  ${this.moves} moves`, {
      fontFamily: "system-ui, sans-serif", fontSize: "14px", color: "#9CA3AF",
    }).setOrigin(0.5).setDepth(31);

    const bg = this.add.rectangle(w / 2, h / 2 + 50, 150, 44, C.purple).setInteractive({ useHandCursor: true }).setDepth(32);
    this.add.text(w / 2, h / 2 + 50, "Play Again", {
      fontFamily: "system-ui, sans-serif", fontSize: "14px", fontStyle: "bold", color: "#FFFFFF",
    }).setOrigin(0.5).setDepth(32);
    bg.on("pointerdown", () => this.scene.restart({
      gridSize: this.gridSize, difficulty: this.difficulty, onComplete: this.onComplete,
    }));

    this.onComplete?.({ time: elapsed, moves: this.moves });
  }
}

export function PipeConnectGame({ gridSize = 6, difficulty = "medium", height = "540px", className, onComplete }: PipeConnectProps) {
  const cbRef = useRef(onComplete);
  cbRef.current = onComplete;
  const palette = useThemedPalette(C, ({ brand }) => ({
    pipe: brand[1],
    pipeGlow: brand[0],
    filled: brand[0],
    purple: brand[1],
  }));

  const config = useMemo((): Phaser.Types.Core.GameConfig => ({
    type: Phaser.AUTO, backgroundColor: "#060518", scene: PipeScene,
    input: { mouse: { preventDefaultWheel: false } },
  }), []);

  const handleReady = useCallback((game: Phaser.Game) => {
    game.scene.start("PipeScene", {
      gridSize, difficulty,
      onComplete: (r: { time: number; moves: number }) => cbRef.current?.(r),
    });
  }, [gridSize, difficulty]);

  return <PhaserEmbed key={palette.cacheKey} config={config} height={height} className={className} onReady={handleReady} />;
}
