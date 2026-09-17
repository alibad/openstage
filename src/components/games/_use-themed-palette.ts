"use client";

import { useEffect } from "react";
import { useBrandNumeric, type BrandNumericPalette } from "@/lib/brand";

/**
 * Bridge brand colors into a Phaser scene's module-level color palette.
 *
 * Each game in this folder declares a `const C = { ... }` object with
 * numeric (`0xRRGGBB`) Phaser colors. Phaser doesn't read CSS variables,
 * so we mutate the chosen keys with values derived from the active brand
 * BEFORE the scene initializes. Combined with re-mounting the
 * `<PhaserEmbed>` on `palette.cacheKey`, this lets the canvas retone
 * live when the user switches themes.
 *
 * The function form is `(brand) => Partial<C>` so each game can map the
 * 5 brand stops onto its own keys (some games use `purple`/`highlight`,
 * others `cyan`/`pipe`, etc.). Keys NOT returned are left untouched —
 * which is intentional for semantic colors like `correct: green` or
 * `wrong: red` that shouldn't follow brand.
 *
 * @example
 * ```tsx
 * const palette = useThemedPalette(C, ({ brand }) => ({
 *   purple: brand[1],
 *   cyan: brand[0],
 * }));
 * return <PhaserEmbed key={palette.cacheKey} ... />;
 * ```
 */
export function useThemedPalette<C extends Record<string, number>>(
  paletteRef: C,
  mapBrand: (palette: BrandNumericPalette) => Partial<C>,
): BrandNumericPalette {
  const brandPalette = useBrandNumeric();
  // Mutate synchronously during render so the scene sees the brand
  // colors when it first reads from `C`. `useEffect` would race the
  // first frame.
  Object.assign(paletteRef, mapBrand(brandPalette));
  // Keep the effect to satisfy any environment that re-runs effects
  // after a brand swap (e.g. HMR), even though the synchronous assign
  // covers the common case.
  useEffect(() => {
    Object.assign(paletteRef, mapBrand(brandPalette));
  }, [paletteRef, brandPalette, mapBrand]);
  return brandPalette;
}
