"use client";

import { useMemo, type CSSProperties, type ReactNode } from "react";
import type { BrandConfig, BrandHint } from "@/lib/brand";
import { useBrand, buildGradientCSS } from "@/lib/brand";
import { computeEffectiveBrand } from "@/lib/brand/merge";

interface BrandScopeProps {
  /** Registry-declared default for the deck (from `PresentationMeta.brand`). */
  registry?: BrandHint;
  /** Runtime override (from per-deck `localStorage`). Wins over registry. */
  runtime?: BrandHint;
  children: ReactNode;
}

/**
 * Scopes a brand override to a subtree. Implementation detail: rather
 * than re-providing the full `BrandContext` (which would require
 * forwarding mutators that intentionally affect global state), this
 * component just sets the brand CSS variables on a wrapper `div`. CSS
 * variable cascade does the rest — every Tailwind `bg-brand-N` /
 * `text-brand-N` class and every `var(--color-brand-N)` reference inside
 * the subtree resolves to the scoped value, while components calling
 * `useBrand()` continue to see the (mutable) global brand.
 *
 * The wrapper uses `display: contents` so it does not introduce any
 * layout box, stacking context, or block formatting boundary.
 */
export function BrandScope({ registry, runtime, children }: BrandScopeProps) {
  const { brand: globalBrand } = useBrand();

  const effective = useMemo(
    () => computeEffectiveBrand(globalBrand, registry, runtime),
    [globalBrand, registry, runtime],
  );

  const cssVars = useMemo(() => buildScopedVars(effective), [effective]);

  // Bail out if the scope produces no actual override (effective === global).
  // Avoids wrapping every page in a no-op div.
  if (!registry && !runtime) return <>{children}</>;

  return (
    <div className="contents" style={cssVars} data-brand-scope>
      {children}
    </div>
  );
}

function buildScopedVars(brand: BrandConfig): CSSProperties {
  const { colors, typography } = brand;
  const stops = colors.gradientStops;
  const s1 = stops[0] || colors.primary;
  const s2 = stops[1] || colors.primary;
  const s3 = stops[2] || colors.secondary;
  const s4 = stops[3] || colors.accent;
  const s5 = stops[4] || colors.accent;

  // Mirror the var set in `injectCSSVariables` so scoped overrides
  // shadow the global :root values via cascade. The named `--color-
  // spectrum-*` aliases are included so decks wearing
  // `text-spectrum-*` classes also follow the scope.
  return {
    "--color-brand-1": s1,
    "--color-brand-2": s2,
    "--color-brand-3": s3,
    "--color-brand-4": s4,
    "--color-brand-5": s5,
    "--color-spectrum-cyan": s1,
    "--color-spectrum-blue": s2,
    "--color-spectrum-purple": s3,
    "--color-spectrum-pink": s4,
    "--color-spectrum-magenta": s5,
    "--color-accent": colors.primary,
    "--color-accent-secondary": colors.secondary,
    "--color-bg-dark": colors.darkBg,
    "--color-bg-elevated": colors.darkSurface,
    "--brand-gradient": buildGradientCSS(stops),
    "--font-sans": `"${typography.bodyFont}", system-ui, sans-serif`,
    "--font-heading": `"${typography.headingFont}", system-ui, sans-serif`,
    "--font-mono": `"${typography.monoFont}", "Fira Code", ui-monospace, monospace`,
  } as CSSProperties;
}
