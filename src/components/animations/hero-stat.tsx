"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";
import { ease, duration } from "@/lib/motion";
import { FlipNumber } from "./flip-number";

interface HeroStatProps {
  /** The dominant number. Use string for "$2.4B", number for raw value */
  value: number | string;
  /** Label underneath */
  label: ReactNode;
  /** Optional small caption above the number */
  kicker?: ReactNode;
  /** Optional supporting text below the label */
  caption?: ReactNode;
  /** Use the FlipNumber mechanical tumble reveal */
  flip?: boolean;
  /** Prefix (e.g. "$") — passed to FlipNumber when flip is true */
  prefix?: string;
  /** Suffix (e.g. "M", "%") */
  suffix?: string;
  /** Compact formatting (for numeric values) */
  compact?: boolean;
  /** Decimals (for numeric values) */
  decimals?: number;
  /** Color applied to the figure. Defaults to mood-aware gradient */
  accent?: string;
  /** Layout alignment */
  align?: "center" | "left";
  /** Size preset — sets the display class */
  size?: "md" | "lg" | "xl" | "monster";
  className?: string;
}

/**
 * HeroStat — "one number owns the slide".
 *
 * Dominant, cinematic figure layout for the moment when a single stat IS
 * the story. Works equally as a scroll section or as a slide-mode slide.
 *
 * @example
 * <HeroStat
 *   value={2400000000}
 *   flip compact prefix="$"
 *   label="in measurable impact"
 *   kicker="2026"
 *   caption="across 60+ enterprise customers"
 * />
 */
export function HeroStat({
  value,
  label,
  kicker,
  caption,
  flip = true,
  prefix = "",
  suffix = "",
  compact = false,
  decimals = 0,
  accent,
  align = "center",
  size = "xl",
  className,
}: HeroStatProps) {
  const print = usePrintMode();

  const sizeClass = {
    md: "display-md",
    lg: "display-lg",
    xl: "display-xl",
    monster: "display-monster",
  }[size];

  const alignClass =
    align === "center"
      ? "items-center text-center"
      : "items-start text-left";

  const motionProps = print
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-80px" },
        transition: { duration: duration.slow, ease: ease.outExpo },
      };

  const figureStyle = accent ? { color: accent } : undefined;

  return (
    <motion.div
      {...motionProps}
      className={cn("flex flex-col gap-6 w-full", alignClass, className)}
    >
      {kicker && (
        <motion.div
          initial={print ? false : { opacity: 0, y: 12 }}
          whileInView={print ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: duration.reveal, ease: ease.outQuart }}
          className="text-xs font-semibold tracking-[0.24em] uppercase text-muted"
        >
          {kicker}
        </motion.div>
      )}

      <div
        className={cn(
          sizeClass,
          "font-semibold leading-none tabular-nums",
          !accent && "mood-gradient-text",
        )}
        style={figureStyle}
      >
        {flip && !print ? (
          <FlipNumber
            value={value}
            prefix={prefix}
            suffix={suffix}
            compact={compact}
            decimals={decimals}
            duration={1.6}
          />
        ) : (
          <>
            {prefix}
            {typeof value === "number"
              ? new Intl.NumberFormat("en-US", {
                  notation: compact ? "compact" : "standard",
                  maximumFractionDigits: decimals,
                  minimumFractionDigits: compact ? 0 : decimals,
                }).format(value)
              : value}
            {suffix}
          </>
        )}
      </div>

      <motion.div
        initial={print ? false : { opacity: 0 }}
        whileInView={print ? undefined : { opacity: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{
          duration: duration.reveal,
          delay: 0.4,
          ease: ease.outQuart,
        }}
        className={cn(
          "text-lg md:text-xl text-muted max-w-2xl leading-snug",
          "text-pretty",
          align === "center" && "mx-auto",
        )}
      >
        {label}
      </motion.div>

      {caption && (
        <motion.div
          initial={print ? false : { opacity: 0 }}
          whileInView={print ? undefined : { opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{
            duration: duration.reveal,
            delay: 0.6,
            ease: ease.outQuart,
          }}
          className={cn(
            "text-sm text-muted/70 max-w-xl",
            align === "center" && "mx-auto",
          )}
        >
          {caption}
        </motion.div>
      )}
    </motion.div>
  );
}
