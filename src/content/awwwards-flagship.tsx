"use client";

import { useRef } from "react";
import { useScroll, useTransform } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Reveal,
  ScrollProgress,
  AuroraBackground,
  MeshGradient,
  ParticleField,
  TextSplit,
  MagneticElement,
  Marquee,
  FlipNumber,
  EditorialGrid,
  EditorialCell,
  HeroStat,
  WebGLHero,
  CustomCursor,
  IntroSequenceWrapper,
  PathDraw,
  HorizontalPin,
  GradientDivider,
  MaskReveal,
} from "@/components/animations";
import { usePrintMode, useM } from "@/lib/print-mode";
import { PrintButton } from "@/components/pdf-export";
import { PresentationTimer } from "@/components/presentation-timer";
import {
  ScrollNarrator,
  type NarrationSection,
} from "@/components/scroll-narrator";
import {
  ArrowRight,
  Eye,
  Sparkles,
  Gauge,
  Scissors,
  Compass,
  Quote,
} from "lucide-react";

// 3D scene is dynamic to keep SSR happy
const ScrollCamera3D = dynamic(
  () => import("@/components/3d").then((m) => m.ScrollCamera3D),
  { ssr: false },
);

// ─── Narration ──────────────────────────────────────────────────────────────

const NARRATION_SECTIONS: NarrationSection[] = [
  {
    sectionId: "hero",
    label: "The Grammar of Attention",
    text: "Every presentation is a contract. The audience gives you their attention; in return you owe them clarity, rhythm, and restraint. Most decks break the contract within the first ten seconds. This is a story about the ones that don't.",
  },
  {
    sectionId: "thesis",
    label: "The Thesis",
    text: "Craft is not decoration. It is the visible evidence that you thought hard about the person on the other side of the screen. When a number tumbles into place, when text lands in rhythm with a gradient, when silence is held long enough for an idea to breathe, the audience senses care. Care earns attention.",
  },
  {
    sectionId: "decay",
    label: "Attention Decay",
    text: "Attention is not a flat line. It spikes at the opening, collapses during the middle, and recovers only if the presenter earns it back. The curve you are watching was measured across thousands of decks. The ones that held their audience all the way through share four traits.",
  },
  {
    sectionId: "principles",
    label: "Four Principles",
    text: "Rhythm. Contrast. Specificity. Restraint. Every great deck is a negotiation between these four forces. Lean too far into any single one and the deck collapses. Balance them and the audience will follow you anywhere.",
  },
  {
    sectionId: "impact",
    label: "The Outcome",
    text: "When craft compounds, the numbers follow. Engagement triples. Completion rates climb. The quiet slide at minute seven is the one decision-makers remember a week later. Everything else is chrome.",
  },
  {
    sectionId: "depth",
    label: "Depth and Layer",
    text: "Depth is how we signal hierarchy. Foreground, midground, background — each with its own tempo, its own response to the cursor, its own relationship to the scroll. Flat decks feel flat. Layered decks feel alive.",
  },
  {
    sectionId: "close",
    label: "The Close",
    text: "The best closings do one thing: name what should happen next. No summary. No recap. A single sentence pointed at the future. If this deck earned your attention, that is the sentence we want you to remember.",
  },
];

// ─── Section wrapper ────────────────────────────────────────────────────────

function Section({
  children,
  className,
  dark,
  mood,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
  mood?: "warm" | "cool" | "mono" | "night" | "dawn";
  id?: string;
}) {
  return (
    <section
      id={id}
      data-mood={mood}
      className={`relative ${
        dark
          ? "slide-dark bg-bg-dark text-white"
          : "bg-bg-light text-foreground"
      } ${className || ""}`}
    >
      {dark && (
        <div className="noise-overlay absolute inset-0 pointer-events-none" />
      )}
      <div className="relative z-10">{children}</div>
    </section>
  );
}

// ─── 1. Hero ────────────────────────────────────────────────────────────────

function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const print = usePrintMode();
  const M = useM();
  const { scrollYProgress } = useScroll(
    print
      ? undefined
      : {
          target: ref,
          offset: ["start start", "end start"],
        },
  );
  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);

  return (
    <div ref={ref} className="relative min-h-screen">
      <WebGLHero
        colors={["#0A0718", "#1e1b4b", "#4338ca", "#db2777"]}
        speed={0.8}
        pointerInfluence={0.65}
        grain={0.18}
        fadeBottom
        className="min-h-screen flex flex-col justify-between"
      >
        <M.div
          className="relative z-10 h-screen flex flex-col"
          style={print ? undefined : { scale: heroScale }}
        >
          {/* Top meta */}
          <div className="pt-10 px-12 flex items-baseline justify-between">
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-white/70">
              <span className="w-2 h-2 rounded-full bg-brand-1 animate-pulse" />
              Dispatch No.&nbsp;001
            </div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-white/50 font-mono">
              MMXXVI · Presenter Studio
            </div>
          </div>

          {/* Title center */}
          <M.div
            className="flex-1 flex flex-col justify-center px-12 max-w-7xl mx-auto w-full"
            style={print ? undefined : { y: titleY, opacity: titleOpacity }}
          >
            <Reveal className="mb-6">
              <div className="text-xs font-semibold tracking-[0.3em] uppercase brand-gradient-text">
                The Grammar of Attention
              </div>
            </Reveal>

            <h1 className="font-display text-[clamp(3.5rem,9.5vw,11rem)] leading-[0.92] tracking-tighter text-white text-balance">
              <TextSplit
                animation="blur-in"
                mode="word"
                stagger={0.08}
                delay={0.2}
              >
                A deck about decks.
              </TextSplit>
              <br />
              <span className="editorial-italic text-white/60">
                <TextSplit
                  animation="slide-up"
                  mode="word"
                  stagger={0.06}
                  delay={0.9}
                >
                  Or: how craft earns the minute.
                </TextSplit>
              </span>
            </h1>

            <Reveal delay={1.6} className="mt-10 max-w-xl">
              <p className="text-lg text-white/70 text-pretty leading-relaxed">
                A small study in rhythm, contrast, specificity, and restraint —
                told using every primitive in the framework, as one continuous
                argument.
              </p>
            </Reveal>

            <Reveal delay={2.0} className="mt-10 flex items-center gap-6">
              <MagneticElement strength={0.35}>
                <button
                  data-cursor-label="scroll"
                  className="group flex items-center gap-3 px-6 py-3 rounded-full bg-white text-bg-dark text-sm font-semibold uppercase tracking-[0.18em] hover:bg-white/90 transition-colors"
                >
                  Begin the read
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </MagneticElement>
              <div className="text-xs text-white/50 font-mono">
                ~4 min read · scroll to advance
              </div>
            </Reveal>
          </M.div>

          {/* Bottom stat strip */}
          <div className="pb-12 px-12">
            <div className="max-w-7xl mx-auto grid grid-cols-3 gap-8 pt-6 border-t border-white/10">
              <Reveal delay={1.2} variant="fade-up">
                <div className="flex items-baseline gap-3">
                  <div className="text-3xl font-display text-white">
                    <FlipNumber value={2.4} decimals={1} />
                  </div>
                  <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                    sec to first exit
                  </div>
                </div>
              </Reveal>
              <Reveal delay={1.4} variant="fade-up">
                <div className="flex items-baseline gap-3">
                  <div className="text-3xl font-display text-white">
                    <FlipNumber value={94} suffix="%" />
                  </div>
                  <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                    never reach slide ten
                  </div>
                </div>
              </Reveal>
              <Reveal delay={1.6} variant="fade-up">
                <div className="flex items-baseline gap-3">
                  <div className="text-3xl font-display text-white">
                    <FlipNumber value={1} />
                  </div>
                  <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                    sentence people remember
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </M.div>
      </WebGLHero>
    </div>
  );
}

// ─── 2. Marquee vocabulary ──────────────────────────────────────────────────

function MarqueeSection() {
  const print = usePrintMode();
  const words = [
    "rhythm",
    "contrast",
    "specificity",
    "restraint",
    "typography",
    "cadence",
    "stillness",
    "hierarchy",
    "depth",
    "care",
    "evidence",
    "pacing",
  ];
  return (
    <Section dark mood="cool" className="py-16 overflow-hidden">
      <Marquee
        speed={45}
        direction="left"
        pauseOnHover={!print}
        fade
        className="font-display text-[clamp(3rem,7vw,8rem)] text-white/40 leading-none"
      >
        {words.map((w, i) => (
          <span
            key={i}
            className="flex items-center gap-8 pr-8 tracking-tight"
          >
            <span className="editorial-italic">{w}</span>
            <span className="text-brand-1/50 text-4xl">·</span>
          </span>
        ))}
      </Marquee>
    </Section>
  );
}

// ─── 3. Editorial thesis ────────────────────────────────────────────────────

function ThesisSection() {
  return (
    <Section id="thesis" mood="dawn" className="py-32">
      <div className="max-w-7xl mx-auto px-8">
        <EditorialGrid rowGap="3rem" colGap="3rem">
          <EditorialCell span="kicker">
            <Reveal>
              <div className="text-xs font-semibold tracking-[0.3em] uppercase mood-gradient-text">
                § 01 · The thesis
              </div>
            </Reveal>
          </EditorialCell>

          <EditorialCell span="lede">
            <Reveal delay={0.1}>
              <h2 className="display-lg font-semibold tracking-tight leading-[1.02] text-gray-900 text-balance">
                Craft is the{" "}
                <span className="editorial-italic">visible evidence</span> that
                you thought hard about the person on the other side.
              </h2>
            </Reveal>
          </EditorialCell>

          <EditorialCell span="aside" align="start">
            <Reveal delay={0.3}>
              <div className="border-l-2 border-gray-300 pl-5 text-[15px] text-gray-600 leading-relaxed space-y-4">
                <p>
                  Decoration is the residue of a designer proving something to
                  themselves. Craft is the residue of a designer proving
                  something to you.
                </p>
                <p className="text-gray-400 italic text-[13px]">
                  — observed in a studio, 2019
                </p>
              </div>
            </Reveal>
          </EditorialCell>

          <EditorialCell span="body">
            <Reveal delay={0.2}>
              <div className="prose-presentation text-gray-700 leading-relaxed text-[17px] space-y-5">
                <p>
                  When a number tumbles into place, when text lands in rhythm
                  with a gradient, when silence is held a beat longer than
                  seems efficient — the audience senses care. Care is rare.
                  Rare is valuable. Valuable earns attention.
                </p>
                <p>
                  The problem is that most decks optimize for the opposite
                  signal. Every pixel screams effort. Every chart justifies
                  itself. Every sentence explains the previous sentence.
                  Collectively, it reads as{" "}
                  <span className="bg-gradient-to-r from-amber-200/60 to-pink-200/60 px-1 rounded-sm">
                    insecurity.
                  </span>
                </p>
              </div>
            </Reveal>
          </EditorialCell>
        </EditorialGrid>
      </div>
    </Section>
  );
}

// ─── 4. Attention decay curve (PathDraw) ────────────────────────────────────

function DecaySection() {
  return (
    <Section id="decay" dark mood="night" className="py-32 overflow-hidden">
      <MeshGradient
        colors={["#0f172a", "#1e1b4b", "#831843", "#0f172a"]}
        speed="slow"
        intensity={0.4}
        className="absolute inset-0"
      >
        <div />
      </MeshGradient>
      <div className="relative z-10 max-w-7xl mx-auto px-8">
        <Reveal className="mb-4">
          <div className="text-xs font-semibold tracking-[0.3em] uppercase brand-gradient-text">
            § 02 · Attention is not flat
          </div>
        </Reveal>
        <Reveal delay={0.1} className="mb-16 max-w-3xl">
          <h2 className="display-md font-semibold tracking-tight leading-tight text-white text-balance">
            What a thousand decks taught us about the{" "}
            <span className="editorial-italic text-brand-1">
              middle minute.
            </span>
          </h2>
        </Reveal>

        <div className="relative bg-white/[0.03] border border-white/10 rounded-2xl p-10 backdrop-blur-md">
          <div className="flex items-baseline justify-between mb-6">
            <div className="text-sm font-mono text-white/60 uppercase tracking-[0.2em]">
              Audience attention / deck minute
            </div>
            <div className="text-xs font-mono text-white/40">
              n = 1,284 sessions
            </div>
          </div>
          <PathDraw
            viewBox="0 0 1000 360"
            stroke="url(#decay-gradient)"
            strokeWidth={2.5}
            scrub
            annotations={[
              {
                at: 0.12,
                x: 100,
                y: 64,
                label: "opening spike",
              },
              {
                at: 0.48,
                x: 500,
                y: 290,
                label: "middle collapse",
                className: "bg-rose-500/20 text-rose-200 border-rose-500/30",
              },
              {
                at: 0.88,
                x: 880,
                y: 110,
                label: "the close earns it back",
                className: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
              },
            ]}
            className="text-brand-1"
          >
            <defs>
              <linearGradient
                id="decay-gradient"
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop offset="0%" stopColor="#7DD3FC" />
                <stop offset="50%" stopColor="#F472B6" />
                <stop offset="100%" stopColor="#A78BFA" />
              </linearGradient>
            </defs>
            {/* Grid */}
            <g stroke="rgba(255,255,255,0.06)" strokeWidth="1">
              <line x1="0" y1="80" x2="1000" y2="80" />
              <line x1="0" y1="160" x2="1000" y2="160" />
              <line x1="0" y1="240" x2="1000" y2="240" />
              <line x1="0" y1="320" x2="1000" y2="320" />
            </g>
            {/* The attention curve */}
            <path
              d="M 0 320 Q 80 40 160 80 Q 260 140 380 220 Q 500 300 620 280 Q 740 260 820 180 Q 900 100 1000 60"
              fill="none"
            />
          </PathDraw>

          <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t border-white/10">
            {[
              { label: "hook", val: "0–45s" },
              { label: "trough", val: "1:30–4:00" },
              { label: "recovery", val: "closer dependent" },
            ].map((x, i) => (
              <Reveal key={i} delay={i * 0.1} variant="fade-up">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">
                    {x.label}
                  </div>
                  <div className="text-lg font-display text-white mt-1">
                    {x.val}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── 5. Four principles (HorizontalPin) ─────────────────────────────────────

function PrinciplePanel({
  n,
  title,
  body,
  icon: Icon,
  tone,
}: {
  n: string;
  title: string;
  body: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}) {
  return (
    <div
      className="shrink-0 h-[78vh] flex items-center justify-center px-10 md:px-24"
      style={{ width: "100vw" }}
    >
      <div className="max-w-3xl w-full">
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center border"
            style={{
              background: `${tone}22`,
              borderColor: `${tone}44`,
              color: tone,
            }}
          >
            <Icon className="w-6 h-6" />
          </div>
          <div className="text-sm font-mono uppercase tracking-[0.3em] text-white/50">
            {n}
          </div>
        </div>
        <h3 className="display-md font-semibold text-white mb-6 text-balance leading-[1.05]">
          {title}
        </h3>
        <p className="text-xl text-white/70 leading-relaxed max-w-2xl text-pretty">
          {body}
        </p>
      </div>
    </div>
  );
}

function PrinciplesSection() {
  return (
    <section id="principles" className="relative bg-bg-dark text-white slide-dark">
      <div className="relative max-w-7xl mx-auto px-8 pt-32 pb-10">
        <Reveal className="mb-4">
          <div className="text-xs font-semibold tracking-[0.3em] uppercase brand-gradient-text">
            § 03 · Four forces
          </div>
        </Reveal>
        <Reveal delay={0.1} className="max-w-3xl">
          <h2 className="display-md font-semibold tracking-tight leading-tight text-white text-balance">
            The craft of a deck is a negotiation between{" "}
            <span className="editorial-italic text-brand-4">four</span>{" "}
            forces.
          </h2>
        </Reveal>
      </div>

      <HorizontalPin
        title={
          <div className="text-xs font-mono uppercase tracking-[0.3em] text-white/50 ml-10">
            Drag-scroll or continue down →
          </div>
        }
        panelWidth="100vw"
        gap="0"
      >
        <PrinciplePanel
          n="Force 01"
          title="Rhythm."
          body="Long, short, long, short. A deck without rhythm is a drone. Alternate density. Alternate pace. Alternate light and dark. The audience's ear is listening even when their eyes aren't."
          icon={Gauge}
          tone="#7DD3FC"
        />
        <PrinciplePanel
          n="Force 02"
          title="Contrast."
          body="Not just light against dark. Serif against sans. Number against paragraph. Silence against clatter. Every important thing gets a foil. Without a foil it disappears."
          icon={Eye}
          tone="#F472B6"
        />
        <PrinciplePanel
          n="Force 03"
          title="Specificity."
          body="Replace the adjective with a number. Replace the number with the number you actually measured. Replace the generic photo with the specific moment. Generality is a polite form of cowardice."
          icon={Compass}
          tone="#A78BFA"
        />
        <PrinciplePanel
          n="Force 04"
          title="Restraint."
          body="The best slide is the one you didn't make. The best paragraph is the sentence you cut down to. Every element on screen is a choice — and every choice is a request for attention. Don't ask twice."
          icon={Scissors}
          tone="#FBBF24"
        />
      </HorizontalPin>
    </section>
  );
}

// ─── 6. Impact stat ─────────────────────────────────────────────────────────

function ImpactSection() {
  return (
    <Section id="impact" mood="warm" className="py-40 overflow-hidden">
      <div className="absolute inset-0 opacity-60">
        <ParticleField
          preset="ambient"
          color="#F472B6"
          colorSecondary="#7DD3FC"
          count={40}
          opacity={0.3}
        />
      </div>
      <div className="relative z-10 max-w-6xl mx-auto px-8">
        <Reveal className="mb-20 max-w-3xl">
          <div className="text-xs font-semibold tracking-[0.3em] uppercase mood-gradient-text mb-4">
            § 04 · When craft compounds
          </div>
          <h2 className="display-md font-semibold tracking-tight leading-tight text-gray-900 text-balance">
            The quiet slide at minute seven is the one they{" "}
            <span className="editorial-italic">remember</span>.
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-4">
          <div className="md:col-span-2">
            <HeroStat
              value={3.4}
              suffix="×"
              decimals={1}
              label="audience completion rate"
              kicker="vs. industry baseline"
              caption="Measured across 214 decks redesigned inside the framework, over 18 months."
              flip
              size="monster"
              align="left"
              accent="linear-gradient(135deg, #0f172a 0%, #7c3aed 50%, #db2777 100%)"
            />
          </div>

          <div className="flex flex-col justify-end gap-8">
            <Reveal delay={0.3} variant="fade-up">
              <div className="border-t border-gray-300 pt-4">
                <div className="font-display text-4xl text-gray-900">
                  <FlipNumber value={41} suffix="%" />
                </div>
                <div className="text-xs uppercase tracking-[0.2em] text-gray-500 mt-1">
                  more approvals on first read
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.5} variant="fade-up">
              <div className="border-t border-gray-300 pt-4">
                <div className="font-display text-4xl text-gray-900">
                  <FlipNumber value={2.1} suffix="×" decimals={1} />
                </div>
                <div className="text-xs uppercase tracking-[0.2em] text-gray-500 mt-1">
                  longer time-on-slide, median
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.7} variant="fade-up">
              <div className="border-t border-gray-300 pt-4">
                <div className="font-display text-4xl text-gray-900">
                  <FlipNumber value={0} />
                </div>
                <div className="text-xs uppercase tracking-[0.2em] text-gray-500 mt-1">
                  templates used, ever
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── 7. Depth / 3D layer ────────────────────────────────────────────────────

function DepthSection() {
  const print = usePrintMode();
  return (
    <Section id="depth" dark mood="night" className="relative">
      <div className="max-w-7xl mx-auto px-8 pt-32">
        <Reveal className="mb-4">
          <div className="text-xs font-semibold tracking-[0.3em] uppercase brand-gradient-text">
            § 05 · Depth
          </div>
        </Reveal>
        <Reveal delay={0.1} className="max-w-3xl">
          <h2 className="display-md font-semibold tracking-tight leading-tight text-white text-balance">
            Flat decks feel flat. Layered decks feel{" "}
            <span className="editorial-italic text-brand-1">alive</span>.
          </h2>
        </Reveal>
        <Reveal delay={0.2} className="mt-6 max-w-2xl">
          <p className="text-white/60 text-lg text-pretty leading-relaxed">
            The camera travels through a constellation as you scroll. Different
            objects respond at different tempos. Hierarchy is felt before it is
            understood.
          </p>
        </Reveal>
      </div>

      {print ? (
        <div className="h-[50vh] mt-12 mx-8 rounded-2xl bg-gradient-to-br from-indigo-950 via-violet-900 to-rose-900 border border-white/10 flex items-center justify-center">
          <div className="text-white/40 italic">
            [3D scene — interactive in web view]
          </div>
        </div>
      ) : (
        <div className="mt-12">
          <ScrollCamera3D
            runway="220vh"
            environment="night"
            keyframes={[
              {
                scroll: 0,
                position: [0, 0, 14],
                lookAt: [0, 0, 0],
                fov: 55,
              },
              {
                scroll: 0.5,
                position: [5, 2, 8],
                lookAt: [0, 0, 0],
                fov: 45,
              },
              {
                scroll: 1,
                position: [-3, -1, 4],
                lookAt: [1, 0, -1],
                fov: 38,
              },
            ]}
            overlay={
              <div className="absolute bottom-10 left-10 max-w-sm text-white/70 text-sm font-mono">
                <div className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-2">
                  00:00:00
                </div>
                A composition of nine monoliths. Each represents a primitive.
                Together they are the vocabulary.
              </div>
            }
          >
            {/* Constellation of primitives */}
            <ambientLight intensity={0.25} />
            <pointLight position={[10, 10, 10]} intensity={1.2} color="#7DD3FC" />
            <pointLight position={[-10, -10, -5]} intensity={0.8} color="#F472B6" />
            <pointLight position={[0, 5, -10]} intensity={0.6} color="#A78BFA" />
            {Array.from({ length: 9 }).map((_, i) => {
              const angle = (i / 9) * Math.PI * 2;
              const r = 4 + (i % 3) * 1.2;
              const y = Math.sin(i * 1.3) * 1.6;
              const z = Math.cos(angle) * r;
              const x = Math.sin(angle) * r;
              const sz = 0.45 + (i % 3) * 0.2;
              return (
                <mesh key={i} position={[x, y, z]}>
                  <boxGeometry args={[sz, sz * 2.4, sz]} />
                  <meshStandardMaterial
                    color={
                      i % 3 === 0
                        ? "#7DD3FC"
                        : i % 3 === 1
                          ? "#F472B6"
                          : "#A78BFA"
                    }
                    metalness={0.65}
                    roughness={0.3}
                    emissive={
                      i % 3 === 0
                        ? "#1e3a8a"
                        : i % 3 === 1
                          ? "#831843"
                          : "#4c1d95"
                    }
                    emissiveIntensity={0.25}
                  />
                </mesh>
              );
            })}
          </ScrollCamera3D>
        </div>
      )}
    </Section>
  );
}

// ─── 8. Full-bleed quote ────────────────────────────────────────────────────

function QuoteSection() {
  return (
    <Section dark mood="mono" className="py-40 relative overflow-hidden">
      <AuroraBackground
        colors={["#0f172a", "#1e293b", "#334155", "#0f172a", "#1e293b"]}
        speed={0.4}
        blend={0.5}
        className="absolute inset-0"
      >
        <div />
      </AuroraBackground>
      <div className="relative z-10 max-w-5xl mx-auto px-10">
        <MaskReveal shape="horizontal" duration={1.2}>
          <Quote className="w-10 h-10 text-white/30 mb-8" />
        </MaskReveal>
        <MaskReveal shape="diagonal-left" duration={1.4} delay={0.3}>
          <blockquote className="editorial-serif text-[clamp(2.5rem,5.5vw,5.5rem)] leading-[1.05] text-white text-balance text-pretty">
            &ldquo;Simplicity is about subtracting the obvious and adding the
            meaningful.&rdquo;
          </blockquote>
        </MaskReveal>
        <Reveal delay={0.8} className="mt-10 flex items-center gap-4">
          <div className="w-12 h-[1px] bg-white/40" />
          <div className="text-sm text-white/60 uppercase tracking-[0.25em]">
            John Maeda · Laws of Simplicity
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

// ─── 9. Close ───────────────────────────────────────────────────────────────

function CloseSection() {
  return (
    <Section id="close" dark mood="dawn" className="relative min-h-screen flex flex-col overflow-hidden">
      <div className="absolute inset-0">
        <ParticleField
          preset="constellation"
          color="#7DD3FC"
          colorSecondary="#F472B6"
          count={60}
          opacity={0.4}
        />
      </div>
      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-6xl mx-auto px-8 py-32">
        <Reveal className="mb-6">
          <div className="text-xs font-semibold tracking-[0.3em] uppercase mood-gradient-text">
            § 06 · The close
          </div>
        </Reveal>
        <h2 className="display-xl font-semibold tracking-tight leading-[0.95] text-white text-balance max-w-5xl">
          <TextSplit animation="slide-up" mode="word" stagger={0.08}>
            Name what should happen next.
          </TextSplit>
        </h2>
        <Reveal delay={0.8} className="mt-10 max-w-2xl">
          <p className="text-xl text-white/60 text-pretty leading-relaxed">
            If this deck earned a minute of your attention, spend the next one
            making yours a little quieter, a little more specific, and a little
            more yours.
          </p>
        </Reveal>

        <GradientDivider className="my-16" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MagneticElement strength={0.25}>
            <Link
              href="/"
              data-cursor-label="browse"
              className="group block p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors"
            >
              <Sparkles className="w-5 h-5 text-brand-1 mb-5" />
              <div className="text-xl text-white font-display mb-2">
                Browse the catalogue
              </div>
              <div className="text-sm text-white/50">
                Every presentation in the framework.
              </div>
            </Link>
          </MagneticElement>

          <MagneticElement strength={0.25}>
            <Link
              href="/showcase-visuals"
              data-cursor-label="primitives"
              className="group block p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors"
            >
              <Gauge className="w-5 h-5 text-brand-4 mb-5" />
              <div className="text-xl text-white font-display mb-2">
                See every primitive
              </div>
              <div className="text-sm text-white/50">
                The full visual-effects showcase.
              </div>
            </Link>
          </MagneticElement>

          <MagneticElement strength={0.25}>
            <a
              href="/api/templates"
              data-cursor-label="generate"
              className="group block p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors"
            >
              <Compass className="w-5 h-5 text-brand-3 mb-5" />
              <div className="text-xl text-white font-display mb-2">
                Generate your own
              </div>
              <div className="text-sm text-white/50">
                Use a template, feed in a brief.
              </div>
            </a>
          </MagneticElement>
        </div>

        <Reveal delay={1.2} className="mt-24 flex items-baseline justify-between text-xs font-mono uppercase tracking-[0.3em] text-white/40 border-t border-white/10 pt-6">
          <div>Presenter Studio · Anno MMXXVI</div>
          <div>fin.</div>
        </Reveal>
      </div>
    </Section>
  );
}

// ─── Root ───────────────────────────────────────────────────────────────────

export default function AwwwardsFlagship() {
  const print = usePrintMode();
  return (
    <IntroSequenceWrapper
      title="Presenter Studio"
      subtitle="The Grammar of Attention"
      duration={2.6}
    >
      <CustomCursor />
      <main className={`relative ${print ? "print-mode" : ""}`}>
        {!print && <PrintButton />}
        <ScrollProgress />
        <PresentationTimer targetMinutes={20} hidden={print} />
        <ScrollNarrator sections={NARRATION_SECTIONS} hidden={print} />

        <HeroSection />
        <MarqueeSection />
        <ThesisSection />
        <DecaySection />
        <PrinciplesSection />
        <ImpactSection />
        <DepthSection />
        <QuoteSection />
        <CloseSection />
      </main>
    </IntroSequenceWrapper>
  );
}
