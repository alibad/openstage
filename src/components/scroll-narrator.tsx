"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Loader2,
  ChevronDown,
  ChevronUp,
  Mic,
  X,
} from "lucide-react";

export interface NarrationSection {
  /** Must match the section element's `id` attribute */
  sectionId: string;
  /** Human-readable label shown in the player */
  label: string;
  /** Text to narrate via TTS */
  text: string;
}

interface ScrollNarratorProps {
  sections: NarrationSection[];
  voice?: string;
  /** Hide the narrator entirely (e.g. in print mode) */
  hidden?: boolean;
}

type PlayerState = "idle" | "loading" | "playing" | "paused";

/**
 * Fires the narrator open from anywhere in the app. Picked up by any
 * mounted `<ScrollNarrator>` instance — un-dismisses and expands it.
 * Used by `<DeckControls>` so the consolidated control bar can reveal
 * the narrator without needing prop wiring through the deck.
 */
export const NARRATOR_OPEN_EVENT = "deck-open-narrator";

export function openScrollNarrator() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NARRATOR_OPEN_EVENT));
}

export function ScrollNarrator({
  sections,
  voice = "nova",
  hidden = false,
}: ScrollNarratorProps) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>("idle");
  const [autoPlay, setAutoPlay] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onOpen = () => {
      setDismissed(false);
      setExpanded(true);
    };
    window.addEventListener(NARRATOR_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(NARRATOR_OPEN_EVENT, onOpen);
  }, []);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Map<string, string>>(new Map());
  const autoPlayRef = useRef(autoPlay);
  autoPlayRef.current = autoPlay;

  const sectionIndex = useMemo(
    () => sections.findIndex((s) => s.sectionId === activeSectionId),
    [sections, activeSectionId],
  );

  const activeSection = sectionIndex >= 0 ? sections[sectionIndex] : null;

  // Track which section is in view
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    for (const section of sections) {
      const el = document.getElementById(section.sectionId);
      if (!el) continue;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSectionId(section.sectionId);
          }
        },
        { rootMargin: "-30% 0px -30% 0px", threshold: 0 },
      );

      observer.observe(el);
      observers.push(observer);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  // Stop audio when section changes
  useEffect(() => {
    if (audioRef.current && playerState === "playing") {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setPlayerState("idle");

      // Auto-play next section if enabled
      if (autoPlayRef.current && activeSectionId) {
        const idx = sections.findIndex((s) => s.sectionId === activeSectionId);
        if (idx >= 0) {
          requestAnimationFrame(() => playSection(activeSectionId));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSectionId]);

  const playSection = useCallback(
    async (sectionId: string) => {
      const section = sections.find((s) => s.sectionId === sectionId);
      if (!section) return;

      // Resume if paused on same section
      if (playerState === "paused" && audioRef.current) {
        audioRef.current.play();
        setPlayerState("playing");
        return;
      }

      // Use cache if available
      const cached = cacheRef.current.get(sectionId);
      if (cached) {
        const audio = new Audio(cached);
        audioRef.current = audio;
        audio.onended = () => {
          setPlayerState("idle");
          if (autoPlayRef.current) advanceToNext(sectionId);
        };
        audio.play();
        setPlayerState("playing");
        return;
      }

      setPlayerState("loading");
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: section.text, voice }),
        });
        if (!res.ok) throw new Error("TTS request failed");
        const { audio: src } = await res.json();
        cacheRef.current.set(sectionId, src);

        const audio = new Audio(src);
        audioRef.current = audio;
        audio.onended = () => {
          setPlayerState("idle");
          if (autoPlayRef.current) advanceToNext(sectionId);
        };
        audio.play();
        setPlayerState("playing");
      } catch (err) {
        console.error("Scroll narration failed:", err);
        setPlayerState("idle");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sections, voice, playerState],
  );

  const advanceToNext = useCallback(
    (currentId: string) => {
      const idx = sections.findIndex((s) => s.sectionId === currentId);
      if (idx < sections.length - 1) {
        const nextSection = sections[idx + 1];
        const el = document.getElementById(nextSection.sectionId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    },
    [sections],
  );

  const handlePlayPause = useCallback(() => {
    if (!activeSectionId) return;

    if (playerState === "playing") {
      audioRef.current?.pause();
      setPlayerState("paused");
      return;
    }

    playSection(activeSectionId);
  }, [activeSectionId, playerState, playSection]);

  const handleSkip = useCallback(
    (direction: -1 | 1) => {
      const targetIdx = sectionIndex + direction;
      if (targetIdx < 0 || targetIdx >= sections.length) return;

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
        setPlayerState("idle");
      }

      const target = sections[targetIdx];
      const el = document.getElementById(target.sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [sectionIndex, sections],
  );

  const handleToggleAutoPlay = useCallback(() => {
    setAutoPlay((v) => !v);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  if (hidden || dismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[90] print-hidden">
      <AnimatePresence mode="wait">
        {expanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-72 rounded-2xl bg-bg-dark/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Mic className="w-3.5 h-3.5 text-spectrum-cyan" />
                <span className="text-xs font-medium text-white/80">
                  Narrator
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setExpanded(false)}
                  className="p-1 rounded-md text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.pause();
                      audioRef.current = null;
                    }
                    setDismissed(true);
                  }}
                  className="p-1 rounded-md text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Current section */}
            <div className="px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">
                Section {sectionIndex + 1} of {sections.length}
              </p>
              <p className="text-sm font-medium text-white/90 leading-snug truncate">
                {activeSection?.label ?? "Scroll to a section"}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2 px-4 pb-3">
              <button
                onClick={() => handleSkip(-1)}
                disabled={sectionIndex <= 0}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  sectionIndex <= 0
                    ? "text-white/10 cursor-not-allowed"
                    : "text-white/50 hover:text-white hover:bg-white/5",
                )}
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={handlePlayPause}
                disabled={!activeSection || playerState === "loading"}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  playerState === "playing"
                    ? "bg-spectrum-cyan text-white shadow-lg shadow-spectrum-cyan/30"
                    : playerState === "loading"
                      ? "bg-white/10 text-spectrum-purple"
                      : "bg-white/10 text-white hover:bg-white/15",
                )}
              >
                {playerState === "loading" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : playerState === "playing" ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </button>

              <button
                onClick={() => handleSkip(1)}
                disabled={sectionIndex >= sections.length - 1}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  sectionIndex >= sections.length - 1
                    ? "text-white/10 cursor-not-allowed"
                    : "text-white/50 hover:text-white hover:bg-white/5",
                )}
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Auto-play toggle */}
            <div className="px-4 pb-3">
              <button
                onClick={handleToggleAutoPlay}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors",
                  autoPlay
                    ? "bg-spectrum-cyan/10 text-spectrum-cyan border border-spectrum-cyan/20"
                    : "bg-white/5 text-white/40 hover:text-white/60 border border-white/5",
                )}
              >
                <span>Auto-play sections</span>
                <div
                  className={cn(
                    "w-7 h-4 rounded-full transition-colors relative",
                    autoPlay ? "bg-spectrum-cyan" : "bg-white/20",
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform",
                      autoPlay ? "translate-x-3.5" : "translate-x-0.5",
                    )}
                  />
                </div>
              </button>
            </div>

            {/* Section list */}
            <div className="max-h-48 overflow-y-auto border-t border-white/5">
              {sections.map((s, i) => {
                const isCurrent = s.sectionId === activeSectionId;
                return (
                  <button
                    key={s.sectionId}
                    onClick={() => {
                      const el = document.getElementById(s.sectionId);
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors",
                      isCurrent
                        ? "bg-white/5 text-white"
                        : "text-white/40 hover:text-white/70 hover:bg-white/3",
                    )}
                  >
                    <span
                      className={cn(
                        "shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono",
                        isCurrent
                          ? "bg-spectrum-cyan text-white"
                          : "bg-white/10 text-white/40",
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="text-xs truncate">{s.label}</span>
                    {isCurrent && playerState === "playing" && (
                      <Volume2 className="w-3 h-3 text-spectrum-cyan ml-auto shrink-0 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={() => setExpanded(true)}
            className={cn(
              "group relative w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg",
              playerState === "playing"
                ? "bg-spectrum-cyan text-white shadow-spectrum-cyan/30"
                : "bg-bg-dark/90 backdrop-blur-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20",
            )}
          >
            {playerState === "loading" ? (
              <Loader2 className="w-5 h-5 animate-spin text-spectrum-purple" />
            ) : playerState === "playing" ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
            {playerState === "playing" && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-spectrum-cyan animate-ping" />
            )}
            <span className="absolute right-full mr-3 px-2.5 py-1 rounded-lg bg-bg-dark/95 border border-white/10 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {playerState === "playing"
                ? activeSection?.label ?? "Playing"
                : "Narrator"}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
