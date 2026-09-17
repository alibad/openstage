import type { BrandConfig } from "./types";
import { BUILTIN_PRESETS, DEFAULT_PRESET_ID } from "./presets";

/**
 * The default brand for this app is the "Spectrum" preset — keeps existing
 * decks pixel-identical out of the box and gives onboarding a sane,
 * already-branded starting point. Importing from `presets.ts` (rather
 * than duplicating the literal) makes the two sources of truth impossible
 * to drift apart.
 */
const spectrumPreset = BUILTIN_PRESETS.find((p) => p.id === DEFAULT_PRESET_ID);
if (!spectrumPreset) throw new Error("Default preset 'spectrum' not found");

export const defaultBrandConfig: BrandConfig = spectrumPreset.config;
