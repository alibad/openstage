---
name: new-deck
description: Build or review a scroll presentation in the Openstage repo to the quality bar — visual variety, non-card-grid primitives, image budget per chapter type, copy patterns, and the first-shot checklist. Use when creating a new scroll deck, adding chapters, or deciding whether a scroll deck is done. (For slide-mode decks use slide-mode; for imagery use generate-image.)
---

# Presentation quality bar — visual variety & first-shot richness

These rules apply to **scroll presentations** (`type: "scroll"`, `src/content/<slug>.tsx`). Slide decks have separate constraints — use the `slide-mode` skill.

A weak deck is all card grids with one hero image — pedagogically sound but visually inert. A strong deck interleaves pinned media, interactive scales, charts, and bespoke imagery so the reader *feels* the scroll. If a new deck doesn't pass the checklist below on first shot, it's not done.

Study a reference deck side-by-side before building: `src/content/awwwards-flagship.tsx` (every primitive sequenced into one argument) and `src/content/sample-scroll.tsx` (35+ components on parade).

## Hard rules — every scroll deck must hit these

| Rule | Threshold |
|------|-----------|
| Generated images | ≥ 1 per 3 chapters (round up). 14-chapter deck → ≥ 5 images. |
| Non-card-grid sections | ≥ 3 per deck. Use `StickyMedia`, `Spectrum`, `AnimatedTimeline`, `AnimatedLineChart`, `OrbitCarousel`, `EditorialGrid`, `HorizontalPin`, or a custom scroll-bound primitive. |
| Consecutive card-grid sections | Max 2. After two, the next section MUST be a different primitive. |
| Scroll-bound visual transform | ≥ 1. Image scale/opacity tied to scroll progress, parallax, pinned hero, or `useScroll`-driven custom SVG. |
| Interactive primitive | ≥ 1. Spectrum scrub, OrbitCarousel rotate, BeforeAfter drag, or scroll-driven simulation. |
| Callout per major section | Each major section ends with a single counter-intuitive claim in a `<Callout>` — **not** a summary of the body. |

## Primitive shopping list — reach for these before card grids

**Composition** (load-bearing — these form the spine of the deck):
- `StickyMedia` (`src/components/scrollytelling/sticky-media.tsx`) — pinned image + scroll-staggered cards. Best for multi-step processes (cascades, pipelines, walk-throughs).
- `Spectrum` (`src/components/scrollytelling/spectrum.tsx`) — scrubable horizontal scale. Use for *any continuum* (intensity, dose, phase, time scale). Replaces a "5-zone card grid."
- `OrbitCarousel` (`src/components/animations/orbit-carousel.tsx`) — 5–6 items around a hub. Use for taxonomies. Better than a flat 5-card row.
- `EditorialGrid` (`src/components/animations/editorial-grid.tsx`) — generous 2–3 column layout for rich cards with imagery. Use this instead of `<div className="grid grid-cols-3">` whenever cards have an image or icon hero.
- `HorizontalPin` (`src/components/scrollytelling/horizontal-pin.tsx`) — drag/scroll horizontal panel. Use for sequences.

**Data viz** (charts beat bullets — note: lives in `src/components/charts/`, not `animations/`):
- `AnimatedTimeline` — phase-based narratives.
- `AnimatedLineChart` — dose-response, curves, simulations.
- `AnimatedBarChart`, `AnimatedPieChart`, `AnimatedMetric`, `FlipNumber` — for stat moments.
- `BeforeAfter` — slide-to-reveal comparisons.
- `FlowDiagram` — when the relationship between nodes matters more than the nodes themselves.
- `ScoreMatrix`, `DataTable` — for structured comparisons.

**Atmosphere** (used sparingly — one per deck max):
- `WebGLHero`, `MeshGradient`, `AuroraBackground` — premium hero feel.
- `ParticleField` — ambient texture; keep `opacity ≤ 0.15`.
- `Marquee` — keyword ticker between acts. Section break, not content carrier.

**Bespoke is encouraged when content is physics-driven.** Anatomy, gas exchange, dose-response — generic primitives won't communicate cause-and-effect. Build a custom `useScroll`-driven SVG. Pattern: `useScroll({ target: ref })` → `useTransform` → SVG attributes.

## Image budget — match images to chapter type

- **Process / anatomy chapter** → bespoke generated image.
- **Stat / data chapter** → no image; let the chart carry it.
- **Taxonomy chapter** (the 5 X) → one composite image showing all 5, OR per-item images inside an `OrbitCarousel`.
- **Definition / framework chapter** → optional; image only if it reinforces the metaphor.

Add image prompts to `scripts/gen-images.mjs` **as part of the build, not as a follow-up** (see the `generate-image` skill). Generate them before declaring the deck done.

## Copy patterns

- **Section titles name the thing, not the question.** "The Cascade" not "How does stress cascade?"
- **Numbered points get semantic titles too.** "01 · The Event / 02 · The Cascade / 03 · The Shift" — not "Step 1 / Step 2 / Step 3."
- **Lede frames the stakes.** Open with authority, metaphor, or frame — not a question.
- **Callouts are counter-intuitive claims.** Not summaries.
- **Tagline = 5 short words separated by middots.** Repeats in hero and CTA.
- **Color is semantic.** Pick a palette per deck (e.g. teal = restoration, amber = activation, indigo = depth, rose = warning, cyan = primary). Reuse across sections so the palette teaches. Never clone a reference deck's palette — every deck owns its identity.

## First-shot checklist (run before declaring a presentation done)

- [ ] Image count ≥ chapters/3 — **and** prompts are committed to `gen-images.mjs`.
- [ ] At least one `StickyMedia` or `HorizontalPin` section.
- [ ] At least one chart or `Spectrum` section.
- [ ] At least one scroll-bound transform (scale / opacity / parallax / custom SVG).
- [ ] No three consecutive card-grid sections anywhere in the deck.
- [ ] Every major section ends with a `Callout` that says something *new*, not a summary.
- [ ] Tagline appears in hero **and** CTA.
- [ ] Reference deck comparison: open `awwwards-flagship.tsx` side-by-side and ask "does this feel as alive?"
- [ ] Verified in a real browser (not just assumed from the code).

## Anti-patterns

- Many chapters / 1 image / 0 charts / 0 sticky sections / 0 spectrum / 0 scroll-bound transforms.
- Same `grid grid-cols-N` card-row pattern repeated section after section.
- Continuum content (time scales, low↔high) shown as bullet cards instead of a `Spectrum` or `AnimatedTimeline`.
- Taxonomies (3 sources, 5 levers) shown as flat grids instead of `OrbitCarousel` or `EditorialGrid`.
- Callouts that paraphrase the body copy instead of landing a new claim.

## Planned — when i18n lands (not yet implemented)

i18n (EN / ES / DE / AR) will use a co-located `T` object + `useLanguage()` hook pattern, with RTL handling for Arabic via `dir="rtl"` on the document and Tailwind RTL utilities. All user-visible strings (headings, body, list items, chart axis labels) will live in `T`. When this lands, every new presentation must include translations on first ship — retrofitting i18n is much more painful than writing it in from the start.
