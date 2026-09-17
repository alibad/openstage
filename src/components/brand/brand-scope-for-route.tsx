"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  loadDeckOverrides,
  DECK_OVERRIDES_EVENT,
  type BrandHint,
} from "@/lib/brand";
import { presentations } from "@/content/registry";
import { BrandScope } from "./brand-scope";

/**
 * Auto-applies a per-deck brand override based on the current route.
 *
 * Slug derivation:
 * - Strips the leading `/` from the pathname and looks up an exact match
 *   in the registry. Both single-segment routes (`/closing-the-feedback-
 *   loop`) and nested routes (`/upskilling/agent-development`) work.
 * - Routes that aren't in the registry (gallery `/`, `/auth/...`,
 *   `/admin`, `/share/[id]`, etc.) get no scope and pass through as a
 *   fragment.
 *
 * Layering: registry default (`PresentationMeta.brand`) is overlaid by
 * the runtime override (`localStorage["brand-overrides"][slug]`). Both
 * are optional. If neither is present, BrandScope short-circuits to a
 * fragment.
 */
export function BrandScopeForRoute({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const slug = pathname && pathname !== "/" ? pathname.slice(1) : null;

  const registryHint = useMemo<BrandHint | undefined>(() => {
    if (!slug) return undefined;
    return presentations.find((p) => p.slug === slug)?.brand;
  }, [slug]);

  const [runtimeHint, setRuntimeHint] = useState<BrandHint | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!slug) {
      setRuntimeHint(undefined);
      return;
    }
    const refresh = () => {
      const all = loadDeckOverrides();
      setRuntimeHint(all[slug]);
    };
    refresh();
    const onChange = () => refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "brand-overrides") refresh();
    };
    window.addEventListener(DECK_OVERRIDES_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(DECK_OVERRIDES_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [slug]);

  return (
    <BrandScope registry={registryHint} runtime={runtimeHint}>
      {children}
    </BrandScope>
  );
}
