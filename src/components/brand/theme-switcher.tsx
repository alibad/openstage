"use client";

import { useState, useRef, useEffect } from "react";
import { Palette, Check, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useBrand, BUILTIN_PRESETS, type BrandPreset } from "@/lib/brand";

interface ThemeSwitcherProps {
  /**
   * Visual style of the trigger.
   * - `pill` — full pill with active preset name + caret (good for headers)
   * - `icon` — square icon-only button (good for floating control bars)
   * - `inline` — borderless trigger that inherits text color (good for menus)
   */
  variant?: "pill" | "icon" | "inline";
  /** Whether the dropdown opens upward instead of downward. */
  openUpwards?: boolean;
  /** Override for the surrounding wrapper class. */
  className?: string;
  /**
   * Override the trigger button's class entirely. Useful when embedding
   * the switcher inside a host toolbar (e.g. `<SlideControls />`) whose
   * buttons have their own size/shape/hover language and the built-in
   * `pill`/`icon`/`inline` variants would look out of place.
   */
  triggerClassName?: string;
  /** When true, renders against a dark backdrop (light text/borders). */
  onDark?: boolean;
  /** Show the keyboard hint row at the bottom of the menu. */
  showShortcutHint?: boolean;
}

function PresetSwatch({ preset, size = 18 }: { preset: BrandPreset; size?: number }) {
  const stops = preset.config.colors.gradientStops;
  const gradient = `linear-gradient(135deg, ${stops
    .map((c, i) => `${c} ${Math.round((i / (stops.length - 1)) * 100)}%`)
    .join(", ")})`;
  return (
    <span
      aria-hidden
      className="rounded-md ring-1 ring-black/10 shrink-0"
      style={{ width: size, height: size, background: gradient }}
    />
  );
}

export function ThemeSwitcher({
  variant = "pill",
  openUpwards = false,
  className = "",
  triggerClassName,
  onDark = false,
  showShortcutHint = true,
}: ThemeSwitcherProps) {
  const { presets, activePresetId, setActivePreset, isLoaded } = useBrand();
  const [open, setOpen] = useState(false);
  // Component-local mount gate: guaranteed false on THIS subtree's first
  // hydration render even when the brand provider has already loaded.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  // Gate brand-aware content behind `isLoaded` (set true by BrandProvider's
  // mount effect after it reads localStorage). The provider lives in the
  // root layout and persists across client navigations, so the active
  // preset can be ahead of whatever was server-rendered into the cached
  // HTML — rendering a preset name during SSR but a different one on the
  // first client commit produces a hydration mismatch on the `title`
  // attribute. Falling back to `null` until hydration completes keeps SSR
  // and the first client paint identical, then the brand-aware UI fills
  // in once the provider's mount effect runs.
  const active = isLoaded
    ? presets.find((p) => p.id === activePresetId) ?? null
    : null;

  const triggerBase =
    "inline-flex items-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";
  const triggerByVariant: Record<NonNullable<ThemeSwitcherProps["variant"]>, string> = {
    pill: onDark
      ? "px-3 py-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-white/90 text-xs font-medium"
      : "px-3 py-1.5 rounded-full border border-border bg-surface hover:bg-accent-light/40 text-foreground text-xs font-medium",
    icon: onDark
      ? "w-9 h-9 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-white/90 justify-center"
      : "w-9 h-9 rounded-full border border-border bg-surface hover:bg-accent-light/40 text-foreground justify-center",
    inline: onDark ? "text-white/80 hover:text-white" : "text-foreground hover:text-accent",
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={
          triggerClassName ?? `${triggerBase} ${triggerByVariant[variant]}`
        }
        // Mount-gated on isLoaded: the preset is read client-side, so the first
        // client render must match the server ("Choose theme") to avoid a
        // hydration mismatch. The real title lands after the context loads.
        title={mounted && active ? `Theme: ${active.name} (press T to cycle)` : "Choose theme"}
        aria-label="Choose theme"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {variant === "icon" ? (
          <Palette className="w-4 h-4" />
        ) : variant === "pill" ? (
          <>
            {active ? <PresetSwatch preset={active} size={14} /> : <Palette className="w-3.5 h-3.5" />}
            <span>{active?.name ?? "Custom"}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </>
        ) : (
          <>
            <Palette className="w-4 h-4" />
            <span>Theme</span>
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-50 ${openUpwards ? "bottom-full mb-2" : "top-full mt-2"} right-0 w-72 rounded-xl border border-border bg-surface shadow-xl overflow-hidden`}
        >
          <div className="px-3 py-2 border-b border-border bg-black/[0.03]">
            <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">
              Theme presets
            </p>
          </div>
          <ul className="max-h-80 overflow-y-auto py-1">
            {presets.map((preset) => {
              const isActive = preset.id === activePresetId;
              return (
                <li key={preset.id} className="relative">
                  {/* Solid accent rail on the left edge marks the active
                      preset — much clearer than a faint background tint
                      that some screen contexts wash out. */}
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-sm bg-[var(--color-brand-3)]"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setActivePreset(preset.id);
                      setOpen(false);
                    }}
                    className={`w-full text-left pl-4 pr-3 py-2.5 flex items-center gap-3 transition-colors ${
                      isActive
                        ? "bg-black/[0.04] hover:bg-black/[0.06]"
                        : "hover:bg-black/[0.03]"
                    }`}
                    role="menuitemradio"
                    aria-checked={isActive}
                  >
                    <PresetSwatch preset={preset} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm ${
                            isActive
                              ? "font-semibold text-foreground"
                              : "font-medium text-foreground/85"
                          }`}
                        >
                          {preset.name}
                        </span>
                        {preset.builtin && (
                          <span className="text-[9px] uppercase tracking-wider text-muted/70 font-semibold">
                            built-in
                          </span>
                        )}
                        {isActive && (
                          <span className="text-[9px] uppercase tracking-wider font-semibold text-[var(--color-brand-3)]">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted mt-0.5 truncate">
                        {preset.description}
                      </p>
                    </div>
                    {isActive && (
                      <Check className="w-4 h-4 text-[var(--color-brand-3)] shrink-0" />
                    )}
                  </button>
                </li>
              );
            })}
            {activePresetId == null && (
              <li className="border-t border-border mt-1 pt-1">
                <div className="px-3 py-2 text-[11px] text-muted">
                  You&apos;ve customized off any preset.
                </div>
              </li>
            )}
          </ul>
          <div className="border-t border-border bg-black/[0.02] px-3 py-2 flex items-center justify-between text-[11px] text-muted">
            {showShortcutHint ? (
              <span>
                Press{" "}
                <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface font-mono text-[10px]">
                  T
                </kbd>{" "}
                to cycle
              </span>
            ) : (
              <span />
            )}
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="text-[var(--color-brand-3)] hover:underline font-medium"
            >
              Customize →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
