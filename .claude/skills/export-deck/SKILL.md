---
name: export-deck
description: "Export a slide deck to PowerPoint (PPTX), to video (Remotion), or add TTS narration — generated audio / voiceover for playback or video (per-slide V-key and the scroll-mode ScrollNarrator widget). Use when exporting a presentation or wiring up voiceover. Note: the on-screen speaker-notes panel and its keyboard toggle are slide-mode, not this skill."
---

### PPTX Export

Slide-mode presentations can be exported to PowerPoint via the download button
in the bottom toolbar. The export:

1. Captures each slide as a high-resolution screenshot (html2canvas)
2. Embeds each screenshot as a full-slide image in a PPTX (pptxgenjs)
3. Copies speaker notes from each `Slide.notes` into the PPTX notes field
4. Adds a footer with title, author, and slide number

The PPTX preserves the exact visual fidelity of the web version. Recipients
can present directly from the PPTX or further edit in PowerPoint.

This bridges the gap between our immersive web presentations and the
traditional PPTX workflow that many stakeholders expect. For pure PPTX
generation from scratch (no web version needed), use the
`presentation-maker` skill instead.

### Video Export (Remotion)

Slide-mode presentations can be previewed and exported as video via the camera
button in the bottom toolbar. The export:

1. Captures each slide as a high-resolution screenshot (html2canvas, same as PPTX)
2. Opens a Remotion Player modal with in-browser video preview
3. User can adjust duration per slide (2-15s) and transition duration (0-3s)
4. Crossfade transitions between slides with a subtle zoom-in effect
5. CLI rendering via `npx remotion render remotion/index.ts SlideVideo out.mp4`

The Remotion infrastructure lives in the `remotion/` folder at the project root.
The `SlideVideo` composition accepts an array of base64 image data URLs and
timing configuration. The Remotion Player is lazily loaded in
`video-export-modal.tsx` to avoid impacting bundle size.

Scripts: `npm run remotion:studio` (visual editor), `npm run remotion:render` (MP4 output).

### TTS Narration

AI-powered narration is available in **both** presentation modes via `/api/tts`.
The TTS endpoint supports OpenAI (`gpt-4o-mini-tts`), Azure OpenAI, and a free
fallback using Edge TTS (Microsoft Neural voices, no API key required).

Six voices are available: Nova, Alloy, Echo, Fable, Onyx, Shimmer.

#### Slide-mode narration

Two ways to narrate slide decks:

1. **Per-slide narration (V key):** Press V or click the speaker icon in the
   bottom toolbar. The current slide's `notes` text is sent to `/api/tts`,
   audio plays immediately, and is cached for instant replay. Pauses on slide
   change. Works on any slide with a `notes` field.

2. **Bulk narration for video export:** The video export modal (camera icon)
   includes a narration panel with voice selection, script editing, and
   "Generate Narration" to TTS all slides at once. Audio is baked into the
   Remotion video with auto-adjusted slide durations.

#### Scroll-mode narration (`ScrollNarrator`)

A floating narrator widget (`@/components/scroll-narrator`) provides
section-by-section TTS for scroll presentations.

```tsx
import { ScrollNarrator, type NarrationSection } from "@/components/scroll-narrator";

const NARRATION_SECTIONS: NarrationSection[] = [
  { sectionId: "hero", label: "Introduction", text: "Welcome to..." },
  { sectionId: "problem", label: "The Problem", text: "The core challenge is..." },
  { sectionId: "solution", label: "Our Approach", text: "Our approach addresses this by..." },
];

// Inside the main component return:
<ScrollNarrator sections={NARRATION_SECTIONS} hidden={print} />
```

How it works:

1. A floating mic button appears in the bottom-right corner (z-90, below
   chapter nav but above content)
2. Click to expand a mini player: current section, play/pause, skip, section list
3. Uses `IntersectionObserver` (`rootMargin: "-30% 0px -30% 0px"`) to track
   which `<Section id="...">` is in view
4. Press play to TTS the current section's text via `/api/tts`
5. Audio is cached per section for instant replay
6. "Auto-play" toggle narrates continuously, advancing to the next section
   when audio ends
7. Hidden in print mode (`hidden={print}`) and dismissible via X button

Props: `sections` (array of `NarrationSection`), `voice` (default `"nova"`),
`hidden` (boolean).

**Every new scroll presentation should include `ScrollNarrator`** with a
`NARRATION_SECTIONS` array defined at module scope. Each entry needs:

- `sectionId`: matches the `id` attribute on the `<Section>` element
- `label`: human-readable name shown in the player UI
- `text`: the narration script (2-4 sentences per section, conversational tone)

Requires `OPENAI_API_KEY` in `.env.local` for OpenAI voices. Falls back to
Edge TTS (free, no key) automatically.
