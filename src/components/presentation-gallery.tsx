"use client";

import Link from "next/link";
import Script from "next/script";
import { presentations } from "@/content/registry";
import { Settings } from "lucide-react";
import { GalleryFilters } from "@/components/gallery-filters";
import { useBrand } from "@/lib/brand";

function getVisiblePresentations() {
  return presentations.filter((p) => {
    if (p.status === "draft") return false;
    const vis = p.visibility || "public";
    if (vis !== "public") return false;
    if (p.expiresAt && new Date(p.expiresAt) < new Date()) return false;
    return true;
  });
}

export default function HomePage() {
  const { brand, copyrightText } = useBrand();
  const visible = getVisiblePresentations();
  const scrollCount = visible.filter((p) => p.type === "scroll").length;
  const slideCount = visible.filter((p) => p.type === "slides").length;

  /* Deliberately NOT redirecting to /onboarding when there is no stored brand.
     `hasOnboarded` is false for every first-time visitor, because it only means
     "this browser has saved a brand" — so this page used to greet the public
     with a six-step "Set Up Your Brand" wizard for somebody else's product.
     Verified live on https://openstage.humanquest.net before this change.
     The default brand is Human Quest and is already correct, so a visitor has
     nothing to set up. Onboarding stays reachable at /onboarding and from
     /settings for the owner. */

  return (
    <div className="min-h-screen bg-bg-light text-foreground">
      <div className="brand-gradient-bar" />

      <div className="max-w-4xl mx-auto px-6 pt-20 pb-16">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            {brand.logo ? (
              <img
                src={brand.logo}
                alt={brand.companyName}
                className="w-11 h-11 rounded-xl object-contain"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl brand-gradient-bg flex items-center justify-center text-white font-bold text-lg">
                {brand.companyName.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                <span className="brand-gradient-text">Openstage</span>{" "}
                Presentations
              </h1>
              <p className="text-xs text-muted mt-0.5">
                Immersive experiences powered by React
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/settings"
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-accent-light transition-all"
              title="Brand Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums text-foreground">
                {visible.length}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-muted font-medium">
                presentations
              </p>
            </div>
          </div>
        </div>

        <GalleryFilters
          presentations={visible}
          scrollCount={scrollCount}
          slideCount={slideCount}
        />

        <div className="mt-20">
          <hq-footer current="openstage" theme="light">
            <a href="https://www.humanquest.net/?ref=openstage">A Human Quest AI pattern · humanquest.net</a>
          </hq-footer>
          <Script src="https://www.humanquest.net/embed/hq-footer.js" strategy="afterInteractive" />
        </div>

        <footer className="mt-10 pt-8 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs text-muted">
          <span className="brand-gradient-text font-semibold">
            {brand.defaults.footerText}
          </span>
          <span>{copyrightText}</span>
          <nav aria-label="Human Quest"><a href="https://www.humanquest.net/" className="underline underline-offset-4">Human Quest</a><span aria-hidden="true"> · </span><a href="https://www.humanquest.net/ai-patterns" className="underline underline-offset-4">Explore AI Patterns</a></nav>
        </footer>
      </div>
    </div>
  );
}
