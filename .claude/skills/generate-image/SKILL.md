---
name: generate-image
description: Generate imagery for a presentation slide using OpenAI GPT Image 2 (gpt-image-2). Covers model/sizing/quality, when an image is earned vs skipped, the zero-text and dark-palette hard rules, and the server-side gen-images.mjs workflow (generate once, commit the PNG). Use when adding, generating, or regenerating an image for a deck.
---

# Image generation (GPT Image 2)

Use **OpenAI GPT Image 2** (`gpt-image-2`, released April 2026) to generate images for slides that genuinely need one. Most slides don't — earn it.

Env var: `OPENAI_API_KEY` (in `.env.local`). Image generation requires org verification on the OpenAI account.
SDK: `openai` (already in `package.json`).

## Model & sizing

| Param | Value |
|---|---|
| `model` | `gpt-image-2` |
| `size` | `1024x1024` (square), `1536x1024` (landscape, default for slides), `1024x1536` (portrait) |
| `quality` | `low` (~$0.006), `medium` (~$0.053, default), `high` (~$0.211) |

Default to `medium` quality for slide visuals — `high` only for hero/cover imagery where detail matters.

## When to generate an image

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

## Hard rules for generated images

1. **Zero text in the image** — no labels, numbers, legends, or annotations. Decks ship in multiple languages; text baked into a raster image is untranslatable.
2. **Pure visual metaphor** — shapes, anatomy, flow, colour — not words.
3. **Dark-palette compatible** — prompt for a dark background (e.g. `#0b1b26` or `#0f172a`) or transparent-friendly composition so it doesn't look pasted in.
4. **Match the deck's palette** — hint at the deck's accent colours in the prompt so generated imagery feels integrated.
5. **Run server-side, save once** — never call OpenAI from the client. Generate via `scripts/gen-images.mjs`, save the PNG as a static asset in `public/generated/`, and reference it with `<img>` or Next.js `<Image>`.

## Workflow

1. Decide the slide needs an image (apply the criteria above).
2. Add `{ slug, prompt }` to `scripts/gen-images.mjs` and run `npm run gen-images`.
3. The PNG lands in `public/generated/<slug>.png`.
4. Reference it in the slide component: `<img src="/generated/<slug>.png" className="..." />`.
5. Commit the PNG — it's a static asset, not a runtime call.

**Never regenerate at runtime.** Images are generated once, committed, and served statically. The script skips any slug whose PNG already exists; delete the PNG first to regenerate.
