"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";
import { SmoothCounter } from "@/components/animations/smooth-counter";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SparklinePoint {
  value: number;
}

interface AnimatedMetricProps {
  /** Display value */
  value: number;
  /** Label below the number */
  label: string;
  /** Prefix (e.g. "$") */
  prefix?: string;
  /** Suffix (e.g. "%", "M") */
  suffix?: string;
  /** Number of decimals */
  decimals?: number;
  /** Delta change (e.g. +12.5) */
  delta?: number;
  /** Delta suffix (e.g. "%" or "pp") */
  deltaSuffix?: string;
  /** Sparkline data (last N data points) */
  sparkline?: SparklinePoint[];
  /** Trend direction — auto-detected from delta if not set */
  trend?: "up" | "down" | "neutral";
  /** Accent color */
  color?: string;
  /** Compact number formatting */
  compact?: boolean;
  className?: string;
}

function MiniSparkline({
  data,
  color,
  width = 80,
  height = 24,
}: {
  data: SparklinePoint[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.7}
      />
    </svg>
  );
}

export function AnimatedMetric({
  value,
  label,
  prefix = "",
  suffix = "",
  decimals = 0,
  delta,
  deltaSuffix = "%",
  sparkline,
  trend: customTrend,
  color = "#818CF8",
  compact = false,
  className,
}: AnimatedMetricProps) {
  const print = usePrintMode();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const show = print || inView;

  const trend =
    customTrend ??
    (delta !== undefined ? (delta > 0 ? "up" : delta < 0 ? "down" : "neutral") : undefined);

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <motion.div
      ref={ref}
      className={cn(
        "flex flex-col gap-2 p-5 rounded-xl border backdrop-blur-sm",
        className,
      )}
      style={{
        borderColor: `${color}20`,
        background: `${color}05`,
      }}
      initial={print ? false : { opacity: 0, y: 16 }}
      animate={show ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="flex items-end justify-between gap-3">
        <div className="text-3xl font-bold tabular-nums" style={{ color }}>
          <SmoothCounter
            target={value}
            prefix={prefix}
            suffix={suffix}
            decimals={decimals}
            compact={compact}
            duration={1.5}
          />
        </div>

        {sparkline && sparkline.length > 1 && (
          <MiniSparkline data={sparkline} color={color} />
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted">{label}</span>

        {delta !== undefined && trend && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded",
              trend === "up" && "text-green-400 bg-green-400/10",
              trend === "down" && "text-red-400 bg-red-400/10",
              trend === "neutral" && "text-muted bg-muted/10",
            )}
          >
            <TrendIcon className="w-3 h-3" />
            {delta > 0 ? "+" : ""}
            {delta}
            {deltaSuffix}
          </span>
        )}
      </div>
    </motion.div>
  );
}
