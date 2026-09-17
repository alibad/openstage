# presenter — Project Guidelines

Project-specific rules for this presentation template. Cross-project standards live in [`/Users/alibadereddin/Code/CLAUDE.md`](../../CLAUDE.md).

Two presentation modes:
- **Scroll** (`type: "scroll"`) — long-form scrollytelling, lives in [`src/content/<slug>.tsx`](src/content/), route at `/<slug>-scroll`
- **Slides** (`type: "slides"`) — fixed-height slide deck, lives in [`src/content/slides/<slug>.tsx`](src/content/), route at `/<slug>`

Both register in [`src/content/registry.ts`](src/content/registry.ts).

Reference decks (study these before building anything new):
- **Flagship scroll**: [`src/content/awwwards-flagship.tsx`](src/content/awwwards-flagship.tsx) — every Phase 2 primitive sequenced into one argument
- **Component catalog**: [`src/content/sample-scroll.tsx`](src/content/sample-scroll.tsx) — 35+ components on parade
- **Slide-mode reference**: [`src/content/sample-slides.tsx`](src/content/sample-slides.tsx)

---

## Presentation Quality Bar — Visual Variety & First-Shot Richness

These rules apply to **scroll presentations**. Slide decks have separate constraints (see "Slide Content Budget" below).

A weak deck is all card grids with one hero image — pedagogically sound but visually inert. A strong deck interleaves pinned media, interactive scales, charts, and bespoke imagery so the reader *feels* the scroll. If a new deck doesn't pass the checklist below on first shot, it's not done.

### Hard rules — every scroll deck must hit these

| Rule | Threshold |
|------|-----------|
| Generated images | ≥ 1 per 3 chapters (round up). 14-chapter deck → ≥ 5 images. |
| Non-card-grid sections | ≥ 3 per deck. Use `StickyMedia`, `Spectrum`, `AnimatedTimeline`, `AnimatedLineChart`, `OrbitCarousel`, `EditorialGrid`, `HorizontalPin`, or a custom scroll-bound primitive. |
| Consecutive card-grid sections | Max 2. After two, the next section MUST be a different primitive. |
| Scroll-bound visual transform | ≥ 1. Image scale/opacity tied to scroll progress, parallax, pinned hero, or `useScroll`-driven custom SVG. |
| Interactive primitive | ≥ 1. Spectrum scrub, OrbitCarousel rotate, BeforeAfter drag, or scroll-driven simulation. |
| Callout per major section | Each major section ends with a single counter-intuitive claim in a `<Callout>` — **not** a summary of the body. |

### Primitive shopping list — reach for these before card grids

**Composition** (load-bearing — these form the spine of the deck):
- `StickyMedia` ([`src/components/scrollytelling/sticky-media.tsx`](src/components/scrollytelling/sticky-media.tsx)) — pinned image + scroll-staggered cards. Best for multi-step processes (cascades, pipelines, walk-throughs).
- `Spectrum` ([`src/components/scrollytelling/spectrum.tsx`](src/components/scrollytelling/spectrum.tsx)) — scrubable horizontal scale. Use for *any continuum* (intensity, dose, phase, time scale). Replaces a "5-zone card grid."
- `OrbitCarousel` ([`src/components/animations/orbit-carousel.tsx`](src/components/animations/orbit-carousel.tsx)) — 5–6 items around a hub. Use for taxonomies. Better than a flat 5-card row.
- `EditorialGrid` ([`src/components/animations/editorial-grid.tsx`](src/components/animations/editorial-grid.tsx)) — generous 2–3 column layout for rich cards with imagery. Use this instead of `<div className="grid grid-cols-3">` whenever cards have an image or icon hero.
- `HorizontalPin` ([`src/components/scrollytelling/horizontal-pin.tsx`](src/components/scrollytelling/horizontal-pin.tsx)) — drag/scroll horizontal panel. Use for sequences.

**Data viz** (charts beat bullets — note: lives in [`src/components/charts/`](src/components/charts/), not `animations/`):
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

### Image budget — match images to chapter type

- **Process / anatomy chapter** → bespoke generated image.
- **Stat / data chapter** → no image; let the chart carry it.
- **Taxonomy chapter** (the 5 X) → one composite image showing all 5, OR per-item images inside an `OrbitCarousel`.
- **Definition / framework chapter** → optional; image only if it reinforces the metaphor.

Add image prompts to [`scripts/gen-images.mjs`](scripts/gen-images.mjs) **as part of the build, not as a follow-up.** Generate them before declaring the deck done.

### Copy patterns

- **Section titles name the thing, not the question.** "The Cascade" not "How does stress cascade?"
- **Numbered points get semantic titles too.** "01 · The Event / 02 · The Cascade / 03 · The Shift" — not "Step 1 / Step 2 / Step 3."
- **Lede frames the stakes.** Open with authority, metaphor, or frame — not a question.
- **Callouts are counter-intuitive claims.** Not summaries.
- **Tagline = 5 short words separated by middots.** Repeats in hero and CTA.
- **Color is semantic.** Pick a palette per deck (e.g. teal = restoration, amber = activation, indigo = depth, rose = warning, cyan = primary). Reuse across sections so the palette teaches.

### First-shot checklist (run before declaring a presentation done)

- [ ] Image count ≥ chapters/3 — **and** prompts are committed to `gen-images.mjs`.
- [ ] At least one `StickyMedia` or `HorizontalPin` section.
- [ ] At least one chart or `Spectrum` section.
- [ ] At least one scroll-bound transform (scale / opacity / parallax / custom SVG).
- [ ] No three consecutive card-grid sections anywhere in the deck.
- [ ] Every major section ends with a `Callout` that says something *new*, not a summary.
- [ ] Tagline appears in hero **and** CTA.
- [ ] Reference deck comparison: open `awwwards-flagship.tsx` side-by-side and ask "does this feel as alive?"

### Anti-patterns

- Many chapters / 1 image / 0 charts / 0 sticky sections / 0 spectrum / 0 scroll-bound transforms.
- Same `grid grid-cols-N` card-row pattern repeated section after section.
- Continuum content (time scales, low↔high) shown as bullet cards instead of a `Spectrum` or `AnimatedTimeline`.
- Taxonomies (3 sources, 5 levers) shown as flat grids instead of `OrbitCarousel` or `EditorialGrid`.
- Callouts that paraphrase the body copy instead of landing a new claim.

---

## Image Generation (GPT Image 2)

Use **OpenAI GPT Image 2** (`gpt-image-2`, released April 2026) to generate images for slides that genuinely need one. Most slides don't — earn it.

Env var: `OPENAI_API_KEY` (in `.env.local`). Image generation requires org verification on the OpenAI account.
SDK: `openai` (already in `package.json`).

### Model & sizing

| Param | Value |
|---|---|
| `model` | `gpt-image-2` |
| `size` | `1024x1024` (square), `1536x1024` (landscape, default for slides), `1024x1536` (portrait) |
| `quality` | `low` (~$0.006), `medium` (~$0.053, default), `high` (~$0.211) |

Default to `medium` quality for slide visuals — `high` only for hero/cover imagery where detail matters.

### When to generate an image

Only when the slide's concept is inherently visual and existing primitives (`FlowDiagram`, `StatGrid`, `AnimatedTimeline`, charts) don't cut it:
- **Anatomical / biological diagrams** — body systems, physiological processes
- **Abstract metaphors** — conceptual illustrations that aid intuition
- **Infographic-style compositions** — proportion, flow, cause-and-effect

**Skip it when:**
- The slide is a cover, title, or section divider with no metaphor to carry
- Stats tell the story — use `StatCard` / `StatGrid`
- The slide already has 3+ bullet items — images crowd it
- The concept is too abstract to convey without text cues

**One image per slide maximum.**

### Hard rules for generated images

1. **Zero text in the image** — no labels, numbers, legends, or annotations. Decks ship in multiple languages; text baked into a raster image is untranslatable.
2. **Pure visual metaphor** — shapes, anatomy, flow, colour — not words.
3. **Dark-palette compatible** — prompt for a dark background (e.g. `#0b1b26` or `#0f172a`) or transparent-friendly composition so it doesn't look pasted in.
4. **Match the deck's palette** — hint at the deck's accent colours in the prompt so generated imagery feels integrated.
5. **Run server-side, save once** — never call OpenAI from the client. Generate via [`scripts/gen-images.mjs`](scripts/gen-images.mjs), save the PNG as a static asset in [`public/generated/`](public/generated/), and reference it with `<img>` or Next.js `<Image>`.

### Workflow

1. Decide the slide needs an image (apply the criteria above).
2. Add `{ slug, prompt }` to [`scripts/gen-images.mjs`](scripts/gen-images.mjs) and run `npm run gen-images`.
3. The PNG lands in `public/generated/<slug>.png`.
4. Reference it in the slide component: `<img src="/generated/<slug>.png" className="..." />`.
5. Commit the PNG — it's a static asset, not a runtime call.

**Never regenerate at runtime.** Images are generated once, committed, and served statically. The script skips any slug whose PNG already exists; delete the PNG first to regenerate.

---

## Scroll-Page Sidebar Nav

When building a fixed sidebar nav (chapter dots on a scrollytelling page), **never render labels as always-visible text** — they will overlap page content on the right side.

### Correct pattern: dots always, labels on hover only

```tsx
<nav className="fixed top-1/2 -translate-y-1/2 right-6 z-50 hidden lg:flex flex-col gap-1.5 items-end">
  {CHAPTERS.map((ch) => {
    const isActive = active === ch.id;
    const isHovered = hovered === ch.id;
    return (
      <button key={ch.id} onMouseEnter={() => setHovered(ch.id)} onMouseLeave={() => setHovered(null)}>
        {/* Label slides in from the right on hover/active — zero footprint otherwise */}
        <AnimatePresence>
          {(isActive || isHovered) && (
            <motion.span
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ duration: 0.15 }}
            >
              {ch.label}
            </motion.span>
          )}
        </AnimatePresence>
        {/* Dot grows on active/hover */}
        <motion.div animate={{ width: isActive ? 20 : isHovered ? 12 : 6 }} style={{ height: 6, borderRadius: 3 }} />
      </button>
    );
  })}
</nav>
```

- Resting state: dots only (~6px wide) — no overlap risk
- Active chapter: label slides in + dot expands to pill
- Hover: same reveal, dimmer color

Reference: [`src/components/chapter-nav.tsx`](src/components/chapter-nav.tsx) — copy from there when adding a new scroll deck.

---

## Slide Content Budget (slide-mode only)

Slides render in a **fixed-height container**. Content that exceeds the visible area is clipped — there is no scroll. Every slide must fit within its bounds.

**Hard limits per slide:**
- Max **4 list/numbered items** — never 5+
- Max **1 callout block** — and only if items ≤ 3
- Keep item descriptions to **1–2 lines** each
- Use `gap-4` between sections, not `gap-8`, unless the slide has very little content

**If content doesn't fit, cut — do not shrink font sizes or squeeze gaps.**
- Merge the last two items into one
- Move secondary detail to speaker notes
- Split into two slides if needed

### Don't stretch content cards to fill the slide

The slide canvas is fixed-height and already vertically-centers its child via `flex flex-col justify-center`. **Never** use `flex-1` on a content grid that holds small cards — it makes each card balloon to fill the leftover vertical space, leaving 60–80% of every card empty. The result reads as broken and lazy.

**Anti-pattern:**
```tsx
<div className="flex flex-col h-full gap-4">
  <Header />
  <div className="grid grid-cols-3 gap-4 flex-1">  {/* ❌ stretches every card */}
    <Card />  <Card />  <Card />
  </div>
</div>
```

**Correct pattern:**
```tsx
<div className="flex flex-col h-full justify-center gap-4">  {/* center the stack */}
  <Header />
  <div className="grid grid-cols-3 gap-4">  {/* ✅ cards size to content */}
    <Card />  <Card />  <Card />
  </div>
</div>
```

Rules:
- **Never** put `flex-1` on a content grid (`grid grid-cols-N`).
- Outer `flex flex-col h-full` wrappers should use `justify-center` so the natural-height content sits centered in the slide.
- If a card has only 2–3 lines, keep the card height to that — don't pad it out with `flex-1`, `min-h-*`, or `h-full`.
- Body text in card bodies: minimum `text-sm`. Use `text-xs` only for tags/labels, never for paragraph content.
- If a single card visibly overpowers its neighbors at content-size (rebalance the content — don't force equal height with `flex-1`).

---

## Planned — not yet implemented

- **i18n (EN / ES / DE / AR)** — co-located `T` object + `useLanguage()` hook pattern, RTL handling for Arabic via `dir="rtl"` on the document and Tailwind RTL utilities. All user-visible strings (headings, body, list items, chart axis labels) will need to live in `T`. When this lands, every new presentation must include translations on first ship — retrofitting i18n is much more painful than writing it in from the start.

---

*Last updated: 2026-05-15 — initial project guide adapted from cc-presenter*
