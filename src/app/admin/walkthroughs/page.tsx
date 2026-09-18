import { Suspense } from "react";
import { CatalogDashboard } from "./catalog";
import { firstScreenshot, getAllIssues, getCatalog, getFixes, getRunVerdict } from "./_data";

// fs reads at request time — the JSON is written by a separate process and
// must never be baked in at build.
export const dynamic = "force-dynamic";

export default function WalkthroughsPage() {
  const catalog = getCatalog();
  const fixes = getFixes();
  const issues = getAllIssues();
  const run = getRunVerdict();

  // The page must work with only fixes.json, only catalog.json, or neither.
  if (!catalog && fixes.length === 0) {
    return (
      <div className="px-6 py-16">
        <h1 className="text-2xl font-semibold mb-2">No walkthroughs yet</h1>
        <p className="text-muted">
          Run <code className="font-mono text-sm px-1.5 py-0.5 rounded bg-foreground/5">/walkthrough catalog</code> to
          discover and document features.
        </p>
      </div>
    );
  }

  const thumbs: Record<string, string | null> = {};
  for (const f of catalog?.features ?? []) thumbs[f.featureId] = firstScreenshot(f.featureId);

  return (
    <Suspense fallback={<div className="px-6 py-16 text-muted">Loading walkthroughs…</div>}>
      <CatalogDashboard catalog={catalog} fixes={fixes} issues={issues} run={run} thumbs={thumbs} />
    </Suspense>
  );
}
