"use client";

import { useRef, useMemo, useCallback } from "react";
import * as Phaser from "phaser";
import { PhaserEmbed } from "./phaser-embed";

export interface WheelSegment {
  label: string;
  color?: string;
}

export interface SpinWheelGameProps {
  segments: WheelSegment[];
  title?: string;
  height?: string;
  className?: string;
  onResult?: (segment: WheelSegment, index: number) => void;
  /** Defer mounting the Phaser canvas until the user clicks Start. */
  startOnInteract?: boolean;
  startLabel?: string;
  startSubLabel?: string;
  /** Pause when the embed leaves the viewport / tab is hidden. */
  autoPauseOffscreen?: boolean;
}

// INTENTIONALLY NOT BRAND-THEMED. The spin wheel relies on neighboring
// segments being visually distinguishable so the player can tell which
// slice the pointer landed on. Re-deriving these from the active brand
// (which only ships ~5 hue stops) would produce adjacent slices in the
// same hue family and degrade legibility. Treat as a fixed "carnival"
// palette — the only game in this folder that opts out of brand theming
// by design. Other Phaser games pull colors from `useBrandNumeric()` and
// re-mount on theme change.
const PALETTE = [
  "#22d3ee", "#818CF8", "#A855F7", "#F472B6",
  "#FBBF24", "#4ADE80", "#FB923C", "#38BDF8",
  "#E879A8", "#6366F1", "#14B8A6", "#F59E0B",
];

class SpinScene extends Phaser.Scene {
  private segments!: WheelSegment[];
  private title?: string;
  private onResult?: SpinWheelGameProps["onResult"];
  private wheelContainer!: Phaser.GameObjects.Container;
  private spinning = false;
  private resultText!: Phaser.GameObjects.Text;
  private spinBtn!: Phaser.GameObjects.Container;
  private currentAngle = 0;

  constructor() {
    super({ key: "SpinScene" });
  }

  init(data: {
    segments: WheelSegment[];
    title?: string;
    onResult?: SpinWheelGameProps["onResult"];
  }) {
    this.segments = data.segments;
    this.title = data.title;
    this.onResult = data.onResult;
    this.spinning = false;
    this.currentAngle = 0;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    if (this.title) {
      this.add
        .text(w / 2, 20, this.title, {
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "18px",
          fontStyle: "bold",
          color: "#F3F4F6",
        })
        .setOrigin(0.5, 0);
    }

    const centerX = w / 2;
    const centerY = h / 2 + (this.title ? 10 : 0);
    const radius = Math.min(w, h) * 0.34;

    this.wheelContainer = this.add.container(centerX, centerY);
    this.drawWheel(radius);

    // Pointer triangle at top
    const pointerGraphics = this.add.graphics();
    pointerGraphics.fillStyle(0xf3f4f6, 1);
    pointerGraphics.fillTriangle(
      centerX, centerY - radius - 18,
      centerX - 12, centerY - radius - 36,
      centerX + 12, centerY - radius - 36
    );
    pointerGraphics.lineStyle(2, 0x0a0718, 1);
    pointerGraphics.strokeTriangle(
      centerX, centerY - radius - 18,
      centerX - 12, centerY - radius - 36,
      centerX + 12, centerY - radius - 36
    );

    // Center button
    this.spinBtn = this.add.container(centerX, centerY);
    const btnCircle = this.add
      .circle(0, 0, 36, 0x818cf8)
      .setInteractive({ useHandCursor: true });
    const btnText = this.add
      .text(0, 0, "SPIN", {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "13px",
        fontStyle: "bold",
        color: "#FFFFFF",
      })
      .setOrigin(0.5, 0.5);
    const btnRing = this.add.circle(0, 0, 40, 0x000000, 0).setStrokeStyle(2, 0xffffff, 0.15);
    this.spinBtn.add([btnRing, btnCircle, btnText]);

    btnCircle.on("pointerover", () => btnCircle.setFillStyle(0x6366f1));
    btnCircle.on("pointerout", () => btnCircle.setFillStyle(0x818cf8));
    btnCircle.on("pointerdown", () => this.spin());

    // Result area
    this.resultText = this.add
      .text(centerX, h - 36, "", {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "18px",
        fontStyle: "bold",
        color: "#F3F4F6",
        align: "center",
      })
      .setOrigin(0.5, 0.5);
  }

  private drawWheel(radius: number) {
    const n = this.segments.length;
    const arcAngle = (Math.PI * 2) / n;

    this.segments.forEach((seg, i) => {
      const hexColor = seg.color || PALETTE[i % PALETTE.length];
      const color = Phaser.Display.Color.HexStringToColor(hexColor).color;
      const startAngle = i * arcAngle - Math.PI / 2;
      const endAngle = startAngle + arcAngle;

      // Segment fill
      const graphics = this.add.graphics();
      graphics.fillStyle(color, 0.85);
      graphics.beginPath();
      graphics.moveTo(0, 0);
      graphics.arc(0, 0, radius, startAngle, endAngle, false);
      graphics.closePath();
      graphics.fillPath();

      // Segment border
      graphics.lineStyle(1.5, 0x0a0718, 0.4);
      graphics.beginPath();
      graphics.moveTo(0, 0);
      graphics.arc(0, 0, radius, startAngle, endAngle, false);
      graphics.closePath();
      graphics.strokePath();

      this.wheelContainer.add(graphics);

      // Label
      const midAngle = startAngle + arcAngle / 2;
      const labelR = radius * 0.65;
      const lx = Math.cos(midAngle) * labelR;
      const ly = Math.sin(midAngle) * labelR;

      const maxLabelW = radius * 0.5;
      const fontSize = seg.label.length > 16 ? "11px" : seg.label.length > 10 ? "12px" : "13px";

      const label = this.add
        .text(lx, ly, seg.label, {
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize,
          fontStyle: "bold",
          color: "#FFFFFF",
          wordWrap: { width: maxLabelW },
          align: "center",
        })
        .setOrigin(0.5, 0.5)
        .setRotation(midAngle + Math.PI / 2);

      // Add shadow for readability
      label.setShadow(1, 1, "#00000066", 2);

      this.wheelContainer.add(label);
    });

    // Outer ring
    const ring = this.add.graphics();
    ring.lineStyle(3, 0xffffff, 0.1);
    ring.strokeCircle(0, 0, radius + 2);
    this.wheelContainer.add(ring);

    // Tick marks
    const tickGraphics = this.add.graphics();
    for (let i = 0; i < n * 2; i++) {
      const angle = (i / (n * 2)) * Math.PI * 2;
      const inner = radius - 4;
      const outer = radius + 2;
      tickGraphics.lineStyle(1, 0xffffff, i % 2 === 0 ? 0.3 : 0.1);
      tickGraphics.beginPath();
      tickGraphics.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      tickGraphics.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      tickGraphics.strokePath();
    }
    this.wheelContainer.add(tickGraphics);
  }

  private spin() {
    if (this.spinning) return;
    this.spinning = true;
    this.resultText.setText("");

    const n = this.segments.length;
    const spins = 4 + Math.random() * 4;
    const extraAngle = Math.random() * Math.PI * 2;
    const targetAngle = this.currentAngle + spins * Math.PI * 2 + extraAngle;

    this.tweens.add({
      targets: this.wheelContainer,
      angle: Phaser.Math.RadToDeg(targetAngle),
      duration: 3500 + Math.random() * 1500,
      ease: "Cubic.easeOut",
      onComplete: () => {
        this.currentAngle = targetAngle;
        this.spinning = false;

        // Determine which segment the pointer (at top) lands on
        const normalizedAngle =
          (((-targetAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2));
        const segmentAngle = (Math.PI * 2) / n;
        const index = Math.floor(normalizedAngle / segmentAngle) % n;

        const winner = this.segments[index];
        const hexColor = winner.color || PALETTE[index % PALETTE.length];

        this.resultText.setText(winner.label);
        this.resultText.setColor(hexColor);

        // Pulse effect
        this.tweens.add({
          targets: this.resultText,
          scaleX: [1.3, 1],
          scaleY: [1.3, 1],
          duration: 300,
          ease: "Back.easeOut",
        });

        this.onResult?.(winner, index);
      },
    });
  }
}

export function SpinWheelGame({
  segments,
  title,
  height = "500px",
  className,
  onResult,
  startOnInteract = false,
  startLabel = "Spin the wheel",
  startSubLabel,
  autoPauseOffscreen = false,
}: SpinWheelGameProps) {
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const config = useMemo(
    (): Phaser.Types.Core.GameConfig => ({
      type: Phaser.AUTO,
      backgroundColor: "#0A0718",
      scene: SpinScene,
      input: { mouse: { preventDefaultWheel: false } },
    }),
    []
  );

  const handleReady = useCallback(
    (game: Phaser.Game) => {
      game.scene.start("SpinScene", {
        segments,
        title,
        onResult: (seg: WheelSegment, idx: number) =>
          onResultRef.current?.(seg, idx),
      });
    },
    [segments, title]
  );

  return (
    <PhaserEmbed
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
