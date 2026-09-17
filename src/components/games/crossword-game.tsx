"use client";

import { useRef, useMemo, useCallback } from "react";
import * as Phaser from "phaser";
import { PhaserEmbed } from "./phaser-embed";
import { useThemedPalette } from "./_use-themed-palette";

export interface CrosswordClue {
  answer: string;
  clue: string;
  row: number;
  col: number;
  direction: "across" | "down";
}

export interface CrosswordGameProps {
  clues: CrosswordClue[];
  height?: string;
  className?: string;
  onComplete?: (result: { time: number; hintsUsed: number }) => void;
}

const CELL = 36;
const GAP = 2;
const C = {
  bg: 0x060518,
  cell: 0x13102a,
  cellActive: 0x1e1a40,
  cellCorrect: 0x166534,
  border: 0x2d2760,
  highlight: 0x818cf8,
  highlightDim: 0x4338ca,
  text: 0xf3f4f6,
  muted: 0x6b7280,
  gold: 0xfbbf24,
  purple: 0x818cf8,
  correct: 0x4ade80,
};

interface GridCell {
  row: number;
  col: number;
  letter: string;
  bg: Phaser.GameObjects.Rectangle;
  letterText: Phaser.GameObjects.Text;
  numberText?: Phaser.GameObjects.Text;
  filled: boolean;
  correct: boolean;
  clueIds: number[];
}

class CrosswordScene extends Phaser.Scene {
  private clues!: CrosswordClue[];
  private onComplete?: CrosswordGameProps["onComplete"];
  private grid: Map<string, GridCell> = new Map();
  private gridRows = 0;
  private gridCols = 0;
  private activeClueIdx = 0;
  private activeCellKey = "";
  private clueTexts: Phaser.GameObjects.Text[] = [];
  private hintsUsed = 0;
  private startTime = 0;
  private completedCount = 0;
  private offsetX = 0;
  private offsetY = 0;

  constructor() {
    super({ key: "CrosswordScene" });
  }

  init(data: { clues: CrosswordClue[]; onComplete?: CrosswordGameProps["onComplete"] }) {
    this.clues = data.clues;
    this.onComplete = data.onComplete;
    this.grid = new Map();
    this.activeClueIdx = 0;
    this.activeCellKey = "";
    this.clueTexts = [];
    this.hintsUsed = 0;
    this.completedCount = 0;
  }

  create() {
    this.startTime = Date.now();
    const w = this.scale.width;
    const h = this.scale.height;

    // Determine grid dimensions
    this.clues.forEach((c) => {
      const endRow = c.direction === "down" ? c.row + c.answer.length - 1 : c.row;
      const endCol = c.direction === "across" ? c.col + c.answer.length - 1 : c.col;
      this.gridRows = Math.max(this.gridRows, endRow + 1);
      this.gridCols = Math.max(this.gridCols, endCol + 1);
    });

    const gridW = this.gridCols * (CELL + GAP);
    const gridH = this.gridRows * (CELL + GAP);
    const clueAreaW = 200;
    const availW = w - clueAreaW - 32;
    this.offsetX = Math.max(16, (availW - gridW) / 2);
    this.offsetY = Math.max(16, (h - gridH) / 2);

    // Build grid cells from clues
    this.clues.forEach((clue, ci) => {
      for (let i = 0; i < clue.answer.length; i++) {
        const r = clue.direction === "down" ? clue.row + i : clue.row;
        const c = clue.direction === "across" ? clue.col + i : clue.col;
        const key = `${r},${c}`;

        if (!this.grid.has(key)) {
          const x = this.offsetX + c * (CELL + GAP) + CELL / 2;
          const y = this.offsetY + r * (CELL + GAP) + CELL / 2;

          const bg = this.add.rectangle(x, y, CELL, CELL, C.cell)
            .setStrokeStyle(1, C.border)
            .setInteractive({ useHandCursor: true });

          const letterText = this.add.text(x, y, "", {
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: "16px",
            fontStyle: "bold",
            color: "#F3F4F6",
          }).setOrigin(0.5, 0.5);

          const cell: GridCell = { row: r, col: c, letter: clue.answer[i], bg, letterText, filled: false, correct: false, clueIds: [ci] };
          this.grid.set(key, cell);

          bg.on("pointerdown", () => this.clickCell(key));
        } else {
          const existing = this.grid.get(key)!;
          existing.clueIds.push(ci);
        }
      }

      // Add cell number for first cell
      const firstKey = `${clue.row},${clue.col}`;
      const firstCell = this.grid.get(firstKey)!;
      if (!firstCell.numberText) {
        const x = this.offsetX + clue.col * (CELL + GAP) + 6;
        const y = this.offsetY + clue.row * (CELL + GAP) + 5;
        firstCell.numberText = this.add.text(x, y, `${ci + 1}`, {
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "8px",
          color: "#6B7280",
        }).setOrigin(0, 0);
      }
    });

    // Clue list
    const clueX = w - clueAreaW - 8;
    const clueTop = 16;
    this.add.text(clueX, clueTop, "CLUES", {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "10px",
      fontStyle: "bold",
      color: "#818CF8",
      letterSpacing: 2,
    });

    let cy = clueTop + 24;
    this.clues.forEach((clue, i) => {
      const prefix = `${i + 1}${clue.direction === "across" ? "A" : "D"}`;
      const t = this.add.text(clueX, cy, `${prefix}. ${clue.clue}`, {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "10px",
        color: "#9CA3AF",
        wordWrap: { width: clueAreaW - 4 },
        lineSpacing: 1,
      }).setInteractive({ useHandCursor: true });

      t.on("pointerdown", () => {
        this.activeClueIdx = i;
        this.activeCellKey = `${clue.row},${clue.col}`;
        this.highlightActive();
      });
      t.on("pointerover", () => { if (this.clueTexts[i]) t.setColor("#E5E7EB"); });
      t.on("pointerout", () => {
        t.setColor(i === this.activeClueIdx ? "#818CF8" : "#9CA3AF");
      });

      this.clueTexts[i] = t;
      cy += t.height + 8;
    });

    // Hint button
    const hintBtn = this.add.rectangle(clueX + clueAreaW / 2, h - 30, 100, 28, C.cell)
      .setStrokeStyle(1, C.gold, 0.3)
      .setInteractive({ useHandCursor: true });
    this.add.text(clueX + clueAreaW / 2, h - 30, "Reveal Letter", {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "10px",
      color: "#FBBF24",
    }).setOrigin(0.5, 0.5);
    hintBtn.on("pointerdown", () => this.revealLetter());
    hintBtn.on("pointerover", () => hintBtn.setFillStyle(C.cellActive));
    hintBtn.on("pointerout", () => hintBtn.setFillStyle(C.cell));

    // Keyboard input
    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => this.handleKey(e));

    // Start on first clue
    this.activeClueIdx = 0;
    this.activeCellKey = `${this.clues[0].row},${this.clues[0].col}`;
    this.highlightActive();
  }

  private clickCell(key: string) {
    const cell = this.grid.get(key);
    if (!cell) return;

    if (key === this.activeCellKey && cell.clueIds.length > 1) {
      const currentIdx = cell.clueIds.indexOf(this.activeClueIdx);
      const nextIdx = (currentIdx + 1) % cell.clueIds.length;
      this.activeClueIdx = cell.clueIds[nextIdx];
    } else {
      this.activeClueIdx = cell.clueIds[0];
    }
    this.activeCellKey = key;
    this.highlightActive();
  }

  private highlightActive() {
    const clue = this.clues[this.activeClueIdx];

    // Reset all
    this.grid.forEach((cell) => {
      if (cell.correct) {
        cell.bg.setFillStyle(C.cellCorrect, 0.15).setStrokeStyle(1, C.correct, 0.3);
      } else {
        cell.bg.setFillStyle(C.cell).setStrokeStyle(1, C.border);
      }
    });

    // Highlight clue cells
    for (let i = 0; i < clue.answer.length; i++) {
      const r = clue.direction === "down" ? clue.row + i : clue.row;
      const c = clue.direction === "across" ? clue.col + i : clue.col;
      const key = `${r},${c}`;
      const cell = this.grid.get(key);
      if (cell && !cell.correct) {
        cell.bg.setFillStyle(C.highlightDim, 0.12).setStrokeStyle(1, C.highlightDim, 0.4);
      }
    }

    // Active cell brighter
    const activeCell = this.grid.get(this.activeCellKey);
    if (activeCell && !activeCell.correct) {
      activeCell.bg.setStrokeStyle(2, C.highlight);
    }

    // Highlight clue text
    this.clueTexts.forEach((t, i) => t.setColor(i === this.activeClueIdx ? "#818CF8" : "#9CA3AF"));
  }

  private handleKey(e: KeyboardEvent) {
    if (e.key === "Tab") {
      e.preventDefault();
      this.activeClueIdx = (this.activeClueIdx + (e.shiftKey ? -1 : 1) + this.clues.length) % this.clues.length;
      const c = this.clues[this.activeClueIdx];
      this.activeCellKey = `${c.row},${c.col}`;
      this.highlightActive();
      return;
    }

    if (e.key === "Backspace") {
      const cell = this.grid.get(this.activeCellKey);
      if (cell && !cell.correct) {
        cell.letterText.setText("");
        cell.filled = false;
      }
      this.moveCursor(-1);
      return;
    }

    const letter = e.key.toUpperCase();
    if (letter.length === 1 && /[A-Z]/.test(letter)) {
      const cell = this.grid.get(this.activeCellKey);
      if (cell && !cell.correct) {
        cell.letterText.setText(letter);
        cell.filled = true;
        this.checkClueCompletion();
        this.moveCursor(1);
      }
    }

    if (e.key === "ArrowRight" || e.key === "ArrowDown") this.moveCursor(1);
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") this.moveCursor(-1);
  }

  private moveCursor(dir: number) {
    const clue = this.clues[this.activeClueIdx];
    const [r, c] = this.activeCellKey.split(",").map(Number);
    let idx = clue.direction === "across" ? c - clue.col : r - clue.row;
    idx += dir;

    if (idx >= 0 && idx < clue.answer.length) {
      const nr = clue.direction === "down" ? clue.row + idx : clue.row;
      const nc = clue.direction === "across" ? clue.col + idx : clue.col;
      this.activeCellKey = `${nr},${nc}`;
      this.highlightActive();
    }
  }

  private checkClueCompletion() {
    const clue = this.clues[this.activeClueIdx];
    let allFilled = true;
    let allCorrect = true;

    for (let i = 0; i < clue.answer.length; i++) {
      const r = clue.direction === "down" ? clue.row + i : clue.row;
      const c = clue.direction === "across" ? clue.col + i : clue.col;
      const cell = this.grid.get(`${r},${c}`);
      if (!cell?.filled) { allFilled = false; break; }
      if (cell.letterText.text !== clue.answer[i]) allCorrect = false;
    }

    if (allFilled && allCorrect) {
      for (let i = 0; i < clue.answer.length; i++) {
        const r = clue.direction === "down" ? clue.row + i : clue.row;
        const c = clue.direction === "across" ? clue.col + i : clue.col;
        const cell = this.grid.get(`${r},${c}`)!;
        cell.correct = true;
        cell.bg.setFillStyle(C.cellCorrect, 0.15).setStrokeStyle(1, C.correct, 0.3);
        cell.letterText.setColor("#4ADE80");
      }
      this.clueTexts[this.activeClueIdx].setColor("#4ADE80").setText("✓ " + this.clueTexts[this.activeClueIdx].text);
      this.completedCount++;

      if (this.completedCount >= this.clues.length) {
        this.time.delayedCall(500, () => this.showVictory());
      }
    } else if (allFilled) {
      this.cameras.main.shake(150, 0.003);
    }
  }

  private revealLetter() {
    const cell = this.grid.get(this.activeCellKey);
    if (!cell || cell.correct) return;
    cell.letterText.setText(cell.letter).setColor("#FBBF24");
    cell.filled = true;
    this.hintsUsed++;
    this.checkClueCompletion();
    this.moveCursor(1);
  }

  private showVictory() {
    const w = this.scale.width;
    const h = this.scale.height;
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);

    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.85);

    this.add.text(w / 2, h / 2 - 40, "Crossword Complete!", {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "28px",
      fontStyle: "bold",
      color: "#4ADE80",
    }).setOrigin(0.5, 0.5);

    this.add.text(w / 2, h / 2 + 4, `Time: ${Math.floor(elapsed / 60)}m ${elapsed % 60}s  •  Hints: ${this.hintsUsed}`, {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "14px",
      color: "#9CA3AF",
    }).setOrigin(0.5, 0.5);

    const retryBg = this.add.rectangle(w / 2, h / 2 + 50, 150, 44, C.purple).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h / 2 + 50, "Play Again", {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#FFFFFF",
    }).setOrigin(0.5, 0.5);
    retryBg.on("pointerdown", () => this.scene.restart({ clues: this.clues, onComplete: this.onComplete }));

    this.onComplete?.({ time: elapsed, hintsUsed: this.hintsUsed });
  }
}

export function CrosswordGame({ clues, height = "480px", className, onComplete }: CrosswordGameProps) {
  const cbRef = useRef(onComplete);
  cbRef.current = onComplete;
  const palette = useThemedPalette(C, ({ brand }) => ({ highlight: brand[1] }));

  const config = useMemo((): Phaser.Types.Core.GameConfig => ({
    type: Phaser.AUTO, backgroundColor: "#060518", scene: CrosswordScene,
    input: { mouse: { preventDefaultWheel: false } },
  }), []);

  const handleReady = useCallback((game: Phaser.Game) => {
    game.scene.start("CrosswordScene", {
      clues, onComplete: (r: { time: number; hintsUsed: number }) => cbRef.current?.(r),
    });
  }, [clues]);

  return <PhaserEmbed key={palette.cacheKey} config={config} height={height} className={className} onReady={handleReady} />;
}
