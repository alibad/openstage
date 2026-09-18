import fs from "fs";
import path from "path";
import { execSync } from "child_process";

/**
 * Server-side readers for the walkthrough artifacts under public/walkthroughs.
 *
 * Every reader is defensive on purpose: these JSON files are written by a
 * separate process (the walkthrough skill, sometimes a prior run, sometimes
 * by hand). One malformed file must degrade to "that item shows empty", never
 * "the whole dashboard 500s". The four invariants: try/catch around
 * JSON.parse, Array.isArray before iterating, tolerate one obvious wrapped
 * variant, and optional-chain through every catalog field.
 */

export const STORAGE = path.join(process.cwd(), "public", "walkthroughs");

// Types + pure helpers live in the client-safe _types.ts; re-exported here so
// server files can keep importing everything from _data.
export * from "./_types";
import type { Catalog, Fix, Issue, RunVerdict, Walkthrough } from "./_types";

function readJson<T>(file: string, fallback: T): T {
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

// Accept the canonical array, or an object wrapping it under a known key — a
// stray writer that emits `{ featureId, issues: [...] }` must not blank the page.
function arrayFrom<T>(parsed: unknown, wrapperKeys: string[]): T[] {
  if (Array.isArray(parsed)) return parsed as T[];
  if (parsed && typeof parsed === "object") {
    for (const key of wrapperKeys) {
      const inner = (parsed as Record<string, unknown>)[key];
      if (Array.isArray(inner)) return inner as T[];
    }
  }
  return [];
}

// Reject any segment that could escape STORAGE (traversal, absolute paths,
// NUL). `[featureId]` comes straight from the URL — this guard is what keeps
// /admin/walkthroughs/../../etc/passwd from becoming an arbitrary file read.
export function safeJoin(...segments: string[]): string | null {
  for (const seg of segments) {
    if (!seg || seg.includes("\0") || seg.includes("/") || seg.includes("\\") || seg === "..") {
      return null;
    }
  }
  const file = path.resolve(STORAGE, ...segments);
  const root = path.resolve(STORAGE) + path.sep;
  if (!file.startsWith(root) && file !== path.resolve(STORAGE)) return null;
  return file;
}

export function getCatalog(): Catalog | null {
  return readJson<Catalog | null>(path.join(STORAGE, "catalog.json"), null);
}

export function getGithubRepo(): string | null {
  const c = getCatalog();
  return c && typeof c.githubRepo === "string" ? c.githubRepo : null;
}

export function getFixes(): Fix[] {
  return arrayFrom<Fix>(readJson<unknown>(path.join(STORAGE, "fixes.json"), []), ["fixes", "items"]);
}

export function getWalkthrough(featureId: string, viewport: "desktop" | "mobile" = "desktop"): Walkthrough | null {
  const file = safeJoin(`${featureId}${viewport === "mobile" ? ".mobile.json" : ".json"}`);
  if (!file) return null;
  const w = readJson<Walkthrough | null>(file, null);
  if (!w || typeof w !== "object") return null;
  if (!Array.isArray(w.steps)) w.steps = [];
  return w;
}

export function getIssues(featureId: string): Issue[] {
  const file = safeJoin(featureId, "issues.json");
  if (!file) return [];
  return arrayFrom<Issue>(readJson<unknown>(file, []), ["issues", "items"]);
}

export function getAllIssues(): Issue[] {
  const c = getCatalog();
  if (!c?.features?.length) return [];
  return c.features.flatMap((f) =>
    getIssues(f.featureId).map((i) => ({ ...i, featureId: f.featureId, featureName: f.featureName })),
  );
}

/** Does a guide.mdx exist for this feature/viewport? Returns the path or null. */
export function guidePath(featureId: string, viewport: "desktop" | "mobile" = "desktop"): string | null {
  const file = viewport === "mobile" ? safeJoin(featureId, "mobile", "guide.mdx") : safeJoin(featureId, "guide.mdx");
  return file && fs.existsSync(file) ? file : null;
}

/** First screenshot of a feature, for card thumbnails. */
export function firstScreenshot(featureId: string): string | null {
  const dir = safeJoin(featureId);
  if (!dir || !fs.existsSync(dir)) return null;
  const png = fs.readdirSync(dir).filter((f) => /^step-\d+.*\.png$/.test(f)).sort()[0];
  return png ? `/walkthroughs/${featureId}/${png}` : null;
}

/**
 * Staleness verdict, computed at read time from runs.json and never persisted.
 * No runs.json → "never". Otherwise compare the latest run's target sha to the
 * current HEAD; git being unavailable degrades to "unknown", not a crash.
 */
export function getRunVerdict(): { verdict: RunVerdict; latestSha?: string; latestAt?: string } {
  const runs = arrayFrom<{ target?: { sha?: string }; startedAt?: string; finishedAt?: string }>(
    readJson<unknown>(path.join(STORAGE, "runs.json"), []),
    ["runs", "items"],
  );
  if (runs.length === 0) return { verdict: "never" };
  const latest = runs[runs.length - 1];
  const latestSha = latest?.target?.sha;
  const latestAt = latest?.finishedAt ?? latest?.startedAt;
  if (!latestSha) return { verdict: "unknown", latestAt };
  try {
    const head = execSync("git rev-parse HEAD", { cwd: process.cwd(), stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    return { verdict: head.startsWith(latestSha) ? "fresh" : "stale", latestSha, latestAt };
  } catch {
    return { verdict: "unknown", latestSha, latestAt };
  }
}
