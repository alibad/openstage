"use client";

import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Grid,
  MessageSquare,
  MessageSquarePlus,
  Download,
  Video,
  Sun,
  Moon,
  Volume2,
  Loader2,
  Pause,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useFeedbackStore } from "@/lib/stores/feedbackStore";
import { ThemeSwitcher } from "@/components/brand/theme-switcher";

export type NarrationState = "idle" | "loading" | "playing" | "paused";

interface SlideControlsProps {
  current: number;
  total: number;
  isFullscreen: boolean;
  showNotes?: boolean;
  hasNotes?: boolean;
  isDark?: boolean;
  narrationState?: NarrationState;
  onNarrate?: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleFullscreen: () => void;
  onShowOverview: () => void;
  onToggleNotes?: () => void;
  onToggleTheme?: () => void;
  onExportPptx?: () => void;
  onExportVideo?: () => void;
  isCapturingVideo?: boolean;
}

export function SlideControls({
  current,
  total,
  isFullscreen,
  showNotes,
  hasNotes,
  isDark,
  narrationState = "idle",
  onNarrate,
  onPrev,
  onNext,
  onToggleFullscreen,
  onShowOverview,
  onToggleNotes,
  onToggleTheme,
  onExportPptx,
  onExportVideo,
  isCapturingVideo,
}: SlideControlsProps) {
  const mutedButtonClass =
    "text-muted hover:text-foreground hover:bg-border/30";
  const disabledButtonClass = "text-border cursor-not-allowed";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between px-6 py-3 backdrop-blur-sm border-t bg-surface/80 border-border/50">
        <div className="flex items-center gap-1">
          <button
            onClick={onShowOverview}
            className={cn("p-2 rounded-lg transition-colors", mutedButtonClass)}
            title="Slide overview (G)"
          >
            <Grid className="w-4 h-4" />
          </button>
          {hasNotes && onToggleNotes && (
            <button
              onClick={onToggleNotes}
              className={cn(
                "p-2 rounded-lg transition-colors",
                showNotes
                  ? "text-spectrum-purple bg-accent-light"
                  : mutedButtonClass,
              )}
              title="Speaker notes (N)"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          )}
          {hasNotes && onNarrate && (
            <button
              onClick={onNarrate}
              disabled={narrationState === "loading"}
              className={cn(
                "p-2 rounded-lg transition-colors",
                narrationState === "playing"
                  ? "text-spectrum-cyan bg-accent-light"
                  : narrationState === "loading"
                    ? "text-spectrum-purple animate-pulse"
                    : mutedButtonClass,
              )}
              title={
                narrationState === "playing"
                  ? "Pause narration"
                  : narrationState === "paused"
                    ? "Resume narration"
                    : narrationState === "loading"
                      ? "Generating..."
                      : "Narrate slide (V)"
              }
            >
              {narrationState === "loading" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : narrationState === "playing" ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          )}
          {onExportPptx && (
            <button
              onClick={onExportPptx}
              className={cn("p-2 rounded-lg transition-colors", mutedButtonClass)}
              title="Export to PowerPoint"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          {onExportVideo && (
            <button
              onClick={onExportVideo}
              disabled={isCapturingVideo}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isCapturingVideo
                  ? "text-spectrum-purple animate-pulse"
                  : mutedButtonClass,
              )}
              title="Export as Video"
            >
              <Video className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onPrev}
            disabled={current === 0}
            className={cn(
              "p-2 rounded-lg transition-colors",
              current === 0 ? disabledButtonClass : mutedButtonClass,
            )}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-sm tabular-nums min-w-[4rem] text-center text-muted">
            {current + 1} / {total}
          </span>

          <button
            onClick={onNext}
            disabled={current === total - 1}
            className={cn(
              "p-2 rounded-lg transition-colors",
              current === total - 1 ? disabledButtonClass : mutedButtonClass,
            )}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <FeedbackButton className={mutedButtonClass} />
          {/* Brand-preset switcher. Reuses the same dropdown as
              `<DeckControls>` / `/settings`, but with the trigger class
              overridden to match the muted square buttons in this bar
              (the built-in `icon` variant is a bordered round pill). */}
          <ThemeSwitcher
            variant="icon"
            openUpwards
            triggerClassName={cn(
              "p-2 rounded-lg transition-colors inline-flex items-center justify-center",
              mutedButtonClass,
            )}
          />
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={cn("p-2 rounded-lg transition-colors", mutedButtonClass)}
              title="Toggle light/dark (D)"
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          )}
          <button
            onClick={onToggleFullscreen}
            className={cn("p-2 rounded-lg transition-colors", mutedButtonClass)}
            title="Fullscreen (F)"
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function FeedbackButton({ className }: { className?: string }) {
  const open = useFeedbackStore((s) => s.open);
  return (
    <button
      onClick={open}
      className={cn("p-2 rounded-lg transition-colors", className)}
      title="Send feedback"
    >
      <MessageSquarePlus className="w-4 h-4" />
    </button>
  );
}
