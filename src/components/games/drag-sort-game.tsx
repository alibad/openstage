"use client";

import { useRef, useMemo, useCallback } from "react";
import * as Phaser from "phaser";
import { PhaserEmbed } from "./phaser-embed";
import { useThemedPalette } from "./_use-themed-palette";

export interface DragSortItem {
  label: string;
  color?: string;
}

export interface DragSortZone {
  label: string;
  /** Which item labels belong here */
  accepts: string[];
  color?: string;
}

export interface DragSortGameProps {
  items: DragSortItem[];
  zones: DragSortZone[];
  title?: string;
  height?: string;
  className?: string;
  onComplete?: (result: { correct: number; total: number }) => void;
}

const C = {
  bg: 0x0a0718,
  surface: 0x151030,
  surfaceHover: 0x1e1848,
  border: 0x2a2550,
  borderHover: 0x3d3670,
  text: 0xf3f4f6,
  muted: 0x9ca3af,
  correct: 0x4ade80,
  wrong: 0xf87171,
  cyan: 0x22d3ee,
  purple: 0x818cf8,
  tray: 0x0d0b1e,
};

const ZONE_COLORS = [0x22d3ee, 0x818cf8, 0xa855f7, 0xf472b6];

class DragSortScene extends Phaser.Scene {
  private items!: DragSortItem[];
  private zones!: DragSortZone[];
  private title?: string;
  private onComplete?: DragSortGameProps["onComplete"];
  private zoneData: {
    rect: Phaser.GameObjects.Rectangle;
    glow: Phaser.GameObjects.Rectangle;
    headerBg: Phaser.GameObjects.Rectangle;
    label: Phaser.GameObjects.Text;
    countText: Phaser.GameObjects.Text;
    zone: DragSortZone;
    placed: string[];
    color: number;
    x: number;
    y: number;
    w: number;
    h: number;
  }[] = [];
  private dragItems: {
    container: Phaser.GameObjects.Container;
    item: DragSortItem;
    homeX: number;
    homeY: number;
    bg: Phaser.GameObjects.Rectangle;
    gripDots: Phaser.GameObjects.Graphics;
  }[] = [];
  private placedCount = 0;
  private progressText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "DragSortScene" });
  }

  init(data: {
    items: DragSortItem[];
    zones: DragSortZone[];
    title?: string;
    onComplete?: DragSortGameProps["onComplete"];
  }) {
    this.items = data.items;
    this.zones = data.zones;
    this.title = data.title;
    this.onComplete = data.onComplete;
    this.placedCount = 0;
    this.zoneData = [];
    this.dragItems = [];
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Header area
    const headerY = 24;
    if (this.title) {
      this.add
        .text(w / 2, headerY, this.title, {
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "20px",
          fontStyle: "bold",
          color: "#F3F4F6",
        })
        .setOrigin(0.5, 0);
    }

    this.add
      .text(w / 2, this.title ? headerY + 28 : headerY, "Drag items into the correct zone", {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "12px",
        color: "#6B7280",
      })
      .setOrigin(0.5, 0);

    this.progressText = this.add
      .text(w - 24, headerY + 6, `0 / ${this.items.length}`, {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "13px",
        color: "#4B5563",
      })
      .setOrigin(1, 0);

    // Layout: zones top half, item tray bottom
    const zonesTopY = this.title ? 72 : 56;
    const trayH = 110;
    const zonesH = h - zonesTopY - trayH - 16;

    // Tray background
    this.add
      .rectangle(w / 2, h - trayH / 2, w, trayH, C.tray)
      .setAlpha(0.6);
    this.add
      .rectangle(w / 2, h - trayH, w, 1, 0xffffff, 0.04);

    this.createZones(w, zonesTopY, zonesH);
    this.createDragItems(w, h, trayH);
    this.setupDragHandlers();
  }

  private createZones(w: number, topY: number, height: number) {
    const gap = 14;
    const totalGap = (this.zones.length - 1) * gap;
    const sideMargin = 20;
    const zoneW = (w - sideMargin * 2 - totalGap) / this.zones.length;

    this.zones.forEach((zone, i) => {
      const color = zone.color
        ? Phaser.Display.Color.HexStringToColor(zone.color).color
        : ZONE_COLORS[i % ZONE_COLORS.length];

      const x = sideMargin + i * (zoneW + gap) + zoneW / 2;
      const y = topY + height / 2;

      // Glow (hidden, shown on hover)
      const glow = this.add
        .rectangle(x, y, zoneW + 8, height + 8, color, 0.06)
        .setStrokeStyle(0)
        .setAlpha(0);

      // Main zone rect
      const rect = this.add
        .rectangle(x, y, zoneW, height, color, 0.03)
        .setStrokeStyle(1, color, 0.2);

      // Header strip at top
      const headerH = 36;
      const headerBg = this.add
        .rectangle(x, topY + headerH / 2, zoneW, headerH, color, 0.08);

      // Zone label
      const label = this.add
        .text(x, topY + headerH / 2, zone.label, {
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "13px",
          fontStyle: "bold",
          color: Phaser.Display.Color.IntegerToColor(color).rgba,
        })
        .setOrigin(0.5, 0.5);

      // Count indicator
      const countText = this.add
        .text(x + zoneW / 2 - 12, topY + headerH / 2, `0/${zone.accepts.length}`, {
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "10px",
          color: "#4B5563",
        })
        .setOrigin(1, 0.5);

      // Drop hint
      const hintY = topY + headerH + (height - headerH) / 2;
      this.add
        .text(x, hintY, "Drop here", {
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "11px",
          color: "#4B5563",
        })
        .setOrigin(0.5, 0.5)
        .setAlpha(0.5);

      this.zoneData.push({
        rect,
        glow,
        headerBg,
        label,
        countText,
        zone,
        placed: [],
        color,
        x,
        y,
        w: zoneW,
        h: height,
      });
    });
  }

  private createDragItems(w: number, h: number, trayH: number) {
    const shuffled = [...this.items].sort(() => Math.random() - 0.5);
    const itemW = 150;
    const itemH = 38;
    const gapX = 10;
    const gapY = 10;
    const perRow = Math.max(1, Math.floor((w - 40) / (itemW + gapX)));
    const rows = Math.ceil(shuffled.length / perRow);
    const totalGridH = rows * (itemH + gapY) - gapY;
    const trayTop = h - trayH;
    const startY = trayTop + (trayH - totalGridH) / 2;

    shuffled.forEach((item, i) => {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const itemsInRow = Math.min(perRow, shuffled.length - row * perRow);
      const totalRowW = itemsInRow * (itemW + gapX) - gapX;
      const x = (w - totalRowW) / 2 + col * (itemW + gapX) + itemW / 2;
      const y = startY + row * (itemH + gapY) + itemH / 2;

      const container = this.add.container(x, y);

      const bg = this.add
        .rectangle(0, 0, itemW, itemH, C.surface)
        .setStrokeStyle(1, C.border);

      // Grip dots on the left
      const gripDots = this.add.graphics();
      gripDots.fillStyle(0xffffff, 0.15);
      const dotSize = 2;
      const dotGap = 5;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 2; c++) {
          gripDots.fillCircle(
            -itemW / 2 + 14 + c * dotGap,
            -dotGap + r * dotGap,
            dotSize
          );
        }
      }

      const text = this.add
        .text(4, 0, item.label, {
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "13px",
          color: "#E5E7EB",
        })
        .setOrigin(0.5, 0.5);

      container.add([bg, gripDots, text]);
      container.setSize(itemW, itemH);
      container.setInteractive({ useHandCursor: true, draggable: true });
      this.input.setDraggable(container);

      container.on("pointerover", () => {
        if (container.alpha === 1) {
          bg.setFillStyle(C.surfaceHover).setStrokeStyle(1, C.borderHover);
        }
      });
      container.on("pointerout", () => {
        if (container.alpha === 1) {
          bg.setFillStyle(C.surface).setStrokeStyle(1, C.border);
        }
      });

      this.dragItems.push({ container, item, homeX: x, homeY: y, bg, gripDots });
    });
  }

  private setupDragHandlers() {
    this.input.on(
      "drag",
      (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Container, dragX: number, dragY: number) => {
        obj.setPosition(dragX, dragY);
        obj.setDepth(10);

        // Highlight zone under cursor
        for (const zd of this.zoneData) {
          const inZone =
            dragX > zd.x - zd.w / 2 &&
            dragX < zd.x + zd.w / 2 &&
            dragY > zd.y - zd.h / 2 &&
            dragY < zd.y + zd.h / 2;
          zd.glow.setAlpha(inZone ? 1 : 0);
          zd.rect.setStrokeStyle(1, zd.color, inZone ? 0.5 : 0.2);
        }
      }
    );

    this.input.on(
      "dragend",
      (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Container) => {
        obj.setDepth(0);

        // Reset all zone highlights
        for (const zd of this.zoneData) {
          zd.glow.setAlpha(0);
          zd.rect.setStrokeStyle(1, zd.color, 0.2);
        }

        const entry = this.dragItems.find((d) => d.container === obj);
        if (!entry) return;

        let dropped = false;
        for (const zd of this.zoneData) {
          const inZone =
            obj.x > zd.x - zd.w / 2 &&
            obj.x < zd.x + zd.w / 2 &&
            obj.y > zd.y - zd.h / 2 &&
            obj.y < zd.y + zd.h / 2;

          if (inZone) {
            const isCorrect = zd.zone.accepts.includes(entry.item.label);
            if (isCorrect) {
              zd.placed.push(entry.item.label);
              this.placedCount++;
              this.progressText.setText(`${this.placedCount} / ${this.items.length}`);
              this.progressText.setColor("#7DD3FC");

              // Update count
              zd.countText.setText(`${zd.placed.length}/${zd.zone.accepts.length}`);
              if (zd.placed.length === zd.zone.accepts.length) {
                zd.countText.setColor("#4ADE80");
              }

              // Lock item
              entry.bg.setStrokeStyle(2, C.correct, 0.6).setFillStyle(C.correct, 0.08);
              entry.gripDots.setAlpha(0);
              this.input.setDraggable(obj, false);

              // Place in zone slot
              const headerH = 36;
              const slotY =
                zd.y - zd.h / 2 + headerH + 16 + (zd.placed.length - 1) * 44;
              this.tweens.add({
                targets: obj,
                x: zd.x,
                y: slotY,
                scaleX: 0.92,
                scaleY: 0.92,
                duration: 250,
                ease: "Back.easeOut",
              });
              dropped = true;

              if (this.placedCount === this.items.length) {
                this.time.delayedCall(600, () => this.showComplete());
              }
            } else {
              // Wrong zone
              entry.bg.setStrokeStyle(2, C.wrong);
              this.cameras.main.shake(120, 0.003);
              this.tweens.add({
                targets: obj,
                x: entry.homeX,
                y: entry.homeY,
                duration: 350,
                ease: "Back.easeOut",
                onComplete: () =>
                  entry.bg.setStrokeStyle(1, C.border).setFillStyle(C.surface),
              });
              dropped = true;
            }
            break;
          }
        }

        if (!dropped) {
          this.tweens.add({
            targets: obj,
            x: entry.homeX,
            y: entry.homeY,
            duration: 300,
            ease: "Back.easeOut",
          });
        }
      }
    );
  }

  private showComplete() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.75);

    this.add
      .text(w / 2, h / 2 - 40, "All sorted!", {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "36px",
        fontStyle: "bold",
        color: "#4ADE80",
      })
      .setOrigin(0.5, 0.5);

    this.add
      .text(w / 2, h / 2 + 4, `${this.items.length} items placed correctly`, {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "14px",
        color: "#9CA3AF",
      })
      .setOrigin(0.5, 0.5);

    const retryBg = this.add
      .rectangle(w / 2, h / 2 + 56, 150, 44, C.purple)
      .setInteractive({ useHandCursor: true });
    retryBg.on("pointerover", () => retryBg.setFillStyle(0x6366f1));
    retryBg.on("pointerout", () => retryBg.setFillStyle(C.purple));

    this.add
      .text(w / 2, h / 2 + 56, "Play Again", {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
        color: "#FFFFFF",
      })
      .setOrigin(0.5, 0.5);

    retryBg.on("pointerdown", () => {
      this.scene.restart({
        items: this.items,
        zones: this.zones,
        title: this.title,
        onComplete: this.onComplete,
      });
    });

    this.onComplete?.({ correct: this.placedCount, total: this.items.length });
  }
}

export function DragSortGame({
  items,
  zones,
  title,
  height = "500px",
  className,
  onComplete,
}: DragSortGameProps) {
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
      scene: DragSortScene,
      input: { mouse: { preventDefaultWheel: false } },
    }),
    []
  );

  const handleReady = useCallback(
    (game: Phaser.Game) => {
      game.scene.start("DragSortScene", {
        items,
        zones,
        title,
        onComplete: (r: { correct: number; total: number }) =>
          onCompleteRef.current?.(r),
      });
    },
    [items, zones, title]
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
