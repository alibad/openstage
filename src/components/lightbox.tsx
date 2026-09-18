"use client";

import { Expand, Minus, Plus, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";

/* ─────────────────────────────────────────────────────────────────────────
   Lightbox — a full-screen overlay for inspecting a figure up close.

   WHY THIS PORTALS, and why that is the whole point of the component:

   Rendering the overlay in place does not work, and the failure is silent.
   A deck section is `relative z-10`, and an animated slide wrapper carries a
   transform — both create a stacking context. An overlay rendered inside one
   has its `z-[9999]` resolved WITHIN that context, so it cannot rise above
   the deck's own control bar no matter how high the number goes. The overlay
   opens, looks almost right, and sits under the chrome.

   `createPortal(…, document.body)` escapes the stacking context entirely,
   which is the only reliable fix. Because the portal target is `document.body`,
   the component must not portal during SSR — hence the `mounted` gate.

   What callers get for free: Escape to close, a backdrop click to close,
   body-scroll lock (restored to its previous value, not blanked), and
   `print-hidden` so an open overlay never lands in a PDF export.

   Children are arbitrary, so this wraps an image, an inline SVG diagram, an
   iframe embed, or a video. For the common "click a picture to enlarge it"
   case, reach for `LightboxFigure` below instead of wiring this by hand.
   ───────────────────────────────────────────────────────────────────────── */

export function Lightbox({
  open,
  onClose,
  title,
  footer,
  children,
  /** Extra controls in the header bar, left of the close button. */
  actions,
  contentClassName,
}: {
  open: boolean;
  onClose: () => void;
  /** Shown top-left; also the dialog's accessible name. */
  title: string;
  footer?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  contentClassName?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    // Reset the pan position each time it opens, so a previous session's
    // scroll offset doesn't decide where the next one starts.
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: 0, left: 0 });
    });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    // Restore whatever the page had, rather than assuming it was "".
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-no-cursor
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex flex-col bg-bg-dark/95 backdrop-blur-xl print-hidden"
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-white/10 shrink-0">
        <p className="text-sm text-white/70 truncate">{title}</p>
        <div className="flex items-center gap-2 shrink-0">
          {actions}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            aria-label="Close"
            className={cn(LIGHTBOX_BUTTON, "ml-1")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* stopPropagation: clicking the figure itself should pan or do nothing,
          not close the overlay. Only the backdrop closes. */}
      <div
        ref={scrollRef}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "flex-1 min-h-0 overflow-auto overscroll-contain p-4 md:p-8",
          contentClassName,
        )}
      >
        {children}
      </div>

      {footer && (
        <div className="px-4 py-2 border-t border-white/10 text-center shrink-0">
          {footer}
        </div>
      )}
    </div>,
    document.body,
  );
}

/** Shared styling for the circular header controls. */
export const LIGHTBOX_BUTTON =
  "w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/10";

const ZOOM_LEVELS = [1, 1.25, 1.5, 1.75, 2] as const;

/* ─────────────────────────────────────────────────────────────────────────
   LightboxFigure — the common case: an inline figure that opens full-screen
   with stepped zoom. Use this for architecture diagrams and screenshots that
   are unreadable at section width.

   In print mode the trigger is inert and the frame scrolls horizontally
   instead: there is no "click to enlarge" on paper, so the figure has to be
   legible where it sits.
   ───────────────────────────────────────────────────────────────────────── */
export function LightboxFigure({
  src,
  alt,
  caption,
  dark,
  className,
  imageClassName,
}: {
  src: string;
  alt: string;
  caption?: string;
  /** Sits on a dark section — softens the frame border. */
  dark?: boolean;
  className?: string;
  imageClassName?: string;
}) {
  const print = usePrintMode();
  const [open, setOpen] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);

  const scale = ZOOM_LEVELS[zoomIndex];
  const canZoomOut = zoomIndex > 0;
  const canZoomIn = zoomIndex < ZOOM_LEVELS.length - 1;

  // Each opening starts at 100%, matching the pan reset in `Lightbox`.
  useEffect(() => {
    if (open) setZoomIndex(0);
  }, [open]);

  return (
    <figure className={cn("w-full", className)}>
      <div
        className={cn(
          "rounded-2xl border bg-white p-3 md:p-4",
          print ? "overflow-x-auto" : "overflow-hidden",
          dark ? "border-white/10" : "border-border shadow-sm",
        )}
      >
        {print ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src}
            alt={alt}
            className={cn("block w-full h-auto", imageClassName)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`Enlarge: ${alt}`}
            className="group relative block w-full cursor-zoom-in"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              draggable={false}
              className={cn("block w-full h-auto", imageClassName)}
            />
            <span className="absolute top-2 right-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              <Expand className="w-3 h-3" />
              Enlarge
            </span>
          </button>
        )}
      </div>

      {caption && (
        <figcaption
          className={cn(
            "mt-3 text-xs leading-relaxed",
            dark ? "text-white/50" : "text-muted",
          )}
        >
          {caption}
        </figcaption>
      )}

      <Lightbox
        open={open}
        onClose={() => setOpen(false)}
        title={alt}
        actions={
          <>
            <button
              type="button"
              disabled={!canZoomOut}
              onClick={(event) => {
                event.stopPropagation();
                setZoomIndex((current) => Math.max(0, current - 1));
              }}
              aria-label="Zoom out"
              className={LIGHTBOX_BUTTON}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-white/60 w-12 text-center tabular-nums">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              disabled={!canZoomIn}
              onClick={(event) => {
                event.stopPropagation();
                setZoomIndex((current) =>
                  Math.min(ZOOM_LEVELS.length - 1, current + 1),
                );
              }}
              aria-label="Zoom in"
              className={LIGHTBOX_BUTTON}
            >
              <Plus className="w-4 h-4" />
            </button>
          </>
        }
        footer={
          <>
            <p className="text-xs text-white/45">
              Scroll to pan · +/- to zoom (100–200%) · Esc to close
            </p>
            {caption && (
              <p className="text-xs text-white/35 mt-1">{caption}</p>
            )}
          </>
        }
      >
        {/* Width drives the zoom rather than a transform, so the scroll
            container gets real overflow to pan through. */}
        <div className="inline-block min-w-full" style={{ width: `${scale * 100}%` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            draggable={false}
            className="block w-full min-w-[960px] max-w-none h-auto rounded-lg bg-white shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)]"
          />
        </div>
      </Lightbox>
    </figure>
  );
}
