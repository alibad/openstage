"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import {
  motion,
  useTransform,
  useInView,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/cn";
import { useSectionProgress } from "./use-section-progress";
import { ease } from "@/lib/motion";

interface PathDrawProps {
  /** SVG viewBox (required to know the drawing space) */
  viewBox?: string;
  /** Width of the SVG container */
  width?: string | number;
  /** Height of the SVG container */
  height?: string | number;
  /** SVG path children — raw <path> or <circle> or <g> elements */
  children: ReactNode;
  /** When true, draws along scroll. When false, draws once on entering viewport. */
  scrub?: boolean;
  /**
   * Scroll offset window for scrubbed draw. Accepts any framer-motion
   * useScroll offset tuple (e.g. `["start end", "start start"]`).
   */
  offset?: [string, string];
  /** Duration for viewport-trigger mode (seconds) */
  duration?: number;
  /** Stroke color applied to all direct children — use "currentColor" for inheritance */
  stroke?: string;
  /** Stroke width */
  strokeWidth?: number;
  /** Fill on child paths (defaults to none) */
  fill?: string;
  /** Optional annotations that reveal in sequence with the line */
  annotations?: {
    /** Progress at which to reveal (0-1) */
    at: number;
    x: number;
    y: number;
    label: ReactNode;
    className?: string;
  }[];
  className?: string;
}

/**
 * PathDraw — scroll-linked SVG stroke-dashoffset reveal.
 *
 * Wrap one or more SVG `<path>` elements and have their strokes draw in
 * as the user scrolls or as the section enters the viewport. Classic
 * editorial / hand-drawn diagram feel.
 *
 * @example
 * <PathDraw viewBox="0 0 800 400" stroke="var(--color-brand-1)" strokeWidth={2} scrub>
 *   <path d="M 0 200 Q 200 100 400 200 T 800 200" />
 * </PathDraw>
 */
export function PathDraw({
  viewBox = "0 0 800 400",
  width = "100%",
  height = "auto",
  children,
  scrub = true,
  offset = ["start 0.85", "end 0.15"],
  duration = 2,
  stroke = "currentColor",
  strokeWidth = 2,
  fill = "none",
  annotations = [],
  className,
}: PathDrawProps) {
  const { ref, progress, print } = useSectionProgress(offset, true);
  const svgRef = useRef<SVGSVGElement>(null);
  const [pathLengths, setPathLengths] = useState<number[]>([]);
  const viewRef = useRef<HTMLDivElement>(null);
  const inView = useInView(viewRef, { once: true, margin: "-80px" });

  // Measure each <path> length after mount so we can drive stroke-dashoffset
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const paths = svg.querySelectorAll<SVGPathElement>("path");
    const lengths = Array.from(paths).map((p) => {
      try {
        return p.getTotalLength();
      } catch {
        return 1000;
      }
    });
    setPathLengths(lengths);
    paths.forEach((p, i) => {
      p.style.strokeDasharray = `${lengths[i]}`;
      p.style.strokeDashoffset = print ? "0" : `${lengths[i]}`;
    });
  }, [children, print]);

  // Drive the draw — scrub with scroll or animate over duration on viewport
  useEffect(() => {
    if (print || pathLengths.length === 0) return;
    const svg = svgRef.current;
    if (!svg) return;
    const paths = svg.querySelectorAll<SVGPathElement>("path");

    if (scrub) {
      const unsub = progress.on("change", (v) => {
        paths.forEach((p, i) => {
          const len = pathLengths[i];
          p.style.strokeDashoffset = `${len * (1 - Math.max(0, Math.min(1, v)))}`;
        });
      });
      return unsub;
    }

    if (inView) {
      const start = performance.now();
      const totalMs = duration * 1000;
      let raf = 0;

      function frame() {
        const t = Math.min(1, (performance.now() - start) / totalMs);
        // Ease-out expo
        const eased = 1 - Math.pow(2, -10 * t);
        paths.forEach((p, i) => {
          const len = pathLengths[i];
          p.style.strokeDashoffset = `${len * (1 - eased)}`;
        });
        if (t < 1) raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
      return () => cancelAnimationFrame(raf);
    }
  }, [progress, inView, pathLengths, scrub, duration, print]);

  return (
    <div ref={viewRef} className={cn("relative", className)}>
      <div ref={ref} className="relative w-full">
        <svg
          ref={svgRef}
          viewBox={viewBox}
          width={width}
          height={height}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-auto"
          style={{
            transitionProperty: "none",
          }}
        >
          {children}
        </svg>
        {annotations.map((a, i) => (
          <PathDrawAnnotation
            key={i}
            progress={progress}
            at={a.at}
            x={a.x}
            y={a.y}
            label={a.label}
            print={print}
            className={a.className}
          />
        ))}
      </div>
    </div>
  );
}

function PathDrawAnnotation({
  progress,
  at,
  x,
  y,
  label,
  print,
  className,
}: {
  progress: MotionValue<number>;
  at: number;
  x: number;
  y: number;
  label: ReactNode;
  print: boolean;
  className?: string;
}) {
  const opacity = useTransform(progress, [Math.max(0, at - 0.02), at], [0, 1]);
  return (
    <motion.div
      style={{
        left: `${x}%`,
        top: `${y}%`,
        opacity: print ? 1 : opacity,
      }}
      initial={false}
      transition={{ ease: ease.outQuart }}
      className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium whitespace-nowrap",
        "bg-bg-dark/80 border border-white/10 text-white rounded backdrop-blur-sm",
        className,
      )}
    >
      {label}
    </motion.div>
  );
}
