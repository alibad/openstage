"use client";

import { useRef, useMemo, useCallback } from "react";
import * as Phaser from "phaser";
import { PhaserEmbed } from "./phaser-embed";
import { useBrandNumeric } from "@/lib/brand";

export interface JeopardyQuestion {
  question: string;
  answer: string;
}

export interface JeopardyCategory {
  name: string;
  questions: JeopardyQuestion[];
}

export interface JeopardyGameProps {
  categories: JeopardyCategory[];
  pointValues?: number[];
  height?: string;
  className?: string;
  onComplete?: (score: number) => void;
}

/**
 * Color slots used by the scene. The brand-aware values (board, cell,
 * accent) are recomputed from `useBrandNumeric()` and injected via init
 * data; semantic values (gold for points, green for correct, red for
 * wrong) stay hardcoded — those carry meaning that brand changes
 * shouldn't override.
 */
interface JeopardyPalette {
  board: number;
  boardLight: number;
  cell: number;
  cellHover: number;
  accent: number;
}

const SEMANTIC = {
  bg: 0x0a0718,
  gold: 0xfbbf24,
  text: 0xf3f4f6,
  muted: 0x9ca3af,
  correct: 0x4ade80,
  wrong: 0xf87171,
};

function darken(value: number, factor: number): number {
  const r = Math.round(((value >> 16) & 0xff) * factor);
  const g = Math.round(((value >> 8) & 0xff) * factor);
  const b = Math.round((value & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}

function lighten(value: number, factor: number): number {
  const r = Math.min(255, Math.round((value >> 16) & 0xff) + Math.round(255 * factor));
  const g = Math.min(255, Math.round((value >> 8) & 0xff) + Math.round(255 * factor));
  const b = Math.min(255, Math.round(value & 0xff) + Math.round(255 * factor));
  return (r << 16) | (g << 8) | b;
}

function buildJeopardyPalette(brand: readonly number[]): JeopardyPalette {
  const accent = brand[1] ?? 0x818cf8;
  // Cells use a darker shade of the brand-2 stop so text stays readable;
  // the original Jeopardy royal blue (`#0e1a6b`) was hand-tuned for
  // contrast — we approximate by darkening the active brand-2 by 50%.
  const cell = darken(accent, 0.4);
  const cellHover = darken(accent, 0.55);
  const board = darken(accent, 0.3);
  const boardLight = darken(accent, 0.5);
  return { board, boardLight, cell, cellHover, accent };
}

class JeopardyScene extends Phaser.Scene {
  private categories!: JeopardyCategory[];
  private pointValues!: number[];
  private onComplete?: JeopardyGameProps["onComplete"];
  private score = 0;
  private answered = 0;
  private totalQs = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private overlay?: Phaser.GameObjects.Container;
  private cells: { rect: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text; used: boolean }[][] = [];
  private palette!: JeopardyPalette;

  constructor() {
    super({ key: "JeopardyScene" });
  }

  init(data: {
    categories: JeopardyCategory[];
    pointValues: number[];
    palette: JeopardyPalette;
    onComplete?: JeopardyGameProps["onComplete"];
  }) {
    this.categories = data.categories;
    this.pointValues = data.pointValues;
    this.palette = data.palette;
    this.onComplete = data.onComplete;
    this.score = 0;
    this.answered = 0;
    this.totalQs = 0;
    this.cells = [];
    this.categories.forEach((cat) => (this.totalQs += cat.questions.length));
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const cols = this.categories.length;
    const rows = this.pointValues.length + 1;
    const pad = 6;
    const topMargin = 8;
    const cellW = (w - pad * (cols + 1)) / cols;
    const cellH = (h - 44 - topMargin - pad * (rows + 1)) / rows;

    // Score
    this.scoreText = this.add
      .text(w / 2, h - 22, "Score: $0", {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
        color: "#FBBF24",
      })
      .setOrigin(0.5, 0.5);

    // Board
    this.categories.forEach((cat, col) => {
      const x = pad + col * (cellW + pad) + cellW / 2;

      // Category header
      const headerY = topMargin + pad + cellH / 2;
      this.add
        .rectangle(x, headerY, cellW, cellH, this.palette.boardLight)
        .setStrokeStyle(1, 0xffffff, 0.05);
      this.add
        .text(x, headerY, cat.name, {
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: cat.name.length > 12 ? "11px" : "13px",
          fontStyle: "bold",
          color: "#FFFFFF",
          wordWrap: { width: cellW - 16 },
          align: "center",
        })
        .setOrigin(0.5, 0.5);

      this.cells[col] = [];

      // Question cells
      cat.questions.forEach((q, row) => {
        if (row >= this.pointValues.length) return;
        const y = topMargin + pad + cellH + pad + row * (cellH + pad) + cellH / 2;
        const pts = this.pointValues[row];

        const rect = this.add
          .rectangle(x, y, cellW, cellH, this.palette.cell)
          .setStrokeStyle(1, 0xffffff, 0.04)
          .setInteractive({ useHandCursor: true });

        const text = this.add
          .text(x, y, `$${pts}`, {
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: "20px",
            fontStyle: "bold",
            color: "#FBBF24",
          })
          .setOrigin(0.5, 0.5);

        const cellData = { rect, text, used: false };
        this.cells[col][row] = cellData;

        rect.on("pointerover", () => {
          if (!cellData.used) rect.setFillStyle(this.palette.cellHover);
        });
        rect.on("pointerout", () => {
          if (!cellData.used) rect.setFillStyle(this.palette.cell);
        });
        rect.on("pointerdown", () => {
          if (!cellData.used && !this.overlay) this.showQuestion(col, row, pts);
        });
      });
    });
  }

  private showQuestion(col: number, row: number, pts: number) {
    const w = this.scale.width;
    const h = this.scale.height;
    const q = this.categories[col].questions[row];

    this.overlay = this.add.container(0, 0);

    // Backdrop
    const backdrop = this.add
      .rectangle(w / 2, h / 2, w, h, 0x000000, 0.85)
      .setInteractive();
    this.overlay.add(backdrop);

    // Category + points
    this.overlay.add(
      this.add
        .text(w / 2, h * 0.2, `${this.categories[col].name} — $${pts}`, {
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "13px",
          color: "#FBBF24",
        })
        .setOrigin(0.5, 0.5)
    );

    // Question
    this.overlay.add(
      this.add
        .text(w / 2, h * 0.38, q.question, {
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "20px",
          fontStyle: "bold",
          color: "#FFFFFF",
          wordWrap: { width: w - 100 },
          align: "center",
          lineSpacing: 6,
        })
        .setOrigin(0.5, 0.5)
    );

    // Reveal answer button
    const btnW = 180;
    const btnH = 46;
    const btnY = h * 0.58;
    const revealBg = this.add
      .rectangle(w / 2, btnY, btnW, btnH, this.palette.accent)
      .setInteractive({ useHandCursor: true });
    const revealText = this.add
      .text(w / 2, btnY, "Reveal Answer", {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
        color: "#FFFFFF",
      })
      .setOrigin(0.5, 0.5);
    this.overlay.add([revealBg, revealText]);

    const accentHover = lighten(this.palette.accent, 0.08);
    revealBg.on("pointerover", () => revealBg.setFillStyle(accentHover));
    revealBg.on("pointerout", () => revealBg.setFillStyle(this.palette.accent));

    revealBg.on("pointerdown", () => {
      revealBg.destroy();
      revealText.destroy();

      // Show answer
      this.overlay!.add(
        this.add
          .text(w / 2, btnY - 10, q.answer, {
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: "17px",
            fontStyle: "bold",
            color: "#4ADE80",
            wordWrap: { width: w - 100 },
            align: "center",
            lineSpacing: 4,
          })
          .setOrigin(0.5, 0.5)
      );

      // Got it right / wrong buttons
      const gotItY = h * 0.74;
      const rightBg = this.add
        .rectangle(w / 2 - 80, gotItY, 140, 40, SEMANTIC.correct, 0.15)
        .setStrokeStyle(1, SEMANTIC.correct, 0.4)
        .setInteractive({ useHandCursor: true });
      this.overlay!.add(rightBg);
      this.overlay!.add(
        this.add
          .text(w / 2 - 80, gotItY, "Got It Right", {
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: "13px",
            fontStyle: "bold",
            color: "#4ADE80",
          })
          .setOrigin(0.5, 0.5)
      );

      const wrongBg = this.add
        .rectangle(w / 2 + 80, gotItY, 140, 40, SEMANTIC.wrong, 0.15)
        .setStrokeStyle(1, SEMANTIC.wrong, 0.4)
        .setInteractive({ useHandCursor: true });
      this.overlay!.add(wrongBg);
      this.overlay!.add(
        this.add
          .text(w / 2 + 80, gotItY, "Got It Wrong", {
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: "13px",
            fontStyle: "bold",
            color: "#F87171",
          })
          .setOrigin(0.5, 0.5)
      );

      rightBg.on("pointerdown", () => this.closeQuestion(col, row, pts, true));
      wrongBg.on("pointerdown", () => this.closeQuestion(col, row, pts, false));
    });
  }

  private closeQuestion(col: number, row: number, pts: number, correct: boolean) {
    if (correct) this.score += pts;
    else this.score -= pts;
    this.answered++;

    this.scoreText.setText(`Score: $${this.score}`);
    this.scoreText.setColor(this.score >= 0 ? "#FBBF24" : "#F87171");

    // Mark cell used
    const cell = this.cells[col][row];
    cell.used = true;
    cell.rect.setFillStyle(0x0a0718).setStrokeStyle(1, 0xffffff, 0.02).removeInteractive();
    cell.text.setColor("#4B5563").setText("—");

    this.overlay?.destroy();
    this.overlay = undefined;

    if (this.answered >= this.totalQs) {
      this.time.delayedCall(400, () => this.showFinal());
    }
  }

  private showFinal() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.8);

    this.add
      .text(w / 2, h / 2 - 40, `Final Score: $${this.score}`, {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "36px",
        fontStyle: "bold",
        color: this.score >= 0 ? "#FBBF24" : "#F87171",
      })
      .setOrigin(0.5, 0.5);

    const retryBg = this.add
      .rectangle(w / 2, h / 2 + 30, 150, 44, this.palette.accent)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(w / 2, h / 2 + 30, "Play Again", {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
        color: "#FFFFFF",
      })
      .setOrigin(0.5, 0.5);
    retryBg.on("pointerdown", () =>
      this.scene.restart({
        categories: this.categories,
        pointValues: this.pointValues,
        palette: this.palette,
        onComplete: this.onComplete,
      })
    );

    this.onComplete?.(this.score);
  }
}

export function JeopardyGame({
  categories,
  pointValues = [200, 400, 600, 800, 1000],
  height = "540px",
  className,
  onComplete,
}: JeopardyGameProps) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const brandPalette = useBrandNumeric();
  const palette = useMemo(
    () => buildJeopardyPalette(brandPalette.brand),
    [brandPalette]
  );

  const config = useMemo(
    (): Phaser.Types.Core.GameConfig => ({
      type: Phaser.AUTO,
      backgroundColor: "#060518",
      scene: JeopardyScene,
      input: { mouse: { preventDefaultWheel: false } },
    }),
    []
  );

  const handleReady = useCallback(
    (game: Phaser.Game) => {
      game.scene.start("JeopardyScene", {
        categories,
        pointValues,
        palette,
        onComplete: (s: number) => onCompleteRef.current?.(s),
      });
    },
    [categories, pointValues, palette]
  );

  // Re-mount the embed when the brand palette changes so Phaser
  // re-creates the scene with fresh colors.
  return (
    <PhaserEmbed
      key={brandPalette.cacheKey}
      config={config}
      height={height}
      className={className}
      onReady={handleReady}
    />
  );
}
