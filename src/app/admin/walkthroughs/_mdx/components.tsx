"use client";

import Image from "next/image";

/**
 * Default implementations of every component a walkthrough guide.mdx expects.
 * Scaffolded once; customise freely — the walkthrough skill never overwrites
 * this file on later runs. Image paths in MDX are relative to the storage root
 * (e.g. "decks-gallery/step-01-landing.png"); the /walkthroughs/ prefix is
 * added here.
 */

const img = (p: string) => `/walkthroughs/${p}`;

export const components = {
  Step: ({
    n,
    title,
    desktop,
    mobile,
    alt,
    children,
  }: {
    n: number;
    title: string;
    desktop: string;
    mobile?: string;
    alt: string;
    children: React.ReactNode;
  }) => (
    <section className="rounded-2xl border-2 border-border bg-surface p-6 my-6" id={`step-${n}`}>
      <div className="flex items-start gap-4">
        <span
          className="h-10 w-10 rounded-full flex items-center justify-center font-bold shrink-0 text-white"
          style={{ background: "var(--color-brand-2)" }}
        >
          {n}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <div className="text-sm text-foreground/80 leading-relaxed">{children}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <figure>
              <Image src={img(desktop)} alt={alt} width={1440} height={900} className="rounded-lg border border-border" unoptimized />
              <figcaption className="text-xs text-muted text-center mt-1">Desktop</figcaption>
            </figure>
            {mobile && (
              <figure>
                <Image src={img(mobile)} alt={`${alt} (mobile)`} width={375} height={812} className="rounded-lg border border-border mx-auto" unoptimized />
                <figcaption className="text-xs text-muted text-center mt-1">Mobile</figcaption>
              </figure>
            )}
          </div>
        </div>
      </div>
    </section>
  ),

  Annotation: ({ type, children }: { type: "tip" | "warning" | "important"; children: React.ReactNode }) => {
    const s = {
      tip: { cls: "bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-200", icon: "💡" },
      warning: { cls: "bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-200", icon: "⚠️" },
      important: { cls: "bg-purple-500/10 border-purple-500 text-purple-900 dark:text-purple-200", icon: "🔒" },
    }[type];
    return (
      <aside className={`${s.cls} border-l-4 rounded-r-md p-3 my-3 text-sm flex gap-2 items-start`}>
        <span aria-hidden>{s.icon}</span>
        <div className="flex-1">{children}</div>
      </aside>
    );
  },

  HeroVideo: ({ src, mobileSrc, poster }: { src: string; mobileSrc?: string; poster?: string }) => (
    <div className="my-6 rounded-2xl overflow-hidden border-2 border-border">
      <video controls poster={poster ? img(poster) : undefined} className="w-full block">
        <source src={img(src)} type="video/webm" />
        {mobileSrc && <source src={img(mobileSrc)} type="video/webm" media="(max-width: 768px)" />}
      </video>
    </div>
  ),

  Screenshots: ({ desktop, mobile, alt }: { desktop: string; mobile?: string; alt: string }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
      <Image src={img(desktop)} alt={alt} width={1440} height={900} className="rounded-lg border border-border" unoptimized />
      {mobile && <Image src={img(mobile)} alt={`${alt} (mobile)`} width={375} height={812} className="rounded-lg border border-border mx-auto" unoptimized />}
    </div>
  ),

  KeyFeatures: ({ features }: { features: string[] }) => (
    <ul className="my-4 grid gap-2">
      {features?.map((f) => (
        <li key={f} className="text-sm">• {f}</li>
      ))}
    </ul>
  ),

  Tips: ({ items }: { items: string[] }) => (
    <ul className="my-4 grid gap-2 rounded-lg p-4" style={{ background: "color-mix(in srgb, var(--color-brand-2) 6%, transparent)" }}>
      {items?.map((t) => (
        <li key={t} className="text-sm">• {t}</li>
      ))}
    </ul>
  ),

  IssueCallout: ({ severity, type, children }: { severity: "critical" | "major" | "minor"; type: string; children: React.ReactNode }) => {
    const cls = { critical: "bg-red-500/10 border-red-500", major: "bg-amber-500/10 border-amber-500", minor: "bg-blue-500/10 border-blue-500" }[severity];
    return (
      <aside className={`${cls} border-l-4 rounded-r-md p-3 my-3 text-sm`}>
        <span className="text-xs font-semibold uppercase tracking-wide opacity-70 mr-2">{type} · {severity}</span>
        <div className="mt-1">{children}</div>
      </aside>
    );
  },
};
