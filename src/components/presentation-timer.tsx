"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { usePrintMode } from "@/lib/print-mode";
import { useActiveSectionIndex } from "@/lib/use-active-section";

export interface SectionBudget {
  /** DOM id of the section to observe */
  id: string;
  /** Short label for the on-pill indicator (defaults to `id`) */
  label?: string;
  /** Time budget for this section, in minutes */
  minutes: number;
}

interface PresentationTimerProps {
  /**
   * Target duration in minutes. The ring fills as you approach it; the
   * readout shifts colour as you cross 75 % / 100 %.
   *
   * If `sections` is provided and `targetMinutes` is omitted, the target is
   * computed as the sum of the section budgets.
   */
  targetMinutes?: number;
  /**
   * Optional per-section budgets. When provided, the timer also tracks the
   * active section via `useActiveSection` and warns (amber → red) when you
   * spend longer inside a section than its budget. Sum should match
   * `targetMinutes` (or omit `targetMinutes` to derive it from the sum).
   */
  sections?: SectionBudget[];
  /** Hide during print mode (default true) */
  hidden?: boolean;
}

/**
 * PresentationTimer — an at-a-glance wall clock for the presenter.
 *
 * Elapsed time is measured from component mount and ticks once a second.
 * A page refresh remounts the component, which resets the clock — no
 * persistence by design. The timer can also be paused/resumed or reset
 * manually via the controls that fade in on hover.
 *
 * Drop at the root of a presentation alongside `<ScrollProgress />` etc:
 *
 * @example Simple wall clock
 * <PresentationTimer targetMinutes={30} />
 *
 * @example Section-aware (warns when overrunning a chapter)
 * <PresentationTimer
 *   sections={[
 *     { id: "hero", label: "Open", minutes: 0.5 },
 *     { id: "demo", label: "Demo", minutes: 1.5 },
 *     { id: "next", label: "Close", minutes: 0.5 },
 *   ]}
 * />
 */
export function PresentationTimer({
  targetMinutes,
  sections,
  hidden = false,
}: PresentationTimerProps = {}) {
  const print = usePrintMode();
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  // Track elapsed time across pause/resume without losing accuracy.
  const startRef = useRef<number>(Date.now());
  const accumulatedRef = useRef<number>(0);

  // Derive total target from sections sum if not explicitly provided.
  const resolvedTargetMinutes = useMemo(() => {
    if (typeof targetMinutes === "number") return targetMinutes;
    if (sections && sections.length > 0) {
      return sections.reduce((acc, s) => acc + s.minutes, 0);
    }
    return 30;
  }, [targetMinutes, sections]);

  // Cumulative end-of-section time in seconds (for each section index).
  const cumulativeEndSec = useMemo(() => {
    if (!sections) return null;
    let acc = 0;
    return sections.map((s) => {
      acc += s.minutes * 60;
      return acc;
    });
  }, [sections]);

  // Track the active section via the shared hook. Pass an empty list when
  // hidden / printing so we don't observe needlessly.
  const sectionIds = useMemo(
    () =>
      print || hidden || !sections ? [] : sections.map((s) => s.id),
    [sections, print, hidden],
  );
  const activeSectionIdx = useActiveSectionIndex(sectionIds);

  useEffect(() => {
    if (print || hidden) return;
    if (paused) return;
    const id = window.setInterval(() => {
      const now = Date.now();
      const total = accumulatedRef.current + (now - startRef.current);
      setSeconds(Math.floor(total / 1000));
    }, 250);
    return () => window.clearInterval(id);
  }, [paused, print, hidden]);

  if (print || hidden) return null;

  const targetSec = resolvedTargetMinutes * 60;
  const progress = Math.min(seconds / targetSec, 1);
  const over = seconds > targetSec;
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  // Section-overrun tone (priority over overall tone).
  let sectionOverrunSec = 0;
  let sectionLabel: string | null = null;
  let sectionDeltaTone: "ok" | "warn" | "bad" = "ok";
  if (
    sections &&
    cumulativeEndSec &&
    activeSectionIdx !== null &&
    activeSectionIdx >= 0 &&
    activeSectionIdx < sections.length
  ) {
    const sec = sections[activeSectionIdx];
    sectionLabel = sec.label ?? sec.id;
    const endSec = cumulativeEndSec[activeSectionIdx];
    sectionOverrunSec = seconds - endSec;
    if (sectionOverrunSec > sec.minutes * 60 * 0.5) {
      sectionDeltaTone = "bad";
    } else if (sectionOverrunSec > 0) {
      sectionDeltaTone = "warn";
    }
  }

  const overallTone: "ok" | "warn" | "bad" =
    seconds < targetSec * 0.75 ? "ok" : !over ? "warn" : "bad";

  const finalToneKey: "ok" | "warn" | "bad" =
    sectionDeltaTone === "bad" || overallTone === "bad"
      ? "bad"
      : sectionDeltaTone === "warn" || overallTone === "warn"
        ? "warn"
        : "ok";

  const tone =
    finalToneKey === "ok"
      ? { text: "text-emerald-300/90", ring: "#6ee7b7", dot: "bg-emerald-400" }
      : finalToneKey === "warn"
        ? { text: "text-amber-300/95", ring: "#fcd34d", dot: "bg-amber-300" }
        : { text: "text-rose-400", ring: "#fb7185", dot: "bg-rose-400" };

  // Section overrun is the strongest "needs attention now" signal — use it to
  // drive the pulse on the readout, in addition to the existing overall-overrun
  // pulse.
  const pulseReadout = over || sectionDeltaTone === "bad";

  // Section indicator copy ("▸ in the wild +0:45")
  const sectionDeltaText = (() => {
    if (!sections || activeSectionIdx === null) return null;
    if (sectionOverrunSec <= 0) return null;
    const om = String(Math.floor(sectionOverrunSec / 60)).padStart(2, "0");
    const os = String(sectionOverrunSec % 60).padStart(2, "0");
    return `+${om}:${os}`;
  })();

  const radius = 13;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  function togglePaused() {
    if (paused) {
      // resuming: start a fresh window from now
      startRef.current = Date.now();
      setPaused(false);
    } else {
      // pausing: bank the elapsed delta
      accumulatedRef.current += Date.now() - startRef.current;
      setPaused(true);
    }
  }

  function reset() {
    startRef.current = Date.now();
    accumulatedRef.current = 0;
    setSeconds(0);
  }

  const titleParts = [
    `Presentation timer · target ${resolvedTargetMinutes} min`,
  ];
  if (sectionLabel) {
    titleParts.push(`section: ${sectionLabel}`);
    if (sectionDeltaText) titleParts.push(`overrun: ${sectionDeltaText}`);
  }
  if (paused) titleParts.push("paused");

  return (
    <div
      // Sits to the right of the FeedbackWidget (which owns bottom-6 left-6,
      // w-10 = 40px + 16px gap = start at left-20). ScrollNarrator claims
      // bottom-6 right-6, so both corners stay balanced.
      className="fixed bottom-6 left-20 z-[90] print-hidden select-none"
      data-no-cursor
    >
      <div
        className={`group flex items-center gap-3 rounded-full bg-bg-dark/85 backdrop-blur-xl border border-white/10 pl-2 pr-3 py-1.5 shadow-2xl font-mono transition-colors ${
          finalToneKey === "bad"
            ? "border-rose-400/40"
            : finalToneKey === "warn"
              ? "border-amber-300/30"
              : ""
        }`}
        title={titleParts.join(" · ")}
      >
        {/* Progress ring */}
        <div className="relative w-8 h-8 shrink-0">
          <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32" aria-hidden="true">
            <circle
              cx="16"
              cy="16"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="2"
            />
            <circle
              cx="16"
              cy="16"
              r={radius}
              fill="none"
              stroke={tone.ring}
              strokeWidth="2"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{
                transition: "stroke-dashoffset 400ms linear, stroke 600ms ease",
              }}
            />
          </svg>
          {/* Heartbeat dot — subtle "time is passing" signal */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={`w-1 h-1 rounded-full ${tone.dot} ${paused ? "opacity-40" : "animate-pulse"}`}
            />
          </div>
        </div>

        {/* Readout */}
        <div
          className={`text-sm tabular-nums tracking-tight ${tone.text} ${pulseReadout ? "animate-pulse" : ""}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {mm}:{ss}
        </div>

        {/* Target label — fades out on hover to make room for controls */}
        <div className="text-[10px] text-white/35 uppercase tracking-[0.2em] transition-opacity group-hover:opacity-0">
          / {resolvedTargetMinutes}m
        </div>

        {/* Section indicator — present only when sections is provided.
            Sits between the target label and the controls; fades out on
            hover so the play/reset buttons can take its place. */}
        {sectionLabel && (
          <div
            className="hidden sm:flex items-center gap-1.5 ps-2 ms-1 border-s border-white/10 transition-opacity group-hover:opacity-0 max-w-[14ch] truncate"
            aria-live="polite"
          >
            <span className="text-white/30 text-[10px]">▸</span>
            <span
              className={`text-[10px] uppercase tracking-[0.15em] truncate ${
                sectionDeltaTone === "bad"
                  ? "text-rose-300"
                  : sectionDeltaTone === "warn"
                    ? "text-amber-300"
                    : "text-white/55"
              }`}
              title={sectionLabel}
            >
              {sectionLabel}
            </span>
            {sectionDeltaText && (
              <span
                className={`text-[10px] tabular-nums font-semibold ${
                  sectionDeltaTone === "bad"
                    ? "text-rose-400 animate-pulse"
                    : "text-amber-300"
                }`}
              >
                {sectionDeltaText}
              </span>
            )}
          </div>
        )}

        {/* Controls — only visible on hover. Absolutely positioned so they
            occupy the label's footprint without reflowing the pill. */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
          <button
            type="button"
            onClick={togglePaused}
            aria-label={paused ? "Resume timer" : "Pause timer"}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white flex items-center justify-center transition-colors"
          >
            {paused ? (
              <Play className="w-3 h-3" />
            ) : (
              <Pause className="w-3 h-3" />
            )}
          </button>
          <button
            type="button"
            onClick={reset}
            aria-label="Reset timer"
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white flex items-center justify-center transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
