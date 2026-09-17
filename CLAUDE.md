# Openstage — Project Guidelines

Project-specific rules for this presentation framework. Cross-project standards live in `/Users/alibadereddin/Code/CLAUDE.md`.

Tinkerstage (tinkerer-presenter) and present.coldclub.com (cc-presenter) are instances of this framework; rules live here.

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

### API pattern

```typescript
import OpenAI from "openai";
import { writeFileSync } from "fs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

async function generateSlideImage(slug: string, concept: string) {
  const result = await openai.images.generate({
    model: "gpt-image-2",
    prompt: `Create a clean, minimal illustration for a presentation slide about: "${concept}".

      Rules:
      - NO text, labels, numbers, or legends anywhere in the image.
      - Dark background (#0b1b26) with light shapes.
      - Colour palette: <deck palette>.
      - Minimal, elegant — presentation visual, not a poster.
      - Pure visual metaphor — no words needed to understand it.`,
    size: "1536x1024",
    quality: "medium",
    n: 1,
  });

  const b64 = result.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image returned");
  writeFileSync(`public/generated/${slug}.png`, Buffer.from(b64, "base64"));
}
```

---

## Scroll-Page Sidebar Nav

Use the shared [`<ChapterNav>`](src/components/chapter-nav.tsx) component for every scroll deck. Per-deck inline ChapterNav implementations were retired in May 2026 — every scroll deck uses the shared component via a thin wrapper. Do **not** re-introduce inline implementations.

### Why a shared component

The shared component uses the `useActiveSection` hook from [`src/lib/use-active-section.ts`](src/lib/use-active-section.ts) which picks the **deepest-visible** section (largest index in the ids list). Naively returning the first visible section gets stuck on earlier sections that still overlap the activation band — this hook fixes that pitfall in one place.

### Pattern: thin per-deck wrapper

Each deck keeps a local `ChapterNav` wrapper that injects its own palette and (if applicable) translated labels. Everything else lives in the shared component.

> ⚠️ The snippet below calls `useLanguage()` / `T[language]`, which require the i18n port (see the Internationalization section — `src/lib/i18n.tsx` does not exist in openstage yet). An English-only deck skips the wrapper entirely and passes a plain `CHAPTERS` array straight to `<ChapterNav>`, exactly as `src/content/ai-patterns.tsx` does.

```tsx
import { ChapterNav as SharedChapterNav } from "@/components/chapter-nav";

function ChapterNav() {
  const { language } = useLanguage();
  return (
    <SharedChapterNav
      chapters={CHAPTER_IDS.map((id, i) => ({
        id,
        label: T[language].chapters[i],
        dark: true,
      }))}
      toneOnDark={{
        activeDot: "bg-[<deck accent>]",
        activeText: "text-[<deck accent>]",
        activeGlow: "shadow-[0_0_10px_<deck accent, 50% alpha>]",
        inactiveDot: "bg-white/25 group-hover:bg-white/50",
        inactiveTextHover: "group-hover:text-white/60",
      }}
      rootMargin="-20% 0px -20% 0px"
    />
  );
}
```

- Labels reveal on hover/active only — never always-visible (overlap risk on the right side).
- Each chapter can opt into the light-tone palette via `dark: false`, and the shared component will use `toneOnLight` instead. See [`ai-patterns.tsx`](src/content/ai-patterns.tsx) for a mixed dark/light deck (its `CHAPTERS` array sets `dark` per chapter).
- Most decks use `rootMargin="-20% 0px -20% 0px"`. The shared default is `"-30% 0px -60% 0px"` which works for taller sections.
- Reference: [`src/content/ai-patterns.tsx`](src/content/ai-patterns.tsx) is the canonical wrapper (a `CHAPTERS` array passed straight to the shared `<ChapterNav>`). Note: `sample-scroll.tsx` still carries a legacy inline `ChapterNav()` — it is the component catalog, not the nav reference.

---

## Floating Widget Hub (DeckControls, Narrator, Feedback)

Every deck has three floating widgets that share the bottom band: [`<DeckControls>`](src/components/deck-controls.tsx) (the theme/feedback/print pill), [`<ScrollNarrator>`](src/components/scroll-narrator.tsx) (the mic that expands into the narrator panel), and the global feedback widget. They look fine in isolation and break in subtle ways together. Follow these rules so every new deck behaves consistently.

### DeckControls behaviors

Consolidated floating control hub for in-deck affordances (theme switcher + feedback + print). Replaces scattered button overlays.

```tsx
import { DeckControls } from "@/components/deck-controls";

// At the root of a deck:
<DeckControls hasNarration={false} />
```

- Auto-suppresses the global feedback bubble while mounted so the two don't compete.
- Auto-hides in print mode so PDF exports stay clean.
- Position defaults to `bottom-right`; pass `position="top-right"` for top-anchored layouts.
- When the deck has a `<ScrollNarrator />` (also bottom-right), pass `hasNarration` so DeckControls shifts left.

### Visual uniformity inside the hub

Every icon button in `<DeckControls>` must share **one** styling — flat, transparent, hover-only background. No bordered chips, no tinted backgrounds, no "active" treatments. If one button reads as a selected/active item while the others don't, users assume it's a toggled state, not a control.

Specifically, the theme switcher's `icon` variant ships with its own `border + bg-white/5`. Inside DeckControls we override it via `triggerClassName` so it matches the siblings:

```tsx
const buttonClass =
  "w-9 h-9 rounded-full text-white/80 hover:text-white hover:bg-white/10 ...";

<ThemeSwitcher variant="icon" onDark triggerClassName={buttonClass} />
<ControlButton buttonClass={buttonClass} ... />
```

**Anti-pattern:** letting `<ThemeSwitcher variant="icon">` render its default chip styling inside the hub — it looks like a permanently-selected toggle.

### Hide-on-overlap

> ⚠️ Requires porting from tinkerer-presenter — `NARRATOR_STATE_EVENT`, `useFeedbackStore.anchorSide`, and `src/lib/use-document-dir.ts` do not exist in openstage yet.

`<DeckControls>` and the expanded `<ScrollNarrator>` panel both live in the same bottom corner. They must not stack. `<ScrollNarrator>` dispatches a `NARRATOR_STATE_EVENT` whenever `expanded` changes; `<DeckControls>` listens and hides itself while the panel is open. Re-use this pattern for any future widget that shares the same corner — broadcast state, listen, hide.

### Open on the same edge as the trigger

> ⚠️ Requires porting from tinkerer-presenter — `NARRATOR_STATE_EVENT`, `useFeedbackStore.anchorSide`, and `src/lib/use-document-dir.ts` do not exist in openstage yet.

When the user clicks the feedback button inside `<DeckControls>`, the feedback panel must open **on the same screen edge** as that button. Opening on the opposite side is disorienting — the user's eye is on the right, the panel appears on the left, and the click feels broken.

Mechanism: `useFeedbackStore` has an `anchorSide: "left" | "right" | null` field. Hosts that own a trigger (e.g. DeckControls) set it when opening the panel; the widget honors it. When the panel closes, `anchorSide` resets to `null` so the standalone feedback bubble falls back to its default.

### RTL: mirror, don't translate

> ⚠️ Requires porting from tinkerer-presenter — `NARRATOR_STATE_EVENT`, `useFeedbackStore.anchorSide`, and `src/lib/use-document-dir.ts` do not exist in openstage yet.

Floating-widget anchors **must** flip horizontally in RTL decks. Vertical anchor (top vs bottom) stays put — reading direction is left/right, not up/down. The source of truth is [`useDocumentDir()`](src/lib/use-document-dir.ts), which reads `document.documentElement.dir` and re-renders on change.

```tsx
const dir = useDocumentDir();
const sideClass = dir === "rtl" ? "left-6" : "right-6";
```

`<DeckControls>`, `<ScrollNarrator>`, and the feedback widget all read this hook. The hub keeps the same offsets in RTL (e.g. when narration is mounted, the hub still sits "inside" the mic), the offset just resolves to the mirrored edge.

**Anti-pattern:** hardcoding `right-6` / `left-6` on a floating widget. If you find yourself reaching for either literal, route through `useDocumentDir()` instead.

### Checklist before shipping a new deck

- [ ] All buttons inside `<DeckControls>` share one flat styling — none reads as "selected."
- [ ] If the deck mounts `<ScrollNarrator>`, `<DeckControls>` has `hasNarration` set, so it auto-hides when the narrator expands.
- [ ] Feedback opens next to the button that triggered it (not on the opposite edge).
- [ ] If the deck is RTL (Arabic, Hebrew), the hub flips to the left edge and the narrator flips to the right edge.

---

## Theme Presets & Per-Deck Brand

The brand system uses a layered preset model: **global → registry hint → runtime override**. Live in [`src/lib/brand/`](src/lib/brand/).

- **Presets** ([`presets.ts`](src/lib/brand/presets.ts)) — `spectrum` is the default. `aurora`, `editorial`, `mono` ship as alternates. Press **T** anywhere to cycle.
- **Per-deck registry default** — set on `PresentationMeta.brand` in [`registry.ts`](src/content/registry.ts):
  ```ts
  { slug: "sample-scroll", title: "Sample Scroll", brand: { presetId: "aurora" } }
  ```
- **Runtime per-deck override** — managed via the [`<PerDeckOverrides>`](src/components/brand/per-deck-overrides.tsx) admin panel, stored in `localStorage["brand-overrides"]`.
- **`<BrandScopeForRoute>`** — mount this in the root layout to apply per-deck brand automatically based on the current route:
  ```tsx
  <BrandProvider>
    <BrandScopeForRoute>
      {children}
    </BrandScopeForRoute>
  </BrandProvider>
  ```
- **`useBrandNumeric()`** ([`numeric.ts`](src/lib/brand/numeric.ts)) — for Phaser/canvas consumers that need `0xRRGGBB` ints. Returns `cacheKey` for remounting embeds on brand change.

---

## Presentation Timer

[`<PresentationTimer>`](src/components/presentation-timer.tsx) — at-a-glance wall clock with optional section budgets. Drops at the deck root.

```tsx
<PresentationTimer
  sections={[
    { id: "hero", label: "Open", minutes: 0.5 },
    { id: "demo", label: "Demo", minutes: 1.5 },
    { id: "next", label: "Close", minutes: 0.5 },
  ]}
/>
```

Tone shifts amber → red when you overrun a section budget OR the total target. Hover the pill to reveal pause/reset controls. Hidden in print mode.

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
- If a single card visibly overpowers its neighbors at content-size (e.g. one has 5 lines, others have 1), rebalance the content — don't force equal height with `flex-1`.

---

## Card Grid Alignment (both modes)

When a row of cards each ends with a CTA (button, link, badge), the CTAs MUST land on the same horizontal baseline. If body-copy lengths differ — and they almost always do — naïve top-down stacking drifts the CTAs to different heights and the row reads as broken.

**Rule:** the CTA element gets `mt-auto`, not `mt-2` or any fixed margin. The card itself is `flex flex-col`. `mt-auto` claims the leftover vertical space above the CTA and pins it to the bottom regardless of body height.

**Anti-pattern:**
```tsx
<div className="flex flex-col gap-4">
  <h3>...</h3>
  <p>...</p>
  <a className="<button classes> mt-2 self-start">Apply</a>  {/* ❌ floats with body height */}
</div>
```

**Correct:**
```tsx
<div className="flex flex-col gap-4">
  <h3>...</h3>
  <p>...</p>
  <a className="<button classes> mt-auto self-start">Apply</a>  {/* ✅ pinned to bottom */}
</div>
```

Apply this anywhere multiple cards in a row share the same CTA pattern — pricing tiers, persona cards, feature comparisons, action grids. Pair with `h-full` on the card so all cards in the grid share the row's tallest height.

Also: card grids of any kind (linked or not) should signal interactivity consistently. If even one card in the row is a link, make sure it (a) uses `<a>` not `<div>`, (b) opens external destinations in a new tab with `target="_blank" rel="noopener noreferrer"`, and (c) has a hover affordance — e.g. `hover:-translate-y-1 hover:border-white/40` plus a small `↗` glyph in the corner. Without the affordance, users won't know the card is clickable.

---

## Internationalization (i18n / RTL)

> ⚠️ Porting note: openstage has no `src/lib/i18n.tsx` and `DeckControls` has no `hasLanguage` yet — port from tinkerer-presenter before enabling.

Every new deck for an RTL language (or any deck that may need translation) must use this pattern on first ship — retrofitting strings later is significantly more painful than writing it in from the start. The language set is open-ended: a deck ships whichever languages it needs; the framework does not fix the list.

### Wiring

- [`<LanguageProvider>`](src/lib/i18n.tsx) is mounted at the app root in [src/app/layout.tsx](src/app/layout.tsx). Don't add another.
- Read the current language with `useLanguage()` → `{ lang, dir, setLang, pick }`.
- `pick({ en, ar, ... })` selects the active translation; equivalent to `T[lang]`.
- `lang` choice is persisted in `localStorage` under the key `"openstage-lang"`; `dir` + `lang` are mirrored onto `<html>` so global widgets (DeckControls, Narrator, Feedback) flip together automatically.

### Translations are co-located

Each deck owns its own `T = { en: {...}, <lang>: {...}, ... }` const at the top of the file. Don't pull translations into a separate JSON — keeping copy next to the layout that renders it is how it stays in sync as the deck evolves. Match the structure to the section structure of the deck (`T.en.hook.title`, `T.en.cities.cards.first.blurb`, …).

```tsx
const T = {
  en: { hook: { kicker: "00 · Calibrate", title: "..." } },
  ar: { hook: { kicker: "00 · تهيئة الغرفة", title: "..." } },
  // add every language the deck ships — the set is open-ended
} as const;
type Strings = typeof T.en;
```

Each section component takes `s: Strings` (and `rtl: boolean` when its layout flips):

```tsx
function HookSection({ s }: { s: Strings }) {
  return <h2>{s.hook.title}</h2>;
}
```

The root component picks once and threads the picked object down:

```tsx
const { lang, dir, pick } = useLanguage();
const s = pick(T);
const rtl = dir === "rtl";
```

### Rules

- **All user-visible strings** go into T — headings, body copy, labels, callouts, list items, chart axis labels, tooltip text, button labels. Nothing hardcoded in JSX.
- **Data arrays** (cascade items, stages, tips, etc.) go into T too — each item as an object with translated string fields.
- **Inline highlights** (e.g. `<span style={{color: accent}}>25× faster</span>`) split the surrounding sentence into `bodyPre / bodyKey / bodyPost` keys in T so translators can reorder as needed.
- **`LanguageSwitcher`** must be placed somewhere accessible on every presentation:
  - **Slide presentations**: already in `SlideControls` via `<LanguageSwitcher compact className="mr-1" />`
  - **Scroll presentations**: add `<LanguageSwitcher compact />` at the bottom of the sidebar nav component
- **Language state** persists to `localStorage` key `"openstage-lang"` — already handled by `LanguageProvider` in the root layout.
- React elements are lazily rendered, so calling `useLanguage()` inside a component and using `T[lang]` is all that's needed — no architecture changes to `Presentation.slides[].content: ReactNode`.

### Adding a new presentation

1. Add `import { useLanguage } from "@/lib/i18n"` to the content file
2. Define `const T = { en: {...}, <lang>: {...}, ... } as const` at the top of the file, with every string in every language the deck ships
3. Call `useLanguage()` inside each component that renders text (or pick once at the root and thread `s: Strings` down)
4. For scroll presentations, add `<LanguageSwitcher compact />` to the chapter nav

### Opt in via DeckControls

Pass `<DeckControls hasLanguage />` to expose the language switcher pill. **Do not** enable `hasLanguage` on a deck that hasn't been translated — flipping `dir` while leaving the default language in place reads as broken.

### RTL: what to flip explicitly

`dir="rtl"` on the `<main>` handles text alignment and inline flow automatically. Most other RTL adjustments are physical-Tailwind utilities that don't auto-mirror. For these, branch on the `rtl` prop:

- **Side anchors**: `right-6` ↔ `left-6`, `right-5` ↔ `left-5`, `-right-[42px]` ↔ `-left-[42px]`.
- **Borders / rails**: `border-l-2 pl-10` ↔ `border-r-2 pr-10` (timeline rails, sidebar rails).
- **Flex direction reversal** for chevron + label pairs: add `flex-row-reverse` so the icon ends up on the inside.
- **Arrow icons that imply direction**: flip with `scale-x-[-1]` so they point "forward" in reading direction.
- **Motion offsets**: `initial.x = rtl ? -6 : 6` for slide-in animations.

Tailwind also ships logical utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`) that auto-flip. Use them where possible for new code; they remove the need to branch.

### Always-LTR inserts

Some content must stay LTR even inside an RTL context. Wrap with `dir="ltr"`:

- **Numerals**: digit strings inside an RTL bidi context get reversed visually around separators — `106,578` renders as `875,601`. Always wrap stat numbers (`<FlipNumber>`, region counts, percentages) in `dir="ltr"`.
- **Timestamps / version strings**: `6:00 PM GMT+3`, `v1.2.3`, `github.com/handle`.
- **Latin proper nouns** in a primarily-RTL line — city names in a marquee, brand names inside RTL copy.

### SSR hydration safety

`localStorage` is unavailable on the server, so SSR always renders `defaultLang`. For a returning user on a non-default language, the client's first render would diverge from SSR and React tears the subtree. Two-part fix already in place:

1. `LanguageProvider` tracks `hasHydrated` internally — but this alone isn't enough for descendants whose first render happens after the provider's effects run.
2. **Mount-gate any component that reads `useLanguage` during render.** Render the default language until `useEffect` flips a local `mounted` flag, then swap. One paint of flicker for a returning non-default-language user; zero hydration warnings.

```tsx
const { lang, dir, pick } = useLanguage();
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
const s = mounted ? pick(T) : T.en;
const effectiveDir = mounted ? dir : "ltr";
```

This is required at the deck root **and** inside `<DeckControls>`'s language button. Anywhere else that branches on `lang` during render needs the same treatment.

### RTL polish checklist before shipping

- [ ] Every visible string lives in `T` — including kickers, captions, button labels, aria-labels, alt text. Easy to miss: chart axis labels, error states, empty states, screen-reader hints.
- [ ] `<DeckControls hasLanguage />` is set, and the switcher works both ways without console errors.
- [ ] Numerals are wrapped in `dir="ltr"` (no reversed digits around commas).
- [ ] Sidebar nav, badges, timeline rails, and chevrons mirror correctly in RTL.
- [ ] Arrow icons that imply direction flip via `scale-x-[-1]`.
- [ ] A returning RTL-language user (with `localStorage.setItem("openstage-lang", "ar")`) hard-reloads with **zero** hydration warnings in the console.
- [ ] Latin proper nouns inside RTL copy don't break the line — wrap in `dir="ltr"` if they do.

### Hard rule: never key map'd children by translated content

When mapping items inside any framer-motion container (`StaggerChildren`, `Reveal`, etc.), **always key by index or a stable non-translated id** — never by `item.title`, `item.name`, or any other translated string.

**Why:** `StaggerChildren` uses `viewport={{ once: true }}` ([`src/components/animations/reveal.tsx`](src/components/animations/reveal.tsx)). Once it fires, the in-view observer unsubscribes and the parent's "visible" variant is locked in. If children keys change on language switch (because keys are translated strings), React unmounts the old children and mounts new ones — the new children inherit `initial="hidden"` but the parent observer is gone, so they never animate to visible. Result: cards render in the DOM at opacity 0 and the section looks empty in any language other than the one the user first scrolled past.

```tsx
// ❌ Wrong — title differs per language, causes remount + invisible cards on language switch
{cards.map((card) => (
  <StaggerItem key={card.title}>...</StaggerItem>
))}

// ✅ Correct — index is stable across language switches
{cards.map((card, i) => (
  <StaggerItem key={i}>...</StaggerItem>
))}
```

This applies to **any** map'd children inside `StaggerChildren`, `Reveal`, or a `motion.div` parent that uses `whileInView` + `once: true`. Plain `<li>` lists outside framer containers are fine with string keys.

---

## Common scroll-deck pitfalls

Bug patterns that have bit us recently. Check against these before generating a new deck.

### `<Section>` primitive + `flex items-center` collapses to the left

When a section's outer `<section>` has `flex items-center` and the inner wrapper has no `w-full`, the wrapper becomes a flex item with `width: auto`, collapses to the content's intrinsic width, and pins to `justify-content: flex-start`. The inner `max-w-Nxl mx-auto` then has no leftover space to center against — the entire section glues to the left edge of the viewport.

**Always:**
```tsx
function Section({ children, dark, className }) {
  return (
    <section className={`relative ${dark ? "bg-bg-dark" : "bg-bg-light"} ${className ?? ""}`}>
      <div className="relative z-10 w-full">{children}</div>  {/* ← w-full is load-bearing */}
    </section>
  );
}
```

If the deck uses `<Section className="... flex items-center ...">` anywhere, the wrapper **must** have `w-full`. Otherwise every centered section is silently broken.

### `<Section>` primitive clips full-bleed backgrounds to content height

The shared `Section` wraps children in `<div className="relative z-10 w-full">` — content-height, with no `h-full` or `flex-1`. Any `absolute inset-0` child (a background image, a gradient overlay, a `ParticleField`) anchors to *that* inner wrapper, not to the outer `min-h-screen` `<section>`. When content is shorter than the viewport, the background stops mid-screen with a visible horizontal seam and the bottom of the section is empty void.

Why `<AuroraBackground className="absolute inset-0" />` works inside a tall hook section anyway: that section's content (brand strip + `pt-20 pb-24` + a 540px quiz) is taller than viewport, so the wrapper grows tall, and the `inset-0` background fills it. The bug only surfaces on **short-content sections that rely on `min-h-screen` for vertical reach** — typically intro / hero / handoff slots where the whole point is a full-bleed image with sparse text on top.

**Fix:** for any section that needs a full-bleed background under sparse content, bypass `<Section>` and write the `<section>` directly so `absolute inset-0` anchors to the full screen-height box and the flex column actually flexes:

```tsx
<section
  id="intro"
  className="relative bg-bg-dark text-white min-h-screen flex flex-col overflow-hidden"
>
  <img src="/generated/hero.png" alt="" aria-hidden
       className="absolute inset-0 w-full h-full object-cover" />
  <div className="absolute inset-0" style={{ background: "..." /* gradient */ }} />

  <div className="relative z-10 ...">{/* brand strip */}</div>
  <div className="relative z-10 flex-1 flex items-center">{/* welcome */}</div>
  <div className="relative z-10 pb-10">{/* scroll cue */}</div>
</section>
```

Reference: `HeroSection` in [`src/content/ai-patterns.tsx`](src/content/ai-patterns.tsx) (a `min-h-screen flex flex-col` section with an `absolute inset-0` WebGL hero). Keep `<Section>` everywhere else — only bypass when you genuinely need an `inset-0` background to reach the floor of a `min-h-screen` viewport.

### `<EditorialGrid>` is a 12-column grid — cells declare span

`<EditorialGrid>` does NOT accept a `columns` prop. It's a fixed `repeat(12, minmax(0, 1fr))` grid. Each `<EditorialCell>` must declare a span via the `span` preset (`"half"`, `"halfRight"`, `"kicker"`, `"lede"`, `"aside"`, `"figure"`, `"quote"`, `"wide"`, etc.) or via explicit `col` / `colStart` props. Cells without a span fall back to grid auto-placement, which gives each one a single 1/12 column — content squashes into a narrow vertical strip.

**Wrong**: `<EditorialGrid columns={2}> <EditorialCell> ... </EditorialCell> ... </EditorialGrid>`
**Right**: `<EditorialGrid> <EditorialCell span="half"> ... </EditorialCell> <EditorialCell span="halfRight"> ... </EditorialCell> </EditorialGrid>`

For a "just give me N equal columns" layout, use a plain `<div className="grid grid-cols-N gap-...">` — `<EditorialGrid>` is for the asymmetric magazine-style grids it ships presets for.

### Wide numbers in narrow grid cells overflow

`FlipNumber` (or any large numeric display) at `text-5xl` is ~48px per digit. In a `grid-cols-5` row on `max-w-6xl`, each cell is ~230px including padding — a 7-character number like `106,578` overflows. The comma and trailing digits leak past the cell border.

**Defaults that survive**: `text-2xl md:text-3xl lg:text-4xl` plus `min-w-0` on the cell. `min-w-0` lets the cell shrink below its content's intrinsic minimum (CSS grid items default to `min-width: min-content`, which would otherwise push the cell wide).

### SVG attributes vs CSS sizing

`<svg height="auto" />` is **invalid** — SVG attributes accept lengths and percentages, not the keyword `auto`. Use CSS for "shrink to fit aspect ratio": `className="w-full h-auto"`. If a component takes a `width` / `height` prop that defaults to `"auto"`, only pass it through as an SVG attribute when the caller actually provided a numeric value:

```tsx
<svg
  viewBox={viewBox}
  {...(width !== undefined ? { width } : {})}
  {...(height !== undefined ? { height } : {})}
  className="w-full h-auto"
/>
```

### Framer `useScroll({ target })` needs `position: relative`

If `useScroll` is pointed at a `ref` whose element is `position: static` (the block default), Framer logs a console warning and the offset calculation is wrong. Always put `relative` on the className of any element you attach a `useScroll` ref to. This is enforced for `useSectionProgress` callers throughout `src/components/scrollytelling/*`; do the same in any new scroll-linked primitive.

### Phaser games can't all mount at once (WebGL context limit)

Browsers cap simultaneous WebGL contexts at ~16. A page that mounts more than ~10 Phaser games on first render triggers a cascade of "Too many active WebGL contexts" + "WebGL Context lost. Renderer disabled" warnings, and games randomly stop working.

Use the [`<LazyGame>`](src/content/showcase-games.tsx) pattern: an `IntersectionObserver` wrapper that only renders the game when the section is near the viewport (300px rootMargin). At most 2–3 games are hot at any time. Apply to any deck that mounts more than ~5 games.

```tsx
function LazyGame({ children, placeholder }) {
  const ref = useRef(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "300px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref}>{active ? children : placeholder}</div>;
}
```

### Every scroll deck needs the floating widget hub

A scroll deck without `<DeckControls>` ships without theme switcher, feedback affordance, language switcher, or print export — the host has no controls during the talk. Always mount `<DeckControls>` (and `<ScrollNarrator>` if the deck has narration). See the "Floating Widget Hub" section above for the wiring rules.

---

*Last updated: 2026-09-17 — consolidated from presenter, cc-presenter and tinkerer-presenter into the canonical Openstage ruleset.*
