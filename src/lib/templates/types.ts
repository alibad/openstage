/**
 * Template system types.
 *
 * The framework ships exactly two templates — `scroll` and `slides`. Each is a
 * full blueprint that covers the canonical narrative arc end-to-end. Posture
 * (problem-solution, status-direction, etc.) is passed in the brief and tones
 * the generator prompt rather than selecting a different template.
 *
 * Templates stay mode-aware so the `/api/templates?mode=...` filter keeps
 * working for integrations.
 */

export type PresentationMode = "scroll" | "slides";
export type ArcPhase =
  | "attention"
  | "empathy"
  | "credibility"
  | "tension"
  | "resolution"
  | "cta";

export type Posture =
  | "validation-extension"
  | "problem-solution"
  | "comparison-recommendation"
  | "education-implication"
  | "status-direction";

export interface TemplateVariable {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "color" | "select" | "multiline" | "image";
  required?: boolean;
  default?: string | number;
  options?: string[];
  hint?: string;
}

/**
 * Recommended primary visual component for a section/slide.
 *
 * Union covers the original chart/layout set plus the Phase 2 art-direction
 * primitives (webgl-hero, editorial-grid, horizontal-pin, path-draw,
 * hero-stat, scroll-camera-3d, marquee) and the Awwwards-tier slide layouts
 * (hero-stat-slide, editorial-slide, full-bleed-quote, chapter-break, bento).
 */
export type TemplateVisual =
  // Original set
  | "hero"
  | "stats-grid"
  | "flow-diagram"
  | "timeline"
  | "chart-bar"
  | "chart-line"
  | "chart-pie"
  | "comparison"
  | "score-matrix"
  | "globe-3d"
  | "sticky-media"
  | "scroll-reveal"
  | "full-bleed"
  | "spectrum"
  | "interaction-zone"
  // Phase 2 scroll primitives
  | "webgl-hero"
  | "aurora"
  | "mesh-gradient"
  | "particle-field"
  | "editorial-grid"
  | "horizontal-pin"
  | "path-draw"
  | "hero-stat"
  | "scroll-camera-3d"
  | "marquee"
  | "flip-number"
  // Slide layouts
  | "title-slide"
  | "hero-stat-slide"
  | "editorial-slide"
  | "full-bleed-quote"
  | "chapter-break"
  | "bento-slide"
  | "bullet-list"
  | "callout"
  | "custom";

export interface TemplateSectionSpec {
  id: string;
  title: string;
  purpose: string;
  arc: ArcPhase;
  /** Recommended primary visual component */
  visual?: TemplateVisual;
  /** Whether this section/slide uses a dark background */
  dark?: boolean;
  /** Prompt guidance for AI generation */
  prompt?: string;
  /** Content variables this section expects */
  variables?: TemplateVariable[];
  /** Slide-mode only: per-slide transition variant */
  transition?: "fade" | "slide" | "blur" | "zoom" | "mask" | "none";
  /** Slide-mode only: data-mood attribute to apply to the slide container */
  mood?: "warm" | "cool" | "mono" | "night" | "dawn";
  /** Optional slide order hint; otherwise inferred from array position */
  slideIndex?: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  /** Default posture — can be overridden per brief. Optional because the
   *  scroll/slides templates are posture-agnostic. */
  posture?: Posture;
  /** Which mode this template targets. The framework ships one template per mode. */
  modes: PresentationMode[];
  /** Recommended accent color (CSS value) */
  accentColor?: string;
  /** Global variables that apply to the whole presentation */
  variables: TemplateVariable[];
  /** Ordered section / slide specs */
  sections: TemplateSectionSpec[];
  /** Tags for discovery */
  tags: string[];
}
