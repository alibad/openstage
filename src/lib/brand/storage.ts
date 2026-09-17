import type { BrandConfig, BrandHint } from "./types";
import { defaultBrandConfig } from "./defaults";

const STORAGE_KEY = "brand-config";
const ACTIVE_PRESET_KEY = "brand-active-preset-id";
const PER_DECK_KEY = "brand-overrides";
const STORAGE_VERSION = 1;

interface StoredBrand {
  version: number;
  config: BrandConfig;
}

export function loadBrandConfig(): BrandConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored: StoredBrand = JSON.parse(raw);
    if (stored.version !== STORAGE_VERSION) {
      return migrate(stored);
    }
    return stored.config;
  } catch {
    return null;
  }
}

export function saveBrandConfig(config: BrandConfig): void {
  if (typeof window === "undefined") return;
  const stored: StoredBrand = { version: STORAGE_VERSION, config };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

export function clearBrandConfig(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ACTIVE_PRESET_KEY);
}

export function hasCompletedOnboarding(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * Active preset id — `null` means "custom" (user has manually edited the
 * brand off any preset). Reading is best-effort and never throws.
 */
export function loadActivePresetId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACTIVE_PRESET_KEY);
  } catch {
    return null;
  }
}

export function saveActivePresetId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id == null) localStorage.removeItem(ACTIVE_PRESET_KEY);
  else localStorage.setItem(ACTIVE_PRESET_KEY, id);
}

/**
 * Per-deck brand overrides — keyed by registry slug. Each entry is a
 * `BrandHint` (preset id and/or inline partial config). Registry-declared
 * defaults from `PresentationMeta.brand` are merged underneath these
 * runtime overrides at the BrandScope level, in this order:
 *   global brand → registry hint → runtime override.
 */
export type PerDeckOverrides = Record<string, BrandHint>;

export function loadDeckOverrides(): PerDeckOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PER_DECK_KEY);
    return raw ? (JSON.parse(raw) as PerDeckOverrides) : {};
  } catch {
    return {};
  }
}

export function saveDeckOverride(slug: string, override: BrandHint | null): void {
  if (typeof window === "undefined") return;
  const all = loadDeckOverrides();
  if (override == null) delete all[slug];
  else all[slug] = override;
  localStorage.setItem(PER_DECK_KEY, JSON.stringify(all));
  emitDeckOverridesChanged();
}

/** Subscribe to per-deck override changes (multi-tab + same-tab `dispatchEvent`). */
export const DECK_OVERRIDES_EVENT = "brand-deck-overrides-changed";

export function emitDeckOverridesChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DECK_OVERRIDES_EVENT));
}

function migrate(stored: StoredBrand): BrandConfig {
  return { ...defaultBrandConfig, ...stored.config };
}
