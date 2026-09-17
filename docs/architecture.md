# Architecture

## File structure

```
src/
  content/
    registry.ts              # Presentation metadata and registry
    {slug}.tsx               # Presentation content (one per presentation)
  app/
    {slug}/page.tsx          # Route page (thin wrapper)
    help/page.tsx            # Persona-driven help hub
    admin/                   # Admin dashboard, studio, management
    api/
      generate/              # Headless generation (POST /api/generate)
      generate/from-repo/    # Generate from GitHub repo
      mcp/                   # MCP tool endpoint for Cursor/Claude
      templates/             # Template discovery API
      share/                 # Share link management (Vercel Blob)
      tts/                   # Text-to-speech for video narration
      og/                    # Dynamic OG social preview images
      presentations/         # Create requests, status tracking
      chat/                  # AI Studio chat endpoint
      deploy/                # Preview, merge, discard branches
      feedback/              # Inline feedback system
      auth/                  # Site and admin authentication
  components/
    animations/              # Reveal, StaggerChildren, AnimatedCounter, etc.
    scrollytelling/          # StickyMedia, ScrollVideo, FullBleed, Spectrum, etc.
    3d/                      # Globe3D, Scene3D, SplineEmbed, RiveEmbed
    charts/                  # AnimatedBarChart, AnimatedLineChart, AnimatedPieChart, etc.
    diagrams/                # TldrawEmbed (live-editable canvas)
    slide-deck.tsx           # Slide-mode container with keyboard nav
    slide-primitives.tsx     # Reusable building blocks for slide content
    video-export-modal.tsx   # Remotion Player preview modal
    pdf-export.tsx           # Screenshot-based PDF export
    studio/                  # AI chat panel, deploy bar, selectors
    feedback-widget/         # Inline annotation + screenshot feedback
  lib/
    templates/               # Presentation blueprints (5 templates)
    generate-context.ts      # System prompt builder for generation API
    ai-context.ts            # Framework conventions for AI
    github.ts                # GitHub App integration
    brand.ts                 # Brand colors and gradients
    pptx-export.ts           # PPTX generation (html2canvas + pptxgenjs)
    print-mode.ts            # ?print mode support
    studio-store.ts          # Zustand store for AI Studio state
    types.ts                 # Slide and Presentation interfaces
remotion/
  index.ts                   # Remotion CLI entry point
  Root.tsx                   # Composition registry
  SlideVideo.tsx             # Video composition with crossfade transitions
```

## Generation pipeline

```
Input (brief or repo URL)
  │
  ├─ POST /api/generate/from-repo
  │    → Extracts README, manifests, source files from GitHub
  │    → Forwards to /api/generate
  │
  ├─ POST /api/generate
  │    → buildGeneratePrompt() assembles system prompt
  │    → Anthropic Claude (claude-opus-4-20250514, max 16k tokens)
  │    → extractGeneratedFiles() parses fenced code blocks
  │    → deployGenerated() commits to branch pres/{slug}
  │    → Creates PR if new branch
  │    → Returns slug, branch, prUrl
  │
  └─ POST /api/mcp
       → MCP wrapper, calls /api/generate with stream: false
       → Returns MCP-formatted summary
```

## Admin request flow

```
Admin submits brief (/admin/new)
  → Assets uploaded to GitHub repo
  → GitHub Issue created with structured payload
  → Claude Code picks up the issue
  → Generates src/content/{slug}.tsx + route page
  → Registers in registry.ts
  → Deploys via Vercel
```

## AI Studio flow

```
Admin opens /admin/studio
  → Selects mode (create / edit / feedback)
  → Chats with Claude to generate or modify content
  → Preview on a branch → Merge to main → Auto-deploy
```

## Export pipeline

| Export | Tech | Flow |
|--------|------|------|
| PPTX | html2canvas-pro + pptxgenjs | Capture each slide → embed as image → add speaker notes → download .pptx |
| Video | Remotion + OpenAI TTS | Capture slides → Remotion Player preview → crossfade transitions + optional narration → MP4 |
| PDF | html2canvas-pro | Screenshot each section at 1920x1080 → download PDF |
| Share | Vercel Blob | Capture full HTML → upload with 7-day TTL → shareable URL at /share/{id} |
