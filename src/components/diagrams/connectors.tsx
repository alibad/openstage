"use client";

import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/cn";

/* ─────────────────────────────────────────────────────────────────────────
   Connectors — the plumbing between stacked nodes in a vertical flow.

   WHY THESE EXIST ALONGSIDE `FlowDiagram`:

   Reach for `FlowDiagram` first. It owns the common case: a node/edge chain,
   horizontal or vertical, and it DOES support a label on an edge. If your
   flow is a chain of uniform steps, use it and stop reading.

   These cover the two things it cannot do, because it renders its own nodes
   from a data array:

     · joining nodes YOU already have — bespoke cards with their own icons,
       chips and internal layout. `FlowDiagram` can't sit between arbitrary
       children, so `Connector` is the rule-plus-label that can.
     · `SplitConnector` — a bracket fanning one node into N branches, each
       drop tinted so the branch columns below are unmistakably its children.
       `FlowDiagram` is a linear chain and has no fan-out at all.

   These are CSS boxes, not SVG, so they sit between real DOM nodes in a
   flex/grid column and inherit its width. Colour rides theme tokens, so a
   flow inverts with its section.
   ───────────────────────────────────────────────────────────────────────── */

/** Default line colour: visible on light and dark, no token needed. */
const LINE = "currentColor";

export function Connector({
  label,
  /** Hide the arrowhead for a plain rule between nodes. */
  arrow = true,
  className,
}: {
  /** Condition or transform that happens between the two nodes. */
  label?: string;
  arrow?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center py-1 text-foreground/25",
        className,
      )}
      aria-hidden="true"
    >
      <span className="h-5 w-px" style={{ background: LINE }} />
      {label && (
        <span className="my-1 rounded-md border border-border bg-surface px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          {label}
        </span>
      )}
      <span className="h-5 w-px" style={{ background: LINE }} />
      {arrow && <ArrowDown className="h-4 w-4" />}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   SplitConnector — one stub down from the parent, a horizontal bar, then a
   coloured drop into each branch column.

   The drops land at the CENTRE of each of N equal columns — `(i + 0.5) / n` —
   so this lines up with a `grid-cols-{n}` row of branch cards directly below
   it. Pass `colors` in the same order as those cards and each branch is
   visually claimed by its own drop.
   ───────────────────────────────────────────────────────────────────────── */
export function SplitConnector({
  colors,
  height = 40,
  className,
}: {
  /** One colour per branch, in the same order as the branch columns below. */
  colors: string[];
  /** Total height in px. Taller reads as a bigger structural break. */
  height?: number;
  className?: string;
}) {
  const n = colors.length;
  if (n === 0) return null;

  // Centre of each equal column, and the span the horizontal bar must cover
  // (first centre to last centre — extending further would overhang).
  const centre = (i: number) => ((i + 0.5) / n) * 100;
  const first = centre(0);
  const last = centre(n - 1);

  return (
    <div
      className={cn("relative mx-auto w-full text-foreground/25", className)}
      style={{ height }}
      aria-hidden="true"
    >
      {/* Stub down from the parent node. */}
      <span
        className="absolute left-1/2 top-0 h-1/2 w-px -translate-x-1/2"
        style={{ background: LINE }}
      />

      {/* Horizontal bar spanning the outermost branch centres. */}
      {n > 1 && (
        <span
          className="absolute top-1/2 h-px"
          style={{
            background: LINE,
            left: `${first}%`,
            width: `${last - first}%`,
          }}
        />
      )}

      {/* One tinted drop per branch. */}
      {colors.map((color, i) => (
        <span
          key={i}
          className="absolute top-1/2 h-1/2 w-px -translate-x-1/2"
          style={{ background: color, left: `${centre(i)}%` }}
        />
      ))}
    </div>
  );
}
