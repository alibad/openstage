import type { BrandConfig } from "./types";
import { BUILTIN_PRESETS, DEFAULT_PRESET_ID } from "./presets";

/**
 * Openstage is a Human Quest product, so its default brand comes from the
 * Human Quest logo and site palette. Importing from `presets.ts` keeps the
 * default, theme switcher and settings UI on one source of truth.
 */
const defaultPreset = BUILTIN_PRESETS.find((p) => p.id === DEFAULT_PRESET_ID);
if (!defaultPreset) throw new Error(`Default preset '${DEFAULT_PRESET_ID}' not found`);

export const defaultBrandConfig: BrandConfig = defaultPreset.config;
