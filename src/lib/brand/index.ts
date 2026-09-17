export { BrandProvider, useBrand, buildGradientCSS } from "./context";
export {
  useBrandNumeric,
  numericToHexString,
  type BrandNumericPalette,
} from "./numeric";
export { defaultBrandConfig } from "./defaults";
export {
  loadBrandConfig,
  saveBrandConfig,
  clearBrandConfig,
  hasCompletedOnboarding,
  loadActivePresetId,
  saveActivePresetId,
  loadDeckOverrides,
  saveDeckOverride,
  emitDeckOverridesChanged,
  DECK_OVERRIDES_EVENT,
  type PerDeckOverrides,
} from "./storage";
export { loadGoogleFont, loadBrandFonts, POPULAR_FONTS } from "./fonts";
export {
  BUILTIN_PRESETS,
  DEFAULT_PRESET_ID,
  getBuiltinPreset,
  type BrandPreset,
} from "./presets";
export type {
  BrandConfig,
  BrandColors,
  BrandTypography,
  BrandDefaults,
  BrandTone,
  BrandVoice,
  BrandHint,
} from "./types";
