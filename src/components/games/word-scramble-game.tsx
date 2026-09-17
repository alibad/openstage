"use client";

import { useRef, useMemo, useCallback } from "react";
import * as Phaser from "phaser";
import { PhaserEmbed } from "./phaser-embed";
import { useThemedPalette } from "./_use-themed-palette";

export interface ScrambleWord {
  word: string;
  hint?: string;
}

export interface WordScrambleGameProps {
  words: ScrambleWord[];
  height?: string;
  className?: string;
  onComplete?: (result: { solved: number; total: number; time: number }) => void;
}

const C = {
  bg: 0x0a0718,
  surface: 0x151030,
  border: 0x2a2550,
  tile: 0x1a1538,
  tileActive: 0x2a2560,
  tileCorrect: 0x4ade80,
  text: 0xf3f4f6,
  muted: 0x9ca3af,
  cyan: 0x22d3ee,
  purple: 0x818cf8,
  wrong: 0xf87171,
};

class ScrambleScene extends Phaser.Scene {
  private words!: ScrambleWord[];
  private onComplete?: WordScrambleGameProps["onComplete"];
  private currentIndex = 0;
  private solved = 0;
  private startTime = 0;
  private scrambled: string[] = [];
  private selected: number[] = [];
  private letterTiles: { container: Phaser.GameObjects.Container; bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text; idx: number }[] = [];
  private answerSlots: Phaser.GameObjects.Text[] = [];
  private hintText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private wordText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "ScrambleScene" });
  }

  init(data: {
    words: ScrambleWord[];
    onComplete?: WordScrambleGameProps["onComplete"];
  }) {
    this.words = data.words;
    this.onComplete = data.onComplete;
    this.currentIndex = 0;
    this.solved = 0;
    this.startTime = Date.now();
  }

  create() {
    const w = this.scale.width;

    this.progressText = this.add
      .text(24, 20, "", {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "13px",
        color: "#6B7280",
      });

    this.wordText = this.add
      .text(w / 2, 20, "", {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "13px",
        fontStyle: "bold",
        color: "#7DD3FC",
      })
      .setOrigin(0.5, 0);

    this.hintText = this.add
      .text(w / 2, 50, "", {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "12px",
        color: "#6B7280",
        fontStyle: "italic",
      })
      .setOrigin(0.5, 0);

    this.feedbackText = this.add
      .text(w / 2, this.scale.height - 30, "", {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
        color: "#4ADE80",
      })
      .setOrigin(0.5, 0.5);

    this.showWord();
  }

  private showWord() {
    const sw = this.words[this.currentIndex];
    const w = this.scale.width;
    const h = this.scale.height;

    this.progressText.setText(`${this.currentIndex + 1} / ${this.words.length}`);
    this.wordText.setText(`${sw.word.length} letters`);
    this.hintText.setText(sw.hint ? `Hint: ${sw.hint}` : "");
    this.feedbackText.setText("");

    // Cleanup
    this.letterTiles.forEach((t) => t.container.destroy());
    this.letterTiles = [];
    this.answerSlots.forEach((s) => s.destroy());
    this.answerSlots = [];
    this.selected = [];

    // Scramble
    const letters = sw.word.toUpperCase().split("");
    this.scrambled = [...letters].sort(() => Math.random() - 0.5);
    // Ensure it's actually scrambled
    if (this.scrambled.join("") === letters.join("") && letters.length > 1) {
      this.scrambled.reverse();
    }

    const tileSize = Math.min(52, (w - 60) / Math.max(letters.length, 1) - 8);
    const gap = 8;

    // Answer slots (top row)
    const answerY = h * 0.38;
    const answerTotalW = letters.length * (tileSize + gap) - gap;
    const answerStartX = (w - answerTotalW) / 2;

    letters.forEach((_, i) => {
      const x = answerStartX + i * (tileSize + gap) + tileSize / 2;
      this.add
        .rectangle(x, answerY, tileSize, tileSize, 0x000000, 0)
        .setStrokeStyle(1, 0xffffff, 0.1);

      const slot = this.add
        .text(x, answerY, "", {
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "22px",
          fontStyle: "bold",
          color: "#F3F4F6",
        })
        .setOrigin(0.5, 0.5);
      this.answerSlots.push(slot);
    });

    // Underline dots
    letters.forEach((_, i) => {
      const x = answerStartX + i * (tileSize + gap) + tileSize / 2;
      this.add.circle(x, answerY + tileSize / 2 + 6, 2, 0xffffff, 0.15);
    });

    // Letter tiles (bottom row)
    const tileY = h * 0.62;
    const tileTotalW = this.scrambled.length * (tileSize + gap) - gap;
    const tileStartX = (w - tileTotalW) / 2;

    this.scrambled.forEach((letter, i) => {
      const x = tileStartX + i * (tileSize + gap) + tileSize / 2;
      const container = this.add.container(x, tileY);

      const bg = this.add
        .rectangle(0, 0, tileSize, tileSize, C.tile)
        .setStrokeStyle(1, C.border)
        .setInteractive({ useHandCursor: true });

      const text = this.add
        .text(0, 0, letter, {
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "22px",
          fontStyle: "bold",
          color: "#E5E7EB",
        })
        .setOrigin(0.5, 0.5);

      container.add([bg, text]);
      container.setSize(tileSize, tileSize);

      const tile = { container, bg, text, idx: i };
      this.letterTiles.push(tile);

      bg.on("pointerover", () => {
        if (!this.selected.includes(i)) bg.setFillStyle(C.tileActive);
      });
      bg.on("pointerout", () => {
        if (!this.selected.includes(i)) bg.setFillStyle(C.tile);
      });
      bg.on("pointerdown", () => this.selectLetter(i));
    });

    // Skip button
    const skipY = h * 0.82;
    const skipBg = this.add
      .rectangle(w / 2, skipY, 100, 32, 0x000000, 0)
      .setStrokeStyle(1, 0xffffff, 0.1)
      .setInteractive({ useHandCursor: true })
      .setName("skip");
    this.add
      .text(w / 2, skipY, "Skip →", {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "12px",
        color: "#6B7280",
      })
      .setOrigin(0.5, 0.5)
      .setName("skipText");

    skipBg.on("pointerover", () => skipBg.setStrokeStyle(1, 0xffffff, 0.3));
    skipBg.on("pointerout", () => skipBg.setStrokeStyle(1, 0xffffff, 0.1));
    skipBg.on("pointerdown", () => this.nextWord(false));
  }

  private selectLetter(tileIdx: number) {
    if (this.selected.includes(tileIdx)) return;

    this.selected.push(tileIdx);
    const tile = this.letterTiles[tileIdx];
    tile.bg.setFillStyle(C.purple, 0.3).setStrokeStyle(1, C.purple, 0.5);
    tile.container.setAlpha(0.5);

    // Fill answer slot
    const slotIdx = this.selected.length - 1;
    if (slotIdx < this.answerSlots.length) {
      this.answerSlots[slotIdx].setText(this.scrambled[tileIdx]);
    }

    // Check if complete
    if (this.selected.length === this.scrambled.length) {
      const attempt = this.selected.map((i) => this.scrambled[i]).join("");
      const correct = this.words[this.currentIndex].word.toUpperCase();
      if (attempt === correct) {
        this.feedbackText.setText("Correct!").setColor("#4ADE80");
        this.answerSlots.forEach((s) => s.setColor("#4ADE80"));
        this.solved++;
        this.time.delayedCall(1000, () => this.nextWord(true));
      } else {
        this.feedbackText.setText("Not quite — try again").setColor("#F87171");
        this.cameras.main.shake(100, 0.003);
        this.time.delayedCall(600, () => this.resetAttempt());
      }
    }
  }

  private resetAttempt() {
    this.selected = [];
    this.answerSlots.forEach((s) => s.setText(""));
    this.feedbackText.setText("");
    this.letterTiles.forEach((t) => {
      t.bg.setFillStyle(C.tile).setStrokeStyle(1, C.border);
      t.container.setAlpha(1);
    });
  }

  private nextWord(wasSolved: boolean) {
    // Clean up skip button
    const skip = this.children.getByName("skip");
    const skipText = this.children.getByName("skipText");
    skip?.destroy();
    skipText?.destroy();

    this.currentIndex++;
    if (this.currentIndex >= this.words.length) {
      this.showResults();
    } else {
      this.showWord();
    }
  }

  private showResults() {
    const w = this.scale.width;
    const h = this.scale.height;
    const elapsed = Math.round((Date.now() - this.startTime) / 1000);

    // Cleanup
    this.letterTiles.forEach((t) => t.container.destroy());
    this.answerSlots.forEach((s) => s.destroy());
    this.hintText.setText("");
    this.wordText.setText("");
    this.progressText.setText("");
    this.feedbackText.setText("");

    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.5);

    this.add
      .text(w / 2, h / 2 - 50, `${this.solved} / ${this.words.length}`, {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "48px",
        fontStyle: "bold",
        color: "#7DD3FC",
      })
      .setOrigin(0.5, 0.5);

    this.add
      .text(w / 2, h / 2, `solved in ${elapsed}s`, {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "16px",
        color: "#9CA3AF",
      })
      .setOrigin(0.5, 0.5);

    const retryBg = this.add
      .rectangle(w / 2, h / 2 + 60, 150, 44, C.purple)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(w / 2, h / 2 + 60, "Play Again", {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
        color: "#FFFFFF",
      })
      .setOrigin(0.5, 0.5);

    retryBg.on("pointerover", () => retryBg.setFillStyle(0x6366f1));
    retryBg.on("pointerout", () => retryBg.setFillStyle(C.purple));
    retryBg.on("pointerdown", () =>
      this.scene.restart({ words: this.words, onComplete: this.onComplete })
    );

    this.onComplete?.({ solved: this.solved, total: this.words.length, time: elapsed });
  }
}

export function WordScrambleGame({
  words,
  height = "440px",
  className,
  onComplete,
}: WordScrambleGameProps) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const palette = useThemedPalette(C, ({ brand }) => ({
    cyan: brand[0],
    purple: brand[1],
  }));

  const config = useMemo(
    (): Phaser.Types.Core.GameConfig => ({
      type: Phaser.AUTO,
      backgroundColor: "#0A0718",
      scene: ScrambleScene,
      input: { mouse: { preventDefaultWheel: false } },
    }),
    []
  );

  const handleReady = useCallback(
    (game: Phaser.Game) => {
      game.scene.start("ScrambleScene", {
        words,
        onComplete: (r: { solved: number; total: number; time: number }) =>
          onCompleteRef.current?.(r),
      });
    },
    [words]
  );

  return <PhaserEmbed key={palette.cacheKey} config={config} height={height} className={className} onReady={handleReady} />;
}
