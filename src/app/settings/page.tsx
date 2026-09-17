"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Palette,
  Type,
  FileText,
  MessageSquare,
  ChevronDown,
  RotateCcw,
  Check,
  Sparkles,
  Layers,
} from "lucide-react";
import Link from "next/link";
import type { BrandConfig, BrandVoice } from "@/lib/brand/types";
import { defaultBrandConfig } from "@/lib/brand/defaults";
import { useBrand, loadBrandFonts } from "@/lib/brand";
import { ColorPicker, GradientBuilder } from "@/components/brand/color-picker";
import { FontSelector } from "@/components/brand/font-selector";
import { LogoUpload } from "@/components/brand/logo-upload";
import { ThemeSwitcher } from "@/components/brand/theme-switcher";
import { PerDeckOverrides } from "@/components/brand/per-deck-overrides";
import { POPULAR_FONTS } from "@/lib/brand/fonts";
import { toast } from "sonner";

function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 bg-surface hover:bg-accent-light/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-accent" />
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 py-6 border-t border-border space-y-6">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { brand, updateBrand, isLoaded, hasOnboarded } = useBrand();
  const [config, setConfig] = useState<BrandConfig>(brand);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isLoaded) setConfig(brand);
  }, [brand, isLoaded]);

  useEffect(() => {
    if (isLoaded && !hasOnboarded) {
      router.replace("/onboarding");
    }
  }, [isLoaded, hasOnboarded, router]);

  useEffect(() => {
    loadBrandFonts(
      config.typography.headingFont,
      config.typography.bodyFont,
      config.typography.monoFont,
    );
  }, [config.typography]);

  const handleSave = () => {
    updateBrand(config);
    setSaved(true);
    toast.success("Brand settings saved");
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setConfig({ ...defaultBrandConfig });
    toast.info("Reset to defaults (click Save to apply)");
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const updateColors = (patch: Partial<BrandConfig["colors"]>) =>
    setConfig({ ...config, colors: { ...config.colors, ...patch } });

  const updateTypo = (patch: Partial<BrandConfig["typography"]>) =>
    setConfig({ ...config, typography: { ...config.typography, ...patch } });

  const updateDefaults = (patch: Partial<BrandConfig["defaults"]>) =>
    setConfig({ ...config, defaults: { ...config.defaults, ...patch } });

  const updateTone = (patch: Partial<BrandConfig["tone"]>) =>
    setConfig({ ...config, tone: { ...config.tone, ...patch } });

  const voices: { value: BrandVoice; label: string; desc: string }[] = [
    { value: "professional", label: "Professional", desc: "Polished, clear, authoritative" },
    { value: "casual", label: "Casual", desc: "Friendly, approachable" },
    { value: "technical", label: "Technical", desc: "Precise, data-driven" },
    { value: "executive", label: "Executive", desc: "Concise, strategic" },
  ];

  return (
    <div className="min-h-screen bg-bg-light text-foreground">
      <div className="brand-gradient-bar" />

      <div className="max-w-2xl mx-auto px-6 pt-10 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-accent-light transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Brand Settings</h1>
              <p className="text-sm text-muted">Customize your presentation brand</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-muted hover:text-foreground border border-border hover:border-accent/50 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium text-white bg-accent hover:bg-accent/90 transition-all"
            >
              {saved ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-border bg-surface p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Theme preset</p>
            <p className="text-[11px] text-muted mt-0.5">
              Pick a built-in palette to instantly retheme everything below. Edits to
              colors, fonts, or copy will fork off the preset into a custom config.
            </p>
          </div>
          <ThemeSwitcher variant="pill" />
        </div>

        <div className="space-y-4">
          <Section title="Company Info" icon={Building2} defaultOpen>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={config.companyName}
                onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-bg-light text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Website
              </label>
              <input
                type="text"
                value={config.defaults.website}
                onChange={(e) => updateDefaults({ website: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-bg-light text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Logo
              </label>
              <LogoUpload
                value={config.logo}
                onChange={(logo) => setConfig({ ...config, logo })}
              />
            </div>
          </Section>

          <Section title="Colors" icon={Palette}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ColorPicker value={config.colors.primary} onChange={(c) => updateColors({ primary: c })} label="Primary" />
              <ColorPicker value={config.colors.secondary} onChange={(c) => updateColors({ secondary: c })} label="Secondary" />
              <ColorPicker value={config.colors.accent} onChange={(c) => updateColors({ accent: c })} label="Accent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Brand Gradient
              </label>
              <GradientBuilder
                stops={config.colors.gradientStops}
                onChange={(stops) => updateColors({ gradientStops: stops })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ColorPicker value={config.colors.darkBg} onChange={(c) => updateColors({ darkBg: c })} label="Dark Background" />
              <ColorPicker value={config.colors.darkSurface} onChange={(c) => updateColors({ darkSurface: c })} label="Dark Surface" />
            </div>
          </Section>

          <Section title="Typography" icon={Type}>
            <FontSelector
              label="Heading Font"
              value={config.typography.headingFont}
              onChange={(f) => updateTypo({ headingFont: f })}
              options={POPULAR_FONTS.heading}
              previewText="The Future of Presentations"
            />
            <FontSelector
              label="Body Font"
              value={config.typography.bodyFont}
              onChange={(f) => updateTypo({ bodyFont: f })}
              options={POPULAR_FONTS.body}
            />
            <FontSelector
              label="Monospace Font"
              value={config.typography.monoFont}
              onChange={(f) => updateTypo({ monoFont: f })}
              options={POPULAR_FONTS.mono}
              previewText="const value = 42;"
            />
          </Section>

          <Section title="Presentation Defaults" icon={FileText}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Default Author</label>
              <input
                type="text"
                value={config.defaults.author}
                onChange={(e) => updateDefaults({ author: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-bg-light text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Footer Text</label>
              <input
                type="text"
                value={config.defaults.footerText}
                onChange={(e) => updateDefaults({ footerText: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-bg-light text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Copyright Template</label>
              <input
                type="text"
                value={config.defaults.copyright}
                onChange={(e) => updateDefaults({ copyright: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-bg-light text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              />
              <p className="text-xs text-muted mt-1">Use {"{year}"} and {"{company}"} as placeholders.</p>
            </div>
          </Section>

          <Section title="Tone & Voice" icon={MessageSquare}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Voice</label>
              <div className="grid grid-cols-2 gap-3">
                {voices.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => updateTone({ voice: v.value })}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      config.tone.voice === v.value
                        ? "border-accent bg-accent-light"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    <p className="text-sm font-semibold text-foreground">{v.label}</p>
                    <p className="text-xs text-muted mt-1">{v.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Default Audience</label>
              <input
                type="text"
                value={config.tone.defaultAudience}
                onChange={(e) => updateTone({ defaultAudience: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-bg-light text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Writing Notes</label>
              <textarea
                value={config.tone.writingNotes}
                onChange={(e) => updateTone({ writingNotes: e.target.value })}
                placeholder="Any specific guidelines for AI-generated content"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-border bg-bg-light text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-none"
              />
            </div>
          </Section>

          <Section title="Per-presentation overrides" icon={Layers}>
            <PerDeckOverrides />
          </Section>
        </div>
      </div>
    </div>
  );
}
