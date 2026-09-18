---
name: quality-standards
description: "The deck quality standards: graphics-first with the graphic-type hierarchy table, writing style (5-word titles, no em dashes, bold not italics, quote sources), the interaction-quality bar (click-selects, no flicker, stable panels), and the core narrative/visual standards. Use when polishing a deck or deciding whether it clears the bar. When the fix targets a specific live section (e.g. a scroll hero or a slide), also load the matching builder skill (new-deck / slide-mode) to implement it — this skill sets the bar, the builder edits."
---

## Quality Standards

### Graphics first, text last

Every section should lead with a visual and use text only as annotation. A diagram
with a short label communicates structure instantly. A paragraph on a slide forces
the audience to read and listen at the same time, and they do neither well.

If your first instinct is a card grid with headings and paragraphs, stop. Ask:
"Can this be a diagram, chart, visual comparison, or annotated graphic instead?"
Almost always, yes.

**Graphic type hierarchy** (prefer earlier options):

| Priority | Type | Best for |
|----------|------|----------|
| 1 | Line/area charts | Trends, rates, timelines with data |
| 2 | Bar charts | Comparisons of magnitude, volume, counts |
| 3 | Flow/pipeline diagrams | Processes, data flows, architectures |
| 4 | Hub-and-spoke / network | Relationships, dependencies, reach |
| 5 | Side-by-side comparisons | Before/after, old/new, option A vs B |
| 6 | Annotated visual metaphors | Abstract concepts (foundations, levers, bridges) |
| 7 | Timelines with markers | Chronological narratives |
| 8 | Scorecard / matrix visuals | Multi-criteria evaluation (icons + bars, not text rows) |
| 9 | Tables with visual indicators | Reference data (last resort for comparisons) |
| 10 | Card grids with text | Flat lists with no visual relationship |

Card grids and bullet points are acceptable only when the content is a flat list
of genuinely equal-weight items with no spatial, temporal, or comparative
relationship between them.

For inline SVG diagrams in React, use Framer Motion for entrance animations and
Tailwind for styling. Wrap diagrams in a container with `backdrop-blur`,
`border-border`, and `rounded-2xl` for visual depth.

### Writing style

- **Titles: 5 words max.** Titles should tell the story: "What Isn't Portable Yet"
  is better than "Portability Analysis." "Revenue Up 40% YoY" beats "Revenue Update."
- **No em dashes.** Use colons, commas, semicolons, or periods.
- **Bold for emphasis, not italics.** Italics are hard to read on projectors and screens.
- **Callout cards:** lead with `<strong>label:</strong>` then the explanation. One sentence.
- **Attributed quotes:** use `<blockquote>` with a source line. Direct quotes from
  source documents build credibility. Attributed quotes are stronger than paraphrased claims.

### Interaction quality bar

Hard-won rules for interactive sections. Violating any of these is what makes
a deck feel "flickery" or "disruptive":

- **Click selects; hover never swaps content.** Hover-driven selection thrashes
  the instant the cursor travels toward the panel it just changed. Hover only
  affects affordance styling (lift, brightness, cursor).
- **Swappable panels keep a static structure.** Key and animate only the
  variable text spans (a 0.25–0.35s rise/fade is enough). Never remount or
  re-fade the whole container on selection change — that reads as flicker.
- **Normalise copy lengths across states** (aim for the same line counts), then
  pin the tail content with a bottom-anchored footer (`flex-col` + `mt-auto`).
  The container must not reflow when the selection changes.
- **Separate entrance from state.** Entrance motion (framer `whileInView`) goes
  on a wrapper element; active/dim styling goes on an inner element. Framer's
  animated opacity overwrites inline `style.opacity` — on one element they fight.
- **`clip-path` clips `box-shadow`.** To glow a clipped shape, put
  `filter: drop-shadow(...)` on the un-clipped wrapper.
- **Compose full-viewport heroes** like the reference decks: top meta bar /
  display-type centre (TextSplit + scroll parallax) / hairline-ruled bottom
  strip with big-number meta. A single stacked column of `Reveal`s reads flat.
- **Scrollytelling over static lists** for sequential stories: pin the diagram
  (`sticky`), accumulate state as the reader scrolls the steps (IntersectionObserver
  with a centre band, e.g. `rootMargin: "-42% 0px -42% 0px"`), and keep a static
  fallback for print and mobile.

### Core standards

1. **Narrative arc**: Every presentation tells a story. Follow the emotional arc:
   attention, empathy, credibility, tension, resolution, call to action.
   (See Content Strategy above.)
2. **Visual rhythm**: Alternate dark and light sections. Never have two consecutive
   sections with the same background.
3. **Data-driven**: Include real numbers, stats, and metrics wherever possible.
   Use `AnimatedCounter` for key figures.
4. **Animations**: Use `Reveal` for section content. Use `StaggerChildren` for
   lists and grids. Don't over-animate: subtlety is key.
5. **Responsive**: All layouts must work on mobile. Use responsive grid classes.
6. **No placeholder content**: Every stat, quote, and claim should be grounded in
   the brief or attached documents. If data is missing, note it in the
   presentation as "TBD" rather than making up numbers.
7. **Tension before resolution**: Don't present the answer before the audience
   feels the problem. Front-load the audience's language, then extend it.
8. **Quote the source material**: Direct quotes from briefs, reviewer comments,
   or data build credibility. Never make claims you can't source.
