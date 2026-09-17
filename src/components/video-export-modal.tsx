"use client";

import { useState, useMemo, useCallback, useRef, lazy, Suspense } from "react";
import {
  X,
  Minus,
  Plus,
  Terminal,
  Loader2,
  Video,
  Mic,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Pencil,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Download,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlideVideo,
  calculateTotalFrames,
  type SlideVideoProps,
} from "../../remotion/SlideVideo";
import {
  generateNarration,
  previewVoice,
  type NarrationResult,
} from "@/lib/video-export";
import { cn } from "@/lib/cn";

const Player = lazy(() =>
  import("@remotion/player").then((mod) => ({ default: mod.Player })),
);

const VOICES = [
  { id: "nova", label: "Nova", desc: "Warm, conversational" },
  { id: "alloy", label: "Alloy", desc: "Neutral, balanced" },
  { id: "echo", label: "Echo", desc: "Clear, articulate" },
  { id: "fable", label: "Fable", desc: "Expressive, dynamic" },
  { id: "onyx", label: "Onyx", desc: "Deep, authoritative" },
  { id: "shimmer", label: "Shimmer", desc: "Bright, engaging" },
] as const;

interface VideoExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  slideImages: string[];
  slideNotes: (string | undefined)[];
  presentationSlug: string;
}

export function VideoExportModal({
  isOpen,
  onClose,
  slideImages,
  slideNotes,
  presentationSlug,
}: VideoExportModalProps) {
  const [durationPerSlide, setDurationPerSlide] = useState(5);
  const [transitionDuration, setTransitionDuration] = useState(0.5);

  // Narration state
  const [selectedVoice, setSelectedVoice] = useState("nova");
  const [narration, setNarration] = useState<NarrationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [narrationProgress, setNarrationProgress] = useState("");
  const [narrationError, setNarrationError] = useState<string | null>(null);
  const [narrationEnabled, setNarrationEnabled] = useState(true);
  const [showNarrationPanel, setShowNarrationPanel] = useState(false);

  // Script editing
  const [editedNotes, setEditedNotes] = useState<(string | undefined)[]>([]);
  const [editingSlideIdx, setEditingSlideIdx] = useState<number | null>(null);

  // Voice preview
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Server-side render state
  const [renderState, setRenderState] = useState<
    "idle" | "rendering" | "downloading" | "done" | "error"
  >("idle");
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderMessage, setRenderMessage] = useState("");
  const [renderError, setRenderError] = useState<string | null>(null);
  const renderAbortRef = useRef<AbortController | null>(null);

  const fps = 30;
  const hasNotes = slideNotes.some((n) => !!n);
  const activeNotes = editedNotes.length > 0 ? editedNotes : slideNotes;

  const slideDurations = useMemo(() => {
    if (!narration || !narrationEnabled) return undefined;
    const padding = 1.5;
    return narration.durations.map((audioDur) =>
      audioDur > 0
        ? Math.max(durationPerSlide, audioDur + padding)
        : durationPerSlide,
    );
  }, [narration, narrationEnabled, durationPerSlide]);

  const totalFrames = useMemo(
    () =>
      calculateTotalFrames(
        slideImages.length,
        durationPerSlide,
        transitionDuration,
        fps,
        slideDurations,
      ),
    [slideImages.length, durationPerSlide, transitionDuration, slideDurations],
  );

  const totalSeconds = (totalFrames / fps).toFixed(1);

  const inputProps: SlideVideoProps = useMemo(
    () => ({
      slides: slideImages,
      audioSegments:
        narration && narrationEnabled ? narration.audioSegments : undefined,
      slideDurations,
      durationPerSlide,
      transitionDuration,
    }),
    [
      slideImages,
      narration,
      narrationEnabled,
      slideDurations,
      durationPerSlide,
      transitionDuration,
    ],
  );

  // Initialize edited notes from slide notes on first open
  const initNotes = useCallback(() => {
    if (editedNotes.length === 0) {
      setEditedNotes([...slideNotes]);
    }
  }, [editedNotes.length, slideNotes]);

  const handlePreviewVoice = useCallback(
    async (voiceId: string) => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }

      if (playingVoice === voiceId) {
        setPlayingVoice(null);
        return;
      }

      setPreviewingVoice(voiceId);
      setPlayingVoice(null);

      const audioUrl = await previewVoice(voiceId);
      setPreviewingVoice(null);

      if (!audioUrl) {
        setNarrationError("Voice preview failed. Check your API key.");
        return;
      }

      setNarrationError(null);
      const audio = new Audio(audioUrl);
      previewAudioRef.current = audio;
      setPlayingVoice(voiceId);

      audio.addEventListener("ended", () => {
        setPlayingVoice(null);
        previewAudioRef.current = null;
      });

      audio.play();
    },
    [playingVoice],
  );

  const handleGenerateNarration = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setNarrationProgress("Starting...");
    setNarrationError(null);

    const notes = editedNotes.length > 0 ? editedNotes : slideNotes;

    try {
      const result = await generateNarration(notes, selectedVoice, {
        onProgress: (msg) => setNarrationProgress(msg),
      });

      const hasAudio = result.audioSegments.some(Boolean);
      if (!hasAudio) {
        setNarrationError(
          "No audio generated. Add OPENAI_API_KEY to .env.local to enable TTS.",
        );
        return;
      }

      setNarration(result);
      setNarrationEnabled(true);
    } catch (err) {
      console.error("Narration generation failed:", err);
      setNarrationError("Failed to generate narration. Check console for details.");
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, editedNotes, slideNotes, selectedVoice]);

  const handleUpdateNote = useCallback(
    (idx: number, text: string) => {
      setEditedNotes((prev) => {
        const copy = prev.length > 0 ? [...prev] : [...slideNotes];
        copy[idx] = text || undefined;
        return copy;
      });
    },
    [slideNotes],
  );

  const handleDownloadMp4 = useCallback(async () => {
    if (renderState === "rendering" || renderState === "downloading") return;

    setRenderState("rendering");
    setRenderProgress(0);
    setRenderMessage("Starting render...");
    setRenderError(null);

    const abort = new AbortController();
    renderAbortRef.current = abort;

    try {
      const response = await fetch("/api/video/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slides: slideImages,
          audioSegments:
            narration && narrationEnabled ? narration.audioSegments : undefined,
          slideDurations,
          durationPerSlide,
          transitionDuration,
          slug: presentationSlug,
        }),
        signal: abort.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server returned ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let jobId = "";
      let downloadSlug = presentationSlug;
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const lines = part.split("\n");
          let eventName = "";
          let eventData = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) eventName = line.slice(7);
            else if (line.startsWith("data: ")) eventData = line.slice(6);
          }
          if (!eventName || !eventData) continue;

          try {
            const data = JSON.parse(eventData);
            if (eventName === "progress") {
              setRenderMessage(data.message || "Rendering...");
              if (data.progress !== undefined) {
                setRenderProgress(data.progress);
              }
            } else if (eventName === "done") {
              jobId = data.jobId;
              downloadSlug = data.slug || presentationSlug;
            } else if (eventName === "error") {
              throw new Error(data.message);
            }
          } catch (parseErr) {
            if (
              parseErr instanceof Error &&
              parseErr.message !== "Unexpected end of JSON input"
            ) {
              throw parseErr;
            }
          }
        }
      }

      if (!jobId) throw new Error("Render completed but no download ID received");

      setRenderState("downloading");
      setRenderMessage("Downloading MP4...");

      const mp4 = await fetch(
        `/api/video/render?id=${jobId}&slug=${encodeURIComponent(downloadSlug)}`,
        { signal: abort.signal },
      );
      if (!mp4.ok) throw new Error("Failed to download rendered video");

      const blob = await mp4.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${downloadSlug}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setRenderState("done");
      setTimeout(() => setRenderState("idle"), 4000);
    } catch (err) {
      if (abort.signal.aborted) return;
      setRenderError(
        err instanceof Error ? err.message : "Render failed unexpectedly",
      );
      setRenderState("error");
    } finally {
      renderAbortRef.current = null;
    }
  }, [
    renderState,
    slideImages,
    narration,
    narrationEnabled,
    slideDurations,
    durationPerSlide,
    transitionDuration,
    presentationSlug,
  ]);

  const handleCancelRender = useCallback(() => {
    renderAbortRef.current?.abort();
    setRenderState("idle");
    setRenderProgress(0);
    setRenderMessage("");
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="slide-dark relative w-full max-w-5xl mx-4 bg-bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-3/15">
                  <Video className="w-4 h-4 text-brand-3" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Video Preview
                  </h2>
                  <p className="text-sm text-muted">
                    {slideImages.length} slides &middot; {totalSeconds}s total
                    {narration && narrationEnabled && " \u00b7 narrated"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-border/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Player */}
            <div className="px-6 py-4">
              <div className="rounded-xl overflow-hidden bg-black">
                <Suspense
                  fallback={
                    <div
                      className="flex items-center justify-center bg-black"
                      style={{ aspectRatio: "16/9" }}
                    >
                      <Loader2 className="w-8 h-8 text-muted animate-spin" />
                    </div>
                  }
                >
                  <Player
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    component={SlideVideo as any}
                    inputProps={inputProps}
                    durationInFrames={Math.max(totalFrames, 1)}
                    fps={fps}
                    compositionWidth={1920}
                    compositionHeight={1080}
                    style={{ width: "100%", aspectRatio: "16/9" }}
                    controls
                    autoPlay={false}
                    clickToPlay
                  />
                </Suspense>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-4 px-6 py-4 border-t border-border">
              {/* Timing row */}
              <div className="flex items-center gap-6">
                <TimingControl
                  label="Per slide"
                  value={`${durationPerSlide}s`}
                  onDecrement={() => setDurationPerSlide((d) => Math.max(2, d - 1))}
                  onIncrement={() => setDurationPerSlide((d) => Math.min(15, d + 1))}
                />
                <TimingControl
                  label="Transition"
                  value={`${transitionDuration}s`}
                  onDecrement={() =>
                    setTransitionDuration((d) => Math.max(0, +(d - 0.25).toFixed(2)))
                  }
                  onIncrement={() =>
                    setTransitionDuration((d) => Math.min(3, +(d + 0.25).toFixed(2)))
                  }
                />

                {narration && (
                  <button
                    onClick={() => setNarrationEnabled((v) => !v)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm transition-colors",
                      narrationEnabled
                        ? "bg-brand-3/20 text-brand-3"
                        : "bg-border/30 text-muted",
                    )}
                  >
                    {narrationEnabled ? (
                      <Volume2 className="w-3.5 h-3.5" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5" />
                    )}
                    Narration
                  </button>
                )}
              </div>

              {/* Narration section */}
              {hasNotes && (
                <div className="rounded-xl border border-border overflow-hidden">
                  {/* Narration header (collapsible) */}
                  <button
                    onClick={() => {
                      setShowNarrationPanel((v) => !v);
                      initNotes();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-bg-elevated hover:bg-bg-elevated/80 transition-colors"
                  >
                    <Mic className="w-4 h-4 text-brand-1 shrink-0" />
                    <div className="flex-1 text-left">
                      <p className="text-sm text-foreground font-medium">
                        {narration
                          ? `Narration ready (${narration.audioSegments.filter(Boolean).length}/${slideImages.length} slides)`
                          : "Add AI voiceover"}
                      </p>
                      <p className="text-xs text-muted">
                        {narration
                          ? "Expand to change voice or edit scripts"
                          : "Choose a voice, review scripts, and generate narration from speaker notes"}
                      </p>
                    </div>
                    {showNarrationPanel ? (
                      <ChevronUp className="w-4 h-4 text-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showNarrationPanel && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 py-4 space-y-4 border-t border-border">
                          {/* Voice selector */}
                          <div>
                            <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                              Voice
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                              {VOICES.map((v) => {
                                const isSelected = selectedVoice === v.id;
                                const isPreviewing = previewingVoice === v.id;
                                const isPlaying = playingVoice === v.id;
                                return (
                                  <button
                                    key={v.id}
                                    onClick={() => setSelectedVoice(v.id)}
                                    className={cn(
                                      "relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all",
                                      isSelected
                                        ? "border-brand-3/50 bg-brand-3/10"
                                        : "border-border hover:border-border/80 hover:bg-surface",
                                    )}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p
                                        className={cn(
                                          "text-sm font-medium",
                                          isSelected ? "text-brand-3" : "text-foreground",
                                        )}
                                      >
                                        {v.label}
                                      </p>
                                      <p className="text-[11px] text-muted truncate">
                                        {v.desc}
                                      </p>
                                    </div>
                                    <div
                                      role="button"
                                      tabIndex={0}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!isPreviewing) handlePreviewVoice(v.id);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && !isPreviewing) {
                                          e.stopPropagation();
                                          handlePreviewVoice(v.id);
                                        }
                                      }}
                                      className={cn(
                                        "shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer",
                                        isPlaying
                                          ? "bg-brand-3 text-white"
                                          : "bg-border/40 text-muted hover:text-foreground hover:bg-border/60",
                                      )}
                                    >
                                      {isPreviewing ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : isPlaying ? (
                                        <Pause className="w-3 h-3" />
                                      ) : (
                                        <Play className="w-3 h-3 ml-0.5" />
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Script editor */}
                          <div>
                            <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                              Narration Script
                            </p>
                            <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
                              {activeNotes.map((note, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-start gap-2 group"
                                >
                                  <span className="shrink-0 w-6 h-6 rounded bg-border/30 flex items-center justify-center text-[10px] font-mono text-muted mt-0.5">
                                    {idx + 1}
                                  </span>
                                  {editingSlideIdx === idx ? (
                                    <div className="flex-1 flex gap-1.5">
                                      <textarea
                                        className="flex-1 text-xs bg-bg-elevated border border-brand-3/30 rounded-lg px-3 py-2 text-foreground resize-none focus:outline-none focus:border-brand-3/50"
                                        rows={3}
                                        defaultValue={note || ""}
                                        onBlur={(e) => {
                                          handleUpdateNote(idx, e.target.value);
                                          setEditingSlideIdx(null);
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === "Escape") setEditingSlideIdx(null);
                                        }}
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => setEditingSlideIdx(null)}
                                        className="shrink-0 self-start p-1 rounded text-brand-3 hover:bg-brand-3/10 transition-colors"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div
                                      className="flex-1 flex items-start gap-1.5 cursor-pointer"
                                      onClick={() => {
                                        setEditingSlideIdx(idx);
                                      }}
                                    >
                                      <p className="flex-1 text-xs text-muted leading-relaxed py-1.5 px-2 rounded-lg hover:bg-border/20 transition-colors">
                                        {note || (
                                          <span className="italic text-muted/50">
                                            No notes — click to add
                                          </span>
                                        )}
                                      </p>
                                      <Pencil className="shrink-0 w-3 h-3 text-muted/40 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Error message */}
                          {narrationError && !isGenerating && (
                            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-950/30 border border-red-500/20">
                              <X className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                              <p className="text-xs text-red-300">{narrationError}</p>
                            </div>
                          )}

                          {/* Generate button */}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={handleGenerateNarration}
                              disabled={isGenerating}
                              className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                isGenerating
                                  ? "bg-brand-3/20 text-brand-3 cursor-wait"
                                  : "bg-brand-3 text-white hover:bg-brand-3/90",
                              )}
                            >
                              {isGenerating ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  {narrationProgress}
                                </>
                              ) : narration ? (
                                <>
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  Regenerate
                                </>
                              ) : (
                                <>
                                  <Mic className="w-3.5 h-3.5" />
                                  Generate Narration
                                </>
                              )}
                            </button>
                            {narration && !isGenerating && (
                              <p className="text-xs text-muted">
                                {narration.audioSegments.filter(Boolean).length} of{" "}
                                {slideImages.length} slides narrated
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Download MP4 */}
              <div className="space-y-2">
                {renderState === "idle" && (
                  <button
                    onClick={handleDownloadMp4}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-1/15 text-brand-1 font-medium text-sm border border-brand-1/20 hover:bg-brand-1/25 hover:border-brand-1/40 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Download MP4
                  </button>
                )}

                {(renderState === "rendering" ||
                  renderState === "downloading") && (
                  <div className="space-y-2 px-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted">{renderMessage}</p>
                      <button
                        onClick={handleCancelRender}
                        className="text-xs text-muted hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="w-full bg-border/30 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-brand-1 to-brand-3"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.max(Math.round(renderProgress * 100), renderState === "downloading" ? 100 : 2)}%`,
                        }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                )}

                {renderState === "done" && (
                  <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <p className="text-sm font-medium text-emerald-400">
                      Download complete
                    </p>
                  </div>
                )}

                {renderState === "error" && (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-950/30 border border-red-500/20">
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-red-300">{renderError}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setRenderState("idle")}
                      className="text-xs text-muted hover:text-foreground transition-colors"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {/* CLI fallback */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-elevated border border-border/50">
                  <Terminal className="w-3.5 h-3.5 text-muted shrink-0" />
                  <div className="text-[11px] text-muted">
                    <span className="text-muted/70">CLI:</span>{" "}
                    <code className="text-muted/70">
                      npx remotion render remotion/index.ts SlideVideo{" "}
                      {presentationSlug}.mp4
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TimingControl({
  label,
  value,
  onDecrement,
  onIncrement,
}: {
  label: string;
  value: string;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted whitespace-nowrap">{label}:</span>
      <button
        onClick={onDecrement}
        className="p-1 rounded text-muted hover:text-foreground hover:bg-border/30 transition-colors"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className="text-sm font-mono text-foreground min-w-[2.5rem] text-center">
        {value}
      </span>
      <button
        onClick={onIncrement}
        className="p-1 rounded text-muted hover:text-foreground hover:bg-border/30 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
