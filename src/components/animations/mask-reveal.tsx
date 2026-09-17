"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useMemo } from "react";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";
import { ease } from "@/lib/motion";

type MaskShape = "circle" | "diamond" | "diagonal-left" | "diagonal-right" | "horizontal" | "vertical";

interface MaskRevealProps {
  children: React.ReactNode;
  /** Shape of the revealing mask */
  shape?: MaskShape;
  /** Animation duration (seconds) */
  duration?: number;
  /** Delay before animation starts */
  delay?: number;
  /** Only animate once */
  once?: boolean;
  className?: string;
}

function buildClipPaths(shape: MaskShape): { from: string; to: string } {
  switch (shape) {
    case "circle":
      return {
        from: "circle(0% at 50% 50%)",
        to: "circle(75% at 50% 50%)",
      };
    case "diamond":
      return {
        from: "polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)",
        to: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
      };
    case "diagonal-left":
      return {
        from: "polygon(0% 0%, 0% 0%, 0% 0%)",
        to: "polygon(0% 0%, 200% 0%, 0% 200%)",
      };
    case "diagonal-right":
      return {
        from: "polygon(100% 0%, 100% 0%, 100% 0%)",
        to: "polygon(100% 0%, 100% 200%, -100% 0%)",
      };
    case "horizontal":
      return {
        from: "inset(0 50% 0 50%)",
        to: "inset(0 0% 0 0%)",
      };
    case "vertical":
      return {
        from: "inset(50% 0 50% 0)",
        to: "inset(0% 0 0% 0)",
      };
  }
}

export function MaskReveal({
  children,
  shape = "circle",
  duration = 1,
  delay = 0,
  once = true,
  className,
}: MaskRevealProps) {
  const print = usePrintMode();
  const ref = useRef(null);
  const inView = useInView(ref, { once, margin: "-80px" });
  const paths = useMemo(() => buildClipPaths(shape), [shape]);

  if (print) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      initial={{ clipPath: paths.from, opacity: 0 }}
      animate={
        inView
          ? { clipPath: paths.to, opacity: 1 }
          : { clipPath: paths.from, opacity: 0 }
      }
      transition={{
        duration,
        delay,
        ease: ease.outCirc,
      }}
    >
      {children}
    </motion.div>
  );
}
