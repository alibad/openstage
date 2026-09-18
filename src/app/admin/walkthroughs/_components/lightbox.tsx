"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Prose } from "./prose";

export interface LightboxStep {
  src: string;
  name?: string;
  description?: string;
  label?: "Before" | "After";
}

/**
 * Full-screen screenshot viewer — image on the left, the step's story on the
 * right, so context travels with the pixels. ← → navigate, ESC closes.
 */
export function ScreenshotLightbox({
  steps,
  startIndex = 0,
  title,
  onClose,
}: {
  steps: LightboxStep[];
  startIndex?: number;
  title: string;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const current = steps[idx];
  const isPortrait = current?.src?.includes("/mobile/");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIdx((i) => Math.min(steps.length - 1, i + 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, steps.length]);

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 flex" onClick={onClose} role="dialog" aria-label={title}>
      <div className="flex-1 flex items-center justify-center p-8 relative" onClick={(e) => e.stopPropagation()}>
        <div
          className={isPortrait ? "relative max-h-[85vh]" : "relative w-full max-w-5xl aspect-video"}
          style={isPortrait ? { aspectRatio: "375/812", height: "85vh" } : undefined}
        >
          <Image src={current.src} alt={current.name || title} fill className="object-contain rounded-xl" unoptimized />
        </div>
        {idx > 0 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIdx((i) => i - 1); }}
            aria-label="Previous"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            ‹
          </button>
        )}
        {idx < steps.length - 1 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIdx((i) => i + 1); }}
            aria-label="Next"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            ›
          </button>
        )}
      </div>
      <div className="w-72 shrink-0 border-l border-white/10 bg-white/[0.025] flex flex-col overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
          <p className="text-xs text-white/30 uppercase tracking-widest truncate pr-4">{title}</p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-white/60 hover:text-white">✕</button>
        </div>
        <div className="flex-1 px-6 py-6 space-y-4">
          <p className="text-xs font-mono text-cyan-400/60">Step {idx + 1} of {steps.length}</p>
          {current.name && <h2 className="text-xl font-bold text-white">{current.name}</h2>}
          {current.label && (
            <span
              className={
                current.label === "Before"
                  ? "inline-block text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30"
                  : "inline-block text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              }
            >
              {current.label}
            </span>
          )}
          {current.description && <Prose className="text-sm text-white/55 leading-relaxed" inline>{current.description}</Prose>}
        </div>
        {steps.length > 1 && (
          <div className="px-6 pb-6 flex flex-wrap gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`Go to step ${i + 1}`}
                className={i === idx ? "w-2 h-2 rounded-full bg-cyan-400" : "w-2 h-2 rounded-full bg-white/20"}
              />
            ))}
          </div>
        )}
        <p className="px-6 pb-4 text-xs text-white/20">← → navigate · ESC close</p>
      </div>
    </div>
  );
}
