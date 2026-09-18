"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";

/* ─────────────────────────────────────────────────────────────────────────
   SvgHoverCard — a fluid tooltip for hotspots inside an inline SVG diagram.

   The problem it solves: a diagram's hotspots live in viewBox coordinates,
   but the tooltip is a DOM node positioned in percentages of the wrapper.
   This converts one to the other, then keeps the card on screen:

     · horizontal position is clamped to 14–86% so a card anchored to a
       hotspot near either edge cannot hang off the side of the figure;
     · past 52% down, the card flips to sit ABOVE its hotspot rather than
       below, so a hotspot low in the diagram doesn't push the card out of
       the figure's box.

   Usage — the wrapper must be `relative`, and `vb` must match the SVG's
   own viewBox, or the maths lands in the wrong place:

     <div className="relative">
       <svg viewBox="0 0 1180 520">…</svg>
       <SvgHoverCard active={active} items={items} vb={{x:0,y:0,w:1180,h:520}} />
     </div>

   `active` is an index into `items` (or null) — keep hover state on the
   parent so the SVG hotspots and the card stay in sync.
   ───────────────────────────────────────────────────────────────────────── */

const MONO = { fontFamily: "var(--font-mono)" } as const;

export type SvgHoverItem = {
  /** Hotspot position, in the SVG's own viewBox coordinates. */
  x: number;
  y: number;
  title: string;
  /** Small uppercase kicker above the body. */
  sub?: string;
  body: string;
  /** Optional footer line, prefixed with a dot in `footColor`. */
  foot?: string;
  footColor?: string;
};

export function SvgHoverCard({
  active,
  items,
  vb,
  dark,
}: {
  /** Index into `items`, or null when nothing is hovered. */
  active: number | null;
  items: SvgHoverItem[];
  /** The host SVG's viewBox, so hotspot coords can be mapped to percentages. */
  vb: { x: number; y: number; w: number; h: number };
  /** Render for a dark section. Uses the `bg-elevated` token, not a fixed hex,
   *  so the card still follows the active theme. */
  dark?: boolean;
}) {
  const it = active != null ? items[active] : null;

  // Clamp keeps an edge-anchored card inside the figure; the flip keeps a
  // low-anchored one from spilling out of the bottom.
  const leftPct = it
    ? Math.min(86, Math.max(14, ((it.x - vb.x) / vb.w) * 100))
    : 0;
  const topPct = it ? ((it.y - vb.y) / vb.h) * 100 : 0;
  const above = topPct > 52;

  return (
    <AnimatePresence>
      {it && (
        <motion.div
          key={active}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="pointer-events-none absolute z-30"
          style={{
            left: `${leftPct}%`,
            top: `${topPct}%`,
            transform: `translate(-50%, ${above ? "-100%" : "0%"})`,
            // Gap between card and hotspot, on whichever side it sits.
            paddingTop: above ? 0 : 22,
            paddingBottom: above ? 22 : 0,
          }}
        >
          <motion.div
            initial={{ y: above ? 10 : -10, scale: 0.95 }}
            animate={{ y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className={cn(
              "w-[280px] rounded-2xl border p-4 text-left shadow-2xl backdrop-blur-md",
              dark
                ? "bg-bg-elevated/95 border-white/15 text-white"
                : "bg-surface/95 border-border text-foreground",
            )}
          >
            <h4 className="font-semibold text-sm leading-snug">{it.title}</h4>

            {it.sub && (
              <div
                className={cn(
                  "mt-1 text-[10px] uppercase tracking-[0.18em]",
                  dark ? "text-white/45" : "text-muted",
                )}
                style={MONO}
              >
                {it.sub}
              </div>
            )}

            <p
              className={cn(
                "mt-2 text-xs leading-relaxed text-pretty",
                dark ? "text-white/65" : "text-muted",
              )}
            >
              {it.body}
            </p>

            {it.foot && (
              <div
                className="mt-2.5 flex items-center gap-1.5 text-[10px]"
                style={{
                  ...MONO,
                  color:
                    it.footColor ||
                    (dark ? "rgba(255,255,255,0.5)" : "var(--color-muted)"),
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: "currentColor" }}
                />
                {it.foot}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
