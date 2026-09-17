"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView, animate } from "framer-motion";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";
import { ease as easingTokens } from "@/lib/motion";

interface SmoothCounterProps {
  /** Target value */
  target: number;
  /** Start value */
  from?: number;
  /** Number of decimal places */
  decimals?: number;
  /** Duration in seconds */
  duration?: number;
  /** Prefix (e.g. "$") */
  prefix?: string;
  /** Suffix (e.g. "%", "K", "M") */
  suffix?: string;
  /** Locale for number formatting (e.g. "en-US") */
  locale?: string;
  /** Use compact notation (1.2K, 3.4M) */
  compact?: boolean;
  /** Easing curve */
  ease?: "linear" | "easeIn" | "easeOut" | "easeInOut" | "spring";
  /** Delay before starting (seconds) */
  delay?: number;
  /** Trend direction indicator */
  trend?: "up" | "down" | "neutral";
  /** Additional CSS class */
  className?: string;
}

export function SmoothCounter({
  target,
  from = 0,
  decimals = 0,
  duration = 2,
  prefix = "",
  suffix = "",
  locale = "en-US",
  compact = false,
  ease = "easeOut",
  delay = 0,
  trend,
  className,
}: SmoothCounterProps) {
  const print = usePrintMode();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [displayValue, setDisplayValue] = useState(print ? target : from);

  useEffect(() => {
    if (print) {
      setDisplayValue(target);
      return;
    }
    if (!inView) return;

    const controls = ease === "spring"
      ? animate(from, target, {
          type: "spring",
          stiffness: 80,
          damping: 20,
          delay,
          onUpdate: (v) => setDisplayValue(v),
        })
      : animate(from, target, {
          duration,
          delay,
          ease:
            ease === "linear"
              ? easingTokens.linear
              : ease === "easeIn"
                ? [0.42, 0, 1, 1]
                : ease === "easeInOut"
                  ? [0.42, 0, 0.58, 1]
                  : easingTokens.outQuart,
          onUpdate: (v) => setDisplayValue(v),
        });

    return () => controls.stop();
  }, [inView, target, from, duration, delay, ease, print]);

  const formatted = formatNumber(displayValue, {
    decimals,
    locale,
    compact,
  });

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {formatted}
      {suffix}
      {trend && <TrendArrow trend={trend} />}
    </span>
  );
}

function TrendArrow({ trend }: { trend: "up" | "down" | "neutral" }) {
  if (trend === "neutral") {
    return <span className="ml-1 text-muted">→</span>;
  }
  return (
    <span
      className={cn(
        "ml-1 inline-block text-[0.75em]",
        trend === "up" ? "text-green-400" : "text-red-400",
      )}
    >
      {trend === "up" ? "↑" : "↓"}
    </span>
  );
}

function formatNumber(
  value: number,
  opts: { decimals: number; locale: string; compact: boolean },
): string {
  if (opts.compact) {
    return new Intl.NumberFormat(opts.locale, {
      notation: "compact",
      maximumFractionDigits: opts.decimals,
    }).format(value);
  }

  return new Intl.NumberFormat(opts.locale, {
    minimumFractionDigits: opts.decimals,
    maximumFractionDigits: opts.decimals,
  }).format(value);
}
