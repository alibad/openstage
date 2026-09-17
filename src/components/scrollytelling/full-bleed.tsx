"use client";

import { type ReactNode, useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { usePrintMode } from "@/lib/print-mode";

type ContentPosition =
  | "center"
  | "bottom-left"
  | "bottom-center"
  | "top-left"
  | "top-center";

interface FullBleedProps {
  src: string;
  alt: string;
  children?: ReactNode;
  /** Darken overlay (0-1) */
  overlay?: number;
  /** Custom gradient overlay instead of black */
  gradient?: string;
  /** Parallax scroll effect on the image */
  parallax?: boolean;
  /** Content alignment */
  position?: ContentPosition;
  /** Video instead of image */
  video?: boolean;
  className?: string;
}

const positionClasses: Record<ContentPosition, string> = {
  center: "items-center justify-center text-center",
  "bottom-left": "items-end justify-start text-left pb-20",
  "bottom-center": "items-end justify-center text-center pb-20",
  "top-left": "items-start justify-start text-left pt-20",
  "top-center": "items-start justify-center text-center pt-20",
};

/**
 * Full-viewport image or video section with optional text overlay.
 * The classic scrollytelling hero/interstitial pattern.
 *
 * Supports parallax (image moves slower than scroll), custom gradient
 * overlays (not just black), content positioning, and video backgrounds.
 *
 * Print: static image with text overlay.
 */
export function FullBleed({
  src,
  alt,
  children,
  overlay = 0.4,
  gradient,
  parallax = false,
  position = "center",
  video = false,
  className,
}: FullBleedProps) {
  const print = usePrintMode();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll(
    print || !parallax
      ? undefined
      : { target: ref, offset: ["start start", "end start"] },
  );
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);

  const overlayStyle = gradient
    ? { background: gradient }
    : overlay > 0
      ? { backgroundColor: `rgba(0,0,0,${overlay})` }
      : undefined;

  if (print) {
    return (
      <section className={`relative min-h-screen ${className || ""}`}>
        <div className="relative h-screen w-full overflow-hidden">
          {video ? (
            <div className="h-full w-full bg-bg-surface flex items-center justify-center text-muted">
              Video: {src}
            </div>
          ) : (
            <Image src={src} alt={alt} fill className="object-cover" priority />
          )}
          {overlayStyle && <div className="absolute inset-0" style={overlayStyle} />}
          {children && (
            <div className={`relative z-10 flex h-full px-8 ${positionClasses[position]}`}>
              <div className="max-w-4xl">{children}</div>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className={`relative min-h-screen ${className || ""}`}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {parallax ? (
          <motion.div className="absolute inset-0" style={{ y }}>
            <div className="absolute inset-0 scale-110">
              {video ? (
                <video
                  src={src}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <Image src={src} alt={alt} fill className="object-cover" priority />
              )}
            </div>
          </motion.div>
        ) : (
          <>
            {video ? (
              <video
                src={src}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <Image
                src={src}
                alt={alt}
                fill
                className="object-cover"
                priority
              />
            )}
          </>
        )}

        {overlayStyle && <div className="absolute inset-0" style={overlayStyle} />}

        {children && (
          <div className={`relative z-10 flex h-full px-8 ${positionClasses[position]}`}>
            <div className="max-w-4xl">{children}</div>
          </div>
        )}
      </div>
    </section>
  );
}
