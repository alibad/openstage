"use client";

import { useRef, useMemo, useCallback } from "react";
import * as Phaser from "phaser";
import { PhaserEmbed } from "./phaser-embed";
import { useThemedPalette } from "./_use-themed-palette";

export interface ReactionGameProps {
  rounds?: number;
  height?: string;
  className?: string;
  onComplete?: (result: { times: number[]; average: number; best: number }) => void;
}

const C = {
  bg: 0x0a0718,
  waiting: 0xf87171,
  ready: 0x4ade80,
  surface: 0x151030,
  purple: 0x818cf8,
  text: 0xf3f4f6,
};

class ReactionScene extends Phaser.Scene {
  private totalRounds!: number;
  private onComplete?: ReactionGameProps["onComplete"];
  private currentRound = 0;
  private times: number[] = [];
  private state: "idle" | "waiting" | "ready" | "clicked" | "early" = "idle";
  private readyTime = 0;
  private bgRect!: Phaser.GameObjects.Rectangle;
  private mainText!: Phaser.GameObjects.Text;
  private subText!: Phaser.GameObjects.Text;
  private roundText!: Phaser.GameObjects.Text;
  private timesText!: Phaser.GameObjects.Text;
  private delayTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: "ReactionScene" });
  }

  init(data: { rounds: number; onComplete?: ReactionGameProps["onComplete"] }) {
    this.totalRounds = data.rounds;
    this.onComplete = data.onComplete;
    this.currentRound = 0;
    this.times = [];
    this.state = "idle";
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.bgRect = this.add
      .rectangle(w / 2, h / 2, w, h, C.bg)
      .setInteractive({ useHandCursor: true });

    this.mainText = this.add
      .text(w / 2, h / 2 - 20, "Click to Start", {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "28px",
        fontStyle: "bold",
        color: "#F3F4F6",
      })
      .setOrigin(0.5, 0.5);

    this.subText = this.add
      .text(w / 2, h / 2 + 20, `${this.totalRounds} rounds — test your reaction speed`, {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "14px",
        color: "#9CA3AF",
      })
      .setOrigin(0.5, 0.5);

    this.roundText = this.add
      .text(24, 20, "", {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "13px",
        color: "#6B7280",
      });

    this.timesText = this.add
      .text(w - 24, 20, "", {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "13px",
        color: "#6B7280",
      })
      .setOrigin(1, 0);

    // Visual ring indicators at bottom
    const ringY = h - 30;
    const ringGap = 24;
    const startX = w / 2 - ((this.totalRounds - 1) * ringGap) / 2;
    for (let i = 0; i < this.totalRounds; i++) {
      this.add
        .circle(startX + i * ringGap, ringY, 6, 0xffffff, 0.06)
        .setStrokeStyle(1, 0xffffff, 0.1)
        .setName(`ring-${i}`);
    }

    this.bgRect.on("pointerdown", () => this.handleClick());
  }

  private handleClick() {
    const w = this.scale.width;

    switch (this.state) {
      case "idle":
        this.startRound();
        break;

      case "waiting":
        // Clicked too early
        this.state = "early";
        if (this.delayTimer) this.delayTimer.destroy();
        this.bgRect.setFillStyle(C.surface);
        this.mainText.setText("Too early!").setColor("#F87171");
        this.subText.setText("Click to try again");
        this.state = "idle";
        break;

      case "ready": {
        const reactionTime = Date.now() - this.readyTime;
        this.times.push(reactionTime);
        this.state = "clicked";

        this.bgRect.setFillStyle(C.bg);
        this.mainText.setText(`${reactionTime}ms`).setColor("#7DD3FC").setFontSize(48);
        this.subText.setText(
          reactionTime < 200 ? "Lightning fast!" :
          reactionTime < 300 ? "Great reflexes!" :
          reactionTime < 400 ? "Decent!" : "Keep practicing!"
        ).setColor("#9CA3AF");

        // Update ring
        const ring = this.children.getByName(`ring-${this.currentRound}`) as Phaser.GameObjects.Arc | null;
        if (ring) {
          const ringColor = reactionTime < 250 ? 0x4ade80 : reactionTime < 400 ? 0xfbbf24 : 0xf87171;
          ring.setFillStyle(ringColor, 0.6).setStrokeStyle(1, ringColor, 0.8);
        }

        this.timesText.setText(this.times.map((t) => `${t}ms`).join("  "));
        this.currentRound++;

        if (this.currentRound >= this.totalRounds) {
          this.time.delayedCall(1200, () => this.showResults());
        } else {
          this.time.delayedCall(1200, () => {
            this.state = "idle";
            this.mainText.setText("Click for Next Round").setColor("#F3F4F6").setFontSize(28);
            this.subText.setText(`Round ${this.currentRound + 1} of ${this.totalRounds}`);
          });
        }
        break;
      }
    }
  }

  private startRound() {
    this.state = "waiting";
    this.roundText.setText(`Round ${this.currentRound + 1} / ${this.totalRounds}`);
    this.bgRect.setFillStyle(C.waiting, 0.15);
    this.mainText.setText("Wait for green...").setColor("#F87171").setFontSize(28);
    this.subText.setText("Don't click yet!");

    const delay = 1500 + Math.random() * 3000;
    this.delayTimer = this.time.delayedCall(delay, () => {
      this.state = "ready";
      this.readyTime = Date.now();
      this.bgRect.setFillStyle(C.ready, 0.15);
      this.mainText.setText("CLICK NOW!").setColor("#4ADE80").setFontSize(36);
      this.subText.setText("");
    });
  }

  private showResults() {
    const w = this.scale.width;
    const h = this.scale.height;
    const avg = Math.round(this.times.reduce((a, b) => a + b, 0) / this.times.length);
    const best = Math.min(...this.times);

    this.bgRect.setFillStyle(C.bg);
    this.roundText.setText("");
    this.timesText.setText("");

    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.6);

    this.mainText.setText(`Average: ${avg}ms`).setColor("#7DD3FC").setFontSize(36).setPosition(w / 2, h / 2 - 50);
    this.subText.setText(`Best: ${best}ms`).setColor("#4ADE80").setFontSize(18).setPosition(w / 2, h / 2 - 8);

    // Individual times
    const timesStr = this.times.map((t, i) => `R${i + 1}: ${t}ms`).join("   ");
    this.add
      .text(w / 2, h / 2 + 30, timesStr, {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "12px",
        color: "#6B7280",
      })
      .setOrigin(0.5, 0.5);

    const retryBg = this.add
      .rectangle(w / 2, h / 2 + 80, 150, 44, C.purple)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(w / 2, h / 2 + 80, "Play Again", {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
        color: "#FFFFFF",
      })
      .setOrigin(0.5, 0.5);

    retryBg.on("pointerover", () => retryBg.setFillStyle(0x6366f1));
    retryBg.on("pointerout", () => retryBg.setFillStyle(C.purple));
    retryBg.on("pointerdown", () =>
      this.scene.restart({ rounds: this.totalRounds, onComplete: this.onComplete })
    );

    this.onComplete?.({ times: this.times, average: avg, best });
  }
}

export function ReactionGame({
  rounds = 5,
  height = "400px",
  className,
  onComplete,
}: ReactionGameProps) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const palette = useThemedPalette(C, ({ brand }) => ({ purple: brand[1] }));

  const config = useMemo(
    (): Phaser.Types.Core.GameConfig => ({
      type: Phaser.AUTO,
      backgroundColor: "#0A0718",
      scene: ReactionScene,
      input: { mouse: { preventDefaultWheel: false } },
    }),
    []
  );

  const handleReady = useCallback(
    (game: Phaser.Game) => {
      game.scene.start("ReactionScene", {
        rounds,
        onComplete: (r: { times: number[]; average: number; best: number }) =>
          onCompleteRef.current?.(r),
      });
    },
    [rounds]
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
