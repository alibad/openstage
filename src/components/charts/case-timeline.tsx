"use client";

/* ─────────────────────────────────────────────────────────────────────────
   CaseTimeline — a single case walked day by day down a vertical rail.

   Distinct from `AnimatedTimeline`, which is a card-per-milestone list where
   spacing is uniform. Here the vertical axis is REAL: a dot's position is its
   day, proportional to the total. That is the whole argument of the chart —
   you can see the three-week gap between two milestones, not just that one
   followed the other. Use it when elapsed time is the point.

   Two pieces of craft worth not re-deriving:

   1. LABEL COLLISION AVOIDANCE. Dots can sit a day apart; their labels
      cannot. Each label is pushed to at least `GAP` below the previous one,
      then joined back to its true dot with a bezier elbow. So the rail stays
      honest about timing while the text stays readable.

   2. The rail is inset far enough from the left edge that the band's
      right-anchored labels ("43 days / on one approval") clear the canvas.
      Pulling `X` in tighter clips them.

   Colour: neutrals ride `currentColor`, so the figure inverts with its
   section without a prop. `accent` marks ordinary dots, `highlight` marks
   emphasised ones and the band — the "this is where the time went" colour.
   In inline SVG, `var()` only resolves through `style`, never the attribute.
   ───────────────────────────────────────────────────────────────────────── */

const MONO = "var(--font-mono)";

export type CaseMark = {
  /** Day offset from the start. Drives vertical position. */
  day: number;
  title: string;
  sub?: string;
  /** Renders in `highlight` at a larger size — the beat that carries the point. */
  emphasis?: boolean;
};

export function CaseTimeline({
  label,
  totalDays,
  marks,
  band,
  accent = "var(--color-accent)",
  highlight = "var(--color-brand-4)",
}: {
  /** Kicker above the rail, e.g. a case id. */
  label: string;
  totalDays: number;
  marks: CaseMark[];
  /** Highlights a stretch of the rail — usually the stall you're calling out. */
  band?: { from: number; to: number; head: string; sub: string };
  accent?: string;
  highlight?: string;
}) {
  const TOP = 62;
  const RAIL_LEN = 470;
  const GAP = 34;
  /* Inset so the band's right-anchored labels clear the left edge. */
  const X = 130;

  const dotY = (d: number) => TOP + (d / totalDays) * RAIL_LEN;

  if (marks.length === 0) return null;

  // Push each label at least GAP below the previous one; the elbow path below
  // reconnects it to its true dot.
  const labelY: number[] = [];
  marks.forEach((m, i) => {
    const want = dotY(m.day);
    labelY.push(i === 0 ? want : Math.max(want, labelY[i - 1] + GAP));
  });

  const height = Math.max(labelY[labelY.length - 1], dotY(totalDays)) + 44;

  return (
    <svg
      viewBox={`0 0 680 ${Math.round(height)}`}
      /* A timeline is all small type, so on paper it gets a higher ceiling
         than other figures (see the `pdf-pages` rules in print-pager.tsx). */
      className="w-full h-auto print-figure-tall"
      role="img"
      aria-label={`${label}. ${marks
        .map((m) => `Day ${m.day}: ${m.title}.`)
        .join(" ")}`}
    >
      <text
        x={44}
        y={26}
        fontSize={11}
        fontFamily={MONO}
        letterSpacing="0.16em"
        fill="currentColor"
        fillOpacity={0.45}
      >
        {label.toUpperCase()}
      </text>

      <line
        x1={X}
        x2={X}
        y1={TOP}
        y2={dotY(totalDays)}
        stroke="currentColor"
        strokeOpacity={0.16}
        strokeWidth={2}
      />

      {band && (
        <>
          <rect
            x={X - 7}
            y={dotY(band.from)}
            width={14}
            height={dotY(band.to) - dotY(band.from)}
            rx={7}
            style={{ fill: highlight, fillOpacity: 0.16 }}
          />
          <text
            x={X - 22}
            y={(dotY(band.from) + dotY(band.to)) / 2 - 4}
            fontSize={12}
            fontWeight={700}
            fontFamily={MONO}
            textAnchor="end"
            style={{ fill: highlight }}
          >
            {band.head}
          </text>
          <text
            x={X - 22}
            y={(dotY(band.from) + dotY(band.to)) / 2 + 10}
            fontSize={11}
            fontFamily={MONO}
            textAnchor="end"
            fill="currentColor"
            fillOpacity={0.45}
          >
            {band.sub}
          </text>
        </>
      )}

      {marks.map((m, i) => {
        const dy = dotY(m.day);
        const ly = labelY[i];
        return (
          <g key={`${m.day}-${m.title}`}>
            <text
              x={X - 22}
              y={ly + 4}
              fontSize={13}
              fontWeight={700}
              fontFamily={MONO}
              textAnchor="end"
              style={m.emphasis ? { fill: highlight } : undefined}
              fill={m.emphasis ? undefined : "currentColor"}
              fillOpacity={m.emphasis ? 1 : 0.5}
            >
              d{m.day}
            </text>

            {/* Elbow back to the true dot when the label had to be nudged. */}
            {Math.abs(dy - ly) > 2 ? (
              <path
                d={`M${X} ${dy} C ${X + 12} ${dy}, ${X + 12} ${ly}, ${X + 24} ${ly}`}
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.2}
              />
            ) : (
              <line
                x1={X}
                x2={X + 24}
                y1={ly}
                y2={ly}
                stroke="currentColor"
                strokeOpacity={0.2}
              />
            )}

            <circle
              cx={X}
              cy={dy}
              r={m.emphasis ? 5.5 : 4}
              style={
                m.emphasis
                  ? { fill: highlight }
                  : { fill: accent, fillOpacity: 0.7 }
              }
            />

            <text
              x={X + 34}
              y={ly + (m.sub ? 0 : 4)}
              fontSize={m.emphasis ? 14 : 13}
              fontWeight={m.emphasis ? 700 : 500}
              fill="currentColor"
              fillOpacity={m.emphasis ? 0.95 : 0.8}
            >
              {m.title}
            </text>

            {m.sub && (
              <text
                x={X + 34}
                y={ly + 17}
                fontSize={12}
                fill="currentColor"
                fillOpacity={0.48}
              >
                {m.sub}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
