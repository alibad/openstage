"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Printer, MessageSquarePlus, X } from "lucide-react";
import { ThemeSwitcher } from "@/components/brand/theme-switcher";
import { useFeedbackStore } from "@/lib/stores/feedbackStore";
import { usePrintMode } from "@/lib/print-mode";

interface DeckControlsProps {
  /**
   * Whether this deck mounts a `<ScrollNarrator />` widget at
   * bottom-right. Used purely for layout — DeckControls shifts left
   * when `true` so the two widgets don't overlap. The narrator owns
   * its own trigger UI (the floating mic button), so DeckControls no
   * longer renders a separate Narrate icon. Defaults to `false`.
   */
  hasNarration?: boolean;
  /**
   * Whether to show the Feedback control. The floating feedback bubble
   * is auto-suppressed while DeckControls is mounted so the two don't
   * compete for the same screen real estate. Defaults to `true`.
   */
  hasFeedback?: boolean;
  /**
   * Whether to show the Theme switcher. Defaults to `true`.
   */
  hasTheme?: boolean;
  /**
   * Whether to show the Print control. Defaults to `true`.
   */
  hasPrint?: boolean;
  /**
   * Where to anchor the control hub. Defaults to `bottom-right` so it
   * lives next to the narrator (also bottom-right) and the feedback
   * widget (bottom-left) in the natural floating-widget band.
   */
  position?: "top-right" | "bottom-right";
}

/**
 * Consolidated floating control hub for in-deck affordances. Replaces
 * the standalone `<PrintButton>` and lives next to (not on top of) the
 * existing `<ChapterNav>`, `<ScrollNarrator>`, `<PresentationTimer>`,
 * and feedback bubble.
 *
 * Behavior:
 * - Renders a single trigger pill that expands into a row of icon
 *   buttons on hover/click.
 * - Auto-hides the global feedback bubble while mounted (the bubble's
 *   trigger is opt-out via `useFeedbackStore.hideTrigger`).
 * - Auto-suppresses itself in print mode (so PDF exports stay clean).
 */
export function DeckControls({
  hasNarration = false,
  hasFeedback = true,
  hasTheme = true,
  hasPrint = true,
  position = "bottom-right",
}: DeckControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const print = usePrintMode();

  // Suppress the floating feedback bubble while DeckControls is on screen.
  useEffect(() => {
    if (!hasFeedback) return;
    const prev = useFeedbackStore.getState().hideTrigger;
    useFeedbackStore.setState({ hideTrigger: true });
    return () => {
      useFeedbackStore.setState({ hideTrigger: prev });
    };
  }, [hasFeedback]);

  if (print) return null;

  // Bottom-right placement needs to clear the ScrollNarrator widget
  // (also fixed at bottom-6 right-6, ~48px wide collapsed). Shift left
  // by the narrator footprint + a small gap when narration is mounted.
  const positionClass =
    position === "top-right"
      ? "fixed top-6 right-6"
      : hasNarration
        ? "fixed bottom-6 right-[5.25rem]"
        : "fixed bottom-6 right-6";

  return (
    <div
      className={`${positionClass} z-[100] print-hidden`}
      data-deck-controls
    >
      <div className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-bg-dark/80 backdrop-blur-md border border-white/10 shadow-lg">
        {hasTheme && (
          <ThemeSwitcher
            variant="icon"
            onDark
            className="ml-0"
            openUpwards={position === "bottom-right"}
          />
        )}
        {hasFeedback && (
          <ControlButton
            icon={<MessageSquarePlus className="w-4 h-4" />}
            label="Send feedback"
            onClick={() =>
              useFeedbackStore.setState({
                isOpen: true,
                isMinimized: false,
              })
            }
          />
        )}
        {hasPrint && (
          <ControlButton
            icon={
              print ? <X className="w-4 h-4" /> : <Printer className="w-4 h-4" />
            }
            label={print ? "Exit print mode" : "Print / export PDF"}
            onClick={() => {
              if (print) {
                router.push(pathname);
              } else {
                router.push(`${pathname}?print`);
                setTimeout(() => window.print(), 1500);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

function ControlButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  const [showTip, setShowTip] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        onFocus={() => setShowTip(true)}
        onBlur={() => setShowTip(false)}
        title={label}
        aria-label={label}
        className="w-9 h-9 rounded-full text-white/80 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        {icon}
      </button>
      {showTip && (
        <div className="pointer-events-none absolute top-full mt-2 right-0 px-2 py-1 rounded-md bg-bg-dark/95 border border-white/10 text-[10px] text-white/80 whitespace-nowrap shadow-lg">
          {label}
        </div>
      )}
    </div>
  );
}
