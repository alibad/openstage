"use client";

import { useRef } from "react";
import { useScroll, useSpring, type MotionValue } from "framer-motion";
import { usePrintMode } from "@/lib/print-mode";
import { springConfig } from "@/lib/motion";

/**
 * Tracks scroll progress through a section using Framer Motion.
 *
 * Two common offset patterns:
 *   - Viewport reveal (default): ["start 0.85", "end 0.15"]
 *     Progress 0→1 as the element passes through the viewport.
 *   - Sticky container: ["start start", "end end"]
 *     Progress 0→1 as the container scrolls from top-aligned to bottom-aligned.
 *
 * Returns `print: true` when ?print is active so components can render
 * a fully-revealed static version.
 */
export function useSectionProgress(
  offset: ["start 0.85", "end 0.15"] | ["start start", "end end"] | ["start 0.75", "end 0.25"] | ["start 0.85", "end 0.25"] | [string, string] = ["start 0.85", "end 0.15"],
  smooth = false,
) {
  const ref = useRef<HTMLDivElement>(null);
  const print = usePrintMode();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: offset as any,
  });

  const smoothed = useSpring(scrollYProgress, springConfig.smooth);

  return {
    ref,
    progress: (smooth ? smoothed : scrollYProgress) as MotionValue<number>,
    print,
  };
}
