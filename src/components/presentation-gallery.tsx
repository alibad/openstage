"use client";

import Link from "next/link";
import { presentations } from "@/content/registry";
import { Settings } from "lucide-react";
import { GalleryFilters } from "@/components/gallery-filters";

function getVisiblePresentations() {
  return presentations.filter((p) => {
    if (p.status === "draft") return false;
    const vis = p.visibility || "public";
    if (vis !== "public") return false;
    if (p.expiresAt && new Date(p.expiresAt) < new Date()) return false;
    return true;
  });
}

/**
 * Every public deck, searchable and sortable. This used to be the whole home
 * page; it now sits under the Openstage landing at /#decks, with the same
 * search, filters, grouping, views and links.
 *
 * Deliberately NOT redirecting to /onboarding when there is no stored brand.
 * `hasOnboarded` is false for every first-time visitor, because it only means
 * "this browser has saved a brand" — so the home page used to greet the public
 * with a six-step "Set Up Your Brand" wizard for somebody else's product.
 * The default brand is Human Quest and is already correct, so a visitor has
 * nothing to set up. Onboarding stays reachable at /onboarding and from
 * /settings for the owner.
 */
export default function PresentationGallery() {
  const visible = getVisiblePresentations();
  const scrollCount = visible.filter((p) => p.type === "scroll").length;
  const slideCount = visible.filter((p) => p.type === "slides").length;

  return (
    <section id="decks" className="hqp-section os-decks-section">
      <div className="hqp-inner">
        <div className="hqp-head">
          <div>
            <p className="hqp-eyebrow">Every deck · {visible.length} live</p>
            <h2 className="hqp-display">
              All the <em>decks.</em>
            </h2>
          </div>
          <Link href="/settings" className="os-settings" title="Brand settings">
            <Settings aria-hidden="true" />
            Brand settings
          </Link>
        </div>

        <div className="os-decks">
          <GalleryFilters
            presentations={visible}
            scrollCount={scrollCount}
            slideCount={slideCount}
            defaultGroupBy="type"
          />
        </div>
      </div>
    </section>
  );
}
