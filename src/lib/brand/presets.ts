import type { BrandConfig } from "./types";

/**
 * Built-in brand presets. The `id` is the canonical key persisted in
 * `localStorage` ("brand-active-preset-id") and referenced by per-deck
 * registry overrides (`PresentationMeta.brand.presetId`).
 *
 * User-saved presets (separate concept, stored under "brand-presets") may
 * coexist with these but cannot share an id with a built-in.
 */

export interface BrandPreset {
  id: string;
  name: string;
  description: string;
  config: BrandConfig;
  builtin?: boolean;
}

const HUMAN_QUEST: BrandPreset = {
  id: "human-quest",
  name: "Human Quest",
  description: "Deep red → coral → orange → gold, drawn from the Human Quest mark.",
  builtin: true,
  config: {
    companyName: "Human Quest",
    logo: "/logos/humanquest.svg",
    colors: {
      primary: "#D95538",
      secondary: "#F49B31",
      accent: "#FBC74F",
      gradientStops: ["#991F16", "#D95538", "#DD623A", "#F49B31", "#FBC74F"],
      darkBg: "#120907",
      darkSurface: "#2B1510",
    },
    typography: {
      headingFont: "Inter",
      bodyFont: "Inter",
      monoFont: "JetBrains Mono",
    },
    defaults: {
      author: "Ali Badereddin",
      footerText: "humanquest.net",
      copyright: "© {year} {company}",
      website: "https://humanquest.net",
    },
    tone: {
      voice: "professional",
      defaultAudience: "Enterprise stakeholders",
      writingNotes: "",
    },
  },
};

const SPECTRUM: BrandPreset = {
  id: "spectrum",
  name: "Spectrum",
  description: "Cyan → blue → purple → pink. A vivid, high-contrast palette.",
  builtin: true,
  config: {
    companyName: "Spectrum",
    logo: null,
    colors: {
      primary: "#818CF8",
      secondary: "#A78BFA",
      accent: "#E879A8",
      gradientStops: ["#7DD3FC", "#818CF8", "#A78BFA", "#E879A8", "#F472B6"],
      darkBg: "#0A0718",
      darkSurface: "#1A1538",
    },
    typography: {
      headingFont: "Inter",
      bodyFont: "Inter",
      monoFont: "JetBrains Mono",
    },
    defaults: {
      author: "",
      footerText: "spectrum",
      copyright: "© {year} {company}",
      website: "",
    },
    tone: {
      voice: "professional",
      defaultAudience: "General audiences",
      writingNotes: "",
    },
  },
};

const AURORA: BrandPreset = {
  id: "aurora",
  name: "Aurora",
  description: "Lime → emerald → cyan → indigo. Tech, data, infrastructure.",
  builtin: true,
  config: {
    companyName: "Aurora",
    logo: null,
    colors: {
      primary: "#06B6D4",
      secondary: "#3B82F6",
      accent: "#84CC16",
      gradientStops: ["#84CC16", "#10B981", "#06B6D4", "#3B82F6", "#6366F1"],
      darkBg: "#06141A",
      darkSurface: "#0F2027",
    },
    typography: {
      headingFont: "Space Grotesk",
      bodyFont: "Inter",
      monoFont: "JetBrains Mono",
    },
    defaults: {
      author: "",
      footerText: "aurora",
      copyright: "© {year} {company}",
      website: "",
    },
    tone: {
      voice: "technical",
      defaultAudience: "Engineers and platform teams",
      writingNotes: "Lead with concrete capabilities; avoid marketing fluff.",
    },
  },
};

const EDITORIAL: BrandPreset = {
  id: "editorial",
  name: "Editorial",
  description: "Amber → coral → wine. Warm, serif-led, editorial decks.",
  builtin: true,
  config: {
    companyName: "Editorial",
    logo: null,
    colors: {
      primary: "#DC2626",
      secondary: "#B91C5A",
      accent: "#F97316",
      gradientStops: ["#FCD34D", "#F97316", "#DC2626", "#B91C5A", "#7C2D5E"],
      darkBg: "#150708",
      darkSurface: "#2A1517",
    },
    typography: {
      headingFont: "Fraunces",
      bodyFont: "Source Sans 3",
      monoFont: "IBM Plex Mono",
    },
    defaults: {
      author: "",
      footerText: "editorial",
      copyright: "© {year} {company}",
      website: "",
    },
    tone: {
      voice: "executive",
      defaultAudience: "Boardroom and external readers",
      writingNotes: "Long-form sentences, narrative cadence, quotable lines.",
    },
  },
};

const MONO: BrandPreset = {
  id: "mono",
  name: "Mono",
  description: "Greyscale gradient with a single red accent. Restrained and crisp.",
  builtin: true,
  config: {
    companyName: "Mono",
    logo: null,
    colors: {
      primary: "#EF4444",
      secondary: "#6B7280",
      accent: "#EF4444",
      gradientStops: ["#9CA3AF", "#6B7280", "#4B5563", "#1F2937", "#EF4444"],
      darkBg: "#0A0A0A",
      darkSurface: "#1A1A1A",
    },
    typography: {
      headingFont: "Inter",
      bodyFont: "Inter",
      monoFont: "JetBrains Mono",
    },
    defaults: {
      author: "",
      footerText: "mono",
      copyright: "© {year} {company}",
      website: "",
    },
    tone: {
      voice: "professional",
      defaultAudience: "Internal teams",
      writingNotes: "Short sentences. Strong verbs. No filler.",
    },
  },
};

export const BUILTIN_PRESETS: readonly BrandPreset[] = [
  HUMAN_QUEST,
  SPECTRUM,
  AURORA,
  EDITORIAL,
  MONO,
] as const;

export const DEFAULT_PRESET_ID = "human-quest";

export function getBuiltinPreset(id: string): BrandPreset | null {
  return BUILTIN_PRESETS.find((p) => p.id === id) ?? null;
}
