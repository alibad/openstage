"use client";

import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";
import { ease } from "@/lib/motion";

type SplitMode = "word" | "char" | "line";
type AnimationType =
  | "fade-up"
  | "fade-in"
  | "blur-in"
  | "slide-up"
  | "slide-down"
  | "scale"
  | "rotate";

interface TextSplitProps {
  children: string;
  /** Split by word, character, or line (newline-delimited) */
  mode?: SplitMode;
  /** Entrance animation style */
  animation?: AnimationType;
  /** Delay before first unit animates (seconds) */
  delay?: number;
  /** Stagger between each unit (seconds) */
  stagger?: number;
  /** Duration per unit (seconds) */
  duration?: number;
  /** Only animate once */
  once?: boolean;
  className?: string;
  /** Class applied to each animated unit */
  unitClassName?: string;
}

const VARIANTS: Record<AnimationType, Variants> = {
  "fade-up": {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
  },
  "fade-in": {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  "blur-in": {
    hidden: { opacity: 0, filter: "blur(12px)" },
    visible: { opacity: 1, filter: "blur(0px)" },
  },
  "slide-up": {
    hidden: { opacity: 0, y: "100%" },
    visible: { opacity: 1, y: "0%" },
  },
  "slide-down": {
    hidden: { opacity: 0, y: "-100%" },
    visible: { opacity: 1, y: "0%" },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.5 },
    visible: { opacity: 1, scale: 1 },
  },
  rotate: {
    hidden: { opacity: 0, rotateX: 90, y: 20 },
    visible: { opacity: 1, rotateX: 0, y: 0 },
  },
};

function splitText(text: string, mode: SplitMode): string[] {
  switch (mode) {
    case "char":
      return text.split("");
    case "line":
      return text.split("\n");
    case "word":
    default:
      return text.split(/(\s+)/).filter(Boolean);
  }
}

export function TextSplit({
  children,
  mode = "word",
  animation = "fade-up",
  delay = 0,
  stagger = 0.04,
  duration = 0.5,
  once = true,
  className,
  unitClassName,
}: TextSplitProps) {
  const print = usePrintMode();

  if (print) {
    return <span className={className}>{children}</span>;
  }

  const units = splitText(children, mode);
  const variants = VARIANTS[animation];
  const isOverflow = animation === "slide-up" || animation === "slide-down";

  return (
    <motion.span
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-60px" }}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
      aria-label={children}
    >
      {units.map((unit, i) => {
        if (/^\s+$/.test(unit)) {
          return (
            <span key={i} className="inline-block">
              &nbsp;
            </span>
          );
        }

        const inner = (
          <motion.span
            className={cn(
              "inline-block",
              isOverflow && "will-change-transform",
              unitClassName,
            )}
            variants={variants}
            transition={{
              duration,
              ease: ease.outQuart,
            }}
            style={
              animation === "rotate" ? { transformOrigin: "bottom left" } : undefined
            }
          >
            {unit === " " ? "\u00A0" : unit}
          </motion.span>
        );

        if (isOverflow) {
          return (
            <span
              key={i}
              className="inline-block overflow-hidden align-bottom"
              style={{ perspective: "600px" }}
            >
              {inner}
            </span>
          );
        }

        return <span key={i}>{inner}</span>;
      })}
    </motion.span>
  );
}
