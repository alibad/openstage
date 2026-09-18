"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Presentation } from "@/lib/types";
import { cn } from "@/lib/cn";
import { ProgressBar } from "./progress-bar";
import { SlideControls } from "./slide-controls";
import { SlideOverview } from "./slide-overview";
import { MessageSquare, X, User, Loader2 } from "lucide-react";
import type { NarrationState } from "./slide-controls";
import { exportSlidesToPptx } from "@/lib/pptx-export";
import { captureSlideImages } from "@/lib/video-export";
import { VideoExportModal } from "./video-export-modal";
import { useFeedbackStore } from "@/lib/stores/feedbackStore";
import { ease, duration } from "@/lib/motion";
import type { SlideTransition as SlideTransitionType } from "@/lib/types";
import type { Variants, Transition } from "framer-motion";

function waitForRerender(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => setTimeout(resolve, 100));
  });
}

// Apple-level polish: all transitions run simultaneously (mode="sync" on AnimatePresence).
// The old slide exits while the new one enters — no pause between them.
// Spring physics on `slide` give a physical, lived-in feel. All other variants use
// symmetric inOut easings so the two planes move as one continuous gesture.

const slideVariantMap: Record<SlideTransitionType, Variants> = {
  // Default: natural horizontal push. The new slide covers the old one from the
  // side, both planes moving together. Spring stiffness/damping tuned to feel
  // snappy but not abrupt — same register as iOS navigation.
  slide: {
    enter: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? 48 : -48,
      scale: 0.97,
      filter: "blur(0px)",
    }),
    center: { opacity: 1, x: 0, scale: 1, filter: "blur(0px)" },
    exit: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? -48 : 48,
      scale: 0.97,
      filter: "blur(0px)",
    }),
  },

  // Elegant cross-dissolve with a whisper of depth (scale 0.98→1).
  // inOutQuart gives symmetric acceleration so both opacity curves feel matched.
  fade: {
    enter: { opacity: 0, x: 0, scale: 0.98, filter: "blur(0px)" },
    center: { opacity: 1, x: 0, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, x: 0, scale: 0.98, filter: "blur(0px)" },
  },

  // Focus shift: feels like the lens rack-focusing to a new subject.
  // Reduced blur (10px) and a gentle y-drift give directionality.
  blur: {
    enter: { opacity: 0, filter: "blur(10px)", scale: 1.015, y: 8, x: 0 },
    center: { opacity: 1, filter: "blur(0px)", scale: 1, y: 0, x: 0 },
    exit: { opacity: 0, filter: "blur(10px)", scale: 0.985, y: -8, x: 0 },
  },

  // Subtle zoom — feels like the camera pushing in. Tight scale range (1.05/0.97)
  // keeps it cinematic without being jarring. Soft blur on enter/exit smooths edges.
  zoom: {
    enter: (direction: number) => ({
      opacity: 0,
      scale: direction > 0 ? 1.05 : 0.96,
      filter: "blur(4px)",
      x: 0,
      y: 0,
    }),
    center: { opacity: 1, scale: 1, filter: "blur(0px)", x: 0, y: 0 },
    exit: (direction: number) => ({
      opacity: 0,
      scale: direction > 0 ? 0.96 : 1.05,
      filter: "blur(4px)",
      x: 0,
      y: 0,
    }),
  },

  // Directional curtain wipe. Now direction-aware: forward = wipe from right,
  // backward = wipe from left. Feels deliberate and theatrical.
  mask: {
    enter: (direction: number) => ({
      opacity: 1,
      clipPath: direction > 0 ? "inset(0 100% 0 0 round 4px)" : "inset(0 0 0 100% round 4px)",
      x: 0,
      scale: 1,
      filter: "blur(0px)",
    }),
    center: {
      opacity: 1,
      clipPath: "inset(0 0% 0 0% round 4px)",
      x: 0,
      scale: 1,
      filter: "blur(0px)",
    },
    exit: (direction: number) => ({
      opacity: 1,
      clipPath: direction > 0 ? "inset(0 0 0 100% round 4px)" : "inset(0 100% 0 0 round 4px)",
      x: 0,
      scale: 1,
      filter: "blur(0px)",
    }),
  },

  none: {
    enter: { opacity: 1, x: 0, scale: 1, filter: "blur(0px)" },
    center: { opacity: 1, x: 0, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 1, x: 0, scale: 1, filter: "blur(0px)" },
  },
};

const slideTransitionMap: Record<SlideTransitionType, Transition> = {
  // Spring physics: feels physical and alive, not mechanical.
  // stiffness 300 / damping 28 → snappy but settled, ~350ms effective duration.
  slide: { type: "spring", stiffness: 300, damping: 28, restDelta: 0.001 },

  // Symmetric ease for a clean, confident dissolve.
  fade: { duration: 0.38, ease: ease.inOutQuart },

  // Slightly longer so the blur "travel" feels intentional.
  blur: { duration: 0.5, ease: ease.outExpo },

  // Tight zoom — outExpo gives a satisfying snap to center.
  zoom: { duration: 0.48, ease: ease.outExpo },

  // inOutExpo: slow start + slow end gives the curtain theatrical weight.
  mask: { duration: 0.6, ease: ease.inOutExpo },

  none: { duration: 0 },
};

interface SlideDeckProps {
  presentation: Presentation;
}

export function SlideDeck({ presentation }: SlideDeckProps) {
  const router = useRouter();
  const { slides } = presentation;
  const [[currentIndex, direction], setPage] = useState([0, 0]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState("");
  const [isCapturingVideo, setIsCapturingVideo] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [capturedSlideImages, setCapturedSlideImages] = useState<string[]>([]);
  const [narrationState, setNarrationState] = useState<NarrationState>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<Map<number, string>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const slideContentRef = useRef<HTMLDivElement>(null);
  const currentSlide = slides[currentIndex];

  useEffect(() => {
    useFeedbackStore.getState().setHideTrigger(true);
    return () => useFeedbackStore.getState().setHideTrigger(false);
  }, []);

  const stopNarration = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setNarrationState("idle");
  }, []);

  useEffect(() => {
    stopNarration();
  }, [currentIndex, stopNarration]);

  const handleNarrate = useCallback(async () => {
    const notes = slides[currentIndex].notes;
    if (!notes) return;

    if (narrationState === "playing") {
      audioRef.current?.pause();
      setNarrationState("paused");
      return;
    }

    if (narrationState === "paused" && audioRef.current) {
      audioRef.current.play();
      setNarrationState("playing");
      return;
    }

    const cached = audioCacheRef.current.get(currentIndex);
    if (cached) {
      const audio = new Audio(cached);
      audioRef.current = audio;
      audio.onended = () => setNarrationState("idle");
      audio.play();
      setNarrationState("playing");
      return;
    }

    setNarrationState("loading");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: notes, voice: "nova" }),
      });
      if (!res.ok) throw new Error("TTS request failed");
      const { audio: src } = await res.json();
      audioCacheRef.current.set(currentIndex, src);

      const audio = new Audio(src);
      audioRef.current = audio;
      audio.onended = () => setNarrationState("idle");
      audio.play();
      setNarrationState("playing");
    } catch (err) {
      console.error("Narration failed:", err);
      setNarrationState("idle");
    }
  }, [currentIndex, narrationState, slides]);

  const paginate = useCallback(
    (newDirection: number) => {
      const next = currentIndex + newDirection;
      if (next >= 0 && next < slides.length) {
        setPage([next, newDirection]);
      }
    },
    [currentIndex, slides.length],
  );

  const goToSlide = useCallback((index: number) => {
    setPage((prev) => [index, index > prev[0] ? 1 : -1]);
    setShowOverview(false);
  }, []);

  const goToSlideInstant = useCallback((index: number) => {
    setPage([index, 0]);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleExit = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    router.push("/");
  }, [router]);

  const [exportError, setExportError] = useState<string | null>(null);

  const handleExportPptx = useCallback(async () => {
    if (isExporting || !slideContentRef.current) return;

    const originalIndex = currentIndex;
    setIsExporting(true);
    setExportError(null);

    await waitForRerender();

    try {
      await exportSlidesToPptx(
        presentation,
        slideContentRef.current!,
        goToSlideInstant,
        {
          onProgress: (msg) => {
            setExportProgress(msg);
          },
          onError: (msg) => {
            setExportError(msg);
          },
        },
        isDark,
      );
    } catch (err) {
      console.error("PPTX export failed:", err);
      setExportError(
        err instanceof Error ? err.message : "Export failed unexpectedly",
      );
    } finally {
      goToSlideInstant(originalIndex);
      setIsExporting(false);
      setExportProgress("");
    }
  }, [isExporting, currentIndex, presentation, goToSlideInstant, isDark]);

  const handleExportVideo = useCallback(async () => {
    if (isCapturingVideo || isExporting || !slideContentRef.current) return;

    const originalIndex = currentIndex;
    setIsCapturingVideo(true);
    setIsExporting(true);

    await waitForRerender();

    try {
      const images = await captureSlideImages(
        slides,
        slideContentRef.current!,
        goToSlideInstant,
        {
          onProgress: (msg) => {
            setExportProgress(msg);
          },
        },
        isDark,
      );
      setCapturedSlideImages(images);
      setShowVideoModal(true);
    } catch (err) {
      console.error("Video capture failed:", err);
    } finally {
      goToSlideInstant(originalIndex);
      setIsCapturingVideo(false);
      setIsExporting(false);
      setExportProgress("");
    }
  }, [isCapturingVideo, isExporting, currentIndex, slides, goToSlideInstant, isDark]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isExporting) return;

      if (showOverview && e.key === "Escape") {
        setShowOverview(false);
        return;
      }

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case " ":
          e.preventDefault();
          paginate(1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          paginate(-1);
          break;
        case "Home":
          e.preventDefault();
          goToSlide(0);
          break;
        case "End":
          e.preventDefault();
          goToSlide(slides.length - 1);
          break;
        case "f":
          toggleFullscreen();
          break;
        case "g":
          setShowOverview((prev) => !prev);
          break;
        case "n":
          setShowNotes((prev) => !prev);
          break;
        case "d":
          // Was `t` historically — moved to `d` to free up `T` /
          // `Shift+T` for `BrandProvider`'s preset cycler. Both
          // listeners are bound at `window` so they used to fire
          // together on `t`, toggling dark mode AND cycling the brand
          // on every press.
          setIsDark((prev) => !prev);
          break;
        case "v":
          handleNarrate();
          break;
        case "Escape":
          if (isFullscreen) {
            document.exitFullscreen();
          } else {
            handleExit();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    paginate,
    goToSlide,
    toggleFullscreen,
    showOverview,
    isFullscreen,
    isExporting,
    slides.length,
    showNotes,
    handleNarrate,
    handleExit,
  ]);

  return (
    <div
      ref={containerRef}
      className={cn(
        isDark && "slide-dark",
        "relative w-screen h-screen overflow-hidden select-none bg-background",
      )}
    >
      <ProgressBar current={currentIndex} total={slides.length} />

      {!isExporting && (
        <button
          onClick={handleExit}
          className="fixed top-4 right-4 z-50 p-2 rounded-full bg-surface/70 backdrop-blur-sm border border-border/50 text-muted hover:text-foreground hover:bg-surface hover:border-border transition-colors"
          title="Exit to gallery (Esc)"
          aria-label="Exit presentation"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Slide content — during export, render without AnimatePresence for instant capture */}
      {isExporting ? (
        <div
          className="absolute inset-0 flex items-center justify-center"
          data-mood={slides[currentIndex].mood}
        >
          <div
            ref={slideContentRef}
            className="w-full h-full mx-auto flex flex-col justify-center slide-gradient max-w-[1200px] px-16 py-20"
          >
            {slides[currentIndex].content}
          </div>
        </div>
      ) : (
        <AnimatePresence initial={false} custom={direction} mode="sync">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={
              slideVariantMap[slides[currentIndex].transition ?? "slide"]
            }
            initial="enter"
            animate="center"
            exit="exit"
            transition={
              slideTransitionMap[slides[currentIndex].transition ?? "slide"]
            }
            data-mood={slides[currentIndex].mood}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div
              ref={slideContentRef}
              className="w-full h-full mx-auto flex flex-col justify-center slide-gradient max-w-[1200px] px-16 py-20"
            >
              {slides[currentIndex].content}
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Export progress overlay */}
      {isExporting && (
        <div className="absolute inset-0 z-[200] bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-border bg-surface/90 shadow-2xl">
            <Loader2 className="w-8 h-8 text-spectrum-purple animate-spin" />
            <p className="text-sm font-medium text-foreground">
              {isCapturingVideo ? "Capturing slides for video" : "Exporting to PowerPoint"}
            </p>
            <p className="text-xs text-muted">{exportProgress}</p>
          </div>
        </div>
      )}

      {/* Export error toast */}
      {exportError && !isExporting && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] max-w-md">
          <div className="flex items-start gap-3 px-5 py-4 rounded-xl border border-red-500/30 bg-red-950/90 backdrop-blur-md shadow-2xl">
            <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-200">Export failed</p>
              <p className="text-xs text-red-300/80 mt-1 break-words">{exportError}</p>
            </div>
            <button
              onClick={() => setExportError(null)}
              className="shrink-0 p-1 rounded text-red-400 hover:text-red-200 hover:bg-red-900/50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Click zones for navigation */}
      {!isExporting && (
        <>
          <div
            className="absolute left-0 top-0 w-1/4 h-full cursor-w-resize z-10"
            onClick={() => paginate(-1)}
          />
          <div
            className="absolute right-0 top-0 w-1/4 h-full cursor-e-resize z-10"
            onClick={() => paginate(1)}
          />
        </>
      )}

      {/* Speaker badge */}
      {currentSlide.speaker && !isExporting && (
        <div className="fixed top-5 right-6 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-surface/80 backdrop-blur-sm">
          <User className="w-3 h-3 text-muted" />
          <span className="text-xs font-medium text-muted">
            {currentSlide.speaker}
          </span>
        </div>
      )}

      {/* Speaker notes panel */}
      <AnimatePresence>
        {showNotes &&
          !isExporting &&
          (currentSlide.notes || currentSlide.speaker) && (
          <motion.div
            className="fixed bottom-[52px] left-0 right-0 z-40 backdrop-blur-md border-t shadow-lg bg-surface/95 border-border/60"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: duration.fast, ease: ease.outQuart }}
          >
            <div className="max-w-[1200px] mx-auto px-8 py-4 flex items-start gap-4">
              <div className="flex items-center gap-2 shrink-0 pt-0.5">
                <MessageSquare className="w-4 h-4 text-spectrum-purple" />
                {currentSlide.speaker && (
                  <span className="text-xs font-semibold uppercase tracking-wider spectrum-gradient-text">
                    {currentSlide.speaker}
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed flex-1 text-muted">
                {currentSlide.notes || "No speaker notes for this slide."}
              </p>
              <button
                onClick={() => setShowNotes(false)}
                className="shrink-0 p-1 rounded transition-colors text-muted hover:text-foreground hover:bg-border/30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generic footer branding */}
      {!isExporting && (
        <div className="fixed bottom-[52px] left-0 right-0 z-30 flex items-center justify-between px-6 py-2">
          <span className="spectrum-gradient-text text-sm font-semibold tracking-wide">
            presenter
          </span>
          <span className="text-[11px] text-muted/60">
            {currentIndex + 1}
          </span>
        </div>
      )}

      {!isExporting && (
        <SlideControls
          current={currentIndex}
          total={slides.length}
          isFullscreen={isFullscreen}
          showNotes={showNotes}
          hasNotes={!!(currentSlide.notes || currentSlide.speaker)}
          isDark={isDark}
          narrationState={narrationState}
          onNarrate={currentSlide.notes ? handleNarrate : undefined}
          onPrev={() => paginate(-1)}
          onNext={() => paginate(1)}
          onToggleFullscreen={toggleFullscreen}
          onShowOverview={() => setShowOverview(true)}
          onToggleNotes={() => setShowNotes((prev) => !prev)}
          onToggleTheme={() => setIsDark((prev) => !prev)}
          onExportPptx={handleExportPptx}
          onExportVideo={handleExportVideo}
          isCapturingVideo={isCapturingVideo}
        />
      )}

      <VideoExportModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        slideImages={capturedSlideImages}
        slideNotes={slides.map((s) => s.notes)}
        presentationSlug={presentation.slug}
      />

      <SlideOverview
        slides={slides}
        current={currentIndex}
        isOpen={showOverview && !isExporting}
        onSelect={goToSlide}
        onClose={() => setShowOverview(false)}
      />
    </div>
  );
}
