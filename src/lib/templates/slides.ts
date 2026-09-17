import { Template } from "./types";

/**
 * The canonical Slides blueprint.
 *
 * One template for every slide-mode deck. Covers the full narrative arc in
 * ~13 slides and uses the Awwwards-tier slide layouts (HeroStatSlide,
 * EditorialSlide, FullBleedQuoteSlide, ChapterBreakSlide, BentoSlide) plus
 * per-slide `transition` and `mood` fields so the generator produces a
 * varied, art-directed deck by default instead of a wall of bullet lists.
 *
 * The generator may add / remove slides but should preserve the arc order
 * and the rhythm of chapter breaks between content clusters.
 */
export const slidesTemplate: Template = {
  id: "slides",
  name: "Slides",
  description:
    "Traditional slide deck with keyboard nav, speaker notes, and PPTX export. Uses the Awwwards-tier slide layouts (hero-stat, editorial, full-bleed quote, chapter break, bento) plus per-slide transitions and mood overrides so the deck reads like an art-directed keynote instead of a bullet-point dump.",
  modes: ["slides"],
  accentColor: "#7DD3FC",
  tags: ["slides", "deck", "keynote", "pptx"],
  variables: [
    { name: "title", label: "Title", type: "text", required: true, hint: "5 words max" },
    { name: "subtitle", label: "Subtitle", type: "text", required: true },
    { name: "author", label: "Author", type: "text", default: "Your Brand" },
    { name: "date", label: "Date", type: "date", required: true },
    {
      name: "posture",
      label: "Narrative Posture",
      type: "select",
      options: [
        "validation-extension",
        "problem-solution",
        "comparison-recommendation",
        "education-implication",
        "status-direction",
      ],
      hint: "Shapes the tone of the whole deck. Optional.",
    },
    {
      name: "bilingual",
      label: "Bilingual (AR/EN)",
      type: "select",
      options: ["no", "yes"],
      default: "no",
      hint: "When 'yes', follow the bilingual slide-mode pattern from CLAUDE.md (buildPresentation(s) wrapper).",
    },
  ],
  sections: [
    {
      id: "title",
      title: "Title",
      purpose: "Open the deck with confidence. Name, date, author.",
      arc: "attention",
      visual: "title-slide",
      dark: true,
      transition: "blur",
      mood: "night",
      prompt:
        "Center-aligned <SlideHeading> + <SlideSubtitle> with author and date in text-muted. Optional <TextSplit animation='blur-in'> on the heading. Keep it restrained — the blur transition does the work on entry.",
    },
    {
      id: "opening",
      title: "Opening Frame",
      purpose: "Plant the question the deck will answer.",
      arc: "attention",
      visual: "full-bleed-quote",
      dark: true,
      transition: "fade",
      mood: "dawn",
      prompt:
        "<FullBleedQuoteSlide> with a single oversized serif sentence that reframes the audience's assumption. Attribute sparingly (source + role only).",
    },
    {
      id: "context",
      title: "Their World",
      purpose: "Prove empathy with real numbers from the audience's universe.",
      arc: "empathy",
      visual: "hero-stat-slide",
      dark: false,
      transition: "zoom",
      mood: "warm",
      prompt:
        "<HeroStatSlide> with one dominant number (use <FlipNumber> when it is a count / metric) and a one-sentence lede that puts it in context. Below the stat, 2-3 <AnimatedMetric> cards with sparklines OR 2-3 <StatCard>s. If the story is geographic (markets, deployments, offices), swap the stat for a <Globe3D> (dynamic import, { ssr: false }) with markers and arcs.",
    },
    {
      id: "landscape",
      title: "Landscape",
      purpose: "Survey the space — editorial-style breakdown of themes.",
      arc: "empathy",
      visual: "editorial-slide",
      dark: false,
      transition: "slide",
      prompt:
        "<EditorialSlide> with kicker, lede, body, and an aside figure (chart or image). Apply text-balance to the heading and prose-presentation to the body column.",
    },
    {
      id: "chapter-break-1",
      title: "Chapter Break",
      purpose: "Pause beat before credibility section.",
      arc: "tension",
      visual: "chapter-break",
      dark: true,
      transition: "mask",
      mood: "night",
      prompt:
        "<ChapterBreakSlide> number='01' title='Why Now' subtitle=''. Typography-only — no visuals.",
    },
    {
      id: "proof",
      title: "Proof Points",
      purpose: "Credibility wall — case studies, partnerships, published results.",
      arc: "credibility",
      visual: "bento-slide",
      dark: false,
      transition: "slide",
      prompt:
        "<BentoSlide> with 4-6 varied-size cells. Mix quantitative (AnimatedMetric / StatCard / SmoothCounter) with qualitative (quotes, logos, small images). Wrap one or two cells in <MagneticCard> for cursor-reactive depth. One cell should span 6 cols × 2 rows to anchor the grid.",
    },
    {
      id: "comparison",
      title: "Before / After",
      purpose: "Make the gap visceral with a direct comparison.",
      arc: "tension",
      visual: "comparison",
      dark: false,
      transition: "slide",
      prompt:
        "Pick the strongest of: <BeforeAfter> draggable slider (for paired images / UI screenshots — ideal when there is a visual delta), <ScoreMatrix> (for vendor / option evaluations across 3+ criteria), <Spectrum> (for qualitative Legacy↔Future style positioning), or <ComparisonGrid> (two-column fallback). Lead with concrete numbers, not adjectives.",
    },
    {
      id: "quote",
      title: "Customer Voice",
      purpose: "Single attributed quote that validates the tension.",
      arc: "tension",
      visual: "full-bleed-quote",
      dark: true,
      transition: "blur",
      mood: "mono",
      prompt:
        "<FullBleedQuoteSlide> — one direct quote from the source material. Attribution on a separate line in text-muted.",
    },
    {
      id: "chapter-break-2",
      title: "Chapter Break",
      purpose: "Pause beat before the resolution.",
      arc: "resolution",
      visual: "chapter-break",
      dark: true,
      transition: "mask",
      mood: "cool",
      prompt:
        "<ChapterBreakSlide> number='02' title='Our Approach' subtitle=''. Keep the mood consistent with the incoming resolution slides.",
    },
    {
      id: "approach",
      title: "Approach",
      purpose: "Diagram of how we resolve the tension.",
      arc: "resolution",
      visual: "flow-diagram",
      dark: false,
      transition: "slide",
      prompt:
        "<FlowDiagram> with 4-6 nodes (icon + label + short description). For audience-driven sessions, swap for <InteractionZone> so the audience can click to deep-dive into each stage, or <TldrawEmbed> (dynamic import) if the approach will be co-designed live. Pair with a single-line <SlideCallout> below that states the promise.",
    },
    {
      id: "impact",
      title: "Impact",
      purpose: "Quantified outcome — the number the audience will remember.",
      arc: "resolution",
      visual: "hero-stat-slide",
      dark: true,
      transition: "zoom",
      mood: "cool",
      prompt:
        "<HeroStatSlide> — dominant number (FlipNumber or AnimatedMetric), kicker, and a one-sentence lede that frames it as a before→after delta. Optionally add an inline <AnimatedBarChart> below the stat.",
    },
    {
      id: "timeline",
      title: "Roadmap",
      purpose: "Make the ask concrete with time-bound milestones.",
      arc: "resolution",
      visual: "timeline",
      dark: false,
      transition: "slide",
      prompt:
        "<AnimatedTimeline direction='horizontal'> or <NumberedSteps> with 3-5 milestones. Each step: date/timeframe + title + one-line description.",
    },
    {
      id: "cta",
      title: "Call to Action",
      purpose: "One obvious next step. End the deck on forward motion.",
      arc: "cta",
      visual: "title-slide",
      dark: true,
      transition: "fade",
      mood: "night",
      prompt:
        "Center-aligned. Single imperative sentence (5-9 words) as <SlideHeading>. Supporting logistics (when, where, owner) below in text-muted. No decoration other than a subtle <brand-gradient-text> accent on the verb.",
    },
  ],
};
