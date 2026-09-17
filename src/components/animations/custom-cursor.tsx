"use client";

import { useEffect, useRef } from "react";
import { usePrintMode } from "@/lib/print-mode";

interface CustomCursorProps {
  /** Disable the cursor on touch devices (default true) */
  disableOnTouch?: boolean;
  /** Ring color — defaults to a neutral off-white */
  color?: string;
  /** Size of the inner dot (px) */
  dotSize?: number;
  /** Size of the trailing ring (px) */
  ringSize?: number;
  /** Blend mode for the dot (useful on light/dark sections) */
  blend?: "normal" | "difference" | "exclusion";
}

/**
 * CustomCursor — app-level dot + trailing ring cursor.
 *
 * Drop in at the root of a presentation and it replaces the system cursor
 * with an animated dot + ring. The ring lags behind, scales up on clickable
 * elements, and displays text when hovering `[data-cursor-label]`.
 *
 * Opt-out per-element with `data-no-cursor`.
 * Automatically disabled on touch devices and in print mode.
 *
 * @example
 * <CustomCursor />
 * ...
 * <button data-cursor-label="Open">Click</button>
 */
export function CustomCursor({
  disableOnTouch = true,
  color = "rgba(255, 255, 255, 0.9)",
  dotSize = 6,
  ringSize = 38,
  blend = "difference",
}: CustomCursorProps = {}) {
  const print = usePrintMode();
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (print) return;
    if (typeof window === "undefined") return;

    const isTouch =
      "ontouchstart" in window ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
    if (disableOnTouch && isTouch) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let ringScale = 1;
    let targetScale = 1;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      if (!dot || !ring || !label) return;
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;

      const target = e.target as HTMLElement | null;
      if (!target || typeof target.closest !== "function") return;

      const optOut = target.closest("[data-no-cursor]");
      if (optOut) {
        dot.style.opacity = "0";
        ring.style.opacity = "0";
        label.style.opacity = "0";
        return;
      }
      dot.style.opacity = "1";
      ring.style.opacity = "1";

      const interactive = target.closest(
        'a, button, [role="button"], input, select, textarea, [data-cursor-interactive]',
      );
      const magnetic = target.closest("[data-cursor-magnetic]");
      const labelled = target.closest<HTMLElement>("[data-cursor-label]");

      if (labelled) {
        label.textContent = labelled.dataset.cursorLabel ?? "";
        label.style.opacity = "1";
        targetScale = 2.4;
      } else {
        label.style.opacity = "0";
        label.textContent = "";
        targetScale = magnetic ? 2 : interactive ? 1.6 : 1;
      }
    };

    const onLeave = () => {
      if (!dot || !ring || !label) return;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
      label.style.opacity = "0";
    };

    const onDown = () => {
      targetScale *= 0.7;
    };
    const onUp = () => {
      // targetScale will be recomputed on next move
    };

    const frame = () => {
      if (!ring || !label) return;
      const follow = reduceMotion ? 0.5 : 0.18;
      ringX += (mouseX - ringX) * follow;
      ringY += (mouseY - ringY) * follow;
      ringScale += (targetScale - ringScale) * 0.15;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%) scale(${ringScale})`;
      label.style.transform = `translate(${ringX}px, ${ringY + ringSize * 0.7}px) translate(-50%, 0)`;
      raf = requestAnimationFrame(frame);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    raf = requestAnimationFrame(frame);

    document.documentElement.classList.add("has-custom-cursor");

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, [disableOnTouch, print, ringSize]);

  if (print) return null;

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full"
        style={{
          width: dotSize,
          height: dotSize,
          background: color,
          mixBlendMode: blend,
          opacity: 0,
          willChange: "transform, opacity",
        }}
      />
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[9998] rounded-full border"
        style={{
          width: ringSize,
          height: ringSize,
          borderColor: color,
          borderWidth: 1,
          mixBlendMode: blend,
          opacity: 0,
          willChange: "transform, opacity",
        }}
      />
      <div
        ref={labelRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[9999] px-2 py-0.5 text-[11px] uppercase tracking-widest font-medium rounded-sm"
        style={{
          background: "white",
          color: "#0A0718",
          opacity: 0,
          willChange: "transform, opacity",
          transition: "opacity 150ms ease-out",
        }}
      />
      <style jsx global>{`
        html.has-custom-cursor,
        html.has-custom-cursor * {
          cursor: none !important;
        }
        html.has-custom-cursor [data-no-cursor],
        html.has-custom-cursor [data-no-cursor] * {
          cursor: auto !important;
        }
        /* Inside no-cursor zones (modals, iframes, etc.) surface a proper
           pointer on interactive elements — the UA default for <button>
           is an arrow, which is confusing when the custom cursor is gone. */
        html.has-custom-cursor [data-no-cursor] a,
        html.has-custom-cursor [data-no-cursor] a *,
        html.has-custom-cursor [data-no-cursor] button,
        html.has-custom-cursor [data-no-cursor] button *,
        html.has-custom-cursor [data-no-cursor] [role="button"],
        html.has-custom-cursor [data-no-cursor] [role="button"] * {
          cursor: pointer !important;
        }
        html.has-custom-cursor [data-no-cursor] input,
        html.has-custom-cursor [data-no-cursor] textarea {
          cursor: text !important;
        }
      `}</style>
    </>
  );
}
