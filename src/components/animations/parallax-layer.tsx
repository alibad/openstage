"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";

interface ParallaxLayerProps {
  children: React.ReactNode;
  /** How much this layer moves relative to scroll. 0 = fixed, 1 = normal scroll, >1 = faster */
  speed?: number;
  /** Horizontal parallax offset in px */
  offsetX?: number;
  /** Additional scale effect on scroll (e.g. 0.05 adds slight zoom) */
  scaleRange?: number;
  /** Opacity fades based on scroll position */
  fade?: boolean;
  className?: string;
}

export function ParallaxLayer({
  children,
  speed = 0.5,
  offsetX = 0,
  scaleRange = 0,
  fade = false,
  className,
}: ParallaxLayerProps) {
  const print = usePrintMode();
  const ref = useRef(null);
  /* `print ? undefined` matters: the print branch below returns a plain <div>
     that never attaches `ref`, so passing a target here leaves motion with a
     ref it can never resolve and it throws "Target ref is defined but not
     hydrated", crashing the whole deck in ?print. Same guard `FullBleed` uses.
     With no target, useScroll falls back to the viewport and the values are
     discarded anyway. */
  const { scrollYProgress } = useScroll(
    print ? undefined : { target: ref, offset: ["start end", "end start"] },
  );

  const yRange = 100 * (1 - speed);
  const y = useTransform(scrollYProgress, [0, 1], [yRange, -yRange]);
  const x = useTransform(
    scrollYProgress,
    [0, 1],
    [offsetX, -offsetX],
  );
  const scale = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [1 - scaleRange, 1, 1 - scaleRange],
  );
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    [0.3, 1, 1, 0.3],
  );

  if (print) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={cn("will-change-transform", className)}
      style={{
        y,
        x: offsetX !== 0 ? x : undefined,
        scale: scaleRange > 0 ? scale : undefined,
        opacity: fade ? opacity : undefined,
      }}
    >
      {children}
    </motion.div>
  );
}
