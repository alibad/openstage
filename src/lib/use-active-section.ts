"use client";

import { useEffect, useState } from "react";

export interface UseActiveSectionOptions {
  /**
   * `IntersectionObserver` rootMargin. Defaults to `"-30% 0px -60% 0px"`,
   * which gives a comfortable activation band roughly 30 % below the top of
   * the viewport and 40 % above the bottom — works well for scroll decks
   * with mid-height sections. Use a tighter band like `"-20% 0px -20% 0px"`
   * for short or stacked sections.
   */
  rootMargin?: string;
  /**
   * Initial active id before any observer has fired. Defaults to the first
   * id in `ids`.
   */
  initial?: string | null;
}

/**
 * useActiveSection — track which DOM section is currently "active" based on
 * viewport visibility, picking the **deepest-visible** section (largest
 * index in `ids`).
 *
 * As the user scrolls down, the active id advances to the most recently
 * entered section instead of getting stuck on an earlier one that still
 * overlaps the IntersectionObserver activation band — a common pitfall when
 * naively returning the first visible section.
 *
 * @param ids - Stable list of DOM ids to observe, in source order.
 * @returns The id of the currently active section, or `null` until the first
 *   one becomes visible (or the `initial` value if provided).
 *
 * @example
 * const CHAPTERS = [{ id: "hero" }, { id: "vision" }, { id: "next" }];
 * const active = useActiveSection(CHAPTERS.map((c) => c.id));
 */
export function useActiveSection(
  ids: readonly string[],
  options: UseActiveSectionOptions = {},
): string | null {
  const { rootMargin = "-30% 0px -60% 0px", initial } = options;
  const initialActive = initial !== undefined ? initial : (ids[0] ?? null);
  const [active, setActive] = useState<string | null>(initialActive);

  // Re-running the effect on every render would tear down all observers, so
  // depend on a stable string key derived from the ids list instead of the
  // array identity.
  const idsKey = ids.join("|");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (ids.length === 0) return;

    const visibleSet = new Set<string>();
    const pickActive = () => {
      let chosen: string | null = null;
      for (const id of ids) {
        if (visibleSet.has(id)) chosen = id;
      }
      if (chosen) setActive(chosen);
    };

    const observers: IntersectionObserver[] = [];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) visibleSet.add(id);
          else visibleSet.delete(id);
          pickActive();
        },
        { rootMargin },
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
    // ids is intentionally tracked via idsKey to avoid observer churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, rootMargin]);

  return active;
}

/**
 * useActiveSectionIndex — same as `useActiveSection` but returns the index
 * of the active id within `ids` (or `null` if none). Convenient for
 * components that key off position rather than id (e.g. cumulative section
 * budgets in `PresentationTimer`).
 */
export function useActiveSectionIndex(
  ids: readonly string[],
  options: UseActiveSectionOptions = {},
): number | null {
  const active = useActiveSection(ids, options);
  if (active == null) return null;
  const idx = ids.indexOf(active);
  return idx >= 0 ? idx : null;
}
