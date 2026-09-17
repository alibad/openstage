"use client";

import { useMemo, Children, isValidElement, type ReactNode } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { usePrintMode } from "@/lib/print-mode";
import { useSectionProgress } from "./use-section-progress";

type RevealMode = "word" | "line" | "char" | "sentence";

interface ScrollRevealTextProps {
  mode?: RevealMode;
  scrub?: boolean;
  highlight?: boolean;
  highlightColor?: string;
  blur?: boolean;
  stagger?: number;
  className?: string;
  children: ReactNode;
}

function extractText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (!node) return "";
  if (isValidElement(node)) {
    return extractText((node.props as { children?: ReactNode }).children);
  }
  if (Array.isArray(node)) return Children.toArray(node).map(extractText).join("");
  return "";
}

function splitText(text: string, mode: RevealMode): string[] {
  switch (mode) {
    case "char":
      return text.split("");
    case "line":
      return text.split("\n").filter((l) => l.trim().length > 0);
    case "sentence":
      return text.match(/[^.!?]+[.!?]+\s*/g) ?? [text];
    case "word":
    default:
      return text.split(/\s+/).filter((w) => w.length > 0);
  }
}

export function ScrollRevealText({
  mode = "word",
  scrub = false,
  highlight = false,
  highlightColor = "var(--color-brand-3, #A78BFA)",
  blur = false,
  stagger = 0.04,
  className,
  children,
}: ScrollRevealTextProps) {
  const print = usePrintMode();
  const text = extractText(children);
  const units = useMemo(() => splitText(text, mode), [text, mode]);

  if (print) {
    return (
      <span
        className={`${className || ""} rounded-md`}
        style={highlight ? {
          backgroundColor: highlightColor,
          padding: "0.1em 0.25em",
          boxDecorationBreak: "clone" as const,
          WebkitBoxDecorationBreak: "clone" as const,
        } : undefined}
      >
        {text}
      </span>
    );
  }

  if (scrub) {
    return (
      <ScrubReveal
        units={units}
        mode={mode}
        highlight={highlight}
        highlightColor={highlightColor}
        blur={blur}
        className={className}
      />
    );
  }

  return (
    <ViewportReveal
      units={units}
      mode={mode}
      highlight={highlight}
      highlightColor={highlightColor}
      blur={blur}
      stagger={stagger}
      className={className}
    />
  );
}

function ScrubReveal({
  units,
  mode,
  highlight,
  highlightColor,
  blur,
  className,
}: {
  units: string[];
  mode: RevealMode;
  highlight: boolean;
  highlightColor: string;
  blur: boolean;
  className?: string;
}) {
  const { ref, progress } = useSectionProgress(["start 0.75", "end 0.25"]);
  const sep = mode === "char" ? "" : " ";

  return (
    <span
      ref={ref}
      className={`${className || ""} ${highlight ? "rounded-md" : ""}`}
      style={highlight ? {
        backgroundColor: highlightColor,
        padding: "0.1em 0.3em",
        boxDecorationBreak: "clone" as const,
        WebkitBoxDecorationBreak: "clone" as const,
      } : undefined}
    >
      {units.map((unit, i) => (
        <ScrubUnit
          key={i}
          unit={unit}
          index={i}
          total={units.length}
          sep={i < units.length - 1 ? sep : ""}
          progress={progress}
          blur={blur}
        />
      ))}
    </span>
  );
}

function ScrubUnit({
  unit,
  index,
  total,
  sep,
  progress,
  blur,
}: {
  unit: string;
  index: number;
  total: number;
  sep: string;
  progress: MotionValue<number>;
  blur: boolean;
}) {
  const start = total > 1 ? index / total : 0;
  const end = total > 1 ? (index + 1) / total : 1;

  const opacity = useTransform(progress, [start * 0.9, end * 0.9], [0.15, 1]);
  const blurFilter = useTransform(progress, [start * 0.9, end * 0.9], [8, 0]);
  const filterStr = useTransform(blurFilter, (v) => `blur(${v}px)`);

  return (
    <motion.span
      style={{
        opacity,
        ...(blur ? { filter: filterStr } : {}),
      }}
    >
      {unit}{sep}
    </motion.span>
  );
}

function ViewportReveal({
  units,
  mode,
  highlight,
  highlightColor,
  blur,
  stagger,
  className,
}: {
  units: string[];
  mode: RevealMode;
  highlight: boolean;
  highlightColor: string;
  blur: boolean;
  stagger: number;
  className?: string;
}) {
  const sep = mode === "char" ? "" : " ";

  return (
    <motion.span
      className={`${className || ""} ${highlight ? "rounded-md" : ""}`}
      style={highlight ? {
        backgroundColor: highlightColor,
        padding: "0.1em 0.3em",
        boxDecorationBreak: "clone" as const,
        WebkitBoxDecorationBreak: "clone" as const,
      } : undefined}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
    >
      {units.map((unit, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: {
              opacity: 0,
              filter: blur ? "blur(8px)" : "blur(0px)",
            },
            visible: {
              opacity: 1,
              filter: "blur(0px)",
            },
          }}
          transition={{
            duration: 0.4,
            delay: i * stagger,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          {unit}{i < units.length - 1 ? sep : ""}
        </motion.span>
      ))}
    </motion.span>
  );
}
