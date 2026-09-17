"use client";

import { ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";
import { ease, duration as durationTokens } from "@/lib/motion";

interface IntroSequenceProps {
  /** Session-storage key — play once per session when set */
  sessionKey?: string;
  /** Force the intro to play every time (ignores sessionKey) */
  alwaysShow?: boolean;
  /** Override total duration (seconds) */
  duration?: number;
  /** Content shown mid-intro (brand logotype, title, etc) */
  children?: ReactNode;
  /** Override the brand text */
  title?: string;
  /** Override the brand subtitle / caption */
  subtitle?: string;
  /** Color of the sweeping gradient bar */
  gradient?: string;
  /** Background color */
  background?: string;
}

const DEFAULT_GRADIENT =
  "var(--brand-gradient, linear-gradient(90deg, var(--color-brand-1), var(--color-brand-2), var(--color-brand-3), var(--color-brand-4), var(--color-brand-5)))";

/**
 * IntroSequence — branded cold-open loader.
 *
 * Plays a short (1.6s by default) gradient-bar sweep + logotype reveal
 * before the presentation renders. Gated by sessionStorage so it only
 * plays once per tab session.
 *
 * Drop at the top of a presentation's content component.
 *
 * @example
 * <IntroSequence title="Presenter" subtitle="The State of AI, 2026" />
 * <main>...</main>
 */
export function IntroSequence({
  sessionKey = "presenter-intro",
  alwaysShow = false,
  duration = 1.8,
  children,
  title = "Presenter",
  subtitle,
  gradient = DEFAULT_GRADIENT,
  background = "#0A0718",
}: IntroSequenceProps) {
  const print = usePrintMode();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (print) return;
    if (typeof window === "undefined") return;
    const seen = alwaysShow
      ? false
      : sessionStorage.getItem(sessionKey) === "seen";
    if (seen) return;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      try {
        sessionStorage.setItem(sessionKey, "seen");
      } catch {
        // ignore
      }
    }, duration * 1000);
    return () => clearTimeout(t);
  }, [alwaysShow, sessionKey, duration, print]);

  if (print) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="intro"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            y: "-100%",
            transition: {
              duration: 0.9,
              ease: ease.inOutExpo,
            },
          }}
          className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden"
          style={{ background }}
          aria-hidden="true"
        >
          {/* Gradient sweep bar */}
          <motion.div
            className="absolute inset-x-0 top-1/2 h-[1px] -translate-y-1/2 origin-left"
            style={{ background: gradient }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: [0, 1, 1] }}
            transition={{
              duration: duration * 0.9,
              times: [0, 0.5, 1],
              ease: ease.inOutExpo,
            }}
          />
          {/* Logotype */}
          <div className="relative z-10 flex flex-col items-center gap-4">
            <motion.div
              initial={{ opacity: 0, y: 16, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: durationTokens.slow,
                delay: duration * 0.28,
                ease: ease.outExpo,
              }}
              className="flex flex-col items-center gap-3 text-white"
            >
              {children ?? (
                <>
                  <div
                    className="text-5xl md:text-6xl font-semibold tracking-tight"
                    style={{
                      background: gradient,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {title}
                  </div>
                  {subtitle && (
                    <div className="text-xs uppercase tracking-[0.3em] text-white/50">
                      {subtitle}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>
          {/* Vertical curtain wipe at end */}
          <motion.div
            className="absolute inset-0 pointer-events-none origin-top"
            style={{ background }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 0 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Imperatively reset the session flag so the intro plays again next render.
 * Useful for dev tooling.
 */
export function resetIntroSession(sessionKey = "presenter-intro") {
  try {
    sessionStorage.removeItem(sessionKey);
  } catch {
    // ignore
  }
}

export function IntroSequenceWrapper({
  children,
  className,
  ...props
}: IntroSequenceProps & { children?: ReactNode; className?: string }) {
  return (
    <div className={cn("contents", className)}>
      <IntroSequence {...props} />
      {children}
    </div>
  );
}
