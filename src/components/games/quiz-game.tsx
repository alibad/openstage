"use client";

import { useRef, useMemo, useCallback } from "react";
import * as Phaser from "phaser";
import { PhaserEmbed } from "./phaser-embed";
import { useThemedPalette } from "./_use-themed-palette";

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

export interface QuizGameProps {
  questions: QuizQuestion[];
  /** Seconds per question (0 = no timer) */
  timePerQuestion?: number;
  /** Brand accent color */
  accentColor?: string;
  height?: string;
  className?: string;
  onComplete?: (result: { score: number; total: number; answers: number[] }) => void;
  /**
   * Defer starting the quiz until the user explicitly clicks a start button.
   * Recommended for timed quizzes embedded on long pages so the timer
   * doesn't run before the user scrolls to the widget.
   */
  startOnInteract?: boolean;
  /** Copy on the start overlay. */
  startLabel?: string;
  startSubLabel?: string;
  /**
   * Pause the game loop when the embed leaves the viewport or the tab is hidden.
   */
  autoPauseOffscreen?: boolean;
}

const COLORS = {
  bg: 0x0a0718,
  surface: 0x1a1538,
  border: 0x2a2550,
  text: 0xf3f4f6,
  muted: 0x9ca3af,
  correct: 0x4ade80,
  wrong: 0xf87171,
  cyan: 0x7dd3fc,
  purple: 0x818cf8,
  pink: 0xf472b6,
};

const OPTION_COLORS = [0x22d3ee, 0x818cf8, 0xa855f7, 0xf472b6];

class QuizScene extends Phaser.Scene {
  private questions!: QuizQuestion[];
  private timePerQ!: number;
  private currentIndex = 0;
  private score = 0;
  private answers: number[] = [];
  private onComplete?: QuizGameProps["onComplete"];
  private optionButtons: Phaser.GameObjects.Container[] = [];
  private questionText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private timerBar!: Phaser.GameObjects.Rectangle;
  private timerEvent?: Phaser.Time.TimerEvent;
  private locked = false;

  constructor() {
    super({ key: "QuizScene" });
  }

  init(data: { questions: QuizQuestion[]; timePerQ: number; onComplete?: QuizGameProps["onComplete"] }) {
    this.questions = data.questions;
    this.timePerQ = data.timePerQ;
    this.onComplete = data.onComplete;
    this.currentIndex = 0;
    this.score = 0;
    this.answers = [];
  }

  create() {
    const w = this.scale.width;

    // Top bar
    this.progressText = this.add.text(24, 20, "", {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "14px",
      color: "#9CA3AF",
    });

    this.scoreText = this.add.text(w - 24, 20, "", {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "14px",
      color: "#7DD3FC",
    }).setOrigin(1, 0);

    // Timer bar
    this.timerBar = this.add.rectangle(0, 0, w, 3, COLORS.cyan).setOrigin(0, 0).setAlpha(this.timePerQ > 0 ? 1 : 0);

    // Question
    this.questionText = this.add.text(w / 2, 80, "", {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "22px",
      fontStyle: "bold",
      color: "#F3F4F6",
      wordWrap: { width: w - 80 },
      align: "center",
    }).setOrigin(0.5, 0);

    this.showQuestion();

    this.scale.on("resize", (size: Phaser.Structs.Size) => {
      this.relayout(size.width, size.height);
    });
  }

  private relayout(w: number, _h: number) {
    this.progressText.setPosition(24, 20);
    this.scoreText.setPosition(w - 24, 20);
    this.questionText.setPosition(w / 2, 80);
    this.questionText.setWordWrapWidth(w - 80);
    this.timerBar.setSize(w, 3);
  }

  private showQuestion() {
    const q = this.questions[this.currentIndex];
    const w = this.scale.width;
    const h = this.scale.height;
    this.locked = false;

    this.progressText.setText(`Question ${this.currentIndex + 1} of ${this.questions.length}`);
    this.scoreText.setText(`Score: ${this.score}`);
    this.questionText.setText(q.question);

    // Clear old options
    this.optionButtons.forEach((c) => c.destroy());
    this.optionButtons = [];

    const optionW = Math.min(w - 60, 500);
    const optionH = 52;
    const gap = 12;
    const totalH = q.options.length * optionH + (q.options.length - 1) * gap;
    const startY = Math.max(180, (h - totalH) / 2 + 30);

    q.options.forEach((opt, i) => {
      const y = startY + i * (optionH + gap);
      const container = this.add.container(w / 2, y);

      const bg = this.add.rectangle(0, 0, optionW, optionH, COLORS.surface)
        .setStrokeStyle(1, COLORS.border)
        .setInteractive({ useHandCursor: true });

      const label = this.add.text(
        -optionW / 2 + 48,
        0,
        opt,
        {
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "16px",
          color: "#F3F4F6",
          wordWrap: { width: optionW - 80 },
        }
      ).setOrigin(0, 0.5);

      const indexCircle = this.add.circle(-optionW / 2 + 24, 0, 14, OPTION_COLORS[i % 4], 0.2);
      const indexLetter = this.add.text(-optionW / 2 + 24, 0, String.fromCharCode(65 + i), {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
        color: Phaser.Display.Color.IntegerToColor(OPTION_COLORS[i % 4]).rgba,
      }).setOrigin(0.5, 0.5);

      container.add([bg, indexCircle, indexLetter, label]);
      container.setSize(optionW, optionH);

      bg.on("pointerover", () => {
        if (!this.locked) bg.setFillStyle(COLORS.border);
      });
      bg.on("pointerout", () => {
        if (!this.locked) bg.setFillStyle(COLORS.surface);
      });
      bg.on("pointerdown", () => this.selectAnswer(i, bg));

      this.optionButtons.push(container);
    });

    // Timer
    if (this.timerEvent) this.timerEvent.destroy();
    this.tweens.killTweensOf(this.timerBar);
    if (this.timePerQ > 0) {
      this.timerBar.setScale(1, 1).setSize(w, 3).setFillStyle(COLORS.cyan);
      this.timerEvent = this.time.addEvent({
        delay: this.timePerQ * 1000,
        callback: () => this.selectAnswer(-1),
      });
      this.tweens.add({
        targets: this.timerBar,
        scaleX: 0,
        duration: this.timePerQ * 1000,
        ease: "Linear",
      });
    }
  }

  private selectAnswer(index: number, bg?: Phaser.GameObjects.Rectangle) {
    if (this.locked) return;
    this.locked = true;
    if (this.timerEvent) this.timerEvent.destroy();

    const q = this.questions[this.currentIndex];
    const isCorrect = index === q.correct;
    if (isCorrect) this.score++;
    this.answers.push(index);

    // Highlight correct/wrong
    this.optionButtons.forEach((container, i) => {
      const optBg = container.list[0] as Phaser.GameObjects.Rectangle;
      if (i === q.correct) {
        optBg.setFillStyle(COLORS.correct, 0.2).setStrokeStyle(2, COLORS.correct);
      } else if (i === index && !isCorrect) {
        optBg.setFillStyle(COLORS.wrong, 0.2).setStrokeStyle(2, COLORS.wrong);
      }
    });

    // Flash feedback
    const w = this.scale.width;
    const feedbackText = this.add.text(w / 2, this.scale.height - 40, isCorrect ? "Correct!" : index === -1 ? "Time's up!" : "Wrong!", {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "16px",
      fontStyle: "bold",
      color: isCorrect ? "#4ADE80" : "#F87171",
    }).setOrigin(0.5, 0.5).setAlpha(0);

    this.tweens.add({
      targets: feedbackText,
      alpha: 1,
      duration: 200,
    });

    this.time.delayedCall(1200, () => {
      feedbackText.destroy();
      this.currentIndex++;
      if (this.currentIndex < this.questions.length) {
        this.showQuestion();
      } else {
        this.showResults();
      }
    });
  }

  private showResults() {
    this.optionButtons.forEach((c) => c.destroy());
    this.optionButtons = [];
    this.questionText.setText("");
    this.progressText.setText("");
    this.timerBar.setAlpha(0);

    const w = this.scale.width;
    const h = this.scale.height;
    const pct = Math.round((this.score / this.questions.length) * 100);
    const color = pct >= 70 ? "#4ADE80" : pct >= 40 ? "#FBBF24" : "#F87171";

    this.add.text(w / 2, h / 2 - 60, `${pct}%`, {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "64px",
      fontStyle: "bold",
      color,
    }).setOrigin(0.5, 0.5);

    this.add.text(w / 2, h / 2 + 10, `${this.score} of ${this.questions.length} correct`, {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "18px",
      color: "#9CA3AF",
    }).setOrigin(0.5, 0.5);

    this.scoreText.setText(`Final: ${this.score}`);

    // Retry button
    const retryBg = this.add.rectangle(w / 2, h / 2 + 70, 140, 44, COLORS.purple)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h / 2 + 70, "Play Again", {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#FFFFFF",
    }).setOrigin(0.5, 0.5);

    retryBg.on("pointerover", () => retryBg.setFillStyle(0x6366f1));
    retryBg.on("pointerout", () => retryBg.setFillStyle(COLORS.purple));
    retryBg.on("pointerdown", () => {
      this.scene.restart({
        questions: this.questions,
        timePerQ: this.timePerQ,
        onComplete: this.onComplete,
      });
    });

    this.onComplete?.({ score: this.score, total: this.questions.length, answers: this.answers });
  }
}

export function QuizGame({
  questions,
  timePerQuestion = 0,
  height = "500px",
  className,
  onComplete,
  startOnInteract = false,
  startLabel = "Start quiz",
  startSubLabel,
  autoPauseOffscreen = false,
}: QuizGameProps) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const palette = useThemedPalette(COLORS, ({ brand }) => ({
    cyan: brand[0],
    purple: brand[1],
    pink: brand[4],
  }));

  const config = useMemo(
    (): Phaser.Types.Core.GameConfig => ({
      type: Phaser.AUTO,
      backgroundColor: "#0A0718",
      scene: QuizScene,
      input: { mouse: { preventDefaultWheel: false } },
    }),
    []
  );

  const handleReady = useCallback(
    (game: Phaser.Game) => {
      game.scene.start("QuizScene", {
        questions,
        timePerQ: timePerQuestion,
        onComplete: (r: { score: number; total: number; answers: number[] }) =>
          onCompleteRef.current?.(r),
      });
    },
    [questions, timePerQuestion]
  );

  return (
    <PhaserEmbed
      key={palette.cacheKey}
      config={config}
      height={height}
      className={className}
      onReady={handleReady}
      startOnInteract={startOnInteract}
      startLabel={startLabel}
      startSubLabel={startSubLabel}
      autoPauseOffscreen={autoPauseOffscreen}
    />
  );
}
