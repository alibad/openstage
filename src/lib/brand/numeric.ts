"use client";

import { useMemo } from "react";
import { useBrand } from "./context";

/**
 * Brand-aware numeric color palette for JS-side consumers.
 *
 * Phaser, three.js, canvas 2D, tsParticles, and similar APIs take colors
 * as numeric hex (`0xRRGGBB`) or string hex (`"#RRGGBB"`) — never CSS
 * variables. This module bridges the gap: it derives numeric values from
 * the active `BrandConfig` so games, scenes, and shaders can theme along
 * with the rest of the app.
 *
 * Usage in a Phaser scene wrapper:
 *
 * ```tsx
 * const palette = useBrandNumeric();
 * // Re-mount the embed when the palette identity changes so Phaser
 * // re-creates the scene with fresh colors.
 * return <PhaserEmbed key={palette.cacheKey} sceneClass={MyScene} initData={{ palette }} />;
 * ```
 *
 * Inside the scene, `palette.brand[2]` etc. yields a numeric hex you can
 * pass straight into `setFillStyle`, `Rectangle` constructors, or
 * `setColor` (after `numericToHexString`).
 */
export interface BrandNumericPalette {
  /** Brand stops 1..5 as numeric `0xRRGGBB`. */
  brand: [number, number, number, number, number];
  /** Brand stops 1..5 as `"#RRGGBB"` strings (for `setColor`, `setStroke`, etc.). */
  brandHex: [string, string, string, string, string];
  /** Identity string for re-mount keys. Stable until the brand changes. */
  cacheKey: string;
}

function hexToNumeric(hex: string): number {
  const trimmed = hex.trim().replace(/^#/, "");
  if (trimmed.length === 3) {
    // Expand `#abc` → `#aabbcc`
    const expanded = trimmed
      .split("")
      .map((c) => c + c)
      .join("");
    return parseInt(expanded, 16);
  }
  return parseInt(trimmed.slice(0, 6), 16);
}

export function numericToHexString(value: number): string {
  return `#${value.toString(16).padStart(6, "0").toUpperCase()}`;
}

/**
 * Read the active brand and project it into the numeric palette shape that
 * Phaser, canvas, and other JS-side renderers consume. Re-renders whenever
 * the brand changes (via `BrandContext`), so callers can use `cacheKey` as
 * a remount key.
 */
export function useBrandNumeric(): BrandNumericPalette {
  const { brand } = useBrand();
  return useMemo(() => {
    const stops = brand.colors.gradientStops;
    const s1 = stops[0] || brand.colors.primary;
    const s2 = stops[1] || brand.colors.primary;
    const s3 = stops[2] || brand.colors.secondary;
    const s4 = stops[3] || brand.colors.accent;
    const s5 = stops[4] || brand.colors.accent;
    const brandHex: [string, string, string, string, string] = [s1, s2, s3, s4, s5];
    const brandNumeric: [number, number, number, number, number] = [
      hexToNumeric(s1),
      hexToNumeric(s2),
      hexToNumeric(s3),
      hexToNumeric(s4),
      hexToNumeric(s5),
    ];
    return {
      brand: brandNumeric,
      brandHex,
      cacheKey: brandHex.join("|"),
    };
  }, [brand]);
}
