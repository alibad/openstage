---
name: component-reference
description: "Reference for every presentation component and design token — motion grammar, typography, colour moods, the full component catalog (animations, visual effects, scrollytelling, 3D, charts, diagrams) with props and import paths, plus how to pick the right register (inform vs land) and the icon convention. Use when choosing or wiring up any single catalog component (charts, diagrams, a before/after slider, 3D, motion easing). For multi-step image workflows — extracting images from a source deck, product mock-ups — see proven-patterns."
---

### Motion Grammar

All new components draw from a single motion vocabulary in `src/lib/motion.ts`:

- `ease.*` — named cubic-beziers (`outQuart`, `outExpo`, `outBack`, `outCirc`, `inOutQuart`, `inOutExpo`, `linear`)
- `duration.*` — `fast` (0.25s), `base` (0.45s), `reveal` (0.7s), `slow` (1.1s), `cinematic` (1.6s)
- `springConfig.*` — raw `{ stiffness, damping, restDelta }` for `useSpring()` (ui, gentle, bouncy, smooth)
- `spring.*` — ready-to-spread Framer Motion `Transition` objects
- `stagger.*` — `tight` (0.04), `base` (0.08), `list` (0.12), `cinematic` (0.2)
- `viewportMargin.*` — trigger margins for scroll reveals (`default`, `early`, `late`)
- `tx.*` — convenience `Transition` presets (`fast`, `reveal`, `hero`, `bounce`, `cinematic`, `mask`, `slide`)
- `fadeVariants.*` — shared variant dictionaries (`fadeUp`, `fadeIn`, `scaleIn`, `slideLeft`, `slideRight`, `blurUp`)

**House rule:** never inline cubic-beziers or stiffness/damping numbers in new
code. Import tokens. Full spec at `docs/motion-spec.md`.

### Typography System

Three fonts are loaded globally: `Inter` (sans), `JetBrains Mono` (mono), and
`Instrument Serif` (display). Each is available as a CSS custom property
(`--font-sans`, `--font-mono`, `--font-display`) and a Tailwind utility.

Fluid display scale (in `globals.css`):

```
.display-xs       → clamp(1.75rem, 3vw, 2.25rem)
.display-sm       → clamp(2rem, 4vw, 3rem)
.display-md       → clamp(2.75rem, 5.5vw, 4.5rem)
.display-lg       → clamp(3.5rem, 7vw, 6rem)
.display-xl       → clamp(4.5rem, 9vw, 8rem)
.display-monster  → clamp(5rem, 12vw, 12rem)
```

Supporting utilities:

- `.editorial-serif` / `.editorial-italic` — applies the Instrument Serif display font
- `.text-balance` — `text-wrap: balance` (great for headlines)
- `.text-pretty` — `text-wrap: pretty` (great for body copy)
- `.prose-presentation` — opinionated prose defaults for editorial body copy

### Colour Moods

Apply `data-mood="warm|cool|mono|night|dawn"` to any element to swap the colour
palette CSS variables beneath it. Pair with `.mood-gradient-text` and
`.mood-gradient-bar` to use the mood's gradient for accents.

| Mood | Palette | Vibes |
|------|---------|-------|
| `warm` | amber / coral / rose | Human, hopeful, retrospective |
| `cool` | cyan / indigo / slate | Technical, analytical, confident |
| `mono` | monochrome slates | Archival, quiet, editorial |
| `night` | deep indigo / violet / magenta | Cinematic, dramatic, hero |
| `dawn` | rose / amber / pink | Gentle, optimistic, opening-beat |

### Phase 2 Primitives (Awwwards-tier)

Higher-impact visual primitives added in April 2026. All live in
`@/components/animations` (or re-exported from `@/components/scrollytelling`
for the scroll-driven ones).

| Component | Purpose |
|-----------|---------|
| `Marquee` | GPU-accelerated infinite ticker. Horizontal/vertical, pause-on-hover, edge fade |
| `FlipNumber` | Mechanical split-flap counter. Tumbles each digit into place |
| `EditorialGrid` / `EditorialCell` | Asymmetric 12-col magazine layout with named slot presets (`kicker`, `lede`, `aside`, `body`, `figure`, …) |
| `HeroStat` | Dominant-figure layout for "one number owns the moment" |
| `WebGLHero` | Pointer-reactive full-bleed GLSL flow-field shader background |
| `ScrollCamera3D` | Scroll-linked R3F camera rig with keyframes (3D depth that responds to scroll) |
| `PathDraw` | Scroll-linked SVG stroke-dashoffset reveal, with progress-gated annotations |
| `HorizontalPin` | GSAP ScrollTrigger pinned horizontal scroll section (Apple product-page style) |
| `CustomCursor` | App-level custom cursor (dot + trailing ring, morphs over interactive elements, respects touch/print) |
| `IntroSequence` / `IntroSequenceWrapper` | Branded cold-open loader, session-gated |

Flagship reference implementation: **[`/awwwards-flagship`](./src/content/awwwards-flagship.tsx)** — a single scroll deck that uses every primitive as one coherent argument about presentation craft. Use it as the canonical example when composing a high-craft deck.

### Pick the right register: inform vs. land

Before composing any deck, choose the visual register and stay consistent within it. Mixing signals "I started ambitious then got tired."

| Register | When to use | Default primitives |
|----------|------------|--------------------|
| **Inform** | Status updates, briefings, technical walkthroughs where the audience already wants the content | `Reveal`, `StaggerChildren`, `AnimatedCounter`, `FlowDiagram`, `AnimatedTimeline`, basic grids |
| **Land** | Proposals, pitches, vision decks, leadership reviews — sections that have to *convince*, not just inform | `WebGLHero`, `TextSplit`, `FlipNumber`, `HeroStat`, `EditorialGrid`, `MaskReveal`, `PathDraw`, `HorizontalPin` |

**Default heuristic:** if the deck is meant to *win something* (budget, alignment, a yes), reach for the high-craft primitives — at least for the hero and one or two punchline beats. The conservative register is appropriate for engineering walkthroughs and recurring updates; it is the wrong default for a one-shot pitch.

**Where to spend the craft budget** (in priority order): hero · one number-owns-the-moment beat · one chapter divider with `MaskReveal` or `PathDraw` · the closing CTA. Don't try to dress every section — the awwwards-flagship pattern is *contrast* between high-craft beats and quieter editorial passages, not uniform maximalism.

If you find yourself writing `<div className="rounded-2xl border ...">` for a section that's supposed to convince someone of something, stop. That section probably wants `HeroStat` + `FlipNumber` or `EditorialGrid` instead.

## Design System

### Colors

Use the CSS custom properties defined in `globals.css`:

- `bg-bg-dark`, `bg-bg-surface`, `bg-bg-elevated` — dark backgrounds
- `bg-bg-light`, `bg-bg-light-surface` — light backgrounds
- `text-foreground`, `text-muted` — text colors
- `text-scale-cyan`, `text-scale-blue`, `text-scale-purple`, `text-scale-pink` — brand accent
- `bg-accent`, `bg-accent-light` — UI accents
- `border-border` — borders

Use `scale-gradient-bar`, `scale-gradient-text`, `scale-gradient-bg` utility classes.

If the presentation has a custom `accentColor`, use it for key highlights (section numbers, CTAs, stat values) while keeping the brand gradient for the top bar and structural elements.

### Typography

- Headings: `font-bold tracking-tight`
- Body: `leading-relaxed`
- Stats/numbers: `font-mono` or `tabular-nums`
- Subtle text: `text-muted` or `text-muted/70`

### Layout Patterns

- Hero: Full viewport height, centered content, dark background
- Content sections: `max-w-4xl mx-auto px-6 py-24` (or `py-32` for spacious)
- Diagram + callouts: SVG or visual left, bullet cards right (architecture sections)
- Two-column comparison: side-by-side for before/after, tradeoffs, option A vs B
- Stats grid: `grid grid-cols-2 md:grid-cols-4 gap-6`
- Card grids: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` (last resort; see Graphics First below)
- Full-width visual: complex diagrams or pipeline visuals that need the whole viewport

### Component Quick Reference

**Live demo:** Visit `/showcase-visuals` to see every component in action with
full i18n (English/Arabic), chapter nav, and print support.

When building a section, pick the component that best fits the content:

| Content need | Component | Import |
|---|---|---|
| Key metrics / KPIs | `AnimatedMetric` | `@/components/charts` |
| Trend over time | `AnimatedLineChart` | `@/components/charts` |
| Compare magnitudes | `AnimatedBarChart` | `@/components/charts` |
| Revenue/market split | `AnimatedPieChart` | `@/components/charts` |
| Before vs. after | `BeforeAfter` | `@/components/charts` |
| Vendor/option comparison | `ScoreMatrix` | `@/components/charts` |
| Architecture / pipeline | `FlowDiagram` | `@/components/charts` |
| Ranked list / editorial bars | `BarRows` | `@/components/charts` |
| Elapsed time across one case | `CaseTimeline` | `@/components/charts` |
| One-section-per-page PDF export | `PrintPager` | `@/components/print-pager` |
| Flow step label / branch split | `Connector`, `SplitConnector` | `@/components/diagrams` |
| Hotspot tooltip on an SVG | `SvgHoverCard` | `@/components/diagrams` |
| Screenshot needing app context | `Frame` | `@/components/frame` |
| Diagram too dense to read inline | `LightboxFigure` | `@/components/lightbox` |
| Project roadmap / phases | `AnimatedTimeline` | `@/components/charts` |
| Reference data table | `DataTable` | `@/components/charts` |
| Pinned visual + narrative | `StickyMedia` | `@/components/animations` |
| Pinned image + annotations | `StickyAnnotations` | `@/components/animations` |
| Progressive text reveal | `ScrollRevealText` | `@/components/animations` |
| Qualitative axis ranking | `Spectrum` | `@/components/animations` |
| Color-coded text analysis | `AnnotatedText` | `@/components/animations` |
| Explore / deep-dive zones | `InteractionZone` | `@/components/animations` |
| Global presence / geopolitics | `Globe3D` | `@/components/3d` (dynamic) |
| 3D product / model viewer | `Scene3D` | `@/components/3d` (dynamic) |
| Cinematic hero background | `AuroraBackground` | `@/components/animations` |
| Organic gradient background | `MeshGradient` | `@/components/animations` |
| Ambient particles | `ParticleField` | `@/components/animations` |
| Full-viewport hero image | `FullBleed` | `@/components/animations` |
| Scroll-scrubbed video | `ScrollVideo` | `@/components/animations` |
| Large number reveal | `AnimatedCounter` or `SmoothCounter` | `@/components/animations` |
| Word-by-word entrance | `TextSplit` | `@/components/animations` |
| Clip-path reveal | `MaskReveal` | `@/components/animations` |
| Cursor-following element | `MagneticElement` | `@/components/animations` |
| Tilt-on-hover card | `MagneticCard` | `@/components/animations` |
| Multi-speed depth layers | `ParallaxLayer` | `@/components/animations` |
| Typewriter effect | `Typewriter` | `@/components/animations` |
| Scroll-mode TTS narrator | `ScrollNarrator` | `@/components/scroll-narrator` |
| Infinite ticker / logo river | `Marquee` | `@/components/animations` |
| Mechanical counter (split-flap) | `FlipNumber` | `@/components/animations` |
| Magazine / editorial layout | `EditorialGrid` + `EditorialCell` | `@/components/animations` |
| One-number owns the moment | `HeroStat` | `@/components/animations` |
| Pointer-reactive WebGL hero | `WebGLHero` | `@/components/animations` |
| Scroll-linked 3D camera rig | `ScrollCamera3D` | `@/components/3d` (dynamic) |
| Scroll-drawn SVG path | `PathDraw` | `@/components/scrollytelling` |
| Pinned horizontal scroll | `HorizontalPin` | `@/components/scrollytelling` |
| Custom cursor (app-level) | `CustomCursor` | `@/components/animations` |
| Branded intro / cold open | `IntroSequence` / `IntroSequenceWrapper` | `@/components/animations` |

### Animation Components

Available from `@/components/animations`:

- `Reveal` — fade-in on scroll (wrap any element). Variants: `fade-up`, `fade-in`, `scale-in`, `slide-left`, `slide-right`.
- `StaggerChildren` + `StaggerItem` — staggered reveal for lists and grids
- `AnimatedCounter` — count-up animation for numbers
- `Typewriter` — typewriter text effect with cursor
- `GradientText` / `AnimatedGradientText` — gradient-colored text
- `ParallaxText` — parallax scrolling text
- `ScrollProgress` — fixed top gradient bar showing page scroll progress
- `FloatingParticles` — lightweight animated dots across a container. Props: `count`, `className`.
- `MouseSpotlight` — radial gradient that follows the cursor. Props: `radius`, `opacity`, `className`.
- `MagneticCard` — 3D tilt card that follows pointer position. Props: `children`, `intensity`, `className`.
- `TextRevealByWord` — words blur/fade in sequentially on scroll. Props: `text`, `className`.
- `GradientDivider` — horizontal shimmer line that scales in on viewport entry. Props: `className`.

For scroll-driven animations, use Framer Motion's `useScroll` and `useTransform`.

### Visual Effects Components

Available from `@/components/animations`. Use these to create cinematic,
Awwwards-level presentation sections.

#### `AuroraBackground` — animated WebGL shader gradient

Full-viewport animated northern-lights gradient using GLSL shaders. Place behind
section content for an immersive background. Falls back gracefully when WebGL is
unavailable. Colors default to the active brand palette.

```tsx
<AuroraBackground colors={["#7DD3FC", "#818CF8", "#A78BFA", "#E879A8", "#F472B6"]} speed={1} blend={0.6}>
  <h1>Hero content on top of aurora</h1>
</AuroraBackground>
```

Props: `colors` (up to 5 hex), `speed` (multiplier), `blend` (0-1 opacity), `className`, `children`.

#### `MeshGradient` — organic morphing blob gradient

Four animated blobs with CSS blur that create an Apple-style organic gradient.
Lighter-weight than AuroraBackground (no WebGL), good for cards and lighter sections.

```tsx
<MeshGradient colors={["#7DD3FC", "#818CF8", "#A78BFA", "#F472B6"]} speed="normal" intensity={0.5}>
  <div className="p-16 text-center">Content here</div>
</MeshGradient>
```

Props: `colors` (4 hex), `speed` ("slow"|"normal"|"fast"), `intensity` (0-1), `className`, `children`.

#### `ParticleField` — tsParticles-powered particle backgrounds

Replaces `FloatingParticles` with a real particle engine. Six presets, or pass raw
tsParticles options for full control.

```tsx
<ParticleField preset="constellation" color="#7DD3FC" colorSecondary="#818CF8" />
<ParticleField preset="fireflies" count={25} />
<ParticleField preset="snow" opacity={0.6} />
```

Presets: `"constellation"` (connected dots, mouse grab), `"ambient"` (slow drift),
`"snow"` (falling with wobble), `"fireflies"` (glowing dots with shadows),
`"rising"` (ascending particles), `"matrix"` (falling green squares).

Props: `preset`, `options` (raw override), `color`, `colorSecondary`, `count`, `opacity`, `className`.

#### `TextSplit` — per-character/word entrance animations

Split text into units and animate each one on viewport entry. Seven animation styles.

```tsx
<TextSplit animation="blur-in" mode="word" stagger={0.04}>
  This sentence reveals word by word with a blur effect
</TextSplit>
<TextSplit animation="slide-up" mode="char" stagger={0.02}>
  Character by character
</TextSplit>
```

Props: `children` (string), `mode` ("word"|"char"|"line"), `animation`
("fade-up"|"fade-in"|"blur-in"|"slide-up"|"slide-down"|"scale"|"rotate"),
`delay`, `stagger`, `duration`, `once`, `className`, `unitClassName`.

#### `MaskReveal` — clip-path reveal on scroll

Reveals content through an expanding clip-path mask when it enters the viewport.
Six shapes available.

```tsx
<MaskReveal shape="circle" duration={1}>
  <img src="/hero.jpg" className="w-full" />
</MaskReveal>
<MaskReveal shape="diagonal-left" duration={0.8}>
  <div className="bg-scale-purple p-12">Revealed diagonally</div>
</MaskReveal>
```

Shapes: `"circle"`, `"diamond"`, `"diagonal-left"`, `"diagonal-right"`,
`"horizontal"` (curtain open), `"vertical"` (curtain open).

Props: `shape`, `duration`, `delay`, `once`, `className`, `children`.

#### `ParallaxLayer` — multi-speed parallax

Wraps content in a parallax layer that moves at a different speed than scroll.
Stack multiple layers for depth.

```tsx
<div className="relative h-screen">
  <ParallaxLayer speed={0.3} fade>
    <img src="/bg.jpg" className="w-full" />
  </ParallaxLayer>
  <ParallaxLayer speed={0.6}>
    <h1 className="text-5xl">Midground text</h1>
  </ParallaxLayer>
  <ParallaxLayer speed={1}>
    <p>Foreground content (moves at normal speed)</p>
  </ParallaxLayer>
</div>
```

Props: `speed` (0=fixed, 1=normal), `offsetX` (horizontal parallax px),
`scaleRange` (zoom on scroll), `fade` (opacity fade at edges), `className`, `children`.

#### `MagneticElement` — cursor-following elements

Elements that subtly follow the cursor. Ideal for logos, icons, CTAs,
and interactive flourishes.

```tsx
import { MagneticElement } from "@/components/animations";

<MagneticElement strength={0.3} range={40} hoverScale={1.05}>
  <img src="/logos/acme.svg" alt="Acme" className="w-16 h-16" />
</MagneticElement>
```

Props: `strength` (0-1), `range` (max px displacement), `stiffness`,
`damping`, `hoverScale`, `className`, `children`.

#### `SmoothCounter` — upgraded number animation

Drop-in upgrade for `AnimatedCounter` with easing curves, locale formatting,
compact notation, and trend indicators.

```tsx
import { SmoothCounter } from "@/components/animations";

<SmoothCounter target={2400000} prefix="$" compact duration={2} trend="up" />
<SmoothCounter target={99.7} suffix="%" decimals={1} ease="spring" />
```

Props: `target`, `from`, `decimals`, `duration`, `prefix`, `suffix`,
`locale`, `compact`, `ease` ("linear"|"easeIn"|"easeOut"|"easeInOut"|"spring"),
`delay`, `trend` ("up"|"down"|"neutral"), `className`.

### Scrollytelling Components

Available from `@/components/scrollytelling` (also re-exported from `@/components/animations`).
All components support print mode (`?print`) and respect `prefers-reduced-motion`.

#### `StickyMedia` — pinned visual + scrolling text steps

Split-screen: media sticks on one side while text steps scroll on the other.
Each direct child is one step. Steps fade in/out based on scroll position.

```tsx
<StickyMedia src="/images/diagram.png" alt="Architecture" mediaPosition="left" overlay={0.1}>
  <div><h3>Step 1</h3><p>First explanation...</p></div>
  <div><h3>Step 2</h3><p>Second explanation...</p></div>
  <div><h3>Step 3</h3><p>Third explanation...</p></div>
</StickyMedia>
```

Props: `src`, `alt`, `mediaPosition` ("left"|"right"), `overlay` (0-1), `mediaFit` ("cover"|"contain"), `video` (boolean).
Mobile: stacks vertically (image sticky at top, text below).

#### `StickyAnnotations` — pinned image with accumulating annotations

Like StickyMedia but adds positioned annotations onto the image at each step.
Annotations accumulate (stay visible once revealed).

```tsx
<StickyAnnotations
  src="/images/screenshot.png"
  alt="Product UI"
  annotations={[
    { x: 25, y: 30, label: "Search bar", step: 0, type: "label" },
    { x: 75, y: 50, label: "Results", step: 1, type: "box", width: 30, height: 20 },
    { x: 50, y: 80, label: "", step: 2, type: "pulse", color: "#4ade80" },
  ]}
>
  <p>The user starts by searching...</p>
  <p>Results appear in real time...</p>
  <p>The system highlights the best match...</p>
</StickyAnnotations>
```

Annotation types: `label` (pill), `circle`, `arrow`, `pulse` (animated ring), `box` (highlight rectangle).

#### `ScrollRevealText` — progressive text reveal

Words/chars/sentences reveal as the user scrolls or enters the viewport.

```tsx
<ScrollRevealText scrub highlight highlightColor="var(--scale-cyan)">
  This sentence reveals word by word as you scroll, with a marker-pen highlight.
</ScrollRevealText>
```

Props: `mode` ("word"|"line"|"char"|"sentence"), `scrub` (scroll-linked vs viewport-triggered),
`highlight` (marker-pen background), `blur` (focus-pull effect), `stagger` (delay between units).

#### `ScrollVideo` — scroll-scrubbed video

Video playback driven by scroll position. Frame-by-frame control.

```tsx
<ScrollVideo src="/videos/demo.mp4" poster="/images/poster.jpg" showProgress runway="400vh" />
```

Props: `src`, `poster`, `sizing` ("viewport"|"contained"), `showProgress` (thin gradient bar), `runway` (scroll distance).

#### `FullBleed` — full-viewport hero/interstitial

Full-screen image or video section with text overlay and optional parallax.

```tsx
<FullBleed src="/images/hero.jpg" alt="City skyline" parallax overlay={0.5} position="bottom-left">
  <h1 className="text-5xl font-bold">The Future of AI</h1>
</FullBleed>
```

Props: `src`, `alt`, `overlay` (0-1), `gradient` (CSS gradient string), `parallax` (boolean),
`position` ("center"|"bottom-left"|"bottom-center"|"top-left"|"top-center"), `video` (boolean).

#### `Spectrum` — axis positioning diagram

Horizontal axis with labeled dots for qualitative comparisons.

```tsx
<Spectrum
  axis={{ left: "Manual", right: "Automated" }}
  items={[
    { label: "Legacy", position: 15 },
    { label: "Current", position: 55, highlight: true },
    { label: "Target", position: 90, color: "var(--scale-cyan)" },
  ]}
  scrub
  showConnectors
/>
```

Props: `axis` ({ left, right }), `items` (label + position 0-100), `scrub`, `showConnectors`, `color`.
Includes a screen-reader-only data table for accessibility.

#### `AnnotatedText` — color-coded text segments

Highlights segments of text with category-colored backgrounds. Good for legal analysis,
transcript markup, or any text where different parts serve different roles.

```tsx
<AnnotatedText
  segments={[
    { text: "The defendant argued ", category: "Defense", color: "#F87171" },
    { text: "that the evidence was inadmissible ", category: "Legal", color: "#4EA8DE" },
    { text: "based on procedural grounds.", category: "Defense", color: "#F87171" },
  ]}
  scrub
  showLegend
/>
```

Props: `segments` (text + category + color), `scrub`, `stagger`, `showLegend`.

#### `InteractionZone` — click-to-explore zones

Pauses the scroll narrative and invites exploration. Each zone has a button and
expandable content panel.

```tsx
<InteractionZone
  zones={[
    { label: "Technical", icon: <CodeIcon />, content: <p>Deep dive...</p>, color: "#4EA8DE" },
    { label: "Business", icon: <BarChartIcon />, content: <p>ROI analysis...</p> },
  ]}
  mode="toggle"
  layout="row"
/>
```

Props: `zones` (label + content + optional icon/color), `mode` ("toggle"|"accordion"), `layout` ("row"|"grid").
Print: all zones expanded. Keyboard accessible.

#### `useSectionProgress` — shared scroll tracking hook

Low-level hook for building custom scroll-driven components.

```tsx
const { ref, progress, print } = useSectionProgress(["start 0.85", "end 0.15"]);
// progress is a Framer Motion MotionValue<number> (0-1)
// print is true when ?print is in the URL
```

For sticky containers, use `["start start", "end end"]`.
For viewport reveal, use the default `["start 0.85", "end 0.15"]`.

### 3D Components

Available from `@/components/3d`. All require dynamic import to avoid SSR issues
and keep bundle size down. Use `next/dynamic` with `{ ssr: false }` when embedding
in presentation content.

#### `Globe3D` — interactive 3D globe

A Three.js-powered rotating globe with arc connections and point markers.
Ideal for government, geopolitics, and global operations presentations.

```tsx
import dynamic from "next/dynamic";
const Globe3D = dynamic(() => import("@/components/3d").then(m => ({ default: m.Globe3D })), { ssr: false });

<Globe3D
  markers={[
    { position: [24.45, 54.65], label: "Abu Dhabi", color: "#7DD3FC" },
    { position: [35.69, 139.69], label: "Tokyo", color: "#F472B6" },
  ]}
  arcs={[
    { from: [24.45, 54.65], to: [25.28, 51.52], color: "#818CF8" },
  ]}
  rotationSpeed={1}
  height="500px"
/>
```

Props: `arcs` (from/to lat-lng pairs), `markers` (position + label + color),
`globeColor`, `wireColor`, `rotationSpeed`, `interactive`, `height`, `className`.

#### `Scene3D` — generic 3D model viewer

Load any `.glb`/`.gltf` model with environment lighting, contact shadows,
float animation, and orbital controls.

```tsx
<Scene3D
  modelUrl="/models/product.glb"
  environment="studio"
  rotationSpeed={1}
  float
  scale={1.5}
  height="500px"
/>
```

Props: `modelUrl`, `rotationSpeed`, `interactive`, `environment`
("city"|"sunset"|"dawn"|"night"|"studio"|"apartment"), `float`, `scale`,
`height`, `children` (custom R3F elements), `className`.

### Chart Components

Available from `@/components/charts`. All charts animate on scroll entry
using Recharts with Framer Motion viewport detection.

#### `AnimatedBarChart` — scroll-triggered bar chart

```tsx
import { AnimatedBarChart } from "@/components/charts";

<AnimatedBarChart
  data={[
    { label: "Q1", value: 120 },
    { label: "Q2", value: 250, highlight: true },
    { label: "Q3", value: 180 },
  ]}
  title="Revenue by Quarter"
  suffix="M"
  color="#818CF8"
  highlightColor="#7DD3FC"
/>
```

Props: `data` (label + value + optional color/highlight), `title`, `suffix`,
`horizontal`, `grid`, `color`, `highlightColor`, `height`, `className`.

#### `AnimatedLineChart` — scroll-triggered line/area chart

```tsx
<AnimatedLineChart
  data={[
    { month: "Jan", revenue: 100, costs: 80 },
    { month: "Feb", revenue: 140, costs: 85 },
    { month: "Mar", revenue: 200, costs: 90 },
  ]}
  xKey="month"
  series={[
    { key: "revenue", label: "Revenue", color: "#7DD3FC" },
    { key: "costs", label: "Costs", color: "#F472B6" },
  ]}
  area
  smooth
  suffix="K"
/>
```

Props: `data`, `xKey`, `series` (key + label + color), `title`, `suffix`,
`area` (fill under line), `grid`, `smooth`, `dots`, `height`, `className`.

#### `AnimatedPieChart` — scroll-triggered pie/donut

```tsx
<AnimatedPieChart
  data={[
    { label: "AI", value: 45 },
    { label: "Cloud", value: 30 },
    { label: "Services", value: 25 },
  ]}
  donut={0.55}
  title="Revenue Mix"
  suffix="%"
/>
```

Props: `data` (label + value + optional color), `title`, `donut` (0=pie, 0.5+=donut),
`showLabels`, `suffix`, `height`, `className`.

#### `BeforeAfter` — draggable comparison slider

Interactive slider that reveals two overlapping states. Works with any children
(images, screenshots, charts, styled divs).

```tsx
<BeforeAfter
  before={<img src="/before.png" className="w-full h-full object-cover" />}
  after={<img src="/after.png" className="w-full h-full object-cover" />}
  beforeLabel="Legacy System"
  afterLabel="AI-Powered"
  height="400px"
/>
```

Props: `before`, `after` (ReactNode), `beforeLabel`, `afterLabel`,
`initialPosition` (0-100), `dividerColor`, `height`, `className`.

#### `AnimatedTimeline` — scroll-triggered step timeline

Vertical or horizontal timeline with animated connector line and staggered node reveals.

```tsx
import { AnimatedTimeline } from "@/components/charts";

<AnimatedTimeline
  nodes={[
    { date: "Jan 2026", title: "Discovery", description: "Stakeholder interviews and data audit.", icon: <Search className="w-4 h-4" /> },
    { date: "Feb 2026", title: "Prototype", description: "Working MVP with 3 core workflows." },
    { date: "Mar 2026", title: "Pilot", description: "Live deployment with 50 users.", color: "#4ade80" },
  ]}
  direction="vertical"
  animateConnector
  color="#818CF8"
/>
```

Props: `nodes` (title + optional description/date/icon/color/content), `direction`
("vertical"|"horizontal"), `animateConnector`, `color`, `className`.

#### `FlowDiagram` — animated node-and-edge pipeline

Renders a linear flow of nodes connected by dashed arrows. Nodes stagger in on scroll.
Useful for architecture diagrams, data pipelines, and process flows.

```tsx
import { FlowDiagram } from "@/components/charts";
import { Database, Cpu, BarChart } from "lucide-react";

<FlowDiagram
  nodes={[
    { id: "ingest", label: "Data Ingest", icon: <Database className="w-5 h-5" />, description: "Raw feeds" },
    { id: "process", label: "AI Processing", icon: <Cpu className="w-5 h-5" />, color: "#7DD3FC" },
    { id: "output", label: "Insights", icon: <BarChart className="w-5 h-5" /> },
  ]}
  edges={[
    { from: "ingest", to: "process", label: "stream" },
    { from: "process", to: "output" },
  ]}
  direction="horizontal"
  stagger={0.15}
/>
```

Props: `nodes` (id + label + optional icon/description/color), `edges` (from + to + optional label),
`direction` ("horizontal"|"vertical"), `color`, `stagger`, `className`.

#### `ScoreMatrix` — criteria vs options evaluation grid

Table with animated score bars. Great for option comparisons, vendor evaluations,
and risk assessments.

```tsx
import { ScoreMatrix } from "@/components/charts";

<ScoreMatrix
  criteria={["Cost", "Speed", "Quality", "Risk"]}
  entries={[
    { option: "Option A", scores: { Cost: 80, Speed: 60, Quality: 90, Risk: 70 }, highlight: true },
    { option: "Option B", scores: { Cost: 60, Speed: 85, Quality: 75, Risk: 50 } },
    { option: "Option C", scores: { Cost: 40, Speed: 90, Quality: 65, Risk: 30 } },
  ]}
  showValues
  thresholds={[40, 70]}
  thresholdColors={["#F87171", "#FBBF24", "#4ADE80"]}
/>
```

Props: `criteria` (column headers), `entries` (option + scores record + optional highlight),
`showValues`, `color`, `highlightColor`, `thresholds` ([low, mid] boundaries),
`thresholdColors` ([low, mid, high] colors), `className`.

#### `SplineEmbed` — Spline 3D scene embed

Lazy-loaded Spline scene. Requires a Spline export URL.

```tsx
import dynamic from "next/dynamic";
const SplineEmbed = dynamic(() => import("@/components/3d").then(m => ({ default: m.SplineEmbed })), { ssr: false });

<SplineEmbed scene="https://prod.spline.design/xxxxx/scene.splinecode" height="500px" />
```

Props: `scene` (Spline URL), `height`, `fallbackText`, `className`.

#### `RiveEmbed` — Rive animation embed

Lazy-loaded Rive animation player. Requires a `.riv` file URL.

```tsx
import dynamic from "next/dynamic";
const RiveEmbed = dynamic(() => import("@/components/3d").then(m => ({ default: m.RiveEmbed })), { ssr: false });

<RiveEmbed src="/animations/loading.riv" stateMachines="MainStateMachine" height="400px" />
```

Props: `src` (.riv URL), `stateMachines`, `animations`, `artboard`, `height`,
`fallbackText`, `className`.

#### `AnimatedMetric` — large number with sparkline and trend

Rich metric card with animated count-up, mini sparkline chart, and delta badge.
Replaces static `StatCard` for data-heavy presentations.

```tsx
import { AnimatedMetric } from "@/components/charts";

<AnimatedMetric
  value={2400000}
  label="Annual Revenue"
  prefix="$"
  compact
  delta={12.5}
  deltaSuffix="%"
  trend="up"
  sparkline={[{ value: 80 }, { value: 92 }, { value: 88 }, { value: 105 }, { value: 120 }]}
  color="#7DD3FC"
/>
```

Props: `value`, `label`, `prefix`, `suffix`, `decimals`, `compact`,
`delta`, `deltaSuffix`, `trend` ("up"|"down"|"neutral"), `sparkline`
(array of `{value}`), `color`, `className`.

#### `DataTable` — styled table with scroll-reveal rows

Full-featured data table with sortable columns, staggered row animations,
row highlighting, and zebra striping.

```tsx
import { DataTable } from "@/components/charts";

<DataTable
  columns={[
    { key: "name", label: "Name", sortable: true },
    { key: "role", label: "Role" },
    { key: "score", label: "Score", align: "right", sortable: true },
  ]}
  data={[
    { name: "Alice", role: "Engineer", score: 95 },
    { name: "Bob", role: "Designer", score: 88 },
    { name: "Carol", role: "PM", score: 92 },
  ]}
  highlightRow={(row) => row.score > 90}
  striped
  highlightColor="#4ADE80"
/>
```

Props: `columns` (key + label + optional align/sortable/render/minWidth),
`data` (array of row objects), `highlightRow` (predicate function),
`staggerRows`, `striped`, `compact`, `highlightColor`, `className`.

### Diagram Components

Available from `@/components/diagrams`. Use `next/dynamic` with `{ ssr: false }`.

#### `TldrawEmbed` — live-editable canvas diagrams

Embeds a full tldraw infinite canvas inside a presentation. Users can draw,
annotate, and collaborate on diagrams in real-time. Supports SVG export
and fullscreen mode.

```tsx
import dynamic from "next/dynamic";
const TldrawEmbed = dynamic(
  () => import("@/components/diagrams").then(m => ({ default: m.TldrawEmbed })),
  { ssr: false }
);

<TldrawEmbed height="500px" readOnly={false} />
```

Props: `snapshot` (tldraw JSON to restore), `height`, `readOnly`,
`showToolbar`, `onChange` (callback on content change), `fallbackText`, `className`.

#### `SvgHoverCard` — fluid tooltip for SVG hotspots

Maps a hotspot's viewBox coordinates to a DOM tooltip, clamping horizontally
to 14–86% and flipping above the hotspot past 52% down, so a card anchored
near any edge stays inside the figure. Keep hover state on the parent.

```tsx
import { SvgHoverCard, type SvgHoverItem } from "@/components/diagrams";

const items: SvgHoverItem[] = [
  { x: 320, y: 180, title: "Ingestion", sub: "Stage 01", body: "…", foot: "4.2s p95" },
];

<div className="relative">
  <svg viewBox="0 0 1180 520">{/* hotspots set `active` on hover */}</svg>
  <SvgHoverCard active={active} items={items} vb={{ x: 0, y: 0, w: 1180, h: 520 }} />
</div>
```

`vb` must match the host SVG's viewBox or the maths lands in the wrong place.
Props: `active` (index or null), `items`, `vb`, `dark`.

#### `Connector` / `SplitConnector` — flow plumbing

Reach for `FlowDiagram` first — it handles a node/edge chain and **does**
support edge labels. These cover what it can't, since it renders its own nodes
from a data array: joining bespoke cards **you** already have, and a **bracket
fanning one node into N tinted branches** (`FlowDiagram` is linear, no fan-out).
CSS boxes, so they sit between real DOM nodes and inherit the column width.

```tsx
import { Connector, SplitConnector } from "@/components/diagrams";

<StepCard … />
<Connector label="if amount > 50k" />
<StepCard … />
<SplitConnector colors={["var(--color-brand-1)", "var(--color-brand-4)"]} />
<div className="grid grid-cols-2 gap-6">{/* branch columns */}</div>
```

`SplitConnector` drops land at the centre of each of N equal columns, so pass
`colors` in the same order as the `grid-cols-{n}` cards directly below.

### Frame Components

#### `Frame` — device / app chrome

Chrome supplies context: a screenshot on a section reads as an image, the same
shot in a browser frame with a URL reads as a product. Three variants share one
API — `browser` (traffic lights + URL pill), `terminal` (dark code surface,
`actions` for tabs), `phone` (bezel + notch).

```tsx
import { Frame } from "@/components/frame";

<Frame variant="browser" url="portal.example.gov/requests">
  <img src="/screens/portal.png" alt="Request queue" />
</Frame>
```

Colour rides theme tokens so a frame inverts with its section; the traffic
lights stay fixed as a semantic window-control palette.
Props: `variant`, `url`, `title`, `actions`, `className`, `bodyClassName`.

### Overlay Components

#### `Lightbox` / `LightboxFigure` — full-screen inspection

**Always portal an overlay.** A section is `relative z-10` and an animated
slide wrapper carries a transform — both create stacking contexts, so an
overlay rendered in place has its `z-[9999]` resolved *within* that context
and silently sits under the deck's control bar. `Lightbox` portals to
`document.body`, which is the only reliable fix.

Free with it: Escape to close, backdrop click, body-scroll lock (restored to
its previous value), `print-hidden`, and an SSR-safe mount gate.

```tsx
import { LightboxFigure } from "@/components/lightbox";

<LightboxFigure
  src="/diagrams/architecture.png"
  alt="Platform architecture"
  caption="Every service crosses the gateway."
  dark
/>
```

`LightboxFigure` is the common case (click to enlarge, stepped 100–200% zoom,
inert and horizontally scrollable in print). For an inline SVG, an iframe
embed or a video, use `Lightbox` directly with arbitrary children.

#### `CaseTimeline` — one case, day by day

Unlike `AnimatedTimeline` (uniform card-per-milestone spacing), the vertical
axis here is **real**: a dot's position is its day, proportional to the total.
That is the argument — you see the three-week gap, not just the sequence. Use
it when elapsed time is the point.

Labels are pushed apart to stay readable and rejoined to their true dots with
bezier elbows, so the rail stays honest about timing. `band` highlights a
stretch, usually the stall being called out.

```tsx
import { CaseTimeline, type CaseMark } from "@/components/charts";

const marks: CaseMark[] = [
  { day: 0, title: "Request filed" },
  { day: 26, title: "Approval granted", sub: "after three chases", emphasis: true },
  { day: 69, title: "Subscription created" },
];

<CaseTimeline
  label="Case 04"
  totalDays={69}
  marks={marks}
  band={{ from: 0, to: 26, head: "26 days", sub: "on one approval" }}
/>
```

Props: `label`, `totalDays`, `marks`, `band`, `accent`, `highlight`.

### Print / Export

#### `PrintPager` — deterministic one-section-per-page PDF

Without it, a scroll deck *flows* onto paper: a section's background stops
where its text stops and the rest of the sheet prints white, and a section a
few lines over the page spills a stub onto the next one. `PrintPager` makes
every top-level section exactly one full-bleed page, scaling any section too
tall to fit.

Two-line wiring — add `pdf-pages` to the deck's `<main>` under `?print` and
mount the pager:

```tsx
import { PrintPager } from "@/components/print-pager";

<main className={`relative ${print ? "print-mode pdf-pages" : ""}`}>
  <PrintPager enabled={print} />
  {/* sections */}
</main>
```

It measures on screen at the same width the printer uses, so a measured height
is the height the page gets. The geometry, the `@page` rule and the measuring
code all live in the component for that reason — keep them together.
Tall small-type figures can opt into a higher ceiling with `print-figure-tall`.

### Icons

Use `lucide-react` for all icons. Pick icons that match the content semantics.
