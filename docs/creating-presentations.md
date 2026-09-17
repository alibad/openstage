# Creating Presentations

There are two ways to create presentations: through the **Admin UI** (no code) or by **writing code** directly.

## Admin mode (no code required)

The admin dashboard at `/admin` lets non-developers create and manage presentations through a web interface.

### Quick request (`/admin/new`)

1. Fill in the title, customer, brief, and optional accent color / password
2. Attach reference documents (PDFs, images, data files)
3. Submit — the app uploads assets to GitHub and creates a GitHub Issue
4. Claude Code picks up the issue, generates the React component, and deploys

### AI Studio (`/admin/studio`)

- Chat-based interface powered by Claude for creating and editing presentations interactively
- Three modes: **Create** (from scratch), **Edit** (modify existing), **Feedback** (address reviewer comments)
- Changes go through a preview/deploy pipeline with branch management

### Access

The admin panel requires the `ADMIN_PASSWORD` environment variable. In production, the entire site also requires `SITE_PASSWORD`.

## Developer mode (code)

Clone the repo and build presentations as React components.

### Create a presentation

Each presentation requires three files:

1. **Content component** at `src/content/{slug}.tsx` — the presentation itself as a React component
2. **Route page** at `src/app/{slug}/page.tsx` — thin wrapper that imports the content component
3. **Registry entry** in `src/content/registry.ts` — metadata (title, description, customer, status)

See `CLAUDE.md` for the full component template, design system reference, and quality standards.

### Two modes

| Mode | Best for | Navigation | Export |
|------|----------|------------|--------|
| **Scroll** | Immersive narratives, data stories, client briefings | Free scroll, chapter nav | PDF, Print |
| **Slides** | Board decks, internal pitches, conference talks | Arrow keys, click, fullscreen | PPTX, Video, PDF |

### Key conventions

- Sections alternate dark/light backgrounds for visual rhythm
- Hero section is always first and dark; CTA section is always last and dark
- Use animation components from `@/components/animations` (Reveal, StaggerChildren, AnimatedCounter, etc.)
- All content must be grounded in the brief or source documents — no made-up stats
- Presentations support `?print` mode (strips animations for PDF/print) and PDF export

### Templates

The framework ships **exactly two templates** — one per mode. Both cover the
full narrative arc and use the Phase 2 art-direction primitives by default.

| Template | Mode | What it is |
|----------|------|------------|
| `scroll` | scroll | Immersive scroll narrative. WebGLHero, EditorialGrid, HorizontalPin, PathDraw, HeroStat + FlipNumber, ScrollCamera3D, and a ScrollNarrator. |
| `slides` | slides | Traditional deck with the Awwwards-tier slide layouts (HeroStatSlide, EditorialSlide, FullBleedQuoteSlide, ChapterBreakSlide, BentoSlide), per-slide transitions, and mood overrides. PPTX export. |

Narrative **posture** (`validation-extension`, `problem-solution`,
`comparison-recommendation`, `education-implication`, `status-direction`) is
a separate field on the generation brief that tones the prompt — it does not
change the template.

Query templates programmatically via `GET /api/templates` (returns both) or
`GET /api/templates?mode=scroll|slides`.
