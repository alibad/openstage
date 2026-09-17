"use client";

import { useRef, useMemo, useCallback } from "react";
import * as Phaser from "phaser";
import { PhaserEmbed } from "./phaser-embed";
import { useThemedPalette } from "./_use-themed-palette";

export interface TowerType {
  id: string;
  label: string;
  color: string;
  range: number;
  damage: number;
  fireRate: number;
  cost: number;
  description?: string;
}

export interface TowerDefenseProps {
  towers?: TowerType[];
  waves?: number;
  startGold?: number;
  height?: string;
  className?: string;
  onComplete?: (result: { wavesCleared: number; score: number }) => void;
}

const DEFAULT_TOWERS: TowerType[] = [
  { id: "blaster", label: "Blaster", color: "#22d3ee", range: 100, damage: 15, fireRate: 800, cost: 50, description: "Fast single-target" },
  { id: "cannon", label: "Cannon", color: "#F87171", range: 80, damage: 40, fireRate: 1500, cost: 100, description: "Heavy splash damage" },
  { id: "frost", label: "Frost", color: "#818CF8", range: 120, damage: 5, fireRate: 600, cost: 75, description: "Slows enemies" },
  { id: "sniper", label: "Sniper", color: "#FBBF24", range: 180, damage: 60, fireRate: 2000, cost: 125, description: "Long range, high damage" },
];

const CELL = 40;
const COLS = 16;
const ROWS = 10;

const C = {
  bg: 0x060518,
  grid: 0x0c0a20,
  gridLine: 0x1a1640,
  path: 0x1e1a40,
  pathBorder: 0x2d2760,
  surface: 0x13102a,
  border: 0x2d2760,
  text: 0xf3f4f6,
  muted: 0x6b7280,
  gold: 0xfbbf24,
  red: 0xf87171,
  green: 0x4ade80,
  purple: 0x818cf8,
};

// Predefined path through the grid (column, row pairs)
const PATH_POINTS = [
  [0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [4, 3], [4, 2], [4, 1],
  [5, 1], [6, 1], [7, 1], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
  [8, 6], [8, 7], [9, 7], [10, 7], [11, 7], [12, 7], [12, 6], [12, 5],
  [12, 4], [12, 3], [13, 3], [14, 3], [15, 3],
];

interface PlacedTower {
  type: TowerType;
  col: number;
  row: number;
  sprite: Phaser.GameObjects.Arc;
  rangeCircle: Phaser.GameObjects.Arc;
  lastFired: number;
}

interface Enemy {
  sprite: Phaser.GameObjects.Arc;
  hpBar: Phaser.GameObjects.Rectangle;
  hpBg: Phaser.GameObjects.Rectangle;
  hp: number;
  maxHp: number;
  speed: number;
  pathIdx: number;
  x: number;
  y: number;
  slowed: number;
  reward: number;
  alive: boolean;
}

interface Projectile {
  sprite: Phaser.GameObjects.Arc;
  target: Enemy;
  tower: PlacedTower;
  speed: number;
}

class TDScene extends Phaser.Scene {
  private towerTypes!: TowerType[];
  private totalWaves!: number;
  private onComplete?: TowerDefenseProps["onComplete"];

  private gold = 200;
  private lives = 20;
  private score = 0;
  private wave = 0;
  private waveActive = false;
  private selectedTower: TowerType | null = null;
  private pathSet = new Set<string>();

  private towers: PlacedTower[] = [];
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private spawnTimer?: Phaser.Time.TimerEvent;

  private goldText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private startBtn!: Phaser.GameObjects.Rectangle;
  private startLabel!: Phaser.GameObjects.Text;
  private hoverGhost?: Phaser.GameObjects.Arc;
  private hoverRange?: Phaser.GameObjects.Arc;
  private towerBtns: { bg: Phaser.GameObjects.Rectangle; border: Phaser.GameObjects.Rectangle }[] = [];

  private gridOffsetX = 0;
  private gridOffsetY = 0;

  constructor() {
    super({ key: "TDScene" });
  }

  init(data: { towers: TowerType[]; waves: number; startGold: number; onComplete?: TowerDefenseProps["onComplete"] }) {
    this.towerTypes = data.towers;
    this.totalWaves = data.waves;
    this.gold = data.startGold;
    this.onComplete = data.onComplete;
    this.lives = 20;
    this.score = 0;
    this.wave = 0;
    this.waveActive = false;
    this.selectedTower = null;
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.towerBtns = [];
    this.pathSet = new Set(PATH_POINTS.map(([c, r]) => `${c},${r}`));
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const panelH = 64;
    this.gridOffsetX = Math.floor((w - COLS * CELL) / 2);
    this.gridOffsetY = panelH;

    // Grid background
    this.add.rectangle(w / 2, panelH + (ROWS * CELL) / 2, COLS * CELL, ROWS * CELL, C.grid);

    // Grid lines
    for (let c = 0; c <= COLS; c++) {
      this.add.rectangle(this.gridOffsetX + c * CELL, panelH + (ROWS * CELL) / 2, 1, ROWS * CELL, C.gridLine, 0.3);
    }
    for (let r = 0; r <= ROWS; r++) {
      this.add.rectangle(this.gridOffsetX + (COLS * CELL) / 2, panelH + r * CELL, COLS * CELL, 1, C.gridLine, 0.3);
    }

    // Path
    PATH_POINTS.forEach(([c, r]) => {
      this.add.rectangle(
        this.gridOffsetX + c * CELL + CELL / 2,
        this.gridOffsetY + r * CELL + CELL / 2,
        CELL - 2, CELL - 2, C.path
      ).setStrokeStyle(1, C.pathBorder, 0.3);
    });

    // Path direction arrows (every 4 cells)
    for (let i = 0; i < PATH_POINTS.length - 1; i += 4) {
      const [cx, cy] = PATH_POINTS[i];
      const [nx, ny] = PATH_POINTS[Math.min(i + 1, PATH_POINTS.length - 1)];
      const dx = nx - cx;
      const dy = ny - cy;
      const angle = Math.atan2(dy, dx);
      const ax = this.gridOffsetX + cx * CELL + CELL / 2;
      const ay = this.gridOffsetY + cy * CELL + CELL / 2;
      const arrow = this.add.triangle(ax, ay, -4, -3, 6, 0, -4, 3, C.muted, 0.25);
      arrow.setRotation(angle);
    }

    // Top panel
    this.add.rectangle(w / 2, panelH / 2, w, panelH, C.surface);
    this.add.rectangle(w / 2, panelH, w, 1, C.border, 0.5);

    this.goldText = this.add.text(16, panelH / 2, "", { fontFamily: "system-ui, sans-serif", fontSize: "12px", fontStyle: "bold", color: "#FBBF24" }).setOrigin(0, 0.5);
    this.livesText = this.add.text(110, panelH / 2, "", { fontFamily: "system-ui, sans-serif", fontSize: "12px", fontStyle: "bold", color: "#F87171" }).setOrigin(0, 0.5);
    this.waveText = this.add.text(200, panelH / 2, "", { fontFamily: "system-ui, sans-serif", fontSize: "12px", fontStyle: "bold", color: "#818CF8" }).setOrigin(0, 0.5);
    this.scoreText = this.add.text(310, panelH / 2, "", { fontFamily: "system-ui, sans-serif", fontSize: "12px", color: "#9CA3AF" }).setOrigin(0, 0.5);

    // Start wave button
    this.startBtn = this.add.rectangle(w - 80, panelH / 2, 120, 32, C.green, 0.15)
      .setStrokeStyle(1, C.green, 0.4)
      .setInteractive({ useHandCursor: true });
    this.startLabel = this.add.text(w - 80, panelH / 2, "Start Wave", {
      fontFamily: "system-ui, sans-serif", fontSize: "11px", fontStyle: "bold", color: "#4ADE80",
    }).setOrigin(0.5, 0.5);
    this.startBtn.on("pointerdown", () => this.startWave());

    // Tower shop (bottom)
    const shopY = panelH + ROWS * CELL + 16;
    this.towerTypes.forEach((t, i) => {
      const bx = this.gridOffsetX + i * 150;
      const bg = this.add.rectangle(bx + 65, shopY + 20, 140, 36, C.surface)
        .setInteractive({ useHandCursor: true });
      const border = this.add.rectangle(bx + 65, shopY + 20, 140, 36).setStrokeStyle(1, C.border);

      this.add.circle(bx + 18, shopY + 20, 8, Phaser.Display.Color.HexStringToColor(t.color).color);
      this.add.text(bx + 34, shopY + 13, t.label, {
        fontFamily: "system-ui, sans-serif", fontSize: "11px", fontStyle: "bold", color: "#E5E7EB",
      });
      this.add.text(bx + 34, shopY + 26, `$${t.cost}`, {
        fontFamily: "system-ui, sans-serif", fontSize: "9px", color: "#FBBF24",
      });
      if (t.description) {
        this.add.text(bx + 80, shopY + 26, t.description, {
          fontFamily: "system-ui, sans-serif", fontSize: "8px", color: "#6B7280",
        });
      }

      bg.on("pointerdown", () => this.selectTowerType(t, i));
      this.towerBtns.push({ bg, border });
    });

    // Grid click handler
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => this.handleGridClick(p));
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => this.handleHover(p));

    this.updateHUD();
  }

  update(_time: number, delta: number) {
    this.updateEnemies(delta);
    this.updateTowers();
    this.updateProjectiles(delta);
  }

  private selectTowerType(t: TowerType, idx: number) {
    if (this.gold < t.cost) return;
    this.selectedTower = this.selectedTower?.id === t.id ? null : t;

    this.towerBtns.forEach((btn, i) => {
      const isSelected = this.selectedTower && i === idx;
      btn.border.setStrokeStyle(isSelected ? 2 : 1, isSelected ? C.green : C.border, isSelected ? 0.8 : 1);
    });

    if (!this.selectedTower) {
      this.hoverGhost?.destroy();
      this.hoverRange?.destroy();
      this.hoverGhost = undefined;
      this.hoverRange = undefined;
    }
  }

  private handleHover(p: Phaser.Input.Pointer) {
    if (!this.selectedTower) return;
    const col = Math.floor((p.x - this.gridOffsetX) / CELL);
    const row = Math.floor((p.y - this.gridOffsetY) / CELL);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) {
      this.hoverGhost?.setVisible(false);
      this.hoverRange?.setVisible(false);
      return;
    }

    const cx = this.gridOffsetX + col * CELL + CELL / 2;
    const cy = this.gridOffsetY + row * CELL + CELL / 2;
    const canPlace = !this.pathSet.has(`${col},${row}`) && !this.towers.some((t) => t.col === col && t.row === row);
    const color = Phaser.Display.Color.HexStringToColor(this.selectedTower.color).color;

    if (!this.hoverGhost) {
      this.hoverGhost = this.add.circle(cx, cy, 10, color, 0.4).setDepth(10);
      this.hoverRange = this.add.circle(cx, cy, this.selectedTower.range, color, 0.05).setStrokeStyle(1, color, 0.15).setDepth(9);
    } else {
      this.hoverGhost.setPosition(cx, cy).setFillStyle(canPlace ? color : C.red, 0.4).setVisible(true);
      this.hoverRange?.setPosition(cx, cy).setRadius(this.selectedTower.range).setVisible(true);
    }
  }

  private handleGridClick(p: Phaser.Input.Pointer) {
    if (!this.selectedTower) return;
    const col = Math.floor((p.x - this.gridOffsetX) / CELL);
    const row = Math.floor((p.y - this.gridOffsetY) / CELL);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
    if (this.pathSet.has(`${col},${row}`)) return;
    if (this.towers.some((t) => t.col === col && t.row === row)) return;
    if (this.gold < this.selectedTower.cost) return;

    this.gold -= this.selectedTower.cost;
    const cx = this.gridOffsetX + col * CELL + CELL / 2;
    const cy = this.gridOffsetY + row * CELL + CELL / 2;
    const color = Phaser.Display.Color.HexStringToColor(this.selectedTower.color).color;

    const sprite = this.add.circle(cx, cy, 12, color).setStrokeStyle(2, 0xffffff, 0.15).setDepth(5);
    const rangeCircle = this.add.circle(cx, cy, this.selectedTower.range, color, 0).setDepth(4);

    this.towers.push({ type: this.selectedTower, col, row, sprite, rangeCircle, lastFired: 0 });
    this.updateHUD();
  }

  private startWave() {
    if (this.waveActive || this.wave >= this.totalWaves) return;
    this.wave++;
    this.waveActive = true;
    this.startBtn.setAlpha(0.3);

    const enemyCount = 5 + this.wave * 3;
    const baseHp = 40 + this.wave * 25;
    const speed = 0.8 + Math.min(this.wave * 0.05, 0.5);
    let spawned = 0;

    this.spawnTimer = this.time.addEvent({
      delay: 600,
      repeat: enemyCount - 1,
      callback: () => {
        spawned++;
        const isBoss = spawned === enemyCount && this.wave % 3 === 0;
        this.spawnEnemy(isBoss ? baseHp * 3 : baseHp, isBoss ? speed * 0.6 : speed, isBoss ? 30 : 10, isBoss);
      },
    });

    this.updateHUD();
  }

  private spawnEnemy(hp: number, speed: number, reward: number, isBoss: boolean) {
    const [sc, sr] = PATH_POINTS[0];
    const x = this.gridOffsetX + sc * CELL + CELL / 2;
    const y = this.gridOffsetY + sr * CELL + CELL / 2;
    const r = isBoss ? 12 : 7;

    const sprite = this.add.circle(x, y, r, isBoss ? C.gold : C.red).setDepth(6);
    const hpBg = this.add.rectangle(x, y - r - 6, 20, 3, 0x000000, 0.5).setDepth(7);
    const hpBar = this.add.rectangle(x, y - r - 6, 20, 3, C.green).setDepth(8);

    this.enemies.push({ sprite, hpBar, hpBg, hp, maxHp: hp, speed, pathIdx: 0, x, y, slowed: 0, reward, alive: true });
  }

  private updateEnemies(delta: number) {
    const dt = delta / 1000;
    let allDead = true;

    for (const e of this.enemies) {
      if (!e.alive) continue;
      allDead = false;

      const slowMult = e.slowed > 0 ? 0.4 : 1;
      if (e.slowed > 0) e.slowed -= dt;

      const nextIdx = Math.min(e.pathIdx + 1, PATH_POINTS.length - 1);
      const [tc, tr] = PATH_POINTS[nextIdx];
      const tx = this.gridOffsetX + tc * CELL + CELL / 2;
      const ty = this.gridOffsetY + tr * CELL + CELL / 2;

      const dx = tx - e.x;
      const dy = ty - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const moveSpeed = e.speed * CELL * slowMult * dt;

      if (dist < moveSpeed) {
        e.x = tx;
        e.y = ty;
        e.pathIdx = nextIdx;

        if (nextIdx >= PATH_POINTS.length - 1) {
          this.killEnemy(e);
          this.lives--;
          this.updateHUD();
          if (this.lives <= 0) { this.gameOver(); return; }
          continue;
        }
      } else {
        e.x += (dx / dist) * moveSpeed;
        e.y += (dy / dist) * moveSpeed;
      }

      e.sprite.setPosition(e.x, e.y);
      if (e.slowed > 0) e.sprite.setFillStyle(C.purple); else e.sprite.setFillStyle(e.maxHp > 200 ? C.gold : C.red);
      e.hpBg.setPosition(e.x, e.y - 13);
      e.hpBar.setPosition(e.x - 10 + 10 * (e.hp / e.maxHp), e.y - 13);
      e.hpBar.setSize(20 * (e.hp / e.maxHp), 3);
      e.hpBar.setFillStyle(e.hp / e.maxHp > 0.5 ? C.green : e.hp / e.maxHp > 0.25 ? C.gold : C.red);
    }

    if (allDead && this.waveActive && !this.spawnTimer?.getRemaining()) {
      this.waveActive = false;
      this.startBtn.setAlpha(1);
      if (this.wave >= this.totalWaves) {
        this.time.delayedCall(500, () => this.victory());
      }
      this.updateHUD();
    }
  }

  private updateTowers() {
    const now = this.time.now;
    for (const t of this.towers) {
      if (now - t.lastFired < t.type.fireRate) continue;

      const cx = this.gridOffsetX + t.col * CELL + CELL / 2;
      const cy = this.gridOffsetY + t.row * CELL + CELL / 2;
      let bestEnemy: Enemy | null = null;
      let bestProgress = -1;

      for (const e of this.enemies) {
        if (!e.alive) continue;
        const d = Phaser.Math.Distance.Between(cx, cy, e.x, e.y);
        if (d <= t.type.range && e.pathIdx > bestProgress) {
          bestProgress = e.pathIdx;
          bestEnemy = e;
        }
      }

      if (bestEnemy) {
        t.lastFired = now;
        const color = Phaser.Display.Color.HexStringToColor(t.type.color).color;
        const proj = this.add.circle(cx, cy, 3, color).setDepth(7);
        this.projectiles.push({ sprite: proj, target: bestEnemy, tower: t, speed: 300 });

        // Muzzle flash
        t.sprite.setScale(1.2);
        this.tweens.add({ targets: t.sprite, scale: 1, duration: 100 });
      }
    }
  }

  private updateProjectiles(delta: number) {
    const dt = delta / 1000;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!p.target.alive) {
        p.sprite.destroy();
        this.projectiles.splice(i, 1);
        continue;
      }

      const dx = p.target.x - p.sprite.x;
      const dy = p.target.y - p.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const move = p.speed * dt;

      if (dist < move + 5) {
        p.sprite.destroy();
        this.projectiles.splice(i, 1);
        this.hitEnemy(p.target, p.tower);
      } else {
        p.sprite.x += (dx / dist) * move;
        p.sprite.y += (dy / dist) * move;
      }
    }
  }

  private hitEnemy(e: Enemy, t: PlacedTower) {
    e.hp -= t.type.damage;
    if (t.type.id === "frost") e.slowed = 2;

    // Splash for cannon
    if (t.type.id === "cannon") {
      for (const other of this.enemies) {
        if (other === e || !other.alive) continue;
        if (Phaser.Math.Distance.Between(e.x, e.y, other.x, other.y) < 40) {
          other.hp -= t.type.damage * 0.5;
          if (other.hp <= 0) this.destroyEnemy(other);
        }
      }
    }

    if (e.hp <= 0) this.destroyEnemy(e);
  }

  private destroyEnemy(e: Enemy) {
    this.gold += e.reward;
    this.score += e.reward;
    this.killEnemy(e);
    this.updateHUD();
  }

  private killEnemy(e: Enemy) {
    e.alive = false;
    e.sprite.destroy();
    e.hpBar.destroy();
    e.hpBg.destroy();
  }

  private updateHUD() {
    this.goldText.setText(`Gold: $${this.gold}`);
    this.livesText.setText(`Lives: ${this.lives}`);
    this.waveText.setText(`Wave: ${this.wave}/${this.totalWaves}`);
    this.scoreText.setText(`Score: ${this.score}`);
    this.startLabel.setText(this.wave >= this.totalWaves ? (this.waveActive ? "Final Wave" : "Victory!") : this.waveActive ? "Wave Active" : `Start Wave ${this.wave + 1}`);
  }

  private gameOver() {
    this.waveActive = false;
    this.spawnTimer?.destroy();
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.85).setDepth(20);
    this.add.text(w / 2, h / 2 - 40, "Base Destroyed", { fontFamily: "system-ui, sans-serif", fontSize: "28px", fontStyle: "bold", color: "#F87171" }).setOrigin(0.5).setDepth(21);
    this.add.text(w / 2, h / 2 + 4, `Survived ${this.wave - 1} waves  •  Score: ${this.score}`, { fontFamily: "system-ui, sans-serif", fontSize: "14px", color: "#9CA3AF" }).setOrigin(0.5).setDepth(21);
    this.createRetry(w / 2, h / 2 + 50);
    this.onComplete?.({ wavesCleared: this.wave - 1, score: this.score });
  }

  private victory() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.85).setDepth(20);
    this.add.text(w / 2, h / 2 - 40, "Victory!", { fontFamily: "system-ui, sans-serif", fontSize: "32px", fontStyle: "bold", color: "#4ADE80" }).setOrigin(0.5).setDepth(21);
    this.add.text(w / 2, h / 2 + 4, `All ${this.totalWaves} waves cleared  •  Score: ${this.score}`, { fontFamily: "system-ui, sans-serif", fontSize: "14px", color: "#FBBF24" }).setOrigin(0.5).setDepth(21);
    this.createRetry(w / 2, h / 2 + 50);
    this.onComplete?.({ wavesCleared: this.totalWaves, score: this.score });
  }

  private createRetry(x: number, y: number) {
    const bg = this.add.rectangle(x, y, 150, 44, C.purple).setInteractive({ useHandCursor: true }).setDepth(22);
    this.add.text(x, y, "Play Again", { fontFamily: "system-ui, sans-serif", fontSize: "14px", fontStyle: "bold", color: "#FFFFFF" }).setOrigin(0.5).setDepth(22);
    bg.on("pointerdown", () => this.scene.restart({
      towers: this.towerTypes, waves: this.totalWaves, startGold: 200, onComplete: this.onComplete,
    }));
  }
}

export function TowerDefenseGame({ towers = DEFAULT_TOWERS, waves = 8, startGold = 200, height = "560px", className, onComplete }: TowerDefenseProps) {
  const cbRef = useRef(onComplete);
  cbRef.current = onComplete;
  const palette = useThemedPalette(C, ({ brand }) => ({ purple: brand[1] }));

  const config = useMemo((): Phaser.Types.Core.GameConfig => ({
    type: Phaser.AUTO, backgroundColor: "#060518", scene: TDScene,
    input: { mouse: { preventDefaultWheel: false } },
  }), []);

  const handleReady = useCallback((game: Phaser.Game) => {
    game.scene.start("TDScene", {
      towers, waves, startGold,
      onComplete: (r: { wavesCleared: number; score: number }) => cbRef.current?.(r),
    });
  }, [towers, waves, startGold]);

  return <PhaserEmbed key={palette.cacheKey} config={config} height={height} className={className} onReady={handleReady} />;
}
