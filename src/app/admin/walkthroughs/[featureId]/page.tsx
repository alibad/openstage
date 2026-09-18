import fs from "fs";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import { components } from "../_mdx/components";
import { Prose } from "../_components/prose";
import { RouteChip } from "../_components/route-chip";
import { getCatalog, getIssues, getWalkthrough, guidePath } from "../_data";

export const dynamic = "force-dynamic";

type Frontmatter = {
  featureId?: string;
  featureName?: string;
  viewport?: "desktop" | "mobile";
  route?: string;
  category?: string;
  targetAudience?: string;
  hero?: { image?: string; video?: string };
  keyFeatures?: string[];
  tips?: string[];
  generatedAt?: string;
};

/**
 * One feature's walkthrough. The route — not the featureId — is the page's
 * identity (it's what gets pasted into Slack), so it leads the header.
 * Renders guide.mdx when the feature has been walked; otherwise an honest
 * pending view built from the catalog entry, never a 404 for a catalogued
 * feature.
 */
export default async function FeaturePage({
  params,
  searchParams,
}: {
  params: Promise<{ featureId: string }>;
  searchParams: Promise<{ viewport?: string }>;
}) {
  const { featureId } = await params;
  const { viewport: vp } = await searchParams;
  const viewport: "desktop" | "mobile" = vp === "mobile" ? "mobile" : "desktop";

  const catalog = getCatalog();
  const feature = catalog?.features?.find((f) => f.featureId === featureId);
  if (!feature) return notFound();

  const mdxFile = guidePath(featureId, viewport) ?? guidePath(featureId, "desktop");
  const walk = getWalkthrough(featureId, viewport);
  const issues = getIssues(featureId);
  const siblings = (catalog?.features ?? []).filter((f) => f.category === feature.category && f.featureId !== featureId).slice(0, 6);

  let content: React.ReactNode = null;
  let fm: Frontmatter = {};
  if (mdxFile) {
    const source = fs.readFileSync(mdxFile, "utf-8");
    const compiled = await compileMDX<Frontmatter>({ source, components, options: { parseFrontmatter: true } });
    content = compiled.content;
    fm = compiled.frontmatter ?? {};
  }

  const status = (ok: boolean | undefined, label: string) => (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${ok ? "bg-emerald-500/15 text-emerald-600" : "bg-foreground/5 text-muted"}`}>
      {label} {ok ? "captured" : "pending"}
    </span>
  );

  return (
    <article className="px-6 py-8 space-y-8">
      <nav className="text-xs text-muted flex flex-wrap items-center gap-1.5">
        <Link href="/admin/walkthroughs" className="hover:text-foreground">Walkthroughs</Link>
        <span>›</span>
        <Link href={`/admin/walkthroughs?tab=features&category=${encodeURIComponent(feature.category)}`} className="hover:text-foreground">{feature.category}</Link>
        <span>›</span>
        <span className="text-foreground">{feature.featureName}</span>
        <span>·</span>
        <code className="font-mono">{feature.route}</code>
      </nav>

      <header className="space-y-4 border-b border-border pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">{feature.featureName}</h1>
        <RouteChip route={feature.route} baseUrl={catalog?.baseUrl} />
        <div className="flex flex-wrap gap-2">
          {status(feature.desktopStatus === "done", "Desktop")}
          {status(feature.mobileStatus === "done", "Mobile")}
          {status(feature.videoStatus === "done", "Video")}
          <span className="px-2 py-0.5 rounded-full text-[11px] border border-border text-muted">{feature.authRole ?? "public"}</span>
        </div>
        {feature.description && <Prose className="text-muted max-w-2xl">{feature.description}</Prose>}
        {fm.targetAudience && (
          <p className="text-sm"><span className="font-medium">For:</span> {fm.targetAudience}</p>
        )}
        <div className="flex gap-1.5 text-xs">
          {(["desktop", "mobile"] as const).map((v) => (
            <Link
              key={v}
              href={`/admin/walkthroughs/${featureId}${v === "mobile" ? "?viewport=mobile" : ""}`}
              className={`px-3 py-1.5 rounded-full border ${viewport === v ? "bg-foreground text-bg-light border-foreground" : "border-border bg-surface text-muted hover:text-foreground"}`}
            >
              {v}
            </Link>
          ))}
        </div>
      </header>

      {content ? (
        <div className="max-w-4xl">{content}</div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-border bg-surface p-8 max-w-3xl">
          <h2 className="text-lg font-semibold mb-2">Not walked yet</h2>
          <p className="text-sm text-muted mb-4">
            This feature is in the catalog but no walkthrough has been captured for the <strong>{viewport}</strong> viewport.
          </p>
          <code className="font-mono text-sm px-2 py-1 rounded bg-foreground/5">/walkthrough {feature.route}</code>
          {walk && walk.steps && walk.steps.length > 0 && (
            <p className="text-xs text-muted mt-4">A walkthrough JSON exists ({walk.steps.length} steps) but no guide.mdx — re-run the stamp phase.</p>
          )}
        </div>
      )}

      {walk?.steps && walk.steps.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-[0.25em] text-muted mb-3">Captures</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {walk.steps.map((s) => (
              <figure key={s.stepNumber}>
                <Image src={`/walkthroughs/${s.screenshotFilename}`} alt={s.screenshotAlt ?? s.title} width={640} height={400} className="rounded-lg border border-border w-full" unoptimized />
                <figcaption className="text-xs text-muted mt-1 truncate">{s.stepNumber}. {s.title}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xs uppercase tracking-[0.25em] text-muted mb-3">Issues</h2>
        {issues.length === 0 ? (
          <p className="text-sm text-muted">None recorded.</p>
        ) : (
          <div className="rounded-2xl border-2 border-border bg-surface divide-y divide-border">
            {issues.map((i) => (
              <Link key={i.id} href={`/admin/walkthroughs/issues/${i.id}`} className="flex items-center gap-3 p-4 text-sm hover:bg-foreground/[0.03]">
                <span className="font-mono text-xs text-muted">#{i.stepNumber ?? "–"}</span>
                <span className="font-medium flex-1">{i.title}</span>
                <span className="text-xs text-muted">{i.severity} · {i.viewport}</span>
                <span className={`text-xs ${i.fixedAt ? "text-emerald-600" : "text-muted"}`}>{i.fixedAt ? "fixed" : "open"}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {siblings.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-[0.25em] text-muted mb-3">More in {feature.category}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {siblings.map((s) => (
              <Link key={s.featureId} href={`/admin/walkthroughs/${s.featureId}`} className="rounded-xl border border-border bg-surface p-4 hover:border-foreground/40">
                <div className="font-medium text-sm leading-tight">{s.featureName}</div>
                <div className="font-mono text-xs text-muted mt-0.5">{s.route}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
