import type { BrandHint } from "@/lib/brand";

export interface PresentationMeta {
  slug: string;
  title: string;
  subtitle?: string;
  author: string;
  date: string;
  description: string;
  slideCount?: number;
  type: "scroll" | "slides";
  protected?: boolean;
  passwordHash?: string;
  accentColor?: string;
  customer?: string;
  status?: "live" | "draft" | "generating" | "failed";
  visibility?: "public" | "unlisted" | "private";
  audience?: string[];
  expiresAt?: string;
  brand?: BrandHint;
}

export const presentations: PresentationMeta[] = [
  {
    slug: "the-power-of-replit",
    title: "The Power of Replit",
    subtitle: "A sentence in. A live app out.",
    author: "Ali Badereddin",
    date: "November 2026",
    description:
      "A field guide to Replit in November 2026: what one browser tab now replaces, ten builds with paste-ready prompts, the ten closest rivals on one map, and Replit against Claude job by job.",
    type: "scroll",
    accentColor: "#F26207",
    customer: "Human Quest",
    status: "live",
    // Reachable by URL, kept out of the gallery and the sitemap until the owner
    // asks to list it — the same path the RTS AI talk took.
    visibility: "unlisted",
  },
  {
    slug: "can-an-ai-play",
    title: "Can an AI Play Our Game?",
    subtitle: "What building a game with coding agents taught us, and who really won",
    author: "Ali Badereddin",
    date: "November 16, 2026",
    description:
      "The AI Tinkerers Doha Round 5 talk: a real-time strategy game built with coding agents. What they reported against what was true, the rulers that told us, and what happened when three AI models and a page of rules played the game.",
    type: "scroll",
    accentColor: "#F2C14E",
    customer: "Human Quest",
    status: "live",
  },
  {
    slug: "stagecraft",
    title: "Stagecraft",
    subtitle: "The deck is the stage",
    author: "Ali Badereddin",
    date: "September 2026",
    description:
      "Openstage Phase 4: one shared WebGL stage, GPU particle morphs in any script, a procedural neural field — and a deck that still prints well.",
    type: "scroll",
    accentColor: "#A78BFA",
  },
  {
    slug: "mobile-inference",
    title: "The Model in Your Pocket",
    subtitle: "How to deploy AI inference on the mobile GPU",
    author: "Ali Badereddin",
    date: "September 2026",
    description:
      "A practical field guide to exporting, compressing, accelerating, profiling, and shipping AI models on iOS and Android.",
    type: "slides",
    slideCount: 13,
    accentColor: "#67E8F9",
    customer: "Human Quest",
    status: "live",
  },
  {
    slug: "proof-before-promise",
    title: "Proof Before Promise",
    subtitle: "How credible product walkthroughs are made",
    author: "Human Quest",
    date: "September 2026",
    description:
      "A slide-mode demonstration built with OpenStage's presentation skills, showing how persona, surface, action, result, and evidence form a trustworthy walkthrough.",
    type: "slides",
    slideCount: 7,
    accentColor: "#7DD3FC",
    customer: "Human Quest",
    status: "live",
  },
  {
    slug: "ai-patterns",
    title: "AI Patterns — Running, Not Described",
    subtitle: "Three live dives: capture, proof, controlled action",
    author: "Ali Badereddin",
    date: "September 21, 2026",
    description:
      "The AI Tinkerers Doha Round 3 talk: Feedback with Openstage, Walkthroughs, and Console with MCP. Working systems, inspectable evidence, and one take-home destination.",
    type: "scroll",
    accentColor: "#D95538",
    customer: "Human Quest",
    status: "live",
  },
  {
    slug: "awwwards-flagship",
    title: "The Grammar of Attention",
    subtitle: "Flagship deck — every Phase 2 primitive in one argument",
    author: "Presenter",
    date: "April 2026",
    description:
      "An Awwwards-tier showcase: IntroSequence, WebGL hero, editorial grid, scroll-drawn curves, pinned horizontal forces, scroll-linked 3D camera, marquee typography, FlipNumber counters, custom cursor — sequenced as a continuous narrative about presentation craft.",
    type: "scroll",
    status: "live",
  },
  {
    slug: "showcase-games",
    title: "Interactive Game Templates",
    subtitle: "Gamification primitives — 14 mini-games for live decks",
    author: "Presenter",
    date: "April 2026",
    description:
      "Quiz, DragSort, Memory, SpinWheel, Hotspot, Jeopardy, Reaction, WordScramble, Millionaire, Crossword, Timeline, TowerDefense, Maze, PipeConnect — drop any of them into a deck with a dynamic import.",
    type: "scroll",
    status: "live",
  },
  {
    slug: "sample-slides",
    title: "Slide Mode Sample",
    subtitle: "Primitives, navigation, and PPTX export",
    author: "Presenter",
    date: "April 2026",
    description:
      "A tour of slide-mode presentations: every primitive, keyboard shortcuts, speaker notes, and one-click PPTX export.",
    type: "slides",
    slideCount: 9,
    status: "live",
  },
  {
    slug: "sample-scroll",
    title: "Visual Effects Sample",
    subtitle: "35+ components with nav, print, i18n, and scrollytelling",
    author: "Presenter",
    date: "April 2026",
    description:
      "The complete component catalog: shader gradients, particle fields, 3D globe, animated charts, StickyMedia, flow diagrams, score matrices, and more.",
    type: "scroll",
    status: "live",
  },
];

export function getProtectedSlugs(): string[] {
  return presentations
    .filter((p) => p.protected && p.passwordHash)
    .map((p) => p.slug);
}

export function getPresentationBySlug(
  slug: string
): PresentationMeta | undefined {
  return presentations.find((p) => p.slug === slug);
}
