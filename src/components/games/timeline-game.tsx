"use client";

import { useRef, useMemo, useCallback } from "react";
import * as Phaser from "phaser";
import { PhaserEmbed } from "./phaser-embed";
import { useThemedPalette } from "./_use-themed-palette";

export interface TimelineEvent {
  label: string;
  year: number;
  detail?: string;
}

export interface TimelineGameProps {
  events: TimelineEvent[];
  title?: string;
  height?: string;
  className?: string;
  onComplete?: (result: { attempts: number; time: number }) => void;
}

const C = {
  bg: 0x060518,
  surface: 0x0e0c24,
  border: 0x1e1a40,
  highlight: 0x818cf8,
  cyan: 0x22d3ee,
  gold: 0xfbbf24,
  correct: 0x4ade80,
  wrong: 0xf87171,
  text: 0xf3f4f6,
  muted: 0x6b7280,
  purple: 0x818cf8,
  drop: 0x4338ca,
};

interface EventCard {
  data: TimelineEvent;
  bg: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  yearLabel: Phaser.GameObjects.Text;
  placed: boolean;
  locked: boolean;
  slotIdx: number;
  homeX: number;
  homeY: number;
}

class TimelineScene extends Phaser.Scene {
  private timelineEvents!: TimelineEvent[];
  private gameTitle!: string;
  private onComplete?: TimelineGameProps["onComplete"];
  private shuffled!: TimelineEvent[];
  private sorted!: TimelineEvent[];
  private cards: EventCard[] = [];
  private slotRects: Phaser.GameObjects.Rectangle[] = [];
  private slotLabels: Phaser.GameObjects.Text[] = [];
  private slotPositions: { x: number; y: number }[] = [];
  private attempts = 0;
  private startTime = 0;
  private placedCount = 0;

  private dragging: EventCard | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private hoveredSlot = -1;

  private statusText!: Phaser.GameObjects.Text;
  private checkBtn!: Phaser.GameObjects.Rectangle;
  private checkLabel!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "TimelineScene" });
  }

  init(data: { events: TimelineEvent[]; title: string; onComplete?: TimelineGameProps["onComplete"] }) {
    this.timelineEvents = data.events;
    this.gameTitle = data.title;
    this.onComplete = data.onComplete;
    this.cards = [];
    this.slotRects = [];
    this.slotLabels = [];
    this.slotPositions = [];
    this.attempts = 0;
    this.placedCount = 0;
    this.dragging = null;
    this.hoveredSlot = -1;
  }

  create() {
    this.startTime = Date.now();
    const w = this.scale.width;
    const h = this.scale.height;
    const count = this.timelineEvents.length;

    this.sorted = [...this.timelineEvents].sort((a, b) => a.year - b.year);
    this.shuffled = Phaser.Utils.Array.Shuffle([...this.timelineEvents]);

    // Title
    this.add.text(w / 2, 18, this.gameTitle, {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "15px",
      fontStyle: "bold",
      color: "#818CF8",
    }).setOrigin(0.5, 0);

    this.add.text(w / 2, 38, "Drag events to the correct position on the timeline", {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "11px",
      color: "#6B7280",
    }).setOrigin(0.5, 0);

    // Layout
    const timelineY = h * 0.38;
    const margin = 50;
    const lineLeft = margin;
    const lineRight = w - margin;
    const slotW = Math.min(120, (lineRight - lineLeft) / count - 8);
    const slotH = 44;

    // Timeline axis line
    this.add.rectangle((lineLeft + lineRight) / 2, timelineY, lineRight - lineLeft, 2, C.border);

    // Endpoint markers
    this.add.text(lineLeft - 4, timelineY, "◄", { fontSize: "12px", color: "#4B5563" }).setOrigin(1, 0.5);
    this.add.text(lineRight + 4, timelineY, "►", { fontSize: "12px", color: "#4B5563" }).setOrigin(0, 0.5);

    // Drop slots above the timeline
    for (let i = 0; i < count; i++) {
      const x = lineLeft + (i + 0.5) * ((lineRight - lineLeft) / count);
      const y = timelineY - slotH / 2 - 14;

      // Tick mark
      this.add.rectangle(x, timelineY, 2, 12, C.border, 0.6);

      // Dashed outline slot
      const slot = this.add.rectangle(x, y, slotW, slotH, C.surface, 0.2)
        .setStrokeStyle(1, C.border, 0.4);
      this.slotRects.push(slot);
      this.slotPositions.push({ x, y });

      // Slot number below timeline
      const lbl = this.add.text(x, timelineY + 14, `${i + 1}`, {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "10px",
        color: "#4B5563",
      }).setOrigin(0.5, 0);
      this.slotLabels.push(lbl);
    }

    // Event cards in a tray at the bottom
    const trayTop = h * 0.62;
    const cols = Math.min(count, 4);
    const rows = Math.ceil(count / cols);
    const cardW = Math.min(150, (w - 40) / cols - 8);
    const cardH = 42;
    const gapX = cardW + 10;
    const gapY = cardH + 12;
    const trayWidth = cols * gapX - 10;
    const trayLeft = (w - trayWidth) / 2 + cardW / 2;

    this.shuffled.forEach((evt, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = trayLeft + col * gapX;
      const cy = trayTop + row * gapY;

      const bg = this.add.rectangle(cx, cy, cardW, cardH, C.surface)
        .setStrokeStyle(1, C.highlight, 0.35)
        .setInteractive({ useHandCursor: true })
        .setDepth(2);

      const label = this.add.text(cx, cy - 2, evt.label, {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "11px",
        fontStyle: "bold",
        color: "#E5E7EB",
        wordWrap: { width: cardW - 16 },
        align: "center",
      }).setOrigin(0.5, 0.5).setDepth(3);

      const yearLabel = this.add.text(cx, cy + 12, `${evt.year}`, {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "9px",
        color: "#818CF8",
      }).setOrigin(0.5, 0).setDepth(3).setVisible(false);

      const card: EventCard = {
        data: evt, bg, label, yearLabel,
        placed: false, locked: false, slotIdx: -1,
        homeX: cx, homeY: cy,
      };
      this.cards.push(card);

      // Pointer-based drag (avoids container coordinate issues)
      bg.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        if (card.locked) return;
        this.startDrag(card, pointer);
      });
    });

    // Scene-level pointer handlers
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => this.onPointerMove(pointer));
    this.input.on("pointerup", () => this.onPointerUp());

    // Status + check button
    this.statusText = this.add.text(24, h - 28, "", {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "11px",
      color: "#6B7280",
    }).setOrigin(0, 0.5);

    this.checkBtn = this.add.rectangle(w - 80, h - 28, 120, 32, C.purple, 0.15)
      .setStrokeStyle(1, C.purple, 0.3)
      .setInteractive({ useHandCursor: true });
    this.checkLabel = this.add.text(w - 80, h - 28, "Check Order", {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#818CF8",
    }).setOrigin(0.5, 0.5);
    this.checkBtn.on("pointerover", () => { if (this.placedCount >= count) this.checkBtn.setFillStyle(C.purple, 0.25); });
    this.checkBtn.on("pointerout", () => this.checkBtn.setFillStyle(C.purple, 0.15));
    this.checkBtn.on("pointerdown", () => this.checkOrder());

    this.updateStatus();
  }

  private startDrag(card: EventCard, pointer: Phaser.Input.Pointer) {
    // If already placed, free the slot
    if (card.placed) {
      this.slotRects[card.slotIdx].setFillStyle(C.surface, 0.2).setStrokeStyle(1, C.border, 0.4);
      card.placed = false;
      card.slotIdx = -1;
      this.placedCount--;
      this.updateStatus();
    }

    this.dragging = card;
    this.dragOffsetX = card.bg.x - pointer.x;
    this.dragOffsetY = card.bg.y - pointer.y;

    card.bg.setDepth(100);
    card.label.setDepth(101);
    card.yearLabel.setDepth(101);
    card.bg.setStrokeStyle(2, C.highlight, 0.8);
    card.bg.setScale(1.05);
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.dragging) return;
    const card = this.dragging;
    const nx = pointer.x + this.dragOffsetX;
    const ny = pointer.y + this.dragOffsetY;
    card.bg.setPosition(nx, ny);
    card.label.setPosition(nx, ny - 2);
    card.yearLabel.setPosition(nx, ny + 12);

    // Highlight nearest available slot
    const nearest = this.findNearestSlot(nx, ny);
    if (nearest !== this.hoveredSlot) {
      if (this.hoveredSlot >= 0 && !this.isSlotOccupied(this.hoveredSlot)) {
        this.slotRects[this.hoveredSlot].setFillStyle(C.surface, 0.2).setStrokeStyle(1, C.border, 0.4);
      }
      this.hoveredSlot = nearest;
      if (nearest >= 0 && !this.isSlotOccupied(nearest)) {
        this.slotRects[nearest].setFillStyle(C.drop, 0.12).setStrokeStyle(1, C.highlight, 0.6);
      }
    }
  }

  private onPointerUp() {
    if (!this.dragging) return;
    const card = this.dragging;
    this.dragging = null;

    card.bg.setScale(1);
    card.bg.setStrokeStyle(1, C.highlight, 0.35);
    card.bg.setDepth(2);
    card.label.setDepth(3);
    card.yearLabel.setDepth(3);

    // Clear slot highlight
    if (this.hoveredSlot >= 0 && !this.isSlotOccupied(this.hoveredSlot)) {
      this.slotRects[this.hoveredSlot].setFillStyle(C.surface, 0.2).setStrokeStyle(1, C.border, 0.4);
    }

    const slot = this.hoveredSlot;
    this.hoveredSlot = -1;

    if (slot >= 0 && !this.isSlotOccupied(slot)) {
      card.placed = true;
      card.slotIdx = slot;
      this.placedCount++;
      const target = this.slotPositions[slot];
      this.tweenCardTo(card, target.x, target.y, 180);
      this.slotRects[slot].setFillStyle(C.highlight, 0.06).setStrokeStyle(1, C.highlight, 0.3);
    } else {
      this.tweenCardTo(card, card.homeX, card.homeY, 250);
    }
    this.updateStatus();
  }

  private tweenCardTo(card: EventCard, x: number, y: number, dur: number) {
    this.tweens.add({ targets: card.bg, x, y, duration: dur, ease: "Back.easeOut" });
    this.tweens.add({ targets: card.label, x, y: y - 2, duration: dur, ease: "Back.easeOut" });
    this.tweens.add({ targets: card.yearLabel, x, y: y + 12, duration: dur, ease: "Back.easeOut" });
  }

  private findNearestSlot(x: number, y: number): number {
    let best = -1;
    let bestDist = 100;
    this.slotPositions.forEach((pos, i) => {
      const dx = pos.x - x;
      const dy = pos.y - y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  }

  private isSlotOccupied(idx: number): boolean {
    return this.cards.some((c) => c.placed && c.slotIdx === idx && c !== this.dragging);
  }

  private updateStatus() {
    const total = this.timelineEvents.length;
    this.statusText.setText(`${this.placedCount} / ${total} placed`);
    const ready = this.placedCount >= total;
    this.checkBtn.setAlpha(ready ? 1 : 0.4);
    this.checkLabel.setColor(ready ? "#A78BFA" : "#4B5563");
  }

  private checkOrder() {
    if (this.placedCount < this.timelineEvents.length) return;
    this.attempts++;

    const placement = new Array<EventCard | null>(this.timelineEvents.length).fill(null);
    this.cards.forEach((c) => { if (c.placed) placement[c.slotIdx] = c; });

    let allCorrect = true;
    placement.forEach((card, i) => {
      if (!card) return;
      const isCorrect = card.data === this.sorted[i];

      if (isCorrect) {
        card.bg.setStrokeStyle(2, C.correct, 0.7);
        card.bg.setFillStyle(C.correct, 0.08);
        card.label.setColor("#4ADE80");
        card.yearLabel.setVisible(true).setColor("#4ADE80");
        card.locked = true;
        card.bg.disableInteractive();
        this.slotRects[i].setFillStyle(C.correct, 0.06).setStrokeStyle(1, C.correct, 0.3);
        this.slotLabels[i].setText(`${card.data.year}`).setColor("#4ADE80");
      } else {
        allCorrect = false;
        card.bg.setStrokeStyle(2, C.wrong, 0.7);

        // Shake then return home
        this.tweens.add({
          targets: [card.bg, card.label, card.yearLabel],
          x: `+=${6}`,
          duration: 40,
          yoyo: true,
          repeat: 4,
          ease: "Sine.inOut",
          onComplete: () => {
            card.bg.setStrokeStyle(1, C.highlight, 0.35).setFillStyle(C.surface);
            card.label.setColor("#E5E7EB");
            card.placed = false;
            this.slotRects[card.slotIdx].setFillStyle(C.surface, 0.2).setStrokeStyle(1, C.border, 0.4);
            card.slotIdx = -1;
            this.placedCount--;
            this.tweenCardTo(card, card.homeX, card.homeY, 350);
            this.updateStatus();
          },
        });
      }
    });

    if (allCorrect) {
      this.time.delayedCall(400, () => this.showVictory());
    }
  }

  private showVictory() {
    const w = this.scale.width;
    const h = this.scale.height;
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);

    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.85).setDepth(200);

    this.add.text(w / 2, h / 2 - 40, "Timeline Complete!", {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "28px",
      fontStyle: "bold",
      color: "#4ADE80",
    }).setOrigin(0.5, 0.5).setDepth(201);

    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    this.add.text(w / 2, h / 2 + 4, `${mins}m ${secs}s  •  ${this.attempts} attempt${this.attempts !== 1 ? "s" : ""}`, {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "14px",
      color: "#9CA3AF",
    }).setOrigin(0.5, 0.5).setDepth(201);

    const retryBg = this.add.rectangle(w / 2, h / 2 + 50, 150, 44, C.purple).setInteractive({ useHandCursor: true }).setDepth(202);
    this.add.text(w / 2, h / 2 + 50, "Play Again", {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#FFFFFF",
    }).setOrigin(0.5, 0.5).setDepth(202);
    retryBg.on("pointerdown", () => this.scene.restart({ events: this.timelineEvents, title: this.gameTitle, onComplete: this.onComplete }));

    this.onComplete?.({ attempts: this.attempts, time: elapsed });
  }
}

export function TimelineGame({ events, title = "Arrange the Timeline", height = "520px", className, onComplete }: TimelineGameProps) {
  const cbRef = useRef(onComplete);
  cbRef.current = onComplete;
  const palette = useThemedPalette(C, ({ brand }) => ({
    highlight: brand[1],
    cyan: brand[0],
  }));

  const config = useMemo((): Phaser.Types.Core.GameConfig => ({
    type: Phaser.AUTO, backgroundColor: "#060518", scene: TimelineScene,
    input: { mouse: { preventDefaultWheel: false } },
  }), []);

  const handleReady = useCallback((game: Phaser.Game) => {
    game.scene.start("TimelineScene", {
      events, title, onComplete: (r: { attempts: number; time: number }) => cbRef.current?.(r),
    });
  }, [events, title]);

  return <PhaserEmbed key={palette.cacheKey} config={config} height={height} className={className} onReady={handleReady} />;
}
