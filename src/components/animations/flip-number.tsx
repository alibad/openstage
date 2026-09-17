"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";
import { ease, duration as durationTokens } from "@/lib/motion";

interface FlipNumberProps {
  /** Target value to reveal */
  value: number | string;
  /** Start value for numeric counts (ignored for strings) */
  from?: number;
  /** Animation duration in seconds */
  duration?: number;
  /** Delay before animation starts */
  delay?: number;
  /** Fixed character width — locks tab width to prevent layout jitter */
  fixedWidth?: boolean;
  /** Character set to cycle through during reveal */
  tumble?: boolean;
  /** Decimal places (numeric values only) */
  decimals?: number;
  /** Prefix (e.g. "$") */
  prefix?: string;
  /** Suffix (e.g. "M", "%") */
  suffix?: string;
  /** Compact formatting (1.2K, 3.4M) for numeric values */
  compact?: boolean;
  /** Pad numeric with leading zeros to this length */
  pad?: number;
  className?: string;
  /** Class on each character flap */
  charClassName?: string;
}

/**
 * FlipNumber — mechanical split-flap counter.
 *
 * Each character flips on its own slight delay to give the feel of a
 * mechanical board (Vestaboard / airport timetable). Perfect for the
 * "$2.4B" headline moment.
 *
 * @example
 * <FlipNumber value={2400000000} compact prefix="$" />
 * <FlipNumber value="AWWWARDS" tumble />
 */
export function FlipNumber({
  value,
  from = 0,
  duration = 1.6,
  delay = 0,
  fixedWidth = true,
  tumble = true,
  decimals = 0,
  prefix = "",
  suffix = "",
  compact = false,
  pad,
  className,
  charClassName,
}: FlipNumberProps) {
  const print = usePrintMode();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const targetString = useMemo(() => {
    if (typeof value === "string") return value;
    let formatted: string;
    if (compact) {
      formatted = new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: decimals,
      }).format(value);
    } else {
      formatted = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);
    }
    if (pad && /^\d+$/.test(formatted)) {
      formatted = formatted.padStart(pad, "0");
    }
    return formatted;
  }, [value, compact, decimals, pad]);

  const fromString = useMemo(() => {
    if (typeof value === "string") return " ".repeat(targetString.length);
    if (compact) {
      const f = new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: decimals,
      }).format(from);
      return f.padStart(targetString.length, " ");
    }
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
      .format(from)
      .padStart(targetString.length, " ");
  }, [from, value, compact, decimals, targetString.length]);

  return (
    <span
      ref={ref}
      className={cn("inline-flex tabular-nums leading-none", className)}
      aria-label={prefix + targetString + suffix}
    >
      {prefix && <span className="mr-[0.05em]">{prefix}</span>}
      {Array.from(targetString).map((char, i) => (
        <FlipChar
          key={i}
          index={i}
          target={char}
          from={fromString[i] ?? " "}
          duration={duration}
          delay={delay + i * 0.08}
          tumble={tumble}
          fixedWidth={fixedWidth}
          active={print || inView}
          className={charClassName}
        />
      ))}
      {suffix && <span className="ml-[0.05em]">{suffix}</span>}
    </span>
  );
}

interface FlipCharProps {
  index: number;
  target: string;
  from: string;
  duration: number;
  delay: number;
  tumble: boolean;
  fixedWidth: boolean;
  active: boolean;
  className?: string;
}

function FlipChar({
  target,
  from,
  duration,
  delay,
  tumble,
  fixedWidth,
  active,
  className,
}: FlipCharProps) {
  const print = usePrintMode();
  const [char, setChar] = useState(print ? target : from);

  useEffect(() => {
    if (print) {
      setChar(target);
      return;
    }
    if (!active) return;

    const isDigit = /\d/.test(target);
    const isAlpha = /[A-Za-z]/.test(target);
    const isPunct = !isDigit && !isAlpha;

    if (isPunct) {
      const t = setTimeout(() => setChar(target), delay * 1000);
      return () => clearTimeout(t);
    }

    if (!tumble) {
      const t = setTimeout(() => setChar(target), delay * 1000);
      return () => clearTimeout(t);
    }

    const pool = isDigit ? "0123456789" : "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const totalMs = duration * 1000;
    const steps = Math.max(8, Math.floor(totalMs / 55));
    let step = 0;
    let interval: ReturnType<typeof setInterval> | null = null;
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        step += 1;
        // Ease-out: finish earlier steps faster, slow toward the end
        const t = step / steps;
        if (t >= 1) {
          setChar(target);
          if (interval) clearInterval(interval);
          return;
        }
        if (t < 0.75) {
          setChar(pool[Math.floor(Math.random() * pool.length)]);
        } else {
          // In the last 25%, step toward the target
          const targetIdx = pool.indexOf(target.toUpperCase());
          const remaining = Math.max(1, Math.floor(steps * (1 - t)));
          const candidate = pool[(targetIdx + remaining) % pool.length];
          setChar(candidate);
        }
      }, 55);
    }, delay * 1000);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [active, target, duration, delay, tumble, print]);

  return (
    <span
      className={cn(
        "inline-block overflow-hidden align-top",
        fixedWidth && "text-center",
        className,
      )}
      style={{
        minWidth: fixedWidth ? "0.62em" : undefined,
        transition: `transform ${durationTokens.fast}s cubic-bezier(${ease.outBack.join(",")})`,
      }}
    >
      {char === " " ? "\u00A0" : char}
    </span>
  );
}
