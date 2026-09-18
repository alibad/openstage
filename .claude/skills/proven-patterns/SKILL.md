---
name: proven-patterns
description: "Reusable presentation patterns pioneered in real decks: bilingual / i18n (Arabic-English RTL toggle), chapter navigation, print/PDF mode, image extraction from source decks, collapsible deep-dives, inline SVG diagrams, scroll-driven hero effects, and product mock-ups. Use when implementing any of these — especially bilingual support. For chapter dot-nav on a scroll deck, pair with scroll-sidebar-nav (which owns the ChapterNav chrome)."
---

## Proven Patterns

These patterns were pioneered in specific presentations and are available for reuse.
Reference the source presentation for implementation details.

### Bilingual / i18n support

Full Arabic/English presentation with live toggle. Works for both scroll and
slide modes.

#### Core pattern

1. Define `type Lang = "ar" | "en"` and a translations object `t` at module scope.
2. Each language branch includes `dir: "rtl" as const` or `dir: "ltr" as const`.
3. Mark the whole object `as const` for narrow TypeScript inference.
4. In the main component: `useState<Lang>("en")`, derive `const s = lang === "ar" ? t.ar : t.en;`.
5. Wrap the root element with `dir={s.dir}` to flip the entire layout for RTL.
6. Every section component receives `s` as a prop. Type it as `typeof t.ar | typeof t.en`.
7. All visible text comes from `s.fieldName`, never hardcoded strings.

```tsx
type Lang = "ar" | "en";
type Strings = typeof t.ar | typeof t.en;

const t = {
  ar: {
    dir: "rtl" as const,
    langToggle: "English",
    hero: { title: "...", subtitle: "..." },
    // ... all sections
  },
  en: {
    dir: "ltr" as const,
    langToggle: "العربية",
    hero: { title: "...", subtitle: "..." },
    // ... mirror structure exactly
  },
} as const;
```

#### LangToggle positioning

The toggle button must not overlap other fixed elements (PrintButton, slide controls).

- **Scroll mode:** Place at `fixed top-6 left-6 z-[100]` (PrintButton is at `right-6`).
- **Slide mode:** Place at `fixed top-6 left-6 z-[200]` (SlideDeck controls use `z-50`).
- **Styling:** Use `bg-bg-dark/80 backdrop-blur-md border border-white/10 text-white`
  for visibility across both light and dark sections.
- Import `Languages` from `lucide-react` for the icon.
- Button text shows the *other* language name: Arabic UI shows "English", English UI shows "العربية".

```tsx
function LangToggle({ lang, onToggle }: { lang: Lang; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="fixed top-6 left-6 z-[100] flex items-center gap-2 px-4 py-2 rounded-full
        bg-bg-dark/80 backdrop-blur-md border border-white/10 text-sm text-white
        hover:bg-bg-elevated transition-colors print-hidden"
    >
      <Languages className="w-4 h-4" />
      {lang === "ar" ? "English" : "العربية"}
    </button>
  );
}
```

#### Text alignment for RTL

Where content uses `text-left` (cards, list items, comparison columns), make it
directional:

```tsx
const align = s.dir === "rtl" ? "text-right" : "text-left";
<div className={`p-8 rounded-2xl ${align}`}>
```

Centered content (`text-center`) does not need adjustment.

#### Scroll mode implementation

In scroll mode, the main component holds language state and passes `s` to each section:

```tsx
export default function MyPresentation() {
  const print = usePrintMode();
  const [lang, setLang] = useState<Lang>("en");
  const s = lang === "ar" ? t.ar : t.en;

  return (
    <div dir={s.dir}>
      <main className={`relative ${print ? "print-mode" : ""}`}>
        {!print && <LangToggle lang={lang} onToggle={() => setLang(l => l === "ar" ? "en" : "ar")} />}
        {!print && <PrintButton />}
        <ScrollProgress />
        <Section dark id="hero"><HeroSection s={s} /></Section>
        {/* ... */}
      </main>
    </div>
  );
}
```

#### Slide mode implementation

Slide mode requires a structural change because the content file normally exports
a static `Presentation` object. The solution:

1. Create a `buildPresentation(s: Strings): Presentation` function that constructs
   the slides array using translated strings.
2. Export a **default component** that holds language state and renders `SlideDeck`:

```tsx
import { SlideDeck } from "@/components/slide-deck";

function buildPresentation(s: Strings): Presentation {
  return {
    slug: "my-slug",
    title: s.title,
    // ...
    slides: [
      { id: "intro", content: <IntroSlide s={s} />, notes: "..." },
      // ...
    ],
  };
}

// Backward-compatible named export (English only, for imports that expect a plain object)
export const myPresentation: Presentation = buildPresentation(t.en);

// Default export: bilingual wrapper
export default function MyPresentationPage() {
  const [lang, setLang] = useState<Lang>("en");
  const s = lang === "ar" ? t.ar : t.en;
  const presentation = buildPresentation(s);

  return (
    <div dir={s.dir}>
      <LangToggle lang={lang} onToggle={() => setLang(l => l === "ar" ? "en" : "ar")} />
      <SlideDeck presentation={presentation} />
    </div>
  );
}
```

3. Update the route page to import the default component instead of the named export:

```tsx
import MyPresentationPage from "@/content/my-slug";
export default function Page() { return <MyPresentationPage />; }
```

#### Translating dynamic components

Components with data-driven content (FlowDiagram, charts, timelines) need their
labels passed through `s`:

```tsx
<FlowDiagram
  nodes={[
    { id: "data", label: s.system.flowNode1Label, description: s.system.flowNode1Desc },
    // ...
  ]}
  edges={[
    { from: "data", to: "ai", label: s.system.flowEdge1 },
    // ...
  ]}
/>
```

#### What stays universal (not translated)

- Numbers and stats: `"25-40%"`, `"~400"`, `">50%"` are universal.
- Brand names and product names (leave these untranslated).
- Image paths and alt text (keep English alt text for accessibility tooling).
- Speaker notes in the `slides` array (these are for the presenter, not the audience).
- CSS class names and animation parameters.

#### Default language

- For Middle East clients: default to Arabic (`useState<Lang>("ar")`).
- For international audiences: default to English (`useState<Lang>("en")`).
- The toggle lets users switch at any time; the choice is not persisted.

### Chapter navigation

Fixed right-side dot nav with labeled chapters for long presentations. Pattern:

1. Define a `CHAPTERS` array: `{ id: string, label: string }[]` matching section IDs.
2. `ChapterNav` component uses `IntersectionObserver` per chapter with
   `rootMargin: "-20% 0px -20% 0px"` to track the topmost visible section.
3. Active dot gets `bg-scale-cyan` with a glow `box-shadow`; inactive dots are
   `bg-white/20` with hover reveal of the label text.
4. Hidden on mobile (`hidden lg:flex`), hidden in print (`print-hidden`).

Use this for any presentation with 6+ sections. Shorter ones don't need it.

### Print mode

Full print/PDF compatibility. Pattern:

1. Import `usePrintMode()` and `useM()` from `@/lib/print-mode`.
2. `useM()` returns `motion` normally, or `staticMotion` (plain HTML elements with
   animation props stripped) when `?print` is in the URL.
3. Conditionally skip decorative elements: `{!print && <FloatingParticles />}`.
4. For collapsible sections, force open in print: `const isOpen = print || open`.
5. For images, add `priority` and `loading="eager"` in print mode.
6. Add a `PrintButton` component (from `@/components/pdf-export`) and the
   `PdfExportButton` for screenshot-based PDF generation.
7. On mount in print mode, force-load all images by resetting `img.src`.

Every new presentation should support print mode. Wrap all `motion.*` calls with
`useM()` instead of importing `motion` directly.

### Image extraction from source decks

When the brief includes a PowerPoint or PDF with images (logos, team photos, charts):

1. Extract images from the source material and place them in
   `public/images/{slug}/` or `public/logos/{slug}/`.
2. Use `next/image` with explicit `width`/`height` for all extracted images.
3. For logos: use transparent PNGs, apply `opacity-60` or similar for visual balance.
4. For team photos: use circular crops (`rounded-full overflow-hidden`).
5. For charts/diagrams from the deck: prefer rebuilding as SVG/React components
   (graphics-first principle). Fall back to images only for complex visuals that
   would take disproportionate effort to recreate.

### Collapsible deep-dive sections

For appendix or technical detail that shouldn't interrupt the narrative flow:

1. Use a `DeepDiveCard` pattern with `AnimatePresence` for expand/collapse.
2. In print mode, force all cards open (`const isOpen = print || open`).
3. Group cards under a clearly labeled "Appendix" or "Deep Dive" section
   at the end of the presentation.

### Inline SVG diagrams

For architecture, pipeline, or flow diagrams:

1. Use `<svg viewBox="..." className="w-full">` with responsive width.
2. Apply Framer Motion entrance animations via `useM()`.
3. Use CSS custom property colors (`var(--scale-cyan)` etc.) or Tailwind colors.
4. Wrap in a container with `backdrop-blur`, `border-border`, `rounded-2xl`.
5. Keep text labels short; use `font-family` matching the presentation font.

### Scroll-driven hero effects

Parallax hero with scroll-linked opacity, scale, blur, and y-offset:

1. Use `useScroll({ target: ref, offset: ["start start", "end start"] })`.
2. Map `scrollYProgress` to transforms via `useTransform`.
3. Skip scroll effects in print mode: `useScroll(print ? undefined : { ... })`.
4. Layer `FloatingParticles` and `MouseSpotlight` behind the content.

### Product mock-ups and live UI

When showing what the product looks like:

1. Build a styled mock-up directly in React (not a screenshot) so it
   animates and responds to the language toggle.
2. Use a container styled as a "browser window" or "app frame" with a
   subtle header bar, rounded corners, and shadow.
3. The mock-up content should use real data from the brief, not lorem ipsum.
