# Presentations Framework — Roadmap

Living document tracking planned features, integrations, and visual investments.
Updated: 2026-04-08

---

## Current State

The framework supports two presentation modes (scroll and slides), with:
- Scrollytelling components (StickyMedia, ScrollRevealText, Spectrum, AnnotatedText, etc.)
- Slide primitives with keyboard nav, speaker notes, fullscreen, overview grid
- PPTX export (html2canvas + pptxgenjs)
- PDF/Print export for scroll mode
- Video export with TTS narration (Remotion + OpenAI)
- AI generation pipeline (Studio UI → Claude → Git deploy → Vercel preview → merge)
- Framer Motion animations, parallax, floating particles
- Inline SVG diagrams, code mockups, bilingual/RTL support
- Inline feedback system (GitHub Issues)

---

## Phase 1: Visual Power (Q2 2026)

The presentations need to look dramatically better. Every item here
directly raises the visual ceiling.

### 1.1 Shader Gradient Backgrounds ✅

| Component | Status |
|-----------|--------|
| `AuroraBackground` | Done — WebGL fragment shader with 5-color palette, configurable speed/blend |
| `MeshGradient` | Done — CSS blob animation with morphing border-radius |

### 1.2 Particle System Upgrade ✅

| Component | Status |
|-----------|--------|
| `ParticleField` | Done — `@tsparticles/slim` with 6 presets (constellation, ambient, snow, fireflies, rising, matrix) |

### 1.3 3D Scroll Scenes ✅

| Component | Status |
|-----------|--------|
| `Globe3D` | Done — R3F globe with arcs, markers, auto-rotation |
| `Scene3D` | Done — Generic GLTF/GLB viewer with environment, float, orbit |

### 1.4 Premium Scroll Animations ✅

| Component | Status |
|-----------|--------|
| `TextSplit` | Done — 7 animation styles (fade-up, blur-in, slide-up, scale, rotate, etc.) |
| `MaskReveal` | Done — 6 clip-path shapes (circle, diamond, diagonal, horizontal, vertical) |
| `ParallaxLayer` | Done — Multi-speed parallax with optional scale/fade |

| `MagneticElement` | Done — cursor-following elements with spring physics |
| `SmoothCounter` | Done — easing curves, locale formatting, compact notation, trend arrows |

### 1.5 Spline / Rive Embeds ✅

| Component | Status |
|-----------|--------|
| `SplineEmbed` | Done — Lazy-loaded `@splinetool/react-spline` with print fallback |
| `RiveEmbed` | Done — Lazy-loaded `@rive-app/react-canvas` with state machine support |

---

## Phase 2: Data & Charts (Q2-Q3 2026)

The "graphics first" principle demands charts as priority 1-2, but there are
zero chart components in the toolkit today.

### 2.1 Scroll-Driven Charts ✅

| Component | Status |
|-----------|--------|
| `AnimatedBarChart` | Done — Recharts + viewport trigger, horizontal/vertical, highlight |
| `AnimatedLineChart` | Done — Multi-series, area fill, smooth curves |
| `AnimatedPieChart` | Done — Fan-open animation, donut variant |

| `AnimatedMetric` | Done — count-up number with sparkline, trend arrow, delta badge |
| `DataTable` | Done — sortable columns, staggered row reveal, highlight conditions |

### 2.2 Comparison & Timeline Visuals ✅

| Component | Status |
|-----------|--------|
| `BeforeAfter` | Done — Draggable comparison slider |
| `AnimatedTimeline` | Done — Vertical/horizontal with animated connector, staggered nodes |
| `FlowDiagram` | Done — Node-and-edge pipeline with dashed arrows, staggered reveal |
| `ScoreMatrix` | Done — Criteria × options grid with animated bars and color thresholds |

---

## Phase 3: Generation Pipeline (Q3 2026)

### 3.1 Template System ✅

Consolidated down to **two templates — one per mode** (April 2026). Both
cover the full narrative arc end-to-end and lean on the Phase 2
art-direction primitives by default.

| Template | Mode | Sections |
|----------|------|----------|
| `scroll` | scroll | Cold Open (WebGLHero), Their World (EditorialGrid), Evidence Rail (HorizontalPin), How It Works (PathDraw / ScrollCamera3D), The Gap (FullBleedQuote / BeforeAfter), Our Approach (FlowDiagram), Projected Impact (HeroStat + FlipNumber), Next Steps (AuroraBackground) |
| `slides` | slides | Title, Opening Frame, Their World, Landscape, Chapter Break, Proof Points, Before/After, Customer Voice, Chapter Break, Approach, Impact, Roadmap, Call to Action (each slide sets its own transition + mood) |

Narrative **posture** (`validation-extension`, `problem-solution`,
`comparison-recommendation`, `education-implication`, `status-direction`)
moved out of the template system — it is now a field on the brief that
tones the generator prompt.

**Prior art (removed Apr 2026):** The previous 5-template system
(`client-briefing`, `internal-pitch`, `conference-talk`, `status-update`,
`data-story`) was consolidated once the Phase 2 primitives and per-slide
transition system made mode-level blueprints expressive enough to cover
every posture with one template each.

### 3.2 Headless Generation API ✅

| Endpoint | Status |
|----------|--------|
| `POST /api/generate` | Done — accepts brief (title, audience, intent, template, source material), streams Claude generation, auto-deploys to branch + PR |
| `POST /api/generate/from-repo` | Done — extracts key files from a GitHub repo URL, builds source material, forwards to /api/generate |

**Flow:** Brief → select template → Claude generates TSX → auto-commit to branch → Vercel preview URL returned.

MCP tool available at `GET /api/mcp` (descriptor) and `POST /api/mcp` (invocation).

### 3.3 Shareable Preview Links ✅

| Component | Status |
|-----------|--------|
| `POST /api/share` | Done — captures HTML, uploads to Vercel Blob with 7-day TTL |
| `/share/[id]` page | Done — iframe-based preview with expiry banner |
| `<ShareButton>` | Done — client-side capture + upload + clipboard copy |
| Share in slide toolbar | Done — wired into `SlideControls` as icon button |
| Share in scroll chrome | Done — `ScrollExportBar` combines share + PDF export |
| `GET /api/share` | Done — list active shares or get share metadata |
| `DELETE /api/share?id=x` | Done — cleanup expired shares |

---

## Phase 4: Advanced (Q4 2026+)

### 4.1 tldraw Embedded Diagrams ✅
**Source:** [tldraw](https://tldraw.dev/) — v4.5, infinite canvas SDK

Done — `TldrawEmbed` component with lazy loading, SVG export, fullscreen mode,
snapshot restore, and dark theme. Available from `@/components/diagrams`.

### 4.2 Theatre.js Visual Timeline
**Source:** [Theatre.js](https://github.com/theatre-js/theatre) — 12k+ stars

Visual animation editor overlay for non-engineers to adjust timing and easing. Deferred until Theatre.js v1.0 ships publicly.

### 4.3 Pretext — DOM-Free Text Measurement
**Source:** [chenglou/pretext](https://github.com/chenglou/pretext) — 40k+ stars

**Decision (April 2026):** Removed from dependencies. Zero imports existed; every
framework primitive (`TextSplit`, `ScrollRevealText`, `FlipNumber`, editorial
typography) already ships its animations via CSS, Framer Motion, or `ResizeObserver`.
Pretext's value is DOM-free text measurement for virtual scrolling of very long
lists — a problem we don't have. Re-add only when:

- A virtualised slide list is needed (50+ slide decks with off-screen rendering), or
- A live WYSIWYG editor UI measures text before paint.

Until then, carrying the package added no runtime value and muddied the intent
of the dependency tree.

---

## Competitive Landscape

| Tool | Strengths | Our Advantage |
|------|-----------|---------------|
| **DexCode** | Terminal-first, MDX, fast simple decks | Full React component model, scrollytelling, interactive 3D, richer visual primitives |
| **Presenton** | REST API, self-host Docker, multi-LLM | Immersive web experience, scroll mode, custom animations, branded components |
| **Gamma** | Polished SaaS, AI generation, collaboration | Self-hosted, full code control, no vendor lock-in, 3D/shader effects |
| **Remotion** | Video output, React-native workflow | Web-first (interactive, linkable), PPTX export; Remotion is complementary |
| **Google Slides / PowerPoint** | Universal compatibility, collaboration | Visual richness, narrative quality, AI generation, scrollytelling, 3D |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-06 | Created roadmap | Track ecosystem opportunities and plan integrations systematically |
| 2026-04-06 | Prioritize Remotion (video export) as Phase 1 High | Most-requested missing export format; same React stack makes integration natural |
| 2026-04-07 | Remotion M1: Preview + CLI render | Installed `remotion`, `@remotion/cli`, `@remotion/player`. Created `SlideVideo` composition with crossfade transitions, `@remotion/player` preview modal, and video capture pipeline |
| 2026-04-07 | Remotion M3: TTS narration | Added `/api/tts` route (OpenAI `gpt-4o-mini-tts`), 6 voice options in modal, audio segments synced per slide via Remotion `<Audio>` + `<Sequence>`, auto-adjusted slide durations based on narration length |
| 2026-04-07 | Remotion M2: Server-side render | Added `/api/video/render` route with `@remotion/bundler` + `@remotion/renderer`; SSE progress streaming to client; "Download MP4" button replaces CLI-only hint; cached webpack bundle between requests; in-memory render buffer with auto-cleanup |
| 2026-04-07 | Roadmap v2: Visual-first rewrite | Removed AWS Lambda (not on AWS), social clips, 160k cubes. Elevated visual effects to Phase 1. Added shader gradients, tsParticles, R3F 3D scenes, premium scroll animations, Spline/Rive embeds. Added charts (Phase 2), templates + headless API + shareable previews (Phase 3) |
| 2026-04-07 | Phase 1 + 2 complete | Built all visual effects (Aurora, Mesh, Particles, TextSplit, MaskReveal, ParallaxLayer), 3D components (Globe3D, Scene3D, SplineEmbed, RiveEmbed), charts (Bar, Line, Pie, Timeline, FlowDiagram, ScoreMatrix, BeforeAfter), and 4 presentation templates with API |
| 2026-04-08 | Phase 3 complete | Headless generation API (POST /api/generate with streaming + /api/generate/from-repo), shareable preview links via Vercel Blob (POST /api/share + /share/[id] page + ShareButton component) |
| 2026-04-08 | Phase 4.1 + remaining backlog | tldraw embedded diagrams, MCP tool descriptor, MagneticElement, SmoothCounter, AnimatedMetric, DataTable. All roadmap phases 1-4.1 complete |
| 2026-04-08 | AI context upgrade + showcase | Rewrote ai-context.ts with full 30+ component library (was only 7 basic components). Built `/showcase-visuals` presentation demonstrating all new visual effects, charts, 3D, and data components. Fixed API docs for TextSplit, ParticleField, MeshGradient to match actual prop types |
| 2026-04-08 | Share integration + data-story template | Wired `ScrollExportBar` (share + PDF) into all 6 scroll presentations. Added share icon to slide toolbar. Built 5th template: `data-story` for data-driven narratives and fixed a presentation type error. |
| 2026-04-08 | OG metadata + gallery upgrade | Dynamic OG image API (`/api/og`) with branded social preview cards. `buildPresentationMetadata()` helper applied to all 9 route pages. Gallery index page with filter tabs (All/Scroll/Slides), type badges, customer tags, presentation count. Search across presentations |
