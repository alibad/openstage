"use client";

import { Children, type ReactNode } from "react";
import Image from "next/image";
import { motion, useTransform } from "framer-motion";
import { usePrintMode } from "@/lib/print-mode";
import { useSectionProgress } from "./use-section-progress";

interface StickyMediaProps {
  /** Image or video path */
  src?: string;
  alt?: string;
  /** Custom React element for the media side (overrides src) */
  media?: ReactNode;
  /** Which side the media sticks to */
  mediaPosition?: "left" | "right";
  /** Darken overlay on the media (0-1) */
  overlay?: number;
  /** Image object-fit mode */
  mediaFit?: "cover" | "contain";
  /** Video instead of image */
  video?: boolean;
  /** Vertical distance between narrative steps. Defaults to 40vh. */
  stepGap?: string;
  /** Space before the first and after the last step. Defaults to 40vh. */
  verticalPadding?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Pinned graphic on one side, scrolling text steps on the other.
 * The bread and butter of scrollytelling: media stays visible while
 * the reader scrolls through explanation steps.
 *
 * Each direct child is one "step". Steps fade in as they enter the
 * active zone and fade out as they leave.
 *
 * Mobile: stacks vertically (media on top, steps below).
 * Print: everything visible, stacked layout.
 */
export function StickyMedia({
  src,
  alt = "",
  media,
  mediaPosition = "left",
  overlay = 0,
  mediaFit = "contain",
  video = false,
  stepGap = "40vh",
  verticalPadding = "40vh",
  className,
  children,
}: StickyMediaProps) {
  const print = usePrintMode();
  const { ref, progress } = useSectionProgress(["start start", "end end"]);
  const steps = Children.toArray(children);

  const renderMedia = (fill: boolean, extraClass?: string) => {
    if (media) return <div className={`w-full h-full flex items-center justify-center ${extraClass || ""}`}>{media}</div>;
    if (video) return fill ? <video src={src} autoPlay muted loop playsInline className={`h-full w-full object-${mediaFit} ${extraClass || ""}`} /> : <video src={src} muted playsInline className={`w-full ${extraClass || ""}`} />;
    return fill
      ? <Image src={src!} alt={alt} fill className={`object-${mediaFit} ${extraClass || ""}`} />
      : <Image src={src!} alt={alt} width={1200} height={675} className={`w-full ${extraClass || ""}`} />;
  };

  if (print) {
    return (
      <section ref={ref} className={className}>
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="mb-8 rounded-2xl overflow-hidden border border-border bg-bg-surface">
            {renderMedia(false)}
          </div>
          <div className="space-y-8">
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
        <div className="sticky top-0 hidden h-screen w-1/2 md:flex items-center justify-center">
          <div className="relative h-full w-full">
            {renderMedia(true)}
            {overlay > 0 && (
              <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlay})` }} />
            )}
          </div>
        </div>

        <div className="md:hidden sticky top-0 h-[40vh] w-full z-0">
          <div className="relative h-full w-full">
            {renderMedia(true, "object-cover")}
            {overlay > 0 && (
              <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlay})` }} />
            )}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg-dark to-transparent" />
          </div>
        </div>

        <div
          className="relative z-10 flex w-full flex-col px-6 md:w-1/2 md:px-12 lg:px-16"
          style={{ gap: stepGap, paddingTop: verticalPadding, paddingBottom: verticalPadding }}
        >
          {steps.map((step, i) => (
            <StepBlock key={i} index={i} total={steps.length} progress={progress}>
              {step}
            </StepBlock>
          ))}
        </div>
      </div>
    </section>
  );
}

function StepBlock({
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
