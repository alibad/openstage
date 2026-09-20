"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { BrandConfig } from "./types";
import { defaultBrandConfig } from "./defaults";
import {
  loadBrandConfig,
  saveBrandConfig,
  loadActivePresetId,
  saveActivePresetId,
} from "./storage";
import {
  BUILTIN_PRESETS,
  DEFAULT_PRESET_ID,
  getBuiltinPreset,
  type BrandPreset,
} from "./presets";

interface BrandContextValue {
  brand: BrandConfig;
  updateBrand: (config: BrandConfig) => void;
  patchBrand: (partial: Partial<BrandConfig>) => void;
  isLoaded: boolean;
  hasOnboarded: boolean;
  gradientCSS: string;
  copyrightText: string;

  // Presets
  presets: readonly BrandPreset[];
  /** `null` means user has customized off-preset */
  activePresetId: string | null;
  setActivePreset: (id: string) => void;
  cyclePreset: (direction?: 1 | -1) => void;
}

const BrandContext = createContext<BrandContextValue | null>(null);

function buildGradientCSS(stops: string[]): string {
  if (stops.length < 2) {
    const c = stops[0] || "#818CF8";
    return `linear-gradient(90deg, ${c} 0%, ${c} 100%)`;
  }
  const step = 100 / (stops.length - 1);
  const parts = stops.map((c, i) => `${c} ${Math.round(i * step)}%`);
  return `linear-gradient(90deg, ${parts.join(", ")})`;
}

function formatCopyright(template: string, companyName: string): string {
  return template
    .replace("{year}", new Date().getFullYear().toString())
    .replace("{company}", companyName);
}

function injectCSSVariables(brand: BrandConfig) {
  const root = document.documentElement;
  const { colors, typography } = brand;
  const stops = colors.gradientStops;

  const s1 = stops[0] || colors.primary;
  const s2 = stops[1] || colors.primary;
  const s3 = stops[2] || colors.secondary;
  const s4 = stops[3] || colors.accent;
  const s5 = stops[4] || colors.accent;

  root.style.setProperty("--color-brand-1", s1);
  root.style.setProperty("--color-brand-2", s2);
  root.style.setProperty("--color-brand-3", s3);
  root.style.setProperty("--color-brand-4", s4);
  root.style.setProperty("--color-brand-5", s5);

  // Alias trick: remap the named spectrum tokens to the active brand stops.
  // This lets every existing `text-spectrum-*` / `bg-spectrum-*` class (and the
  // `.spectrum-gradient-*` utilities) silently respond to theme
  // changes without per-deck code edits. Decks that hardcode hex literals
  // (e.g. `#7DD3FC` directly in JSX) are NOT covered — those are migrated
  // separately to `var(--color-brand-N)` references.
  root.style.setProperty("--color-spectrum-cyan", s1);
  root.style.setProperty("--color-spectrum-blue", s2);
  root.style.setProperty("--color-spectrum-purple", s3);
  root.style.setProperty("--color-spectrum-pink", s4);
  root.style.setProperty("--color-spectrum-magenta", s5);

  root.style.setProperty("--color-accent", colors.primary);
  root.style.setProperty("--color-accent-secondary", colors.secondary);
  root.style.setProperty("--color-bg-dark", colors.darkBg);
  root.style.setProperty("--color-bg-elevated", colors.darkSurface);
  // NOTE: `--color-bg-surface` and `--color-bg-card` are intentionally NOT
  // overridden here. Several decks consume those classes with hand-tuned
  // values; deriving them via mixColor would cause subtle but visible
  // drift. Treated as app-chrome, not part of the brand surface.

  root.style.setProperty("--brand-gradient", buildGradientCSS(stops));

  root.style.setProperty(
    "--font-sans",
    `"${typography.bodyFont}", system-ui, sans-serif`,
  );
  root.style.setProperty(
    "--font-heading",
    `"${typography.headingFont}", system-ui, sans-serif`,
  );
  root.style.setProperty(
    "--font-mono",
    `"${typography.monoFont}", "Fira Code", ui-monospace, monospace`,
  );
}

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<BrandConfig>(defaultBrandConfig);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [activePresetId, setActivePresetIdState] = useState<string | null>(
    DEFAULT_PRESET_ID,
  );

  useEffect(() => {
    const saved = loadBrandConfig();
    const savedPresetId = loadActivePresetId();
    if (saved) {
      // The original Openstage default was stored as preset `spectrum` while
      // carrying the Human Quest name and logo. Upgrade that exact legacy
      // combination to the real Human Quest preset. Custom brands and users
      // who deliberately choose the now-generic Spectrum preset stay intact.
      const isLegacyHumanQuestSpectrum =
        savedPresetId === "spectrum" && saved.companyName === "Human Quest";
      const resolvedPreset = getBuiltinPreset(
        isLegacyHumanQuestSpectrum ? DEFAULT_PRESET_ID : savedPresetId ?? "",
      );
      const resolvedBrand = resolvedPreset?.config ?? saved;
      const resolvedPresetId = resolvedPreset?.id ?? savedPresetId;

      setBrand(resolvedBrand);
      setHasOnboarded(true);
      setActivePresetIdState(resolvedPresetId);
      injectCSSVariables(resolvedBrand);
      if (resolvedPreset) {
        saveBrandConfig(resolvedBrand);
        saveActivePresetId(resolvedPreset.id);
      }
    } else {
      setActivePresetIdState(DEFAULT_PRESET_ID);
      injectCSSVariables(defaultBrandConfig);
    }
    setIsLoaded(true);
  }, []);

  const updateBrand = useCallback((config: BrandConfig) => {
    setBrand(config);
    saveBrandConfig(config);
    setHasOnboarded(true);
    // Manual edit pulls the brand off any active preset.
    setActivePresetIdState(null);
    saveActivePresetId(null);
    injectCSSVariables(config);
  }, []);

  const patchBrand = useCallback((partial: Partial<BrandConfig>) => {
    setBrand((prev) => {
      const next = { ...prev, ...partial };
      saveBrandConfig(next);
      injectCSSVariables(next);
      return next;
    });
    setActivePresetIdState(null);
    saveActivePresetId(null);
  }, []);

  const setActivePreset = useCallback((id: string) => {
    const preset = getBuiltinPreset(id);
    if (!preset) return;
    setBrand(preset.config);
    saveBrandConfig(preset.config);
    setHasOnboarded(true);
    setActivePresetIdState(id);
    saveActivePresetId(id);
    injectCSSVariables(preset.config);
  }, []);

  const cyclePreset = useCallback(
    (direction: 1 | -1 = 1) => {
      const ids = BUILTIN_PRESETS.map((p) => p.id);
      const currentIdx = activePresetId ? ids.indexOf(activePresetId) : -1;
      const nextIdx = (currentIdx + direction + ids.length) % ids.length;
      setActivePreset(ids[nextIdx]);
    },
    [activePresetId, setActivePreset],
  );

  // Keyboard shortcut: `T` cycles to next preset, `Shift+T` to previous.
  // Ignored when typing in inputs/textareas/contenteditable.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== "t" && e.key !== "T") return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      cyclePreset(e.shiftKey ? -1 : 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cyclePreset]);

  const gradientCSS = useMemo(
    () => buildGradientCSS(brand.colors.gradientStops),
    [brand.colors.gradientStops],
  );
  const copyrightText = useMemo(
    () => formatCopyright(brand.defaults.copyright, brand.companyName),
    [brand.defaults.copyright, brand.companyName],
  );

  return (
    <BrandContext.Provider
      value={{
        brand,
        updateBrand,
        patchBrand,
        isLoaded,
        hasOnboarded,
        gradientCSS,
        copyrightText,
        presets: BUILTIN_PRESETS,
        activePresetId,
        setActivePreset,
        cyclePreset,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand(): BrandContextValue {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error("useBrand must be used within BrandProvider");
  return ctx;
}

export { buildGradientCSS };
