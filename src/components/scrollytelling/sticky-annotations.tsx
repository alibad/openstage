"use client";

import { Children, type ReactNode } from "react";
import Image from "next/image";
import { motion, useTransform, AnimatePresence } from "framer-motion";
import { usePrintMode } from "@/lib/print-mode";
import { useSectionProgress } from "./use-section-progress";

type AnnotationType = "label" | "circle" | "arrow" | "pulse" | "box";

interface Annotation {
  /** X position on media (0-100%) */
  x: number;
  /** Y position on media (0-100%) */
  y: number;
  label: string;
  /** Which scroll step reveals this annotation (0-indexed) */
  step: number;
  color?: string;
  type?: AnnotationType;
  /** Width for box annotations (percentage) */
  width?: number;
  /** Height for box annotations (percentage) */
  height?: number;
}

interface StickyAnnotationsProps {
  src?: string;
  alt?: string;
  /** Custom React element for the media (overrides src) */
  media?: ReactNode;
  annotations: Annotation[];
  mediaPosition?: "left" | "right";
  overlay?: number;
  className?: string;
  children: ReactNode;
}

const DEFAULT_COLOR = "var(--color-brand-1, #7DD3FC)";

/**
 * Pinned image with positioned annotations that accumulate as the
 * reader scrolls through text steps. The core NYT/Pudding
 * explanatory pattern.
 *
 * Annotations stay visible once their step is reached (accumulate).
 * Supports label pills, circles, arrows, pulsing rings, and highlight boxes.
 *
 * Mobile: image at top with annotations, text below.
 * Print: all annotations and steps visible.
 */
export function StickyAnnotations({
  src,
  alt = "",
  media,
  annotations,
  mediaPosition = "left",
  overlay = 0,
  className,
  children,
}: StickyAnnotationsProps) {
  const print = usePrintMode();
  const { ref, progress } = useSectionProgress(["start start", "end end"]);
  const steps = Children.toArray(children);
  const numSteps = steps.length;

  const renderMedia = (fill: boolean) => {
    if (media) return <div className="w-full h-full flex items-center justify-center">{media}</div>;
    return fill
      ? <Image src={src!} alt={alt} fill className="object-contain" />
      : <Image src={src!} alt={alt} width={1200} height={675} className="w-full" />;
  };

  if (print) {
    return (
      <section ref={ref} className={className}>
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="relative mb-8 rounded-2xl overflow-hidden border border-border">
            {renderMedia(false)}
            <div className="absolute inset-0">
              {annotations.map((ann, i) => (
                <AnnotationMarker key={i} annotation={ann} visible />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            {steps.map((step, i) => (
              <div key={i}>{step}</div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className={`relative ${className || ""}`}>
      <div className={`flex min-h-screen ${mediaPosition === "right" ? "flex-row-reverse" : ""}`}>
        <div className="sticky top-0 hidden h-screen w-1/2 md:flex items-center justify-center p-8">
          <div className="relative w-full h-full max-h-[80vh] rounded-2xl overflow-hidden border border-white/10 bg-bg-surface shadow-2xl">
            {renderMedia(true)}
            {overlay > 0 && (
              <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlay})` }} />
            )}
            <AnnotationLayer annotations={annotations} numSteps={numSteps} progress={progress} />
          </div>
        </div>

        <div className="md:hidden sticky top-0 h-[40vh] w-full z-0">
          <div className="relative h-full w-full">
            {renderMedia(true)}
            <AnnotationLayer annotations={annotations} numSteps={numSteps} progress={progress} />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-bg-dark to-transparent" />
          </div>
        </div>

        <div className="relative z-10 flex w-full flex-col gap-[50vh] px-6 py-[50vh] md:w-1/2 md:px-12 lg:px-16">
          {steps.map((step, i) => (
            <StepFade key={i} index={i} total={numSteps} progress={progress}>
              {step}
            </StepFade>
          ))}
        </div>
      </div>
    </section>
  );
}

function AnnotationLayer({
  annotations,
  numSteps,
  progress,
}: {
  annotations: Annotation[];
  numSteps: number;
  progress: import("framer-motion").MotionValue<number>;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {annotations.map((ann, i) => (
        <AnimatedAnnotation
          key={i}
          annotation={ann}
          numSteps={numSteps}
          progress={progress}
        />
      ))}
    </div>
  );
}

function AnimatedAnnotation({
  annotation,
  numSteps,
  progress,
}: {
  annotation: Annotation;
  numSteps: number;
  progress: import("framer-motion").MotionValue<number>;
}) {
  const threshold = numSteps > 0 ? annotation.step / numSteps : 0;
  const visible = useTransform(progress, (p) => p >= threshold);

  return (
    <motion.div style={{ opacity: useTransform(visible, (v) => (v ? 1 : 0)) }}>
      <AnnotationMarker annotation={annotation} visible />
    </motion.div>
  );
}

function StepFade({
  children,
  index,
  total,
  progress,
}: {
  children: ReactNode;
  index: number;
  total: number;
  progress: import("framer-motion").MotionValue<number>;
}) {
  const stepStart = index / total;
  const stepEnd = (index + 1) / total;
  const fadeIn = stepStart + (stepEnd - stepStart) * 0.15;
  const fadeOut = stepStart + (stepEnd - stepStart) * 0.85;
  const opacity = useTransform(
    progress,
    [stepStart, fadeIn, fadeOut, stepEnd],
    [0.7, 1, 1, 0.7],
  );

  return (
    <motion.div style={{ opacity }} className="max-w-lg">
      {children}
    </motion.div>
  );
}

function AnnotationMarker({
  annotation,
  visible,
}: {
  annotation: Annotation;
  visible: boolean;
}) {
  const color = annotation.color ?? DEFAULT_COLOR;
  const type = annotation.type ?? "label";

  const base: React.CSSProperties = {
    position: "absolute",
    left: `${annotation.x}%`,
    top: `${annotation.y}%`,
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    transition: "opacity 0.35s ease-out, transform 0.35s ease-out",
    opacity: visible ? 1 : 0,
  };

  if (type === "circle") {
    return (
      <div
        style={{
          ...base,
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: `2.5px solid ${color}`,
          boxShadow: visible ? `0 0 16px ${color}40` : "none",
          transform: visible
            ? "translate(-50%, -50%) scale(1)"
            : "translate(-50%, -50%) scale(0.4)",
        }}
      />
    );
  }

  if (type === "pulse") {
    return (
      <div style={base}>
        <span
          className="absolute inset-0 animate-ping rounded-full"
          style={{ backgroundColor: `${color}30`, width: 32, height: 32 }}
        />
        <span
          className="relative block rounded-full"
          style={{ backgroundColor: color, width: 12, height: 12 }}
        />
      </div>
    );
  }

  if (type === "arrow") {
    return (
      <svg
        width={28}
        height={28}
        viewBox="0 0 28 28"
        style={{
          ...base,
          transform: visible
            ? "translate(-50%, -50%) scale(1)"
            : "translate(-50%, -50%) scale(0.4)",
        }}
      >
        <path
          d="M14 4 L14 20 M7 15 L14 22 L21 15"
          stroke={color}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "box") {
    const w = annotation.width ?? 10;
    const h = annotation.height ?? 8;
    return (
      <div
        style={{
          position: "absolute",
          left: `${annotation.x - w / 2}%`,
          top: `${annotation.y - h / 2}%`,
          width: `${w}%`,
          height: `${h}%`,
          border: `2px solid ${color}`,
          borderRadius: 8,
          backgroundColor: `${color}10`,
          pointerEvents: "none",
          transition: "opacity 0.35s ease-out",
          opacity: visible ? 1 : 0,
        }}
      />
    );
  }

  return (
    <span
      style={{
        ...base,
        backgroundColor: `${color}E6`,
        backdropFilter: "blur(8px)",
        color: "#fff",
        padding: "0.2em 0.65em",
        borderRadius: "0.375em",
        fontSize: "0.8rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
        boxShadow: `0 2px 12px ${color}30`,
        transform: visible
          ? "translate(-50%, -50%) scale(1)"
          : "translate(-50%, -50%) scale(0.7)",
      }}
    >
      {annotation.label}
    </span>
  );
}
