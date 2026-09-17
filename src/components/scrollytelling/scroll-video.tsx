"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { motion, useTransform } from "framer-motion";
import { usePrintMode } from "@/lib/print-mode";
import { useSectionProgress } from "./use-section-progress";

interface ScrollVideoProps {
  src: string;
  /** Poster image shown while loading and in print mode */
  poster?: string;
  /** Full-viewport or contained sizing */
  sizing?: "viewport" | "contained";
  /** Show a thin progress bar at the bottom */
  showProgress?: boolean;
  /** How much scroll runway to create (CSS value) */
  runway?: string;
  className?: string;
}

/**
 * Scroll-scrubbed video: currentTime is driven by scroll position,
 * giving frame-by-frame control.
 *
 * The video sits in a sticky container while a scroll runway below it
 * provides the scrubbing distance. Scrolling forward plays the video;
 * scrolling back rewinds it.
 *
 * Mobile: falls back to poster image if video can't load.
 * Print: poster image.
 * Respects prefers-reduced-motion: pauses at middle frame.
 */
export function ScrollVideo({
  src,
  poster,
  sizing = "viewport",
  showProgress = false,
  runway = "300vh",
  className,
}: ScrollVideoProps) {
  const print = usePrintMode();
  const { ref, progress } = useSectionProgress(["start start", "end end"]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef(-1);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  const seekToProgress = useCallback((p: number) => {
    const video = videoRef.current;
    if (!video || !video.duration || !isFinite(video.duration)) return;
    const target = p * video.duration;
    if (Math.abs(target - lastTimeRef.current) < 0.016) return;
    video.currentTime = target;
    lastTimeRef.current = target;
  }, []);

  useEffect(() => {
    if (print) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      seekToProgress(0.5);
      return;
    }

    const unsubscribe = progress.on("change", (v) => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => seekToProgress(v));
    });

    return () => {
      unsubscribe();
      cancelAnimationFrame(rafRef.current);
    };
  }, [progress, print, seekToProgress]);

  if (print) {
    return (
      <section ref={ref} className={className}>
        {poster ? (
          <img src={poster} alt="" className="w-full rounded-2xl" />
        ) : (
          <div className="w-full aspect-video bg-bg-surface rounded-2xl flex items-center justify-center text-muted">
            Video: {src}
          </div>
        )}
      </section>
    );
  }

  const sizeClasses = sizing === "viewport" ? "h-screen w-full" : "h-auto w-full aspect-video";

  return (
    <section ref={ref} className={`relative ${className || ""}`}>
      <div className={`sticky top-0 overflow-hidden ${sizeClasses}`}>
        {/* Poster fallback */}
        {(!ready || error) && poster && (
          <img
            src={poster}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* Video element */}
        {!error && (
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            preload="auto"
            muted
            playsInline
            onCanPlayThrough={() => setReady(true)}
            onError={() => setError(true)}
            className={`h-full w-full object-cover transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`}
          />
        )}

        {/* Progress bar */}
        {showProgress && ready && (
          <motion.div
            className="absolute bottom-0 left-0 h-[3px] origin-left"
            style={{
              scaleX: progress,
              background: "linear-gradient(90deg, var(--color-brand-1), var(--color-brand-3))",
            }}
          />
        )}
      </div>

      {/* Scroll runway */}
      <div style={{ height: runway }} />
    </section>
  );
}
