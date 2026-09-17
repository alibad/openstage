import { Template } from "./types";

/**
 * The canonical Scroll blueprint.
 *
 * One template covers every scroll-mode presentation the framework produces.
 * It maps the six-beat emotional arc (attention → empathy → credibility →
 * tension → resolution → cta) onto eight sections, each recommending a
 * Phase 2 art-direction primitive. The generator should keep the section
 * order but can expand any single section into multiple sub-sections when
 * the source material is rich.
 *
 * Posture tone (problem-solution, status-direction, etc.) is passed in the
 * brief — it does not change the blueprint, only the wording.
 */
export const scrollTemplate: Template = {
  id: "scroll",
  name: "Scroll",
  description:
    "Immersive scroll-mode narrative. Full-bleed cinematic sections powered by the Phase 2 primitives (WebGL heroes, horizontal-pin case studies, scroll-linked 3D camera, path-draw spines). Works for client briefings, internal pitches, data stories, status updates, or conference narratives — tone adjusts via `posture`.",
  modes: ["scroll"],
  accentColor: "#7DD3FC",
  tags: ["scroll", "immersive", "narrative", "flagship"],
  variables: [
    { name: "title", label: "Title", type: "text", required: true, hint: "5 words max" },
    { name: "subtitle", label: "Subtitle", type: "text", required: true },
    { name: "author", label: "Author", type: "text", default: "Your Brand" },
    { name: "date", label: "Date", type: "date", required: true },
    {
      name: "accentColor",
      label: "Accent Color",
      type: "color",
      default: "#7DD3FC",
      hint: "Overrides the brand default when a client brand colour is provided",
    },
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
      name: "narrationSections",
      label: "Include ScrollNarrator",
      type: "select",
      options: ["yes", "no"],
      default: "yes",
      hint: "Every scroll deck should ship with the ScrollNarrator floating TTS widget.",
    },
  ],
  sections: [
    {
      id: "hero",
      title: "Cold Open",
      purpose: "Arrest attention in the first three seconds. Promise the payoff.",
      arc: "attention",
      visual: "webgl-hero",
      dark: true,
      prompt:
        "Full-viewport dark hero backed by <WebGLHero> (preferred) or <AuroraBackground>. Use <TextSplit animation='blur-in' mode='word'> for the headline so each word lands. Subtitle in text-muted, one sentence. Optionally gate behind <IntroSequenceWrapper> for session-gated cold opens. Add <FloatingParticles> or <ParticleField preset='constellation'> sparingly.",
      variables: [
        { name: "headline", label: "Headline", type: "text", required: true, hint: "5 words max" },
        { name: "subtitle", label: "Subtitle", type: "text", required: true },
      ],
    },
    {
      id: "landscape",
      title: "Their World",
      purpose: "Show empathy — prove we live inside the audience's reality.",
      arc: "empathy",
      visual: "editorial-grid",
      dark: false,
      prompt:
        "<EditorialGrid> magazine layout (kicker + lede + body + aside). Alternatively use <StickyMedia> with 3-4 annotation steps. When the story is geographic (markets, offices, deployments, geopolitics) make the aside a <Globe3D> (dynamic import, { ssr: false }) with markers and arcs. Lead with direct quotes from the source material. Apply className='prose-presentation text-pretty' to long-form copy and text-balance to headings. Include 2-3 AnimatedMetric cards with sparklines sourced from real data.",
      variables: [
        { name: "contextParagraph", label: "Context", type: "multiline", required: true },
        {
          name: "stats",
          label: "Key Statistics (JSON array)",
          type: "multiline",
          hint: 'Array of {value, label, delta?, trend?, sparkline?} — pass through to AnimatedMetric',
        },
      ],
    },
    {
      id: "credibility",
      title: "Evidence Rail",
      purpose: "Build credibility through proof points the audience cannot dismiss.",
      arc: "credibility",
      visual: "horizontal-pin",
      dark: true,
      prompt:
        "<HorizontalPin> rail with 3-5 panels — one proof point per panel (case study, published result, ChartMatrix score, quoted reviewer). Each panel should earn attention with a single dominant visual, not a wall of text. Consider <AnimatedTimeline direction='horizontal'> as an alternative for chronological proof.",
    },
    {
      id: "demonstration",
      title: "How It Works",
      purpose: "Make the invisible visible. Show the mechanism, not just the outcome.",
      arc: "credibility",
      visual: "path-draw",
      dark: false,
      prompt:
        "<PathDraw> scroll-linked SVG spine that diagrams the solution/data flow, with <PathDrawAnnotation> callouts at key waypoints. Or <ScrollCamera3D> with 3-4 keyframes when there is a 3D model / spatial story. Or <StickyAnnotations> when we have a UI screenshot that needs to be unpacked.",
    },
    {
      id: "tension",
      title: "The Gap",
      purpose: "Make the problem visceral before presenting the answer.",
      arc: "tension",
      visual: "full-bleed",
      dark: true,
      prompt:
        "Pick the strongest of: <BeforeAfter> draggable slider (paired images / UI screenshots with a visible delta), <Spectrum> (qualitative Legacy↔Future positioning), <ScoreMatrix> (option comparison when the gap is multi-criteria), or <FullBleed> with an oversized serif quote. Pair whatever we pick with a single dominant number (<HeroStat> + <FlipNumber>) and one direct quote from the source material. This is the emotional low point of the deck — give it room to breathe.",
      variables: [
        { name: "currentState", label: "Current State", type: "multiline", required: true },
        { name: "desiredState", label: "Desired State", type: "multiline", required: true },
      ],
    },
    {
      id: "approach",
      title: "Our Approach",
      purpose: "Resolve the tension with a concrete, graphics-first answer.",
      arc: "resolution",
      visual: "flow-diagram",
      dark: false,
      prompt:
        "<FlowDiagram> pipeline (4-6 nodes) with icons and one-line descriptions, or an <EditorialGrid> breakdown of pillars. For audience-driven briefings, swap the flow for <InteractionZone> so they can click to deep-dive into each pillar, or <TldrawEmbed> (dynamic import) when the approach will be co-designed live on the canvas. Support with 2-3 one-sentence <SlideCallout>-style cards. Never a bulleted list if a diagram would do.",
    },
    {
      id: "impact",
      title: "Projected Impact",
      purpose: "Quantify the upside with numbers the audience will repeat.",
      arc: "resolution",
      visual: "hero-stat",
      dark: true,
      prompt:
        "<HeroStat> with a dominant <FlipNumber> as the number, kicker + supporting copy. Complement with 2-3 <AnimatedMetric> cards. Include at least one <AnimatedBarChart> or <AnimatedLineChart> when the data supports a trend story.",
    },
    {
      id: "cta",
      title: "Next Steps",
      purpose: "Give the audience one obvious, time-bound action.",
      arc: "cta",
      visual: "aurora",
      dark: true,
      prompt:
        "<AuroraBackground> or <ParticleField preset='fireflies'> closing section. Single sentence promise on top of the ambient background (use <MaskReveal shape='horizontal'>), followed by 1-3 numbered next steps and a <MagneticElement> primary CTA. End with author + date in text-muted.",
      variables: [
        {
          name: "steps",
          label: "Next Steps (JSON array)",
          type: "multiline",
          hint: 'Array of {date?, title, description} — max 3 items',
        },
      ],
    },
  ],
};
