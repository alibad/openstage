"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Palette,
  Type,
  FileText,
  MessageSquare,
  Eye,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
} from "lucide-react";
import type { BrandConfig, BrandVoice } from "@/lib/brand/types";
import { defaultBrandConfig } from "@/lib/brand/defaults";
import { useBrand, loadBrandFonts } from "@/lib/brand";
import { ColorPicker, GradientBuilder } from "@/components/brand/color-picker";
import { FontSelector } from "@/components/brand/font-selector";
import { LogoUpload } from "@/components/brand/logo-upload";
import { POPULAR_FONTS } from "@/lib/brand/fonts";

const STEPS = [
  { id: "company", label: "Company", icon: Building2 },
  { id: "colors", label: "Colors", icon: Palette },
  { id: "typography", label: "Typography", icon: Type },
  { id: "defaults", label: "Defaults", icon: FileText },
  { id: "tone", label: "Tone", icon: MessageSquare },
  { id: "preview", label: "Preview", icon: Eye },
] as const;

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < current
                ? "brand-gradient-bg text-white"
                : i === current
                  ? "border-2 border-accent text-accent bg-accent-light"
                  : "border border-border text-muted"
            }`}
          >
            {i < current ? <Check className="w-4 h-4" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div
              className={`w-8 h-px ${i < current ? "bg-accent" : "bg-border"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function CompanyStep({
  config,
  onChange,
}: {
  config: BrandConfig;
  onChange: (c: BrandConfig) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Tell us about your company
        </h2>
        <p className="text-muted mt-2">
          This information will appear in presentations, footers, and metadata.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Company Name
          </label>
          <input
            type="text"
            value={config.companyName}
            onChange={(e) => onChange({ ...config, companyName: e.target.value })}
            placeholder="Acme Corp"
            className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Website
          </label>
          <input
            type="text"
            value={config.defaults.website}
            onChange={(e) =>
              onChange({
                ...config,
                defaults: { ...config.defaults, website: e.target.value },
              })
            }
            placeholder="acme.com"
            className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Logo
          </label>
          <LogoUpload
            value={config.logo}
            onChange={(logo) => onChange({ ...config, logo })}
          />
        </div>
      </div>
    </div>
  );
}

function ColorsStep({
  config,
  onChange,
}: {
  config: BrandConfig;
  onChange: (c: BrandConfig) => void;
}) {
  const updateColors = (patch: Partial<BrandConfig["colors"]>) =>
    onChange({ ...config, colors: { ...config.colors, ...patch } });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Brand Colors
        </h2>
        <p className="text-muted mt-2">
          Define your color palette. The gradient is used for accents, headings, and the top bar.
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ColorPicker
            value={config.colors.primary}
            onChange={(c) => updateColors({ primary: c })}
            label="Primary"
          />
          <ColorPicker
            value={config.colors.secondary}
            onChange={(c) => updateColors({ secondary: c })}
            label="Secondary"
          />
          <ColorPicker
            value={config.colors.accent}
            onChange={(c) => updateColors({ accent: c })}
            label="Accent"
          />
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
          <ColorPicker
            value={config.colors.darkBg}
            onChange={(c) => updateColors({ darkBg: c })}
            label="Dark Background"
          />
          <ColorPicker
            value={config.colors.darkSurface}
            onChange={(c) => updateColors({ darkSurface: c })}
            label="Dark Surface"
          />
        </div>
      </div>
    </div>
  );
}

function TypographyStep({
  config,
  onChange,
}: {
  config: BrandConfig;
  onChange: (c: BrandConfig) => void;
}) {
  const updateTypo = (patch: Partial<BrandConfig["typography"]>) =>
    onChange({ ...config, typography: { ...config.typography, ...patch } });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Typography
        </h2>
        <p className="text-muted mt-2">
          Choose fonts from Google Fonts. They load automatically at runtime.
        </p>
      </div>

      <div className="space-y-6">
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
      </div>
    </div>
  );
}

function DefaultsStep({
  config,
  onChange,
}: {
  config: BrandConfig;
  onChange: (c: BrandConfig) => void;
}) {
  const updateDefaults = (patch: Partial<BrandConfig["defaults"]>) =>
    onChange({ ...config, defaults: { ...config.defaults, ...patch } });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Presentation Defaults
        </h2>
        <p className="text-muted mt-2">
          Set the default metadata for new presentations.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Default Author
          </label>
          <input
            type="text"
            value={config.defaults.author}
            onChange={(e) => updateDefaults({ author: e.target.value })}
            placeholder="Your name or company"
            className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Footer Text
          </label>
          <input
            type="text"
            value={config.defaults.footerText}
            onChange={(e) => updateDefaults({ footerText: e.target.value })}
            placeholder="acme"
            className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
          />
          <p className="text-xs text-muted mt-1">
            Appears in the bottom-left of slide decks and the gallery footer.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Copyright Template
          </label>
          <input
            type="text"
            value={config.defaults.copyright}
            onChange={(e) => updateDefaults({ copyright: e.target.value })}
            placeholder="© {year} {company}"
            className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
          />
          <p className="text-xs text-muted mt-1">
            Use {"{year}"} and {"{company}"} as placeholders.
          </p>
        </div>
      </div>
    </div>
  );
}

function ToneStep({
  config,
  onChange,
}: {
  config: BrandConfig;
  onChange: (c: BrandConfig) => void;
}) {
  const updateTone = (patch: Partial<BrandConfig["tone"]>) =>
    onChange({ ...config, tone: { ...config.tone, ...patch } });

  const voices: { value: BrandVoice; label: string; desc: string }[] = [
    { value: "professional", label: "Professional", desc: "Polished, clear, and authoritative" },
    { value: "casual", label: "Casual", desc: "Friendly, approachable, and conversational" },
    { value: "technical", label: "Technical", desc: "Precise, data-driven, and detailed" },
    { value: "executive", label: "Executive", desc: "Concise, strategic, and high-level" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Tone & Voice
        </h2>
        <p className="text-muted mt-2">
          Guide how AI generates content for your presentations.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Voice
          </label>
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
          <label className="block text-sm font-medium text-foreground mb-2">
            Default Audience
          </label>
          <input
            type="text"
            value={config.tone.defaultAudience}
            onChange={(e) => updateTone({ defaultAudience: e.target.value })}
            placeholder="Business stakeholders"
            className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Writing Notes
          </label>
          <textarea
            value={config.tone.writingNotes}
            onChange={(e) => updateTone({ writingNotes: e.target.value })}
            placeholder="Any specific guidelines for AI-generated content: avoid jargon, use metrics, etc."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-none"
          />
        </div>
      </div>
    </div>
  );
}

function PreviewStep({ config }: { config: BrandConfig }) {
  const gradientCSS = (() => {
    const stops = config.colors.gradientStops;
    if (stops.length < 2) return config.colors.primary;
    const step = 100 / (stops.length - 1);
    return `linear-gradient(90deg, ${stops.map((c, i) => `${c} ${Math.round(i * step)}%`).join(", ")})`;
  })();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Preview Your Brand
        </h2>
        <p className="text-muted mt-2">
          Here is how your brand will look across presentations.
        </p>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden shadow-lg">
        <div className="h-1" style={{ background: gradientCSS }} />

        <div className="bg-surface p-6">
          <div className="flex items-center gap-3 mb-6">
            {config.logo ? (
              <img
                src={config.logo}
                alt={config.companyName}
                className="w-10 h-10 rounded-xl object-contain"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ background: gradientCSS }}
              >
                {config.companyName.charAt(0)}
              </div>
            )}
            <div>
              <p
                className="text-lg font-semibold"
                style={{
                  background: gradientCSS,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {config.companyName}
              </p>
              <p className="text-xs text-muted">Presentations</p>
            </div>
          </div>

          <div
            className="rounded-xl p-8 text-white mb-4"
            style={{ backgroundColor: config.colors.darkBg }}
          >
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-2"
              style={{
                background: gradientCSS,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Sample Section
            </p>
            <h3
              className="text-2xl font-bold tracking-tight mb-3"
              style={{ fontFamily: `"${config.typography.headingFont}", sans-serif` }}
            >
              Your presentations, your brand.
            </h3>
            <p
              className="text-sm text-white/60 leading-relaxed"
              style={{ fontFamily: `"${config.typography.bodyFont}", sans-serif` }}
            >
              Every chart, diagram, and animation reflects your visual identity.
            </p>

            <div className="flex gap-3 mt-6">
              {[config.colors.primary, config.colors.secondary, config.colors.accent].map(
                (c, i) => (
                  <div
                    key={i}
                    className="flex-1 h-24 rounded-xl flex items-end p-3"
                    style={{ backgroundColor: c }}
                  >
                    <span className="text-[10px] font-mono text-white/80">{c}</span>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted pt-2">
            <span
              className="font-semibold"
              style={{
                background: gradientCSS,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {config.defaults.footerText}
            </span>
            <span>
              {config.defaults.copyright
                .replace("{year}", new Date().getFullYear().toString())
                .replace("{company}", config.companyName)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const stepTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.25 },
};

export default function OnboardingPage() {
  const router = useRouter();
  const { updateBrand, hasOnboarded } = useBrand();
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<BrandConfig>({ ...defaultBrandConfig });

  useEffect(() => {
    if (hasOnboarded) {
      router.replace("/");
    }
  }, [hasOnboarded, router]);

  useEffect(() => {
    loadBrandFonts(
      config.typography.headingFont,
      config.typography.bodyFont,
      config.typography.monoFont,
    );
  }, [config.typography]);

  const canContinue = useCallback(() => {
    if (step === 0) return config.companyName.trim().length > 0;
    return true;
  }, [step, config.companyName]);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleFinish = () => {
    const finalConfig = {
      ...config,
      defaults: {
        ...config.defaults,
        author: config.defaults.author || config.companyName,
        footerText: config.defaults.footerText || config.companyName.toLowerCase(),
        copyright: config.defaults.copyright || `© {year} ${config.companyName}`,
      },
    };
    updateBrand(finalConfig);
    router.push("/");
  };

  const isLast = step === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-bg-light flex flex-col">
      <div className="brand-gradient-bar" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-accent" />
              <span className="text-lg font-semibold text-foreground">
                Set Up Your Brand
              </span>
            </div>
            <StepIndicator current={step} total={STEPS.length} />
          </div>

          <div className="bg-surface rounded-2xl border border-border p-8 shadow-sm min-h-[420px]">
            <AnimatePresence mode="wait">
              <motion.div key={step} {...stepTransition}>
                {step === 0 && <CompanyStep config={config} onChange={setConfig} />}
                {step === 1 && <ColorsStep config={config} onChange={setConfig} />}
                {step === 2 && <TypographyStep config={config} onChange={setConfig} />}
                {step === 3 && <DefaultsStep config={config} onChange={setConfig} />}
                {step === 4 && <ToneStep config={config} onChange={setConfig} />}
                {step === 5 && <PreviewStep config={config} />}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {isLast ? (
              <button
                type="button"
                onClick={handleFinish}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white brand-gradient-bg hover:opacity-90 transition-all shadow-md"
              >
                <Check className="w-4 h-4" />
                Finish Setup
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canContinue()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-center mt-6">
            <p className="text-xs text-muted">
              Step {step + 1} of {STEPS.length}: {STEPS[step].label}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
