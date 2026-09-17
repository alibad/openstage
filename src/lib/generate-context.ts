/**
 * Builds the system prompt for the headless generation API.
 *
 * The framework ships exactly two templates — `scroll` and `slides`. The
 * generator picks the template from the brief's `mode` unless the caller
 * explicitly overrides it. Narrative posture (problem-solution,
 * status-direction, etc.) is a separate field on the brief that tones the
 * prompt without changing the template shape.
 */

import { buildSystemPrompt } from "./ai-context";
import {
  getDefaultTemplate,
  getTemplateById,
  type Posture,
  type Template,
} from "./templates";

export interface GenerateBrief {
  title: string;
  audience: string;
  intent: string;
  mode: "scroll" | "slides";
  /** Optional template id. Defaults to the canonical template for `mode`
   *  (`scroll` or `slides`). Kept for backwards-compat with older clients. */
  templateId?: string;
  /** Optional narrative posture — tones the prompt only, does not change
   *  the template blueprint. */
  posture?: Posture;
  accentColor?: string;
  sourceMaterial?: string;
  additionalInstructions?: string;
}

const POSTURE_GUIDANCE: Record<Posture, string> = {
  "validation-extension":
    "Tone: 'Your work is strong. Here's what comes next.' Front-load validation of the audience's existing effort, then extend it. Never open with disagreement.",
  "problem-solution":
    "Tone: 'Here's the pain. Here's the path out.' Lead with the audience's pain in their own language, then pivot to the path out. Tension before resolution.",
  "comparison-recommendation":
    "Tone: 'Here are the tradeoffs. Here's what I'd pick.' Surface the options honestly before recommending one. Use ScoreMatrix / ComparisonGrid.",
  "education-implication":
    "Tone: 'Here's how this works. Here's what it means for us.' Teach first, then translate the lesson into implications. Avoid insider jargon up front.",
  "status-direction":
    "Tone: 'Here's where we are. Here's where we're headed.' Factual current-state assessment, followed by a clear forward direction with owners.",
};

function formatTemplate(template: Template): string {
  const sections = template.sections
    .map((s, i) => {
      const extras = [
        s.dark ? "dark" : undefined,
        s.transition ? `transition=${s.transition}` : undefined,
        s.mood ? `mood=${s.mood}` : undefined,
      ]
        .filter(Boolean)
        .join(" | ");
      const meta = extras ? ` | ${extras}` : "";
      return `${i + 1}. **${s.title}** (${s.arc}) — ${s.purpose}\n   Visual: \`${s.visual || "custom"}\`${meta}\n   Prompt: ${s.prompt || "Use best judgment."}`;
    })
    .join("\n\n");

  const globalVars = template.variables
    .map(
      (v) =>
        `- ${v.name}: ${v.label}${v.required ? " (required)" : ""}${v.hint ? ` — ${v.hint}` : ""}`,
    )
    .join("\n");

  return `
## Active Template: ${template.name}

**Description:** ${template.description}

### Global Variables
${globalVars}

### Section Blueprint

Follow this section structure. Each section specifies its narrative arc phase,
recommended visual component, and generation guidance.${
    template.modes.includes("slides")
      ? " In slide mode each section maps to exactly one slide — preserve the `transition` and `mood` fields on the matching Slide object."
      : ""
  }

${sections}

IMPORTANT:
- Generate the sections in this order. Section IDs must match the template's \`id\`.
- Prefer the recommended visual primitive unless the source material strongly suggests otherwise.
- The slide/scroll-mode primitive names above correspond to real React components exported from \`@/components/animations\`, \`@/components/scrollytelling\`, \`@/components/charts\`, \`@/components/slide-primitives\`, \`@/components/slide-layouts\`, and \`@/components/3d\`. Do not invent new names.
`.trim();
}

function formatSlideInstructions(): string {
  return `
## Slide Mode Output

For slide-mode presentations, output a DIFFERENT format. The content file exports a
\`Presentation\` object with a \`slides\` array instead of a default component.

Each Slide may set an optional \`transition\` (one of \`fade | slide | blur | zoom | mask | none\`)
and an optional \`mood\` (one of \`warm | cool | mono | night | dawn\`). When the template
specifies them, pass them through verbatim.

### Slide Component Palette

Reach for these before falling back to bullet lists. Mix at least 4 different
visual types across the deck — a deck built from nothing but \`BulletList\` is
a failure state, not a baseline.

**Slide layouts (use one per slide where applicable):**
\`HeroStatSlide\` · \`EditorialSlide\` · \`FullBleedQuoteSlide\` ·
\`ChapterBreakSlide\` · \`BentoSlide\`
(all from \`@/components/slide-layouts\`)

**Primitives (compose inside slides):**
\`SlideHeading\` · \`SlideSubtitle\` · \`SectionTag\` · \`BulletList\`/\`Bullet\` ·
\`StatCard\`/\`StatGrid\` · \`ComparisonGrid\` · \`SlideCallout\` ·
\`SlideTimeline\` · \`NumberedSteps\` · \`CodePreview\`
(from \`@/components/slide-primitives\`)

**Rich data / comparison components — USE THESE, not card grids:**
- \`BeforeAfter\` (draggable slider) — for before/after states, any time two
  versions need to be compared side-by-side. Works with images, screenshots,
  styled divs, or charts.
- \`ScoreMatrix\` — criteria × options evaluation grid (vendors, platforms,
  tradeoffs) with animated score bars and thresholds.
- \`DataTable\` — styled tables with row highlighting and staggered reveal.
- \`Spectrum\` — axis positioning (Manual ↔ Automated, Legacy ↔ Future)
  with labelled dots.
- \`AnimatedTimeline\` — vertical or horizontal project timeline / roadmap.
- \`FlowDiagram\` — pipeline / architecture with nodes and edges.
- \`AnimatedBarChart\` / \`AnimatedLineChart\` / \`AnimatedPieChart\` —
  for magnitude / trend / composition stories.
- \`AnimatedMetric\` — large number + sparkline + trend delta.
(all from \`@/components/charts\`)

**3D / interactive / game-like components — use when the content warrants it:**
- \`Globe3D\` — rotating earth with markers and arcs. Use for geographic,
  geopolitical, or global-operations slides.
- \`Scene3D\` — generic \`.glb\` / \`.gltf\` model viewer with environment
  lighting and orbit controls.
- \`SplineEmbed\` — embed a Spline scene URL.
- \`RiveEmbed\` — embed a Rive animation.
- \`TldrawEmbed\` — **live editable** infinite canvas for diagrams; the
  audience can draw on it during the talk.
- \`InteractionZone\` — click-to-explore zones; pauses the narrative for
  audience-driven deep dives.
- \`MagneticCard\` — 3D tilt card that follows the pointer. Great for
  "explore our products" or hero moments.
- \`MagneticElement\` — subtle cursor-follower for hero CTAs / logos.
IMPORTANT: 3D and canvas components (\`Globe3D\`, \`Scene3D\`, \`SplineEmbed\`,
\`RiveEmbed\`, \`TldrawEmbed\`) MUST be dynamically imported with SSR disabled:
\`const Globe3D = dynamic(() => import("@/components/3d").then(m => ({ default: m.Globe3D })), { ssr: false });\`

**Ambient backgrounds (wrap \`<ChapterBreakSlide>\` or \`<FullBleedQuoteSlide>\` for extra depth):**
\`AuroraBackground\` · \`MeshGradient\` · \`ParticleField\` (presets:
constellation, ambient, snow, fireflies, rising, matrix)
(from \`@/components/animations\`)

**Text / entrance effects:**
\`TextSplit\` (word / char blur-in, slide-up, etc.) · \`MaskReveal\`
(circle / diamond / diagonal / curtain) · \`FlipNumber\` (mechanical counter) ·
\`SmoothCounter\` (upgraded animated number) · \`Marquee\` (infinite ticker
for logo rows, values, quotes)

\`\`\`tsx file="src/content/{slug}.tsx"
"use client";

import dynamic from "next/dynamic";
import { Presentation } from "@/lib/types";
import {
  SectionTag, SlideHeading, SlideSubtitle,
  Bullet, BulletList, StatCard, StatGrid,
  ComparisonGrid, SlideCallout, SlideTimeline,
  NumberedSteps, CodePreview,
} from "@/components/slide-primitives";
import {
  HeroStatSlide, EditorialSlide, FullBleedQuoteSlide,
  ChapterBreakSlide, BentoSlide,
} from "@/components/slide-layouts";
import {
  AnimatedBarChart, AnimatedLineChart, AnimatedPieChart,
  AnimatedMetric, AnimatedTimeline,
  FlowDiagram, ScoreMatrix, DataTable, BeforeAfter,
} from "@/components/charts";
import {
  FlipNumber, SmoothCounter, Marquee, TextSplit, MaskReveal,
  MagneticCard, MagneticElement, AuroraBackground, MeshGradient,
  ParticleField, Spectrum, InteractionZone,
} from "@/components/animations";
const Globe3D = dynamic(
  () => import("@/components/3d").then(m => ({ default: m.Globe3D })),
  { ssr: false },
);

function TitleSlide() {
  return (
    <div className="flex flex-col h-full items-center justify-center text-center gap-4">
      <SlideHeading>Title Here</SlideHeading>
      <SlideSubtitle>Subtitle here</SlideSubtitle>
    </div>
  );
}

// ... more slide functions — prefer HeroStatSlide / EditorialSlide /
//     FullBleedQuoteSlide / ChapterBreakSlide / BentoSlide / Globe3D /
//     BeforeAfter / ScoreMatrix / InteractionZone over raw bullet dumps.

export const myPresentation: Presentation = {
  slug: "my-slug",
  title: "Title",
  subtitle: "Subtitle",
  author: "Your Brand",
  date: "April 2026",
  description: "One-liner.",
  slides: [
    { id: "title",    content: <TitleSlide />,  transition: "blur",  mood: "night", notes: "Open with confidence." },
    { id: "impact",   content: <ImpactSlide />, transition: "zoom",  mood: "cool",  notes: "Land the number." },
    // ... more slides
  ],
};
\`\`\`

The route page for slide mode:

\`\`\`tsx file="src/app/{slug}/page.tsx"
import { SlideDeck } from "@/components/slide-deck";
import { myPresentation } from "@/content/{slug}";

export const metadata = {
  title: "Title — Your Brand",
  description: "Description.",
};

export default function Page() {
  return <SlideDeck presentation={myPresentation} />;
}
\`\`\`
`.trim();
}

function formatScrollInstructions(): string {
  return `
## Scroll Mode Output

Scroll decks render a single default-export React component and rely on the
Phase 2 art-direction primitives. Include:

- \`<ScrollProgress />\` top bar and \`<PrintButton />\` (unless print mode).
- \`<ScrollNarrator sections={NARRATION_SECTIONS} hidden={print} />\` — define
  the NARRATION_SECTIONS array with one entry per \`<Section id="...">\`.
- \`usePrintMode()\` + \`useM()\` for print-safe motion.
- Alternate dark / light \`<Section>\` blocks. Dark sections must carry the
  \`slide-dark\` class alongside \`bg-bg-dark text-white\`.
- Use fluid display scales (\`display-xl\`, \`display-lg\`, …), \`text-balance\`
  on headings, \`text-pretty\` on prose, and the \`prose-presentation\` class
  on long-form columns.
- Apply \`data-mood="..."\` on sections that want a distinct palette
  (warm / cool / mono / night / dawn).

### Scroll Component Palette

Reach for these before falling back to plain card grids or bullet lists. Mix
at least 5 different primitives across the deck.

**Hero / ambient backgrounds (pick ONE per section):**
- \`WebGLHero\` — GLSL flow-field cover with pointer reactivity.
- \`AuroraBackground\` — animated northern-lights gradient.
- \`MeshGradient\` — organic morphing blob gradient.
- \`ParticleField\` (presets: constellation / ambient / snow / fireflies /
  rising / matrix) — particle engine backgrounds.
- \`FullBleed\` — full-viewport hero image / video with overlay text.

**Layouts & narrative primitives:**
- \`EditorialGrid\` + \`EditorialCell\` — asymmetric 12-col magazine layouts.
- \`HeroStat\` — dominant-figure hero (number + kicker + lede).
- \`HorizontalPin\` — GSAP-pinned horizontal rail (case studies, option comparisons).
- \`PathDraw\` + \`PathDrawAnnotation\` — scroll-linked SVG spine for data flows /
  architectures.
- \`ScrollCamera3D\` — scroll-linked React Three Fiber camera rig with keyframes.
- \`StickyMedia\` — pinned visual + scrolling text steps.
- \`StickyAnnotations\` — pinned image with accumulating annotations.
- \`ScrollRevealText\` / \`TextSplit\` / \`MaskReveal\` — progressive text entrance.
- \`Marquee\` — infinite ticker (logo bands, value manifestos, quotes).
- \`IntroSequenceWrapper\` — branded cold-open loader (session-gated).

**Charts / data — always pick one of these over a plain card grid:**
- \`AnimatedBarChart\` / \`AnimatedLineChart\` / \`AnimatedPieChart\` — trends /
  magnitudes / composition.
- \`AnimatedMetric\` — large number with sparkline and delta.
- \`AnimatedTimeline\` — vertical / horizontal project timeline.
- \`FlowDiagram\` — pipeline / architecture with nodes and edges.
- \`ScoreMatrix\` — criteria × options evaluation grid.
- \`DataTable\` — sortable table with row highlighting.
- \`BeforeAfter\` — draggable slider comparing two states. Use for
  before/after screenshots, old-vs-new UIs, legacy-vs-new metrics.

**3D / interactive / game-like — use whenever the content warrants it:**
- \`Globe3D\` — rotating earth with markers and arcs (geographic,
  geopolitical, global-operations stories).
- \`Scene3D\` — generic 3D model viewer (\`.glb\` / \`.gltf\`).
- \`SplineEmbed\` — Spline scene embed.
- \`RiveEmbed\` — Rive animation embed.
- \`TldrawEmbed\` — **live editable** canvas diagram. Audience can draw on
  it during the talk.
- \`InteractionZone\` — click-to-explore zones; pauses the scroll narrative
  for audience-driven deep dives.
- \`Spectrum\` — axis positioning (Manual ↔ Automated) with labeled dots.
- \`MagneticCard\` / \`MagneticElement\` — cursor-reactive cards and CTAs.
- \`CustomCursor\` — app-level cursor that morphs over \`data-cursor-magnetic\`
  zones and reveals \`data-cursor-label\` copy.
IMPORTANT: 3D and canvas components (\`Globe3D\`, \`Scene3D\`, \`SplineEmbed\`,
\`RiveEmbed\`, \`TldrawEmbed\`) MUST be dynamically imported with SSR disabled:
\`const Globe3D = dynamic(() => import("@/components/3d").then(m => ({ default: m.Globe3D })), { ssr: false });\`

**Counters / numbers:**
- \`FlipNumber\` — mechanical split-flap counter.
- \`SmoothCounter\` — count-up with easing, locale, compact notation, trend.
- \`AnimatedCounter\` — simple count-up.

Rule of thumb: if the section would otherwise be a card grid of text, replace
it with one of the components above.
`.trim();
}

export function buildGeneratePrompt(brief: GenerateBrief): string {
  const basePrompt = buildSystemPrompt({ mode: "create" });

  const parts = [basePrompt];

  // Default to the canonical template for the chosen mode if the caller
  // didn't pick one explicitly. Legacy template ids still resolve via
  // getTemplateById; unknown ids fall through to the default.
  const template =
    (brief.templateId ? getTemplateById(brief.templateId) : undefined) ||
    getDefaultTemplate(brief.mode);

  if (brief.mode === "slides") {
    parts.push(formatSlideInstructions());
  } else {
    parts.push(formatScrollInstructions());
  }

  parts.push(formatTemplate(template));

  const postureLine = brief.posture
    ? `\n\n**Narrative Posture:** ${brief.posture}\n${POSTURE_GUIDANCE[brief.posture]}`
    : "";

  parts.push(`
## Generation Task

Create a complete ${brief.mode}-mode presentation with the following brief:

**Title:** ${brief.title}
**Audience:** ${brief.audience}
**Intent:** ${brief.intent}
${brief.accentColor ? `**Accent Color:** ${brief.accentColor}` : ""}
${brief.additionalInstructions ? `**Additional Instructions:** ${brief.additionalInstructions}` : ""}${postureLine}

${
  brief.sourceMaterial
    ? `## Source Material\n\nUse the following material as the primary source. Extract real data, quotes, and specifics. Never fabricate statistics.\n\n${brief.sourceMaterial}`
    : ""
}

## Output Rules

1. Output the COMPLETE content file inside a fenced block: \`\`\`tsx file="src/content/{slug}.tsx"
2. Output the COMPLETE route page inside a fenced block: \`\`\`tsx file="src/app/{slug}/page.tsx"
3. Output a JSON metadata block: \`\`\`json file="metadata"
   Include: { "slug": "...", "title": "...", "description": "...", "mode": "...", "sectionCount": N }
4. Every section must have real content grounded in the brief or source material.
5. Use the full component library: animations, scrollytelling, charts, 3D where appropriate.
6. Follow the "graphics first" principle: lead with visuals, text as annotation.
`);

  return parts.join("\n\n");
}

/**
 * Extracts fenced code blocks from the AI response.
 * Returns a map of file paths to content.
 */
export function extractGeneratedFiles(
  response: string,
): { files: Record<string, string>; metadata: Record<string, string> } {
  const files: Record<string, string> = {};
  const metadata: Record<string, string> = {};

  const fenceRegex = /```(?:tsx|json)\s+file="([^"]+)"\n([\s\S]*?)```/g;
  let match;

  while ((match = fenceRegex.exec(response)) !== null) {
    const filePath = match[1];
    const content = match[2].trim();

    if (filePath === "metadata") {
      try {
        const parsed = JSON.parse(content);
        Object.assign(metadata, parsed);
      } catch {
        // Metadata parsing is best-effort
      }
    } else {
      files[filePath] = content;
    }
  }

  return { files, metadata };
}
