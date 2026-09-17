"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";

interface ScoreEntry {
  /** Row label (option) */
  option: string;
  /** Scores keyed by criteria name, 0-100 */
  scores: Record<string, number>;
  highlight?: boolean;
}

interface ScoreMatrixProps {
  /** Column headers (criteria) */
  criteria: string[];
  /** Row data */
  entries: ScoreEntry[];
  /** Show numeric values alongside bars */
  showValues?: boolean;
  /** Color for bars */
  color?: string;
  /** Highlight color for top scores */
  highlightColor?: string;
  /** Color thresholds: [low, medium] boundaries (out of 100) */
  thresholds?: [number, number];
  /** Low/medium/high colors */
  thresholdColors?: [string, string, string];
  className?: string;
}

function ScoreBar({
  value,
  color,
  showValue,
  animate,
  delay,
}: {
  value: number;
  color: string;
  showValue: boolean;
  animate: boolean;
  delay: number;
}) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-2 rounded-full bg-border/30 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={animate ? { width: 0 } : { width: `${clamped}%` }}
          animate={{ width: `${clamped}%` }}
          transition={{
            duration: 0.8,
            delay,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />
      </div>
      {showValue && (
        <span className="text-xs font-mono text-muted w-8 text-right shrink-0">
          {clamped}
        </span>
      )}
    </div>
  );
}

export function ScoreMatrix({
  criteria,
  entries,
  showValues = true,
  color = "#818CF8",
  highlightColor = "#7DD3FC",
  thresholds,
  thresholdColors,
  className,
}: ScoreMatrixProps) {
  const print = usePrintMode();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const show = print || inView;

  function getColor(value: number, isHighlight: boolean): string {
    if (thresholds && thresholdColors) {
      if (value < thresholds[0]) return thresholdColors[0];
      if (value < thresholds[1]) return thresholdColors[1];
      return thresholdColors[2];
    }
    return isHighlight ? highlightColor : color;
  }

  return (
    <motion.div
      ref={ref}
      className={cn("w-full", className)}
      initial={print ? false : { opacity: 0, y: 16 }}
      animate={show ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <table className="w-full text-sm border-collapse table-fixed">
        <thead>
          <tr>
            <th className="text-left text-xs font-medium text-muted uppercase tracking-wider pb-3 pr-4 w-[28%]">
              &nbsp;
            </th>
            {criteria.map((c) => (
              <th
                key={c}
                className="text-left text-xs font-medium text-muted uppercase tracking-wider pb-3 px-2"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, rowIdx) => (
            <tr
              key={entry.option}
              className={cn(
                "border-t border-border/30",
                entry.highlight && "bg-accent-light/5",
              )}
            >
              <td className="py-3 pr-4">
                <span
                  className={cn(
                    "text-sm font-semibold",
                    entry.highlight ? "text-white" : "text-white/80",
                  )}
                >
                  {entry.option}
                  {entry.highlight && (
                    <span className="ml-1.5 text-[10px] font-semibold text-brand-1">
                      ★
                    </span>
                  )}
                </span>
              </td>
              {criteria.map((c, colIdx) => {
                const val = entry.scores[c] ?? 0;
                const barColor = getColor(val, !!entry.highlight);
                return (
                  <td key={c} className="py-3 px-2">
                    <ScoreBar
                      value={val}
                      color={barColor}
                      showValue={showValues}
                      animate={show && !print}
                      delay={rowIdx * 0.08 + colIdx * 0.04}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
