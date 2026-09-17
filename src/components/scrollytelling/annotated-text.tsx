"use client";

import { useMemo } from "react";
import { motion, useTransform } from "framer-motion";
import { usePrintMode } from "@/lib/print-mode";
import { useSectionProgress } from "./use-section-progress";

interface TextSegment {
  text: string;
  category?: string;
  color?: string;
}

interface AnnotatedTextProps {
  segments: TextSegment[];
  /** Scroll-scrubbed progressive highlighting */
  scrub?: boolean;
  /** Stagger delay in seconds (viewport mode only) */
  stagger?: number;
  /** Show color-coded legend below */
  showLegend?: boolean;
  className?: string;
}

const DEFAULT_COLOR = "var(--color-brand-3, #A78BFA)";

/**
 * Color-coded text segments with scroll-driven or viewport-triggered
 * highlighting. Each segment gets a background color tied to its category.
 *
 * Scroll-scrubbed (scrub=true): segments highlight left-to-right as
 * the user scrolls. Great for transcripts, legal text, or analysis.
 *
 * Viewport-triggered (default): segments stagger-highlight when in view.
 *
 * Uses box-decoration-break: clone for proper multi-line highlighting.
 * Print: all segments highlighted.
 */
export function AnnotatedText({
  segments,
  scrub = false,
  stagger = 0.06,
  showLegend = false,
  className,
}: AnnotatedTextProps) {
  const print = usePrintMode();
  const { ref, progress } = useSectionProgress(["start 0.85", "end 0.15"]);

  const legend = useMemo(() => {
    if (!showLegend) return [];
    const seen = new Map<string, string>();
    for (const seg of segments) {
      if (seg.category && !seen.has(seg.category)) {
        seen.set(seg.category, seg.color ?? DEFAULT_COLOR);
      }
    }
    return Array.from(seen.entries()).map(([category, color]) => ({ category, color }));
  }, [segments, showLegend]);

  return (
    <div ref={ref} className={className}>
      <p className="text-lg leading-relaxed">
        {print ? (
          segments.map((seg, i) => (
            <HighlightedSpan key={i} text={seg.text} color={seg.color ?? DEFAULT_COLOR} active />
          ))
        ) : scrub ? (
          segments.map((seg, i) => (
            <ScrubSegment
              key={i}
              text={seg.text}
              color={seg.color ?? DEFAULT_COLOR}
              index={i}
              total={segments.length}
              progress={progress}
            />
          ))
        ) : (
          segments.map((seg, i) => (
            <ViewportSegment
              key={i}
              text={seg.text}
              color={seg.color ?? DEFAULT_COLOR}
              delay={i * stagger}
            />
          ))
        )}
      </p>

      {legend.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-4">
          {legend.map(({ category, color }) => (
            <span
              key={category}
              className="flex items-center gap-2 text-sm text-muted"
            >
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ backgroundColor: color }}
              />
              {category}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function HighlightedSpan({
  text,
  color,
  active,
}: {
  text: string;
  color: string;
  active: boolean;
}) {
  return (
    <span
      className="rounded-sm transition-colors duration-300"
      style={{
        backgroundColor: active ? `${color}30` : "transparent",
        borderBottom: active ? `2px solid ${color}` : "2px solid transparent",
        padding: "0.05em 0.2em",
        boxDecorationBreak: "clone",
        WebkitBoxDecorationBreak: "clone",
      }}
    >
      {text}
    </span>
  );
}

function ScrubSegment({
  text,
  color,
  index,
  total,
  progress,
}: {
  text: string;
  color: string;
  index: number;
  total: number;
  progress: import("framer-motion").MotionValue<number>;
}) {
  const threshold = total > 1 ? index / (total - 1) : 0;

  const bg = useTransform(progress, (p) =>
    p >= threshold * 0.85 ? `${color}30` : "transparent",
  );
  const border = useTransform(progress, (p) =>
    p >= threshold * 0.85 ? `2px solid ${color}` : "2px solid transparent",
  );

  return (
    <motion.span
      className="rounded-sm"
      style={{
        backgroundColor: bg,
        borderBottom: border,
        padding: "0.05em 0.2em",
        boxDecorationBreak: "clone",
        WebkitBoxDecorationBreak: "clone",
        transition: "background-color 0.2s, border-color 0.2s",
      }}
    >
      {text}
    </motion.span>
  );
}

function ViewportSegment({
  text,
  color,
  delay,
}: {
  text: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.span
      className="rounded-sm"
      initial={{ backgroundColor: "transparent", borderBottom: "2px solid transparent" }}
      whileInView={{
        backgroundColor: `${color}30`,
        borderBottom: `2px solid ${color}`,
      }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      style={{
        padding: "0.05em 0.2em",
        boxDecorationBreak: "clone",
        WebkitBoxDecorationBreak: "clone",
      }}
    >
      {text}
    </motion.span>
  );
}
