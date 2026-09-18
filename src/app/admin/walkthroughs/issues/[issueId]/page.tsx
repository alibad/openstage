import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Prose } from "../../_components/prose";
import { getAllIssues, getCatalog } from "../../_data";

export const dynamic = "force-dynamic";

/** One issue with full context and, once fixed, a before/after comparison. */
export default async function IssuePage({ params }: { params: Promise<{ issueId: string }> }) {
  const { issueId } = await params;
  const all = getAllIssues();
  const idx = all.findIndex((i) => i.id === issueId);
  if (idx === -1) return notFound();
  const issue = all[idx];
  const catalog = getCatalog();

  // Previous / next within the same feature.
  const sameFeature = all.filter((i) => i.featureId === issue.featureId);
  const pos = sameFeature.findIndex((i) => i.id === issueId);
  const prev = pos > 0 ? sameFeature[pos - 1] : null;
  const next = pos < sameFeature.length - 1 ? sameFeature[pos + 1] : null;

  const src = (p?: string | null) => (p ? `/walkthroughs/${issue.featureId}/${p}` : null);
  const sev = issue.severity ?? "minor";
  const sevCls = sev === "critical" ? "bg-red-500/10 text-red-600" : sev === "major" ? "bg-amber-500/10 text-amber-600" : "bg-blue-500/10 text-blue-600";

  return (
    <article className="px-6 py-8 space-y-8 max-w-5xl">
      <nav className="text-xs text-muted flex flex-wrap items-center gap-1.5">
        <Link href="/admin/walkthroughs?tab=issues" className="hover:text-foreground">Issues</Link>
        <span>›</span>
        <Link href={`/admin/walkthroughs/${issue.featureId}`} className="hover:text-foreground">{issue.featureName}</Link>
        <span>›</span>
        <span className="text-foreground">{issue.title}</span>
      </nav>

      <header className="space-y-3 border-b border-border pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${sevCls}`}>{sev}</span>
          {issue.type && <span className="px-2 py-0.5 rounded-full text-[11px] border border-border text-muted">{issue.type}</span>}
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${issue.fixedAt ? "bg-emerald-500/15 text-emerald-600" : "bg-foreground/5 text-muted"}`}>
            {issue.fixedAt ? "fixed" : "unfixed"}
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{issue.title}</h1>
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
          <div>Feature: <Link href={`/admin/walkthroughs/${issue.featureId}`} className="text-foreground hover:underline">{issue.featureName}</Link></div>
          {issue.route && <div>Route: <code className="font-mono">{issue.route}</code></div>}
          {issue.viewport && <div>Viewport: {issue.viewport}</div>}
          {issue.stepNumber != null && <div>Step: {issue.stepNumber}</div>}
          {issue.detectedAt && <div>Detected: {new Date(issue.detectedAt).toLocaleString()}</div>}
        </dl>
      </header>

      {issue.description && <Prose className="text-foreground/85 max-w-3xl">{issue.description}</Prose>}

      {issue.before || issue.after ? (
        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-[0.25em] text-muted">Before / after</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {src(issue.before) && (
              <figure className="rounded-xl border-2 border-red-500/40 overflow-hidden">
                <figcaption className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider bg-red-500/10 text-red-600">Before</figcaption>
                <Image src={src(issue.before) as string} alt="Before" width={1440} height={900} className="w-full" unoptimized />
              </figure>
            )}
            {src(issue.after) && (
              <figure className="rounded-xl border-2 border-emerald-500/40 overflow-hidden">
                <figcaption className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-600">After</figcaption>
                <Image src={src(issue.after) as string} alt="After" width={1440} height={900} className="w-full" unoptimized />
              </figure>
            )}
          </div>
          {issue.fix && (
            <div className="rounded-xl border border-border bg-surface p-4 text-sm">
              <div className="text-[11px] uppercase tracking-wider text-muted mb-1">Fix</div>
              <Prose>{issue.fix}</Prose>
              {issue.fixedAt && <div className="text-xs text-muted mt-2">Fixed {new Date(issue.fixedAt).toLocaleString()}</div>}
            </div>
          )}
        </section>
      ) : null}

      {src(issue.screenshot) && (
        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-[0.25em] text-muted">Original capture</h2>
          <Image src={src(issue.screenshot) as string} alt={issue.title} width={1440} height={900} className="rounded-xl border border-border w-full max-w-3xl" unoptimized />
        </section>
      )}

      <footer className="flex items-center justify-between border-t border-border pt-6 text-sm">
        <div>
          {prev ? (
            <Link href={`/admin/walkthroughs/issues/${prev.id}`} className="text-muted hover:text-foreground">← {prev.title}</Link>
          ) : (
            <span />
          )}
        </div>
        {issue.githubIssue && (
          <a href={issue.githubIssue} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-foreground underline">GitHub ↗</a>
        )}
        <div>
          {next ? (
            <Link href={`/admin/walkthroughs/issues/${next.id}`} className="text-muted hover:text-foreground">{next.title} →</Link>
          ) : (
            <span />
          )}
        </div>
      </footer>
      {catalog?.githubRepo && !issue.githubIssue && (
        <p className="text-xs text-muted">Not yet tracked in GitHub ({catalog.githubRepo}).</p>
      )}
    </article>
  );
}
