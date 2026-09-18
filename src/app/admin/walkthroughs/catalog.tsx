"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Layers, CheckCircle2, AlertTriangle, Video, Users, ChevronDown, ExternalLink, CircleDot, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { Prose } from "./_components/prose";
import { ScreenshotLightbox, type LightboxStep } from "./_components/lightbox";
import { issueUrl, commitUrl, type Catalog, type Fix, type Issue, type RunVerdict } from "./_types";

type Tab = "features" | "personas" | "issues" | "fixes";
type StatusFilter = "all" | "done" | "pending" | "issues";

const PERSONA_ICON: Record<string, string> = { visitor: "👀", presenter: "🎤", admin: "🛡️", "new-user": "🆕", parent: "👨‍👩‍👧", coach: "🏋️" };

export function CatalogDashboard({
  catalog,
  fixes,
  issues,
  run,
  thumbs,
}: {
  catalog: Catalog | null;
  fixes: Fix[];
  issues: Issue[];
  run: { verdict: RunVerdict; latestSha?: string; latestAt?: string };
  thumbs: Record<string, string | null>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const features = catalog?.features ?? [];
  const personas = catalog?.personas ?? [];
  const repo = catalog?.githubRepo ?? null;
  const brand = catalog?.brand ?? {};

  // Features is the headline output; never default to an empty tab.
  const fallbackTab: Tab = features.length > 0 ? "features" : issues.length > 0 ? "issues" : fixes.length > 0 ? "fixes" : "personas";
  const tabParam = searchParams.get("tab");
  const tab: Tab =
    tabParam === "features" || tabParam === "personas" || tabParam === "issues" || tabParam === "fixes" ? tabParam : fallbackTab;
  const setTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === fallbackTab) params.delete("tab");
    else params.set("tab", next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>(searchParams.get("category") ?? "all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [openFix, setOpenFix] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ steps: LightboxStep[]; index: number; title: string } | null>(null);

  const categories = useMemo(() => Array.from(new Set(features.map((f) => f.category))).sort(), [features]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return features.filter((f) => {
      // Search must include the route — "/apps" is how people refer to a walkthrough.
      const matchesSearch = !q || f.featureName.toLowerCase().includes(q) || f.route.toLowerCase().includes(q) || (f.description ?? "").toLowerCase().includes(q);
      const matchesCat = category === "all" || f.category === category;
      const done = f.desktopStatus === "done" || f.mobileStatus === "done";
      const matchesStatus =
        status === "all" || (status === "done" && done) || (status === "pending" && !done) || (status === "issues" && (f.issueCount ?? 0) > 0);
      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [features, search, category, status]);

  const grouped = useMemo(
    () =>
      categories.reduce((acc, c) => {
        const fs = filtered.filter((f) => f.category === c);
        if (fs.length > 0) acc[c] = fs;
        return acc;
      }, {} as Record<string, typeof filtered>),
    [categories, filtered],
  );

  const documented = features.filter((f) => f.desktopStatus === "done" || f.mobileStatus === "done").length;
  const videos = features.filter((f) => f.videoStatus === "done").length;
  const openIssues = issues.filter((i) => !i.fixedAt).length;
  const verified = fixes.filter((f) => f.status === "verified").length;

  const stats = [
    { icon: Layers, value: features.length, label: "features", sub: `${categories.length} categories` },
    { icon: CheckCircle2, value: documented, label: "documented", sub: `${features.length - documented} pending` },
    { icon: Video, value: videos, label: "videos", sub: "desktop + mobile" },
    { icon: AlertTriangle, value: openIssues, label: "open issues", sub: `${issues.length - openIssues} fixed` },
    { icon: Users, value: personas.length, label: "personas", sub: `${verified} fixes verified` },
  ];

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "features", label: "Features", count: features.length },
    { id: "personas", label: "Personas", count: personas.length },
    { id: "issues", label: "Issues", count: issues.length },
    { id: "fixes", label: "Bug Fixes", count: fixes.length },
  ];

  const verdictLabel: Record<RunVerdict, string> = {
    never: "Never walked — every feature is pending.",
    fresh: "Fresh — last run matches the current commit.",
    stale: "Stale — code changed since the last run.",
    "very-stale": "Very stale — re-run recommended.",
    unknown: "Run history present; freshness unknown.",
  };

  return (
    <div className="px-6 py-8 space-y-8">
      {/* Header — brand colours come from the catalog JSON, so inline style is correct here. */}
      <header
        className="rounded-2xl p-8 text-white"
        style={{ background: `linear-gradient(135deg, ${brand.secondaryColor ?? "#0A0718"}, ${brand.primaryColor ?? "#818CF8"})` }}
      >
        <div className="flex items-center gap-4">
          {brand.logoPath && <Image src={brand.logoPath} alt="" width={40} height={40} className="rounded-lg" unoptimized />}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{catalog?.projectName ?? "Walkthroughs"}</h1>
            <p className="text-white/70 text-sm">Feature catalog &amp; living documentation</p>
          </div>
        </div>
      </header>

      {/* Stat strip — one horizontal row, not five tall cards. */}
      <div className="flex flex-wrap items-stretch gap-x-8 gap-y-3 rounded-xl border border-border bg-surface px-5 py-3">
        {stats.map((s, i) => (
          <div key={s.label} className={cn("flex items-center gap-3 min-w-0", i > 0 && "sm:border-l sm:border-border sm:pl-8")}>
            <s.icon className="w-4 h-4 text-muted shrink-0" />
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-semibold tabular-nums leading-none">{s.value}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted">{s.label}</span>
              </div>
              <div className="text-[11px] text-muted">{s.sub}</div>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 text-[11px] text-muted sm:ml-auto">
          <CircleDot className={cn("w-3.5 h-3.5", run.verdict === "fresh" ? "text-emerald-500" : run.verdict === "never" ? "text-muted" : "text-amber-500")} />
          {verdictLabel[run.verdict]}
          {run.latestSha && <code className="font-mono">{run.latestSha.slice(0, 7)}</code>}
        </div>
      </div>

      {/* Tabs — URL-controlled so they're bookmarkable. */}
      <nav className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.id ? "border-foreground text-foreground" : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {t.label} <span className="ml-1 text-xs text-muted tabular-nums">{t.count}</span>
          </button>
        ))}
      </nav>

      {tab === "features" && (
        <section className="space-y-8">
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or route…"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-(--color-brand-2)/40"
              />
            </label>
            <div className="flex flex-wrap gap-1.5">
              {["all", ...categories].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    category === c ? "bg-foreground text-bg-light border-foreground" : "border-border bg-surface text-muted hover:text-foreground",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              {(["all", "done", "pending", "issues"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    status === s ? "bg-foreground text-bg-light border-foreground" : "border-border bg-surface text-muted hover:text-foreground",
                  )}
                >
                  {s === "issues" ? "has issues" : s}
                </button>
              ))}
            </div>
          </div>

          {Object.keys(grouped).length === 0 && <p className="text-muted text-sm">No features match.</p>}

          {Object.entries(grouped).map(([cat, fs]) => (
            <div key={cat}>
              <h2 className="text-xs uppercase tracking-[0.25em] text-muted mb-3">{cat}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {fs.map((f) => {
                  const badge = (ok: boolean, label: string) => (
                    <span
                      title={`${label} ${ok ? "documented" : "pending"}`}
                      className={cn(
                        "w-6 h-6 rounded-md text-[11px] font-bold flex items-center justify-center",
                        ok ? "bg-emerald-500/15 text-emerald-600" : "bg-foreground/5 text-muted",
                      )}
                    >
                      {label}
                    </span>
                  );
                  return (
                    <Link
                      key={f.featureId}
                      href={`/admin/walkthroughs/${f.featureId}`}
                      className="group rounded-2xl border-2 border-border bg-surface p-5 flex flex-col gap-3 transition-transform hover:-translate-y-0.5 hover:border-foreground/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold leading-tight truncate">{f.featureName}</h3>
                          <div className="font-mono text-xs text-muted mt-0.5">{f.route}</div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {badge(f.desktopStatus === "done", "D")}
                          {badge(f.mobileStatus === "done", "M")}
                          {badge(f.videoStatus === "done", "V")}
                        </div>
                      </div>
                      {f.description && (
                        <Prose inline className="text-sm text-muted leading-snug line-clamp-2">
                          {f.description}
                        </Prose>
                      )}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] mt-auto">
                        <span className="px-2 py-0.5 rounded-full border border-border text-muted">{f.authRole ?? "public"}</span>
                        {(f.issueCount ?? 0) > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 font-medium">{f.issueCount} issue{f.issueCount === 1 ? "" : "s"}</span>
                        )}
                        {f.isStale && (
                          <span title="Code changed since last walkthrough. Re-run to update." className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium">
                            Stale
                          </span>
                        )}
                        {f.lastWalkthroughAt && <span className="text-muted">{new Date(f.lastWalkthroughAt).toLocaleDateString()}</span>}
                      </div>
                      {thumbs[f.featureId] && (
                        <Image src={thumbs[f.featureId] as string} alt="" width={640} height={400} className="rounded-lg border border-border w-full" unoptimized />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === "personas" && (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {personas.length === 0 && <p className="text-muted text-sm">No personas detected.</p>}
          {personas.map((p) => (
            <div key={p.id} className="rounded-2xl border-2 border-border bg-surface p-6 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden>{PERSONA_ICON[p.id] ?? "🙂"}</span>
                <div>
                  <h3 className="text-lg font-semibold leading-tight">{p.name}</h3>
                  <span className="text-[11px] uppercase tracking-wider text-muted">{p.authRole ?? "public"}</span>
                </div>
              </div>
              {p.description && <Prose className="text-sm text-muted">{p.description}</Prose>}
              {p.keyJourneys && p.keyJourneys.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted mb-1.5">Key journeys</div>
                  <ul className="space-y-1">
                    {p.keyJourneys.map((j) => (
                      <li key={j} className="text-sm flex gap-2">
                        <span className="text-muted">•</span>
                        <Prose inline>{j}</Prose>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {p.entryPoint && (
                <div className="mt-auto text-xs text-muted">
                  Entry: <code className="font-mono px-1.5 py-0.5 rounded bg-foreground/5">{p.entryPoint}</code>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {tab === "issues" && (
        <section className="rounded-2xl border-2 border-border bg-surface divide-y divide-border">
          {issues.length === 0 && <p className="text-muted text-sm p-6">No issues recorded.</p>}
          {issues.map((i) => (
            <Link key={`${i.featureId}-${i.id}`} href={`/admin/walkthroughs/issues/${i.id}`} className="flex items-start gap-4 p-4 hover:bg-foreground/[0.03]">
              <span
                className={cn(
                  "shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase",
                  i.severity === "critical" ? "bg-red-500/10 text-red-600" : i.severity === "major" ? "bg-amber-500/10 text-amber-600" : "bg-blue-500/10 text-blue-600",
                )}
              >
                {i.severity ?? "minor"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-medium leading-tight">{i.title}</div>
                <div className="text-xs text-muted font-mono">{i.featureName} · {i.route} · {i.viewport}</div>
                {i.description && <Prose inline className="text-sm text-muted line-clamp-2 mt-1">{i.description}</Prose>}
              </div>
              <span className={cn("text-[11px] shrink-0", i.fixedAt ? "text-emerald-600" : "text-muted")}>{i.fixedAt ? "fixed" : "open"}</span>
            </Link>
          ))}
        </section>
      )}

      {tab === "fixes" && (
        <section className="space-y-3">
          {fixes.length === 0 && <p className="text-muted text-sm">No verified fixes yet. Run <code className="font-mono text-xs">/walkthrough --verify</code>.</p>}
          {fixes.map((fx) => {
            const open = openFix === fx.id;
            const status = fx.status ?? "open";
            return (
              <div key={fx.id} className="rounded-2xl border-2 border-border bg-surface">
                <button type="button" onClick={() => setOpenFix(open ? null : fx.id)} className="w-full text-left p-5 flex items-start gap-4">
                  <span
                    className={cn(
                      "shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase",
                      status === "verified" ? "bg-emerald-500/10 text-emerald-600" : status === "open" ? "bg-amber-500/10 text-amber-600" : "bg-foreground/5 text-muted",
                    )}
                  >
                    {status}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{fx.title}</span>
                      {fx.date && <span className="text-xs text-muted">{fx.date}</span>}
                    </div>
                    {fx.description && <Prose inline className="text-sm text-muted line-clamp-2 mt-1">{fx.description}</Prose>}
                    {fx.githubIssues && fx.githubIssues.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {fx.githubIssues.slice(0, 5).map((gi) => (
                          <span key={gi.number} className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 text-[11px] font-mono">#{gi.number}</span>
                        ))}
                        {fx.githubIssues.length > 5 && <span className="text-[11px] text-muted">+{fx.githubIssues.length - 5} more</span>}
                      </div>
                    )}
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-muted shrink-0 transition-transform", open && "rotate-180")} />
                </button>
                {open && (
                  <div className="border-t border-border p-5 space-y-4 text-sm">
                    <div className="flex flex-wrap gap-4 text-xs text-muted">
                      {fx.page && <span>Page: <span className="text-foreground">{fx.page}</span></span>}
                      {fx.route && <span>Route: <code className="font-mono">{fx.route}</code></span>}
                      {fx.commit &&
                        (repo ? (
                          <a href={commitUrl(repo, fx.commit)} target="_blank" rel="noopener noreferrer" className="font-mono underline">{fx.commit}</a>
                        ) : (
                          <code className="font-mono">{fx.commit}</code>
                        ))}
                    </div>
                    {fx.githubIssues && fx.githubIssues.length > 0 && (
                      <ul className="space-y-1">
                        {fx.githubIssues.map((gi) =>
                          repo ? (
                            <li key={gi.number}>
                              <a href={issueUrl(repo, gi.number)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:underline">
                                <CircleDot className="w-3.5 h-3.5 text-muted" /> <span className="font-mono">#{gi.number}</span> {gi.title} <ExternalLink className="w-3 h-3 text-muted" />
                              </a>
                            </li>
                          ) : (
                            <li key={gi.number} className="font-mono">#{gi.number} {gi.title}</li>
                          ),
                        )}
                      </ul>
                    )}
                    {fx.screenshots && fx.screenshots.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {fx.screenshots.map((ss, i) => {
                          const pair: LightboxStep[] = ss.before
                            ? [
                                { src: `/walkthroughs/${ss.before}`, name: "Before", description: ss.caption, label: "Before" },
                                { src: `/walkthroughs/${ss.src}`, name: "After", description: ss.caption, label: "After" },
                              ]
                            : [{ src: `/walkthroughs/${ss.src}`, description: ss.caption }];
                          return (
                            <button key={i} type="button" onClick={() => setLightbox({ steps: pair, index: 0, title: fx.title })} className="text-left">
                              <Image src={`/walkthroughs/${ss.src}`} alt={ss.caption ?? ""} width={640} height={400} className="rounded-lg border border-border w-full" unoptimized />
                              {ss.caption && <Prose inline className="text-xs text-muted mt-1 block">{ss.caption}</Prose>}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="italic text-muted">Code-only fix — no visual walkthrough needed.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      <footer className="text-xs text-muted">Last updated: {catalog?.updatedAt ? new Date(catalog.updatedAt).toLocaleString() : "—"}</footer>

      {lightbox && <ScreenshotLightbox steps={lightbox.steps} startIndex={lightbox.index} title={lightbox.title} onClose={() => setLightbox(null)} />}
    </div>
  );
}
