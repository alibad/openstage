"use client";

import { useRef, useMemo, useCallback } from "react";
import * as Phaser from "phaser";
import { PhaserEmbed } from "./phaser-embed";
import { useThemedPalette } from "./_use-themed-palette";

export interface MemoryPair {
  id: string;
  label: string;
  color?: string;
}

export interface MemoryGameProps {
  pairs: MemoryPair[];
  height?: string;
  className?: string;
  onComplete?: (result: { moves: number; pairs: number; time: number }) => void;
}

const C = {
  bg: 0x0a0718,
  surface: 0x1a1538,
  border: 0x2a2550,
  cardFace: 0x151030,
  text: 0xf3f4f6,
  muted: 0x9ca3af,
  matched: 0x4ade80,
  purple: 0x818cf8,
};

const CARD_COLORS = [0x22d3ee, 0x818cf8, 0xa855f7, 0xf472b6, 0xfbbf24, 0x4ade80, 0xfb923c, 0x38bdf8];

interface Card {
  container: Phaser.GameObjects.Container;
  pairId: string;
  label: string;
  colorIdx: number;
  faceUp: boolean;
  matched: boolean;
  bg: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
  backIcon: Phaser.GameObjects.Text;
}

class MemoryScene extends Phaser.Scene {
  private pairsDef!: MemoryPair[];
  private onComplete?: MemoryGameProps["onComplete"];
  private cards: Card[] = [];
  private flipped: Card[] = [];
  private moves = 0;
  private matchedCount = 0;
  private locked = false;
  private startTime = 0;
  private movesText!: Phaser.GameObjects.Text;
  private matchText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "MemoryScene" });
  }

  init(data: { pairs: MemoryPair[]; onComplete?: MemoryGameProps["onComplete"] }) {
    this.pairsDef = data.pairs;
    this.onComplete = data.onComplete;
    this.cards = [];
    this.flipped = [];
    this.moves = 0;
    this.matchedCount = 0;
    this.locked = false;
  }

  create() {
    const w = this.scale.width;
    this.startTime = Date.now();

    this.movesText = this.add.text(24, 16, "Moves: 0", {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "13px",
      color: "#9CA3AF",
    });

    this.matchText = this.add.text(w - 24, 16, `Matched: 0/${this.pairsDef.length}`, {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "13px",
      color: "#7DD3FC",
    }).setOrigin(1, 0);

    this.add.text(w / 2, 16, "Find all matching pairs", {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "13px",
      color: "#9CA3AF",
    }).setOrigin(0.5, 0);

    this.createCards(w);
  }

  private createCards(w: number) {
    // Create two copies of each pair and shuffle
    const allCards: { pairId: string; label: string; colorIdx: number }[] = [];
    this.pairsDef.forEach((pair, i) => {
      allCards.push({ pairId: pair.id, label: pair.label, colorIdx: i % CARD_COLORS.length });
      allCards.push({ pairId: pair.id, label: pair.label, colorIdx: i % CARD_COLORS.length });
    });

    // Fisher-Yates shuffle
    for (let i = allCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
    }

    const total = allCards.length;
    const cols = total <= 8 ? 4 : total <= 12 ? 4 : 6;
    const rows = Math.ceil(total / cols);
    const h = this.scale.height;
    const availH = h - 60;
    const availW = w - 40;
    const cardW = Math.min(110, (availW - (cols - 1) * 10) / cols);
    const cardH = Math.min(110, (availH - (rows - 1) * 10) / rows);
    const gridW = cols * cardW + (cols - 1) * 10;
    const gridH = rows * cardH + (rows - 1) * 10;
    const startX = (w - gridW) / 2 + cardW / 2;
    const startY = (h - gridH) / 2 + cardH / 2 + 15;

    allCards.forEach((data, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardW + 10);
      const y = startY + row * (cardH + 10);

      const container = this.add.container(x, y);
      const bg = this.add.rectangle(0, 0, cardW, cardH, C.surface).setStrokeStyle(1, C.border);
      const backIcon = this.add.text(0, 0, "?", {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "24px",
        fontStyle: "bold",
        color: "#4B5563",
      }).setOrigin(0.5, 0.5);

      const cardColor = CARD_COLORS[data.colorIdx];
      const text = this.add.text(0, 0, data.label, {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: Math.min(13, cardW / 8) + "px",
        fontStyle: "bold",
        color: Phaser.Display.Color.IntegerToColor(cardColor).rgba,
        wordWrap: { width: cardW - 16 },
        align: "center",
      }).setOrigin(0.5, 0.5).setVisible(false);

      container.add([bg, backIcon, text]);
      container.setSize(cardW, cardH);
      container.setInteractive({ useHandCursor: true });

      const card: Card = { container, pairId: data.pairId, label: data.label, colorIdx: data.colorIdx, faceUp: false, matched: false, bg, text, backIcon };

      container.on("pointerover", () => {
        if (!card.faceUp && !card.matched && !this.locked) bg.setFillStyle(C.border);
      });
      container.on("pointerout", () => {
        if (!card.faceUp && !card.matched && !this.locked) bg.setFillStyle(C.surface);
      });
      container.on("pointerdown", () => this.flipCard(card));

      this.cards.push(card);
    });
  }

  private flipCard(card: Card) {
    if (this.locked || card.faceUp || card.matched) return;
    if (this.flipped.length >= 2) return;

    card.faceUp = true;
    const cardColor = CARD_COLORS[card.colorIdx];
    card.bg.setFillStyle(C.cardFace).setStrokeStyle(1, cardColor, 0.5);
    card.backIcon.setVisible(false);
    card.text.setVisible(true);

    this.tweens.add({
      targets: card.container,
      scaleX: [0, 1],
      duration: 200,
      ease: "Back.easeOut",
    });

    this.flipped.push(card);

    if (this.flipped.length === 2) {
      this.moves++;
      this.movesText.setText(`Moves: ${this.moves}`);
      this.locked = true;

      const [a, b] = this.flipped;
      if (a.pairId === b.pairId) {
        // Match!
        this.matchedCount++;
        this.matchText.setText(`Matched: ${this.matchedCount}/${this.pairsDef.length}`);
        a.matched = true;
        b.matched = true;
        [a, b].forEach((c) => {
          c.bg.setStrokeStyle(2, C.matched, 0.6);
          c.container.setAlpha(0.7);
        });
        this.flipped = [];
        this.locked = false;

        if (this.matchedCount === this.pairsDef.length) {
          this.time.delayedCall(500, () => this.showComplete());
        }
      } else {
        this.time.delayedCall(800, () => {
          [a, b].forEach((c) => {
            c.faceUp = false;
            c.bg.setFillStyle(C.surface).setStrokeStyle(1, C.border);
            c.text.setVisible(false);
            c.backIcon.setVisible(true);
          });
          this.flipped = [];
          this.locked = false;
        });
      }
    }
  }

  private showComplete() {
    const w = this.scale.width;
    const h = this.scale.height;
    const elapsed = Math.round((Date.now() - this.startTime) / 1000);

    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.75);

    this.add.text(w / 2, h / 2 - 50, "All matched!", {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "32px",
      fontStyle: "bold",
      color: "#4ADE80",
    }).setOrigin(0.5, 0.5);

    this.add.text(w / 2, h / 2, `${this.moves} moves · ${elapsed}s`, {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "16px",
      color: "#9CA3AF",
    }).setOrigin(0.5, 0.5);

    const retryBg = this.add.rectangle(w / 2, h / 2 + 50, 140, 44, C.purple)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h / 2 + 50, "Play Again", {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#FFFFFF",
    }).setOrigin(0.5, 0.5);

    retryBg.on("pointerdown", () => {
      this.scene.restart({ pairs: this.pairsDef, onComplete: this.onComplete });
    });

    this.onComplete?.({ moves: this.moves, pairs: this.pairsDef.length, time: elapsed });
  }
}

export function MemoryGame({
  pairs,
  height = "500px",
  className,
  onComplete,
}: MemoryGameProps) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const palette = useThemedPalette(C, ({ brand }) => ({ purple: brand[1] }));

  const config = useMemo(
    (): Phaser.Types.Core.GameConfig => ({
      type: Phaser.AUTO,
      backgroundColor: "#0A0718",
      scene: MemoryScene,
      input: { mouse: { preventDefaultWheel: false } },
    }),
    []
  );

  const handleReady = useCallback(
    (game: Phaser.Game) => {
      game.scene.start("MemoryScene", {
        pairs,
        onComplete: (r: { moves: number; pairs: number; time: number }) =>
          onCompleteRef.current?.(r),
      });
    },
    [pairs]
  );

  return (
    <PhaserEmbed
      key={palette.cacheKey}
      config={config}
      height={height}
      className={className}
      onReady={handleReady}
    />
  );
}
