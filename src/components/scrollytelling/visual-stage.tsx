"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";

interface VisualStageProps {
  src: string;
  alt?: string;
  children: ReactNode;
  className?: string;
  imageClassName?: string;
  overlay?: string;
  height?: string;
}

/**
 * VisualStage turns one image into a full-screen, scroll-bound chapter opener.
 * The image pushes in as the reader crosses the section while copy stays pinned
 * to the viewport. It gives generated or documentary media room to carry an
 * argument before the denser proof UI begins.
 */
export function VisualStage({
  src,
  alt = "",
  children,
  className,
  imageClassName,
  overlay = "linear-gradient(90deg, rgba(5,7,14,.96) 0%, rgba(5,7,14,.78) 42%, rgba(5,7,14,.18) 76%, rgba(5,7,14,.5) 100%)",
  height = "135vh",
}: VisualStageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const print = usePrintMode();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -36]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -20]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.72, 1], [1, 1, 0]);

  if (print) {
    return (
      <div className={cn("relative min-h-[720px] overflow-hidden bg-bg-dark text-white", className)}>
        {/* Static presentation assets are generated once and committed. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={cn("absolute inset-0 h-full w-full object-cover", imageClassName)} />
        <div className="absolute inset-0" style={{ background: overlay }} />
        <div className="relative z-10 flex min-h-[720px] items-center">{children}</div>
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("relative bg-bg-dark text-white", className)} style={{ height }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* motion.img keeps the transform on the media element itself; Next Image's
            fill wrapper breaks that scroll transform in WebKit-sized viewports. */}
        <motion.img
          src={src}
          alt={alt}
          style={{ scale, y }}
          className={cn("absolute inset-0 h-full w-full object-cover", imageClassName)}
        />
        <div className="absolute inset-0" style={{ background: overlay }} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,6,12,.22),transparent_35%,rgba(4,6,12,.62))]" />
        <motion.div style={{ y: copyY, opacity: copyOpacity }} className="relative z-10 flex h-full items-center">
          {children}
        </motion.div>
      </div>
    </div>
  );
}
