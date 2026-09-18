/**
 * Client-safe types and pure helpers for the walkthrough dashboard.
 * No Node imports here — client components import from THIS file, never from
 * _data.ts (which pulls fs/child_process into the bundle).
 */

export type CatalogFeature = {
  featureId: string;
  featureName: string;
  route: string;
  category: string;
  description?: string;
  requiresAuth?: boolean;
  authRole?: string | null;
  desktopStatus?: "done" | "pending";
  mobileStatus?: "done" | "pending";
  videoStatus?: "done" | "pending";
  issueCount?: number;
  lastWalkthroughAt?: string | null;
  lastCodeChangeAt?: string | null;
  isStale?: boolean;
};

export type CatalogPersona = {
  id: string;
  name: string;
  description?: string;
  authRole?: string | null;
  entryPoint?: string;
  keyJourneys?: string[];
  navItems?: { label: string; route: string }[];
};

export type CatalogBrand = {
  primaryColor?: string;
  primaryColorLight?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  logoPath?: string | null;
  fontFamily?: string;
  fontFamilyBody?: string;
};

export type Catalog = {
  projectName?: string;
  githubRepo?: string;
  baseUrl?: string;
  brand?: CatalogBrand;
  discoveredAt?: string;
  updatedAt?: string;
  features?: CatalogFeature[];
  personas?: CatalogPersona[];
};

export type WalkStep = {
  stepNumber: number;
  title: string;
  description?: string;
  screenshotFilename: string;
  screenshotAlt?: string;
  route?: string;
  annotations?: { type: "tip" | "warning" | "important"; text: string }[];
};

export type Walkthrough = {
  featureId: string;
  featureName: string;
  viewport?: "desktop" | "mobile";
  overview?: string;
  targetAudience?: string;
  hero?: { image?: string; video?: string };
  steps?: WalkStep[];
  keyFeatures?: string[];
  tips?: string[];
  generatedAt?: string;
};

export type Issue = {
  id: string;
  stepNumber?: number;
  type?: string;
  severity?: "critical" | "major" | "minor";
  title: string;
  description?: string;
  screenshot?: string | null;
  route?: string;
  viewport?: string;
  detectedAt?: string;
  before?: string | null;
  after?: string | null;
  fixedAt?: string | null;
  fix?: string | null;
  githubIssue?: string | null;
  // added by getAllIssues
  featureId?: string;
  featureName?: string;
};

export type Fix = {
  id: string;
  title: string;
  description?: string;
  status?: "verified" | "open" | "wont-fix";
  commit?: string;
  date?: string;
  page?: string;
  route?: string;
  githubIssues?: { number: number; title: string }[];
  screenshots?: { src: string; caption?: string; before?: string }[];
};

export type RunVerdict = "never" | "fresh" | "stale" | "very-stale" | "unknown";

export function issueUrl(repo: string, num: number) {
  return `https://github.com/${repo}/issues/${num}`;
}
export function commitUrl(repo: string, sha: string) {
  return `https://github.com/${repo}/commit/${sha}`;
}
