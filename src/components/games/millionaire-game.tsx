"use client";

import { useRef, useMemo, useCallback } from "react";
import * as Phaser from "phaser";
import { PhaserEmbed } from "./phaser-embed";
import { useThemedPalette } from "./_use-themed-palette";

export interface MillionaireQuestion {
  question: string;
  options: [string, string, string, string];
  correct: number;
}

export interface MillionaireGameProps {
  questions: MillionaireQuestion[];
  height?: string;
  className?: string;
  onComplete?: (result: { prize: string; questionsAnswered: number }) => void;
}

const PRIZES = [
  "$100", "$200", "$300", "$500", "$1,000",
  "$2,000", "$4,000", "$8,000", "$16,000", "$32,000",
  "$64,000", "$125,000", "$250,000", "$500,000", "$1,000,000",
];
const SAFE_HAVENS = new Set([4, 9]);
const OPTION_LETTERS = ["A", "B", "C", "D"];
const OPTION_COLORS = [0x22d3ee, 0x818cf8, 0xa855f7, 0xf472b6];

const C = {
  bg: 0x060518,
  surface: 0x0e0c24,
  border: 0x1e1a40,
  gold: 0xfbbf24,
  correct: 0x4ade80,
  wrong: 0xf87171,
  text: 0xf3f4f6,
  muted: 0x6b7280,
  purple: 0x818cf8,
  dimOption: 0x0a0820,
};

class MillionaireScene extends Phaser.Scene {
  private questions!: MillionaireQuestion[];
  private onComplete?: MillionaireGameProps["onComplete"];
  private currentQ = 0;
  private locked = false;
  private lifelines = { fiftyFifty: true, skip: true };
  private optionBtns: { bg: Phaser.GameObjects.Rectangle; letter: Phaser.GameObjects.Text; label: Phaser.GameObjects.Text; idx: number; eliminated: boolean }[] = [];
  private questionText!: Phaser.GameObjects.Text;
  private prizeText!: Phaser.GameObjects.Text;
  private ladderTexts: Phaser.GameObjects.Text[] = [];
  private fiftyBtn!: Phaser.GameObjects.Container;
  private skipBtn!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: "MillionaireScene" });
  }

  init(data: { questions: MillionaireQuestion[]; onComplete?: MillionaireGameProps["onComplete"] }) {
    this.questions = data.questions;
    this.onComplete = data.onComplete;
    this.currentQ = 0;
    this.locked = false;
    this.lifelines = { fiftyFifty: true, skip: true };
    this.optionBtns = [];
    this.ladderTexts = [];
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Prize ladder (right side)
    const ladderX = w - 20;
    const ladderTop = 16;
    const ladderStep = 22;
    const maxVisible = Math.min(PRIZES.length, this.questions.length);

    for (let i = maxVisible - 1; i >= 0; i--) {
      const y = ladderTop + (maxVisible - 1 - i) * ladderStep;
      const isSafe = SAFE_HAVENS.has(i);
      const t = this.add.text(ladderX, y, PRIZES[i], {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: isSafe ? "11px" : "10px",
        fontStyle: isSafe ? "bold" : "normal",
        color: isSafe ? "#FBBF24" : "#4B5563",
      }).setOrigin(1, 0);
      this.ladderTexts[i] = t;
    }

    // Current prize
    this.prizeText = this.add.text(24, 16, "", {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "12px",
      color: "#6B7280",
    });

    // Question area
    const qBoxY = h * 0.28;
    this.add.rectangle(w * 0.42, qBoxY, w * 0.72, 80, C.surface).setStrokeStyle(1, C.border);
    this.questionText = this.add.text(w * 0.42, qBoxY, "", {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "16px",
      fontStyle: "bold",
      color: "#F3F4F6",
      wordWrap: { width: w * 0.65 },
      align: "center",
      lineSpacing: 4,
    }).setOrigin(0.5, 0.5);

    // Options (2x2 grid)
    const optW = w * 0.36 - 10;
    const optH = 48;
    const optGapX = 12;
    const optGapY = 10;
    const gridLeft = w * 0.42 - optW - optGapX / 2;
    const gridTop = h * 0.48;

    for (let i = 0; i < 4; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = gridLeft + col * (optW + optGapX) + optW / 2;
      const y = gridTop + row * (optH + optGapY) + optH / 2;

      const bg = this.add.rectangle(x, y, optW, optH, C.surface)
        .setStrokeStyle(1, C.border)
        .setInteractive({ useHandCursor: true });

      const letter = this.add.text(x - optW / 2 + 16, y, OPTION_LETTERS[i], {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
        color: Phaser.Display.Color.IntegerToColor(OPTION_COLORS[i]).rgba,
      }).setOrigin(0.5, 0.5);

      const label = this.add.text(x + 6, y, "", {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "13px",
        color: "#E5E7EB",
        wordWrap: { width: optW - 44 },
      }).setOrigin(0.5, 0.5);

      bg.on("pointerover", () => {
        if (!this.locked && !this.optionBtns[i].eliminated) bg.setFillStyle(C.border);
      });
      bg.on("pointerout", () => {
        if (!this.locked && !this.optionBtns[i].eliminated) bg.setFillStyle(C.surface);
      });
      bg.on("pointerdown", () => this.selectAnswer(i));

      this.optionBtns.push({ bg, letter, label, idx: i, eliminated: false });
    }

    // Lifelines
    const lifeY = h - 36;
    this.fiftyBtn = this.createLifeline(w * 0.42 - 60, lifeY, "50:50", () => this.useFiftyFifty());
    this.skipBtn = this.createLifeline(w * 0.42 + 60, lifeY, "SKIP", () => this.useSkip());

    this.showQuestion();
  }

  private createLifeline(x: number, y: number, label: string, callback: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 90, 32, C.surface)
      .setStrokeStyle(1, C.gold, 0.3)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(0, 0, label, {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#FBBF24",
    }).setOrigin(0.5, 0.5);
    container.add([bg, text]);

    bg.on("pointerover", () => bg.setFillStyle(C.border));
    bg.on("pointerout", () => bg.setFillStyle(C.surface));
    bg.on("pointerdown", callback);
    return container;
  }

  private showQuestion() {
    if (this.currentQ >= this.questions.length) {
      this.showWin();
      return;
    }

    const q = this.questions[this.currentQ];
    this.locked = false;
    this.questionText.setText(q.question);

    const prize = this.currentQ > 0 ? PRIZES[this.currentQ - 1] : "$0";
    this.prizeText.setText(`Current: ${prize} → Playing for ${PRIZES[this.currentQ]}`);

    // Update ladder
    this.ladderTexts.forEach((t, i) => {
      if (i < this.currentQ) {
        t.setColor("#4B556380");
      } else if (i === this.currentQ) {
        t.setColor("#FFFFFF").setFontStyle("bold").setFontSize(12);
      } else {
        t.setColor(SAFE_HAVENS.has(i) ? "#FBBF24" : "#4B5563");
        t.setFontStyle(SAFE_HAVENS.has(i) ? "bold" : "normal").setFontSize(SAFE_HAVENS.has(i) ? 11 : 10);
      }
    });

    // Reset options
    this.optionBtns.forEach((btn, i) => {
      btn.eliminated = false;
      btn.bg.setFillStyle(C.surface).setStrokeStyle(1, C.border).setInteractive({ useHandCursor: true }).setAlpha(1);
      btn.letter.setAlpha(1);
      btn.label.setText(q.options[i]).setAlpha(1).setColor("#E5E7EB");
    });
  }

  private selectAnswer(idx: number) {
    if (this.locked || this.optionBtns[idx].eliminated) return;
    this.locked = true;

    const q = this.questions[this.currentQ];
    const btn = this.optionBtns[idx];

    // Highlight selected
    btn.bg.setStrokeStyle(2, 0xffffff, 0.6);

    // Suspense delay
    this.time.delayedCall(800, () => {
      const isCorrect = idx === q.correct;

      // Reveal correct answer
      this.optionBtns[q.correct].bg.setFillStyle(C.correct, 0.15).setStrokeStyle(2, C.correct);
      this.optionBtns[q.correct].label.setColor("#4ADE80");

      if (!isCorrect) {
        btn.bg.setFillStyle(C.wrong, 0.15).setStrokeStyle(2, C.wrong);
        btn.label.setColor("#F87171");
        this.cameras.main.shake(200, 0.004);

        this.time.delayedCall(1500, () => this.showGameOver());
      } else {
        this.time.delayedCall(1000, () => {
          this.currentQ++;
          this.showQuestion();
        });
      }
    });
  }

  private useFiftyFifty() {
    if (!this.lifelines.fiftyFifty || this.locked) return;
    this.lifelines.fiftyFifty = false;

    const q = this.questions[this.currentQ];
    const wrong = [0, 1, 2, 3].filter((i) => i !== q.correct);
    // Shuffle and pick 2 to eliminate
    wrong.sort(() => Math.random() - 0.5);
    const toEliminate = wrong.slice(0, 2);

    toEliminate.forEach((i) => {
      this.optionBtns[i].eliminated = true;
      this.optionBtns[i].bg.setFillStyle(C.dimOption).setStrokeStyle(1, C.border, 0.2).setAlpha(0.3);
      this.optionBtns[i].letter.setAlpha(0.2);
      this.optionBtns[i].label.setAlpha(0.2);
    });

    // Disable button visually
    const bg = this.fiftyBtn.list[0] as Phaser.GameObjects.Rectangle;
    const text = this.fiftyBtn.list[1] as Phaser.GameObjects.Text;
    bg.setStrokeStyle(1, 0xffffff, 0.05).removeInteractive();
    text.setColor("#4B5563");
  }

  private useSkip() {
    if (!this.lifelines.skip || this.locked) return;
    this.lifelines.skip = false;
    this.currentQ++;

    const bg = this.skipBtn.list[0] as Phaser.GameObjects.Rectangle;
    const text = this.skipBtn.list[1] as Phaser.GameObjects.Text;
    bg.setStrokeStyle(1, 0xffffff, 0.05).removeInteractive();
    text.setColor("#4B5563");

    this.showQuestion();
  }

  private showGameOver() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Determine safe haven prize
    let safePrize = "$0";
    for (let i = this.currentQ - 1; i >= 0; i--) {
      if (SAFE_HAVENS.has(i)) { safePrize = PRIZES[i]; break; }
    }

    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.8);

    this.add.text(w / 2, h / 2 - 50, "Game Over", {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "32px",
      fontStyle: "bold",
      color: "#F87171",
    }).setOrigin(0.5, 0.5);

    this.add.text(w / 2, h / 2 - 10, `You walk away with ${safePrize}`, {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "16px",
      color: "#FBBF24",
    }).setOrigin(0.5, 0.5);

    this.add.text(w / 2, h / 2 + 16, `Answered ${this.currentQ} of ${this.questions.length} correctly`, {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "12px",
      color: "#9CA3AF",
    }).setOrigin(0.5, 0.5);

    this.createRetry(w / 2, h / 2 + 66);
    this.onComplete?.({ prize: safePrize, questionsAnswered: this.currentQ });
  }

  private showWin() {
    const w = this.scale.width;
    const h = this.scale.height;
    const finalPrize = PRIZES[Math.min(this.questions.length, PRIZES.length) - 1];

    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.8);

    this.add.text(w / 2, h / 2 - 50, finalPrize, {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "48px",
      fontStyle: "bold",
      color: "#FBBF24",
    }).setOrigin(0.5, 0.5);

    this.add.text(w / 2, h / 2 + 4, "You answered every question!", {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "16px",
      color: "#4ADE80",
    }).setOrigin(0.5, 0.5);

    this.createRetry(w / 2, h / 2 + 56);
    this.onComplete?.({ prize: finalPrize, questionsAnswered: this.questions.length });
  }

  private createRetry(x: number, y: number) {
    const bg = this.add.rectangle(x, y, 150, 44, C.purple).setInteractive({ useHandCursor: true });
    this.add.text(x, y, "Play Again", {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#FFFFFF",
    }).setOrigin(0.5, 0.5);
    bg.on("pointerover", () => bg.setFillStyle(0x6366f1));
    bg.on("pointerout", () => bg.setFillStyle(C.purple));
    bg.on("pointerdown", () => this.scene.restart({ questions: this.questions, onComplete: this.onComplete }));
  }
}

export function MillionaireGame({ questions, height = "540px", className, onComplete }: MillionaireGameProps) {
  const cbRef = useRef(onComplete);
  cbRef.current = onComplete;
  const palette = useThemedPalette(C, ({ brand }) => ({ purple: brand[1] }));

  const config = useMemo((): Phaser.Types.Core.GameConfig => ({
    type: Phaser.AUTO, backgroundColor: "#060518", scene: MillionaireScene,
    input: { mouse: { preventDefaultWheel: false } },
  }), []);

  const handleReady = useCallback((game: Phaser.Game) => {
    game.scene.start("MillionaireScene", {
      questions, onComplete: (r: { prize: string; questionsAnswered: number }) => cbRef.current?.(r),
    });
  }, [questions]);

  return <PhaserEmbed key={palette.cacheKey} config={config} height={height} className={className} onReady={handleReady} />;
}
