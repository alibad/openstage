---
name: generation-api
description: "Generate presentations programmatically: the generate_presentation MCP tool, the two-template system (scroll/slides), the headless POST /api/generate and /api/generate/from-repo endpoints, and shareable preview links. Use when generating a deck via API or MCP, working with templates, or creating share links."
---

### MCP Tool

The generation API is exposed as an MCP tool for Cursor/Claude integration.

- **Tool name:** `generate_presentation`
- **Discovery:** `GET /api/mcp` returns the tool descriptor
- **Invocation:** `POST /api/mcp` with `{ "name": "generate_presentation", "arguments": { ... } }`

The tool accepts the same arguments as `POST /api/generate` (title, audience,
intent, mode, templateId, sourceMaterial, etc.) and returns a summary with
the slug, branch, and PR URL.

### Template System

The framework ships **exactly two templates — one per mode**. Both cover the
full six-beat narrative arc (attention → empathy → credibility → tension →
resolution → cta) and lean on the Phase 2 art-direction primitives by default.

| Template | Mode | What it is |
|----------|------|------------|
| `scroll` | `scroll` | Immersive scroll narrative built from WebGLHero, EditorialGrid, HorizontalPin, PathDraw, HeroStat + FlipNumber, ScrollCamera3D, Aurora/ParticleField closings, and a ScrollNarrator. |
| `slides` | `slides` | Traditional deck built from the Awwwards-tier slide layouts (`HeroStatSlide`, `EditorialSlide`, `FullBleedQuoteSlide`, `ChapterBreakSlide`, `BentoSlide`) with per-slide `transition` and `mood` variants. Exports to PPTX. |

**Narrative posture** (`validation-extension`, `problem-solution`,
`comparison-recommendation`, `education-implication`, `status-direction`) is
a **separate field on the brief**, not a separate template. It tones the
generator prompt — the blueprint shape stays the same.

To query templates programmatically:
- `GET /api/templates` — returns both templates
- `GET /api/templates?id=scroll` — full scroll blueprint
- `GET /api/templates?id=slides` — full slides blueprint
- `GET /api/templates?mode=slides` — filter by mode (will return `slides`)

When using templates for AI generation, the `prompt` field on each section
provides guidance for content generation, and the `variables` field specifies
what data the section expects. The slides template also sets recommended
`transition` and `mood` per slide — the generator should preserve those on
the emitted `Slide` objects.

### Headless Generation API

Generate presentations programmatically without the Studio UI.

#### `POST /api/generate` — Generate from a brief

```json
{
  "title": "AI Strategy for ACME Corp",
  "audience": "C-suite executives",
  "intent": "Secure budget approval for an AI transformation program",
  "mode": "scroll",
  "posture": "problem-solution",
  "accentColor": "#4EA8DE",
  "sourceMaterial": "Paste raw text, markdown, or document content here...",
  "additionalInstructions": "Focus on cost savings over revenue growth",
  "stream": true
}
```

**Stream mode (default):** Returns SSE events:
- `event: status` — phase updates ("generating", "deploying")
- `event: chunk` — AI response text chunks
- `event: complete` — final result with `slug`, `branch`, `prUrl`, `files`
- `event: error` — error message

**Batch mode (stream=false):** Returns JSON with `slug`, `branch`, `prUrl`, `files`, `usage`.

#### `POST /api/generate/from-repo` — Generate from a GitHub repo

```json
{
  "repoUrl": "https://github.com/owner/repo",
  "audience": "Open source community",
  "intent": "Explain the project's architecture and value proposition",
  "mode": "scroll",
  "posture": "education-implication",
  "focusPaths": ["src/core/", "README.md"]
}
```

Extracts key files (README, package.json, source files) from the repo,
then forwards to `/api/generate` with the extracted content as source material.

### Shareable Preview Links

One-click sharing without going through Git/Vercel deploy.

#### `POST /api/share` — Create a share link

Captures the current page HTML, uploads to Vercel Blob with a 7-day TTL,
and returns a shareable URL at `/share/{id}`.

**Client-side usage:** Drop a `<ShareButton slug="my-slug" />` into any
presentation. It captures the DOM, uploads, and copies the URL to clipboard.

```tsx
import { ShareButton } from "@/components/share-button";

<ShareButton slug="q3-board-review" title="Q3 Board Review" variant="button" />
```

**API usage:**

```json
POST /api/share
{ "slug": "q3-board-review", "html": "<!DOCTYPE html>...", "title": "Q3 Board Review" }

Response:
{ "shareId": "q3-board-review-a1b2c3d4", "shareUrl": "https://example.com/share/q3-board-review-a1b2c3d4", "expiresAt": "..." }
```
