"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * EditorialGrid — asymmetric 12-column magazine-style grid.
 *
 * Replaces the symmetric SplitSlide pattern with named slots that can span
 * uneven column/row counts, giving decks an editorial, magazine-like rhythm.
 *
 * @example
 * <EditorialGrid>
 *   <EditorialCell span="kicker"><Kicker /></EditorialCell>
 *   <EditorialCell span="lede"><h2>Big headline</h2></EditorialCell>
 *   <EditorialCell span="figure"><Image ... /></EditorialCell>
 *   <EditorialCell span="aside"><p>Sidebar copy</p></EditorialCell>
 *   <EditorialCell span="body"><p>Main paragraph</p></EditorialCell>
 * </EditorialGrid>
 */

type NamedSpan =
  | "kicker" // col 1-3, row 1 — short label or eyebrow text
  | "lede" // col 1-8, row 2 — big headline
  | "aside" // col 9-12, row 2-3 — sidebar copy
  | "body" // col 1-8, row 3 — main body paragraph
  | "figure" // col 1-12, row 4 — full-width image or chart
  | "figureHalf" // col 7-12, row 2-3 — half-width image
  | "figureLeft" // col 1-6, row 2-3 — half-width image on left
  | "quote" // col 3-11, row 3 — centered pull-quote
  | "wide" // col 1-12 — full-width content row
  | "half" // col 1-6 — half-width column
  | "halfRight"; // col 7-12 — right half column

interface EditorialGridProps {
  children: ReactNode;
  /** Number of rows. Auto if omitted. */
  rows?: number;
  /** Vertical gap between rows */
  rowGap?: string;
  /** Horizontal gap between columns */
  colGap?: string;
  className?: string;
}

export function EditorialGrid({
  children,
  rows,
  rowGap = "2.5rem",
  colGap = "2rem",
  className,
}: EditorialGridProps) {
  return (
    <div
      // Tagged so a media query can override the inline grid below. Inline
      // styles beat stylesheets, so the mobile collapse in globals.css has to
      // target an attribute and use !important — there is no way around that
      // while the spans are computed in JS.
      data-editorial-grid=""
      className={cn("grid w-full", className)}
      style={{
        gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
        gridAutoRows: "auto",
        gridTemplateRows: rows ? `repeat(${rows}, auto)` : undefined,
        rowGap,
        columnGap: colGap,
      }}
    >
      {children}
    </div>
  );
}

const SPAN_PRESETS: Record<NamedSpan, React.CSSProperties> = {
  kicker: { gridColumn: "1 / span 3" },
  lede: { gridColumn: "1 / span 8" },
  aside: { gridColumn: "9 / span 4", gridRow: "span 2" },
  body: { gridColumn: "1 / span 8" },
  figure: { gridColumn: "1 / span 12" },
  figureHalf: { gridColumn: "7 / span 6", gridRow: "span 2" },
  figureLeft: { gridColumn: "1 / span 6", gridRow: "span 2" },
  quote: { gridColumn: "3 / span 9" },
  wide: { gridColumn: "1 / span 12" },
  half: { gridColumn: "1 / span 6" },
  halfRight: { gridColumn: "7 / span 6" },
};

interface EditorialCellProps {
  children: ReactNode;
  /** Use a named slot preset — defaults to wide if omitted */
  span?: NamedSpan;
  /** Manually specify column span (1-12) */
  col?: number;
  /** Manually specify column start (1-based) */
  colStart?: number;
  /** Manually specify row span */
  row?: number;
  /** Manually specify row start */
  rowStart?: number;
  /** Vertical align inside cell */
  align?: "start" | "center" | "end" | "stretch";
  className?: string;
}

export function EditorialCell({
  children,
  span,
  col,
  colStart,
  row,
  rowStart,
  align,
  className,
}: EditorialCellProps) {
  const preset = span ? SPAN_PRESETS[span] : {};
  const style: React.CSSProperties = {
    ...preset,
  };
  if (col) {
    style.gridColumn = colStart
      ? `${colStart} / span ${col}`
      : `span ${col}`;
  } else if (colStart && !span) {
    style.gridColumnStart = colStart;
  }
  if (row) {
    style.gridRow = rowStart ? `${rowStart} / span ${row}` : `span ${row}`;
  } else if (rowStart && !span) {
    style.gridRowStart = rowStart;
  }
  if (align) style.alignSelf = align;

  return (
    <div data-editorial-cell="" className={cn("min-w-0", className)} style={style}>
      {children}
    </div>
  );
}
