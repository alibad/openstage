export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  gradientStops: string[];
  darkBg: string;
  darkSurface: string;
}

export interface BrandTypography {
  headingFont: string;
  bodyFont: string;
  monoFont: string;
}

export interface BrandDefaults {
  author: string;
  footerText: string;
  copyright: string;
  website: string;
}

export type BrandVoice = "professional" | "casual" | "technical" | "executive";

export interface BrandTone {
  voice: BrandVoice;
  defaultAudience: string;
  writingNotes: string;
}

export interface BrandConfig {
  companyName: string;
  logo: string | null;
  colors: BrandColors;
  typography: BrandTypography;
  defaults: BrandDefaults;
  tone: BrandTone;
}

/**
 * A scoped brand override — used by `PresentationMeta.brand` (registry
 * defaults) and the runtime per-deck overrides stored under
 * `brand-overrides` localStorage. Either form may be partial; the
 * effective brand is computed by layering global → registry → runtime.
 */
export interface BrandHint {
  /** Reference a built-in preset by id. */
  presetId?: string;
  /** Inline overlay applied on top of the resolved preset / global brand. */
  override?: DeepPartial<BrandConfig>;
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
