import type { BrandConfig, BrandHint } from "./types";
import { getBuiltinPreset } from "./presets";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Shallow-deep merge: top-level keys are merged 1 level deep so the
 * `colors` / `typography` / `defaults` / `tone` sub-objects are spread
 * (not replaced) when only some of their fields are overridden. Arrays
 * (e.g. `gradientStops`) are replaced wholesale, never element-merged.
 */
export function mergeBrand(
  base: BrandConfig,
  patch: DeepPartial<BrandConfig> | undefined,
): BrandConfig {
  if (!patch) return base;
  return {
    companyName: patch.companyName ?? base.companyName,
    logo: patch.logo !== undefined ? (patch.logo as string | null) : base.logo,
    colors: { ...base.colors, ...(patch.colors as object | undefined) },
    typography: { ...base.typography, ...(patch.typography as object | undefined) },
    defaults: { ...base.defaults, ...(patch.defaults as object | undefined) },
    tone: { ...base.tone, ...(patch.tone as object | undefined) },
  };
}

/**
 * Apply a single `BrandHint` (presetId and/or override) on top of a base
 * brand. The preset replaces the base entirely if specified; the override
 * then overlays whatever fields it declares.
 */
export function applyBrandHint(
  base: BrandConfig,
  hint: BrandHint | undefined,
): BrandConfig {
  if (!hint) return base;
  let result = base;
  if (hint.presetId) {
    const preset = getBuiltinPreset(hint.presetId);
    if (preset) result = preset.config;
  }
  if (hint.override) result = mergeBrand(result, hint.override);
  return result;
}

/**
 * The full layering order for a deck: global brand → registry hint →
 * runtime override. Each layer either preset-resets or overlays the
 * previous, so a deck can declare `{ presetId: "editorial" }` in the
 * registry and the user can later run-time override with
 * `{ override: { typography: { headingFont: "Inter" } } }` to keep the
 * editorial palette but force a different font.
 */
export function computeEffectiveBrand(
  global: BrandConfig,
  registry: BrandHint | undefined,
  runtime: BrandHint | undefined,
): BrandConfig {
  return applyBrandHint(applyBrandHint(global, registry), runtime);
}
