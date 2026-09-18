"use client";

import { motion, useTransform } from "framer-motion";
import { usePrintMode } from "@/lib/print-mode";
import { useSectionProgress } from "./use-section-progress";

interface SpectrumItem {
  label: string;
  /** Position on the axis (0-100) */
  position: number;
  highlight?: boolean;
  color?: string;
}

interface SpectrumProps {
  axis: { left: string; right: string };
  items: SpectrumItem[];
  color?: string;
  /** Scroll-scrubbed: items reveal left-to-right as you scroll */
  scrub?: boolean;
  showConnectors?: boolean;
  /** Light background mode — boosts contrast for axis and labels */
  light?: boolean;
  className?: string;
}

const W = 640;
const H = 120;
const AXIS_Y = 60;
const PAD = 60;
const CHAR_WIDTH = 7.2;
const LABEL_PAD = 12;

function xPos(position: number): number {
  return PAD + (position / 100) * (W - 2 * PAD);
}

function computeLabelRows(items: SpectrumItem[]): number[] {
  const sorted = [...items].sort((a, b) => a.position - b.position);
  const widths = sorted.map((it) => it.label.length * CHAR_WIDTH);
  const xs = sorted.map((it) => xPos(it.position));
  const rows = new Array(sorted.length).fill(0);

  for (let i = 1; i < sorted.length; i++) {
    const prevRight = xs[i - 1] + widths[i - 1] / 2 + LABEL_PAD;
    const currLeft = xs[i] - widths[i] / 2;
    if (currLeft < prevRight && rows[i - 1] === 0) {
      rows[i] = 1;
    } else if (currLeft < prevRight && rows[i - 1] === 1) {
      rows[i] = 0;
    }
  }

  const origOrder = items.map((it) => sorted.indexOf(it));
  return origOrder.map((si) => rows[si]);
}

/**
 * Horizontal axis diagram for qualitative positioning.
 * Places labeled dots along a spectrum from left to right.
 *
 * Scroll-scrubbed (scrub=true): items reveal progressively.
 * Viewport-triggered (default): all items appear together.
 * Print: all items visible.
 *
 * Includes a screen-reader-only table for accessibility.
 */
export function Spectrum({
  axis,
  items,
  color = "var(--color-brand-1, #7DD3FC)",
  scrub = false,
  showConnectors = false,
  light = false,
  className,
}: SpectrumProps) {
  const print = usePrintMode();
  const sorted = [...items].sort((a, b) => a.position - b.position);
  const labelRows = computeLabelRows(sorted);
  const { ref, progress } = useSectionProgress(["start 0.85", "end 0.15"] as [string, string]);

  const axisOpacity = light ? 0.5 : 0.2;
  const labelOpacity = light ? 0.85 : 0.5;

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-hidden="true">
        {/* Axis */}
        <line
          x1={PAD}
          y1={AXIS_Y}
          x2={W - PAD}
          y2={AXIS_Y}
          stroke="currentColor"
          strokeOpacity={axisOpacity}
          strokeWidth={2}
        />
        {/* Axis labels */}
        <text x={PAD} y={AXIS_Y + 28} fill="currentColor" fillOpacity={labelOpacity} fontSize={11} fontWeight={500} textAnchor="start">
          {axis.left}
        </text>
        <text x={W - PAD} y={AXIS_Y + 28} fill="currentColor" fillOpacity={labelOpacity} fontSize={11} fontWeight={500} textAnchor="end">
          {axis.right}
        </text>

        {/* Connectors */}
        {showConnectors &&
          sorted.map((item, i) => {
            if (i === 0) return null;
            return (
              <ConnectorLine
                key={`c-${i}`}
                x1={xPos(sorted[i - 1].position)}
                x2={xPos(item.position)}
                index={i}
                total={sorted.length}
                progress={progress}
                scrub={scrub}
                print={print}
                light={light}
              />
            );
          })}

        {/* Items */}
        {sorted.map((item, i) => (
          <ItemDot
            key={i}
            item={item}
            index={i}
            total={sorted.length}
            defaultColor={color}
            progress={progress}
            scrub={scrub}
            print={print}
            light={light}
            labelRow={labelRows[i]}
          />
        ))}
      </svg>

      {/* Screen reader table */}
      <table className="sr-only">
        <caption>Spectrum: {axis.left} to {axis.right}</caption>
        <thead>
          <tr>
            <th>Item</th>
            <th>Position</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((item, i) => (
            <tr key={i}>
              <td>{item.label}</td>
              <td>{item.position}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConnectorLine({
  x1,
  x2,
  index,
  total,
  progress,
  scrub,
  print,
  light,
}: {
  x1: number;
  x2: number;
  index: number;
  total: number;
  progress: import("framer-motion").MotionValue<number>;
  scrub: boolean;
  print: boolean;
  light: boolean;
}) {
  const threshold = total > 1 ? index / (total - 1) : 0;
  const opacity = useTransform(progress, (p) => {
    if (print || !scrub) return 1;
    return p >= threshold * 0.9 ? 1 : 0;
  });

  return (
    <motion.line
      x1={x1}
      y1={AXIS_Y}
      x2={x2}
      y2={AXIS_Y}
      stroke="currentColor"
      strokeOpacity={light ? 0.3 : 0.12}
      strokeWidth={light ? 1.5 : 1}
      strokeDasharray="4 4"
      style={{ opacity }}
    />
  );
}

function ItemDot({
  item,
  index,
  total,
  defaultColor,
  progress,
  scrub,
  print,
  light,
  labelRow,
}: {
  item: SpectrumItem;
  index: number;
  total: number;
  defaultColor: string;
  progress: import("framer-motion").MotionValue<number>;
  scrub: boolean;
  print: boolean;
  light: boolean;
  labelRow: number;
}) {
  const x = xPos(item.position);
  const itemColor = item.color ?? defaultColor;
  const r = item.highlight ? 8 : 6;
  const threshold = total > 1 ? index / (total - 1) : 0;

  const labelY = labelRow === 0 ? AXIS_Y - 18 : AXIS_Y + 28;

  const opacity = useTransform(progress, (p) => {
    if (print) return 1;
    if (!scrub) return p > 0.05 ? 1 : 0;
    return p >= threshold * 0.9 ? 1 : 0;
  });

  const scale = useTransform(progress, (p) => {
    if (print) return 1;
    if (!scrub) return p > 0.05 ? 1 : 0;
    return p >= threshold * 0.9 ? 1 : 0;
  });

  return (
    <motion.g
      style={{
        opacity,
        scale,
        originX: `${x}px`,
        originY: `${AXIS_Y}px`,
      }}
    >
      {item.highlight && (
        <circle cx={x} cy={AXIS_Y} r={r + 4} fill={itemColor} fillOpacity={light ? 0.25 : 0.15} />
      )}
      <circle cx={x} cy={AXIS_Y} r={r} fill={itemColor} stroke={light ? itemColor : "none"} strokeWidth={light ? 2 : 0} strokeOpacity={0.3} />
      <text
        x={x}
        y={labelY}
        fill="currentColor"
        fillOpacity={light ? 1 : 0.8}
        fontSize={12}
        fontWeight={item.highlight ? 700 : 500}
        textAnchor="middle"
      >
        {item.label}
      </text>
    </motion.g>
  );
}
