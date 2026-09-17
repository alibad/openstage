"use client";

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePrintMode } from "@/lib/print-mode";

interface Zone {
  label: string;
  content: ReactNode;
  color?: string;
  icon?: ReactNode;
}

interface InteractionZoneProps {
  zones: Zone[];
  /** "toggle" = one active at a time; "accordion" = multiple can be open */
  mode?: "toggle" | "accordion";
  layout?: "row" | "grid";
  className?: string;
}

const DEFAULT_COLOR = "var(--color-brand-3, #A78BFA)";

/**
 * Click-driven exploration zones. Each zone has a button and expandable
 * content. Pauses the scroll narrative and invites the reader to explore.
 *
 * Toggle mode (default): clicking one zone closes the previous.
 * Accordion mode: multiple zones can be open simultaneously.
 *
 * Print: all zones expanded.
 * Keyboard accessible: Enter/Space to toggle.
 */
export function InteractionZone({
  zones,
  mode = "toggle",
  layout = "row",
  className,
}: InteractionZoneProps) {
  const print = usePrintMode();
  const [openSet, setOpenSet] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setOpenSet((prev) => {
      const next = new Set(mode === "toggle" ? [] : prev);
      if (prev.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
      }
      return next;
    });
  };

  const gridClass =
    layout === "grid"
      ? zones.length <= 2
        ? "grid grid-cols-2 gap-3"
        : zones.length === 3
          ? "grid grid-cols-3 gap-3"
          : "grid grid-cols-2 md:grid-cols-4 gap-3"
      : "flex flex-wrap gap-3";

  return (
    <div className={className}>
      {/* Zone buttons */}
      <div className={gridClass}>
        {zones.map((zone, i) => {
          const color = zone.color ?? DEFAULT_COLOR;
          const isOpen = print || openSet.has(i);

          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
              aria-controls={`iz-content-${i}`}
              className="relative rounded-xl px-5 py-3.5 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 text-left"
              style={{
                backgroundColor: isOpen ? `${color}20` : "rgba(255,255,255,0.05)",
                color: isOpen ? "#fff" : "rgba(255,255,255,0.6)",
                borderWidth: 1,
                borderColor: isOpen ? `${color}60` : "rgba(255,255,255,0.1)",
                boxShadow: isOpen ? `0 0 20px ${color}15` : "none",
              }}
            >
              <span className="flex items-center gap-2">
                {zone.icon}
                {zone.label}
              </span>
              {isOpen && (
                <motion.div
                  layoutId={`iz-bar-${i}`}
                  className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                  style={{ backgroundColor: color }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Zone content */}
      {print ? (
        <div className="mt-6 space-y-6">
          {zones.map((zone, i) => (
            <div
              key={i}
              id={`iz-content-${i}`}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-6"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
                {zone.label}
              </p>
              {zone.content}
            </div>
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {zones.map((zone, i) => {
            if (!openSet.has(i)) return null;
            const color = zone.color ?? DEFAULT_COLOR;

            return (
              <motion.div
                key={i}
                id={`iz-content-${i}`}
                role="region"
                aria-label={zone.label}
                initial={{ opacity: 0, y: 8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="mt-4 overflow-hidden rounded-xl border bg-white/[0.03] p-6"
                style={{ borderColor: `${color}30` }}
              >
                {zone.content}
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
    </div>
  );
}
