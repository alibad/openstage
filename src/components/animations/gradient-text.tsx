"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { usePrintMode } from "@/lib/print-mode";

interface GradientTextProps {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "span" | "p";
}

export function GradientText({
  children,
  className,
  as: Tag = "span",
}: GradientTextProps) {
  return (
    <Tag
      className={`spectrum-gradient-text ${className || ""}`}
    >
      {children}
    </Tag>
  );
}

export function AnimatedGradientText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const print = usePrintMode();

  if (print) {
    return (
      <span
        className={`inline-block ${className || ""}`}
        style={{ color: "var(--color-brand-3)" }}
      >
        {children}
      </span>
    );
  }

  return (
    <motion.span
      className={`inline-block ${className || ""}`}
      style={{
        // Use `backgroundImage` (the long-hand) instead of the
        // `background` shorthand. The shorthand resets every
        // `background-*` longhand to its initial value — including
        // `background-clip` — and depending on how React serializes the
        // style object, that reset can race the explicit `backgroundClip:
        // "text"` set below, leaving the gradient painted as a solid
        // rectangle instead of being clipped to the text shape.
        // Read from the runtime brand gradient (set by `BrandProvider` /
        // `BrandScope`) so the active preset themes the headline.
        backgroundImage:
          "var(--brand-gradient, linear-gradient(90deg, var(--color-brand-1) 0%, var(--color-brand-2) 25%, var(--color-brand-3) 50%, var(--color-brand-4) 75%, var(--color-brand-5) 100%))",
        backgroundSize: "200% auto",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        color: "transparent",
      }}
      animate={{
        backgroundPosition: ["0% center", "100% center", "0% center"],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      {children}
    </motion.span>
  );
}

export function ParallaxText({
  children,
  className,
  speed = 0.3,
}: {
  children: string;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [60 * speed, -60 * speed]);

  return (
    <div ref={ref} className="overflow-hidden">
      <motion.div style={{ y }} className={className}>
        {children}
      </motion.div>
    </div>
  );
}
