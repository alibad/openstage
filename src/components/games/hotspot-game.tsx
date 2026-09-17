"use client";

import { useRef, useMemo, useCallback } from "react";
import * as Phaser from "phaser";
import { PhaserEmbed } from "./phaser-embed";
import { useBrandNumeric } from "@/lib/brand";

export interface Hotspot {
  /** X position 0-100 (percentage of canvas width) */
  x: number;
  /** Y position 0-100 (percentage of canvas height) */
  y: number;
  label: string;
  description: string;
  /**
   * Optional explicit color for this hotspot. When omitted, the scene
   * cycles through the active brand palette (`useBrandNumeric().brandHex`)
   * so a single deck doesn't have to hand-pick colors per spot.
   */
  color?: string;
  icon?: string;
}

export interface HotspotGameProps {
  hotspots: Hotspot[];
  title?: string;
  subtitle?: string;
  height?: string;
  className?: string;
  onExplore?: (hotspot: Hotspot, index: number) => void;
}

class HotspotScene extends Phaser.Scene {
  private hotspots!: Hotspot[];
  private title?: string;
  private subtitle?: string;
  private onExplore?: HotspotGameProps["onExplore"];
  private explored = new Set<number>();
  private spots: {
    outerRing: Phaser.GameObjects.Arc;
    innerDot: Phaser.GameObjects.Arc;
    pulse: Phaser.GameObjects.Arc;
    labelText: Phaser.GameObjects.Text;
    idx: number;
  }[] = [];
  private infoPanel?: Phaser.GameObjects.Container;
  private progressText!: Phaser.GameObjects.Text;
  private counterText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "HotspotScene" });
  }

  private spotColors!: string[];

  init(data: {
    hotspots: Hotspot[];
    title?: string;
    subtitle?: string;
    spotColors: string[];
    onExplore?: HotspotGameProps["onExplore"];
  }) {
    this.hotspots = data.hotspots;
    this.title = data.title;
    this.subtitle = data.subtitle;
    this.spotColors = data.spotColors;
    this.onExplore = data.onExplore;
    this.explored = new Set();
    this.spots = [];
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Grid background
    const grid = this.add.graphics();
    grid.lineStyle(1, 0xffffff, 0.02);
    const gridSize = 40;
    for (let x = 0; x < w; x += gridSize) {
      grid.moveTo(x, 0);
      grid.lineTo(x, h);
    }
    for (let y = 0; y < h; y += gridSize) {
      grid.moveTo(0, y);
      grid.lineTo(w, y);
    }
    grid.strokePath();

    // Title
    const headerY = 24;
    if (this.title) {
      this.add
        .text(24, headerY, this.title, {
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "18px",
          fontStyle: "bold",
          color: "#F3F4F6",
        })
        .setOrigin(0, 0);
    }
    if (this.subtitle) {
      this.add
        .text(24, this.title ? headerY + 26 : headerY, this.subtitle, {
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "12px",
          color: "#6B7280",
        })
        .setOrigin(0, 0);
    }

    // Progress
    this.counterText = this.add
      .text(w - 24, headerY, `0 / ${this.hotspots.length}`, {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "13px",
        color: "#4B5563",
      })
      .setOrigin(1, 0);

    this.progressText = this.add
      .text(w - 24, headerY + 18, "Click each hotspot to explore", {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "11px",
        color: "#4B5563",
      })
      .setOrigin(1, 0);

    // Create hotspots
    const spotAreaTop = 80;
    const spotAreaH = h - spotAreaTop - 20;

    this.hotspots.forEach((hs, i) => {
      const x = (hs.x / 100) * (w - 80) + 40;
      const y = spotAreaTop + (hs.y / 100) * spotAreaH;
      const hexColor = hs.color || this.spotColors[i % this.spotColors.length];
      const color = Phaser.Display.Color.HexStringToColor(hexColor).color;

      // Pulsing ring
      const pulse = this.add.circle(x, y, 20, color, 0.1);
      this.tweens.add({
        targets: pulse,
        scaleX: 1.8,
        scaleY: 1.8,
        alpha: 0,
        duration: 1500,
        repeat: -1,
        delay: i * 200,
      });

      // Outer ring
      const outerRing = this.add
        .circle(x, y, 16, 0x000000, 0)
        .setStrokeStyle(2, color, 0.5);

      // Inner dot
      const innerDot = this.add
        .circle(x, y, 8, color, 0.8)
        .setInteractive({ useHandCursor: true });

      // Label below the dot
      const labelText = this.add
        .text(x, y + 24, hs.label, {
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "11px",
          fontStyle: "bold",
          color: hexColor,
          align: "center",
        })
        .setOrigin(0.5, 0)
        .setAlpha(0.7);

      // Number badge
      this.add
        .text(x, y, `${i + 1}`, {
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "9px",
          fontStyle: "bold",
          color: "#FFFFFF",
        })
        .setOrigin(0.5, 0.5);

      innerDot.on("pointerover", () => {
        if (!this.explored.has(i)) {
          outerRing.setStrokeStyle(2, color, 1);
          innerDot.setScale(1.2);
          labelText.setAlpha(1);
        }
      });
      innerDot.on("pointerout", () => {
        if (!this.explored.has(i)) {
          outerRing.setStrokeStyle(2, color, 0.5);
          innerDot.setScale(1);
          labelText.setAlpha(0.7);
        }
      });
      innerDot.on("pointerdown", () => this.openInfo(i, x, y));

      this.spots.push({ outerRing, innerDot, pulse, labelText, idx: i });
    });
  }

  private openInfo(index: number, spotX: number, spotY: number) {
    const hs = this.hotspots[index];
    const hexColor = hs.color || this.spotColors[index % this.spotColors.length];
    const color = Phaser.Display.Color.HexStringToColor(hexColor).color;
    const w = this.scale.width;
    const h = this.scale.height;

    // Mark explored
    if (!this.explored.has(index)) {
      this.explored.add(index);
      this.counterText.setText(`${this.explored.size} / ${this.hotspots.length}`);
      if (this.explored.size === this.hotspots.length) {
        this.counterText.setColor("#4ADE80");
        this.progressText.setText("All explored!").setColor("#4ADE80");
      }

      // Dim the spot
      const spot = this.spots[index];
      spot.innerDot.setAlpha(0.4);
      spot.outerRing.setStrokeStyle(2, color, 0.2);
      spot.pulse.destroy();
      spot.labelText.setAlpha(0.4);
    }

    // Close existing panel
    this.infoPanel?.destroy();

    // Info panel
    const panelW = Math.min(360, w - 60);
    const panelH = 140;

    // Position panel to avoid going off-screen
    let panelX = spotX + 30;
    let panelY = spotY - panelH / 2;
    if (panelX + panelW > w - 20) panelX = spotX - panelW - 30;
    if (panelY < 70) panelY = 70;
    if (panelY + panelH > h - 20) panelY = h - panelH - 20;

    this.infoPanel = this.add.container(panelX, panelY);

    // Background
    const bg = this.add
      .rectangle(panelW / 2, panelH / 2, panelW, panelH, 0x151030, 0.95)
      .setStrokeStyle(1, color, 0.3);

    // Accent bar
    const accent = this.add.rectangle(2, panelH / 2, 3, panelH - 16, color);

    // Title
    const title = this.add
      .text(20, 18, hs.label, {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "15px",
        fontStyle: "bold",
        color: hexColor,
      })
      .setOrigin(0, 0);

    // Description
    const desc = this.add
      .text(20, 44, hs.description, {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "12px",
        color: "#D1D5DB",
        wordWrap: { width: panelW - 50 },
        lineSpacing: 4,
      })
      .setOrigin(0, 0);

    // Close button
    const closeBtn = this.add
      .text(panelW - 16, 12, "×", {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "18px",
        color: "#6B7280",
      })
      .setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true });

    closeBtn.on("pointerover", () => closeBtn.setColor("#F3F4F6"));
    closeBtn.on("pointerout", () => closeBtn.setColor("#6B7280"));
    closeBtn.on("pointerdown", () => this.infoPanel?.destroy());

    this.infoPanel.add([bg, accent, title, desc, closeBtn]);

    // Animate in
    this.infoPanel.setAlpha(0).setScale(0.9);
    this.tweens.add({
      targets: this.infoPanel,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: "Back.easeOut",
    });

    this.onExplore?.(hs, index);
  }
}

export function HotspotGame({
  hotspots,
  title,
  subtitle,
  height = "500px",
  className,
  onExplore,
}: HotspotGameProps) {
  const onExploreRef = useRef(onExplore);
  onExploreRef.current = onExplore;
  const brandPalette = useBrandNumeric();

  const config = useMemo(
    (): Phaser.Types.Core.GameConfig => ({
      type: Phaser.AUTO,
      backgroundColor: "#0A0718",
      scene: HotspotScene,
      input: { mouse: { preventDefaultWheel: false } },
    }),
    []
  );

  const handleReady = useCallback(
    (game: Phaser.Game) => {
      game.scene.start("HotspotScene", {
        hotspots,
        title,
        subtitle,
        spotColors: brandPalette.brandHex,
        onExplore: (hs: Hotspot, idx: number) =>
          onExploreRef.current?.(hs, idx),
      });
    },
    [hotspots, title, subtitle, brandPalette]
  );

  // Re-mount on brand change so per-spot colors retone live.
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
