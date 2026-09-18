"use client";

import { Reveal } from "@/components/animations/reveal";
import { cn } from "@/lib/cn";
import { useM } from "@/lib/print-mode";

/* ─────────────────────────────────────────────────────────────────────────
   BarRows — an editorial ranked-bar list: label, inline bar, value, caption.

   This is deliberately NOT `AnimatedBarChart`. That one is a real charting
   surface (axes, grid, recharts) and belongs where the numbers are the
   subject. This is a piece of typography that happens to carry a bar: the
   label leads, the bar is a supporting gesture, and the caption underneath
   does the arguing. It reads as prose, which is why it keeps getting reached
   for in narrative sections where a chart would be too loud.

   THE PRINT TRAP (the reason this is a component and not a snippet):

   The resting width MUST live in `style`, not only in `whileInView`. Print
   mode strips animation props, and a reveal that never fires leaves each bar
   at its `initial` width — so the deck quietly prints a full set of bars
   showing the WRONG numbers. Stating the true width in `style` means the
   animation is decoration: if it runs, it animates to the same place; if it
   never runs, the bar is already correct.

   Values are normalized against `max` (default: the largest value present),
   so callers pass real numbers and don't pre-compute percentages.
   ───────────────────────────────────────────────────────────────────────── */

export type BarRowItem = {
  label: string;
  value: number;
  /** Overrides the printed value, for units or pre-formatted text ("4.2 days"). */
  display?: string;
  /** Supporting line under the row — where the actual argument goes. */
  caption?: string;
  /** Per-row colour. Defaults to the deck accent. */
  color?: string;
};

export function BarRows({
  items,
  max,
  suffix = "",
  numbered = false,
  dark = false,
  className,
}: {
  items: BarRowItem[];
  /** Scale ceiling. Defaults to the largest value, making that row full-width. */
  max?: number;
  /** Appended to the numeric value when `display` is absent. */
  suffix?: string;
  /** Show a monospaced 01/02/03 index at the left. */
  numbered?: boolean;
  /** Render for a dark section. */
  dark?: boolean;
  className?: string;
}) {
  const m = useM();
  const ceiling = max ?? Math.max(...items.map((i) => i.value), 0);
  const pct = (v: number) => (ceiling > 0 ? (v / ceiling) * 100 : 0);

  return (
    <div className={className}>
      {items.map((item, i) => {
        const width = pct(item.value);
        return (
          <Reveal key={`${item.label}-${i}`} delay={0.06 * i}>
            <div
              className={cn(
                "grid md:grid-cols-[1fr_1.15fr] items-center gap-x-8 gap-y-3 border-b py-5",
                dark ? "border-white/10" : "border-border",
              )}
            >
              <div className="flex items-center gap-4">
                {numbered && (
                  <span
                    className={cn(
                      "shrink-0 font-mono text-[11px] tabular-nums",
                      dark ? "text-white/25" : "text-muted/50",
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                )}
                <span
                  className={cn(
                    "text-base leading-snug md:text-lg",
                    dark ? "text-white/85" : "text-foreground",
                  )}
                >
                  {item.label}
                </span>
              </div>

              <div className="flex items-center gap-5">
                <div
                  className={cn(
                    "h-2.5 flex-1 overflow-hidden rounded-full",
                    dark ? "bg-white/10" : "bg-muted/15",
                  )}
                >
                  <m.div
                    className="h-full rounded-full"
                    // Resting width in `style` — see THE PRINT TRAP above.
                    style={{
                      backgroundColor: item.color ?? "var(--color-accent)",
                      width: `${width}%`,
                    }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${width}%` }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
                  />
                </div>
                <span
                  className={cn(
                    "w-14 shrink-0 text-right font-mono text-[11px] tabular-nums",
                    dark ? "text-white/40" : "text-muted",
                  )}
                >
                  {item.display ?? `${item.value}${suffix}`}
                </span>
              </div>

              {item.caption && (
                <p
                  className={cn(
                    "-mt-1 text-sm leading-relaxed md:col-start-2",
                    dark ? "text-white/45" : "text-muted",
                  )}
                >
                  {item.caption}
                </p>
              )}
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
