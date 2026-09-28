"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate, motion, useMotionValue, useScroll, useTransform } from "framer-motion";
import { Reveal, ScrollProgress } from "@/components/animations";
import { ChapterNav } from "@/components/chapter-nav";
import { DeckControls } from "@/components/deck-controls";
import {
  NeuralField,
  ParticleMorph,
  Stage,
  StageCamera,
  StageView,
  useHeldProgress,
  useStage,
  type MorphTarget,
} from "@/components/stage";
import { usePrintMode } from "@/lib/print-mode";

/*
 * Stagecraft — the Phase 4 showcase.
 *
 * Every primitive in src/components/stage/ on parade, in the order a deck
 * author meets them: the shared stage, the particle morph, the neural field,
 * text in any script, and what happens on devices that can't do any of it.
 *
 * Palette (semantic, reused throughout):
 *   cyan   #7DD3FC — the stage itself, structure
 *   violet #A78BFA — particles, transformation
 *   orchid #F0ABFC — the reader's hand: interaction
 *   amber  #FBBF24 — fallbacks, graceful degradation
 */

const CYAN = "#7DD3FC";
const VIOLET = "#A78BFA";
const ORCHID = "#F0ABFC";
const AMBER = "#FBBF24";
const TAGLINE = "Canvas · Swarm · Signal · Script · Grace";

const CHAPTERS = [
  { id: "hero", label: "The stage", dark: true },
  { id: "canvas", label: "One canvas", dark: true },
  { id: "signal", label: "Signal", dark: true },
  { id: "script", label: "Any script", dark: true },
  { id: "grace", label: "Graceful", dark: true },
  { id: "build", label: "Build with it", dark: true },
] as const;

/* ─── Shared bits ────────────────────────────────────────────────────────── */

function Kicker({ children, color = CYAN }: { children: ReactNode; color?: string }) {
  return (
    <div className="font-mono text-xs uppercase tracking-[0.3em] mb-5" style={{ color }}>
      {children}
    </div>
  );
}

function Callout({ children, color = VIOLET }: { children: ReactNode; color?: string }) {
  return (
    <Reveal>
      <p
        className="mt-14 max-w-3xl border-l-2 pl-6 text-xl md:text-2xl leading-relaxed text-white/85"
        style={{ borderColor: color }}
      >
        {children}
      </p>
    </Reveal>
  );
}

/* ─── 0 · Hero: the deck is the stage ────────────────────────────────────── */

const HERO_TARGETS: MorphTarget[] = [
  { shape: "scatter" },
  { text: "OPENSTAGE", weight: 800 },
  { shape: "galaxy", scale: 1.0 },
  { text: "The deck is\nthe stage.", weight: 700 },
  { shape: "globe", scale: 0.92 },
];

const HERO_CAPTIONS = [
  "",
  "A presentation system for decks that move.",
  "Forty thousand particles, one draw call.",
  "Every section can open a window into one shared 3D world.",
  "Scroll on — the rest of the deck is built from the same pieces.",
];

function HeroSection() {
  const print = usePrintMode();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // Scroll drives targets 1…n; a short intro flies the cloud in from target 0.
  const held = useHeldProgress(scrollYProgress, HERO_TARGETS.length - 1);
  const intro = useMotionValue(0);
  useEffect(() => {
    const controls = animate(intro, 1, { duration: 2.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 });
    return () => controls.stop();
  }, [intro]);
  const progress = useTransform([intro, held], ([a, b]: number[]) => (a < 1 ? a : 1 + b));

  const [caption, setCaption] = useState(1);
  useEffect(() => progress.on("change", (v) => setCaption(Math.round(Math.max(v, 1)))), [progress]);

  return (
    // In print the scroll runway collapses to one page: there is nothing to scroll through.
    <section ref={ref} id="hero" className="relative bg-transparent text-white" style={{ height: print ? "100vh" : "520vh" }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <StageView
          className="absolute inset-0"
          poster={
            <div className="flex h-full items-center justify-center px-6 text-center">
              <h1 className="text-6xl md:text-8xl font-semibold tracking-tight">
                Openstage
                <span className="block text-white/40">The deck is the stage.</span>
              </h1>
            </div>
          }
        >
          <StageCamera position={[0, 0, 10]} fov={38} />
          <ParticleMorph targets={HERO_TARGETS} progress={progress} colors={[CYAN, VIOLET, ORCHID]} />
        </StageView>

        {/* Vignette over the particles, under the text. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(18,9,7,0.85) 100%)" }}
        />

        <div className="relative z-10 flex h-full flex-col justify-between px-6 py-8 md:px-12">
          <div className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.3em] text-white/45">
            <span>Openstage · Phase 4</span>
            <span className="hidden sm:inline">{TAGLINE}</span>
          </div>
          <div className="mx-auto max-w-2xl text-center">
            <motion.p
              key={caption}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="text-base md:text-lg text-white/70"
            >
              {HERO_CAPTIONS[caption] ?? ""}
            </motion.p>
            <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-white/35">
              Scroll · move the cursor through the cloud
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── 1 · One canvas ─────────────────────────────────────────────────────── */

const TRIO: { label: string; targets: MorphTarget[]; colors: string[] }[] = [
  { label: "sphere → torus → helix", targets: [{ shape: "sphere" }, { shape: "torus" }, { shape: "helix", scale: 1.2 }], colors: [CYAN, VIOLET] },
  { label: "cube → snowflake → ring", targets: [{ shape: "cube" }, { shape: "snowflake", spin: 0.1 }, { shape: "ring" }], colors: [VIOLET, ORCHID] },
  { label: "globe → galaxy → wave", targets: [{ shape: "globe" }, { shape: "galaxy", scale: 1.2 }, { shape: "wave", scale: 1.3 }], colors: [ORCHID, CYAN] },
];

function useTicker(steps: number, every = 3200) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % steps), every);
    return () => clearInterval(id);
  }, [steps, every]);
  return i;
}

function CanvasSection() {
  const step = useTicker(3);
  return (
    <section id="canvas" className="relative bg-transparent py-32 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <Kicker>01 · One canvas</Kicker>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight max-w-4xl">
            Three scenes. One WebGL context.
          </h2>
          <p className="mt-6 max-w-2xl text-lg text-white/65 leading-relaxed">
            Each panel below is its own 3D scene with its own camera. All three draw into the single canvas
            behind this page. A scene that scrolls away stops costing anything.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {TRIO.map((panel, i) => (
            <div key={i} className="rounded-2xl border border-white/10 overflow-hidden">
              <StageView className="aspect-square w-full" index={i + 2}>
                <StageCamera position={[0, 0, 10]} fov={34} />
                <ParticleMorph
                  targets={panel.targets}
                  progress={step}
                  colors={panel.colors}
                  count={9000}
                  size={1.9}
                  seed={11 + i}
                />
              </StageView>
              <div className="border-t border-white/10 px-5 py-4 font-mono text-xs text-white/50">{panel.label}</div>
            </div>
          ))}
        </div>

        <Callout color={CYAN}>
          Browsers stop drawing after about sixteen WebGL contexts. The old way, every 3D section spent one.
          On the stage, a deck can hold as many 3D moments as its story needs.
        </Callout>
      </div>
    </section>
  );
}

/* ─── 2 · Signal ─────────────────────────────────────────────────────────── */

const SIGNAL_STATES = [
  { at: 0.12, label: "Idle", body: "A few connections flicker. Most of the network is dark." },
  { at: 0.45, label: "Thinking", body: "Activity climbs. Pulses fire at random across every layer." },
  { at: 0.78, label: "Forward pass", body: "The pulses fall into step and roll from input to output, layer by layer." },
];

function SignalSection() {
  const print = usePrintMode();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const activity = useTransform(scrollYProgress, [0, 0.4, 1], [0.08, 0.85, 0.95]);
  const wave = useTransform(scrollYProgress, [0.55, 0.8], [0, 1]);
  const [state, setState] = useState(0);
  useEffect(
    () =>
      scrollYProgress.on("change", (v) => {
        const idx = SIGNAL_STATES.reduce((acc, s, i) => (v >= s.at - 0.12 ? i : acc), 0);
        setState(idx);
      }),
    [scrollYProgress],
  );

  return (
    <section ref={ref} id="signal" className="relative bg-transparent text-white" style={{ height: print ? "100vh" : "320vh" }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <StageView className="absolute inset-0">
          <StageCamera position={[0, 0.2, 6.2]} fov={40} />
          <NeuralField activity={activity} wave={wave} colors={[CYAN, ORCHID]} position={[1.25, 0, 0]} scale={0.98} />
        </StageView>
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(to right, rgba(18,9,7,0.92) 0%, rgba(18,9,7,0.55) 38%, transparent 70%)" }}
        />
        <div className="relative z-10 mx-auto flex h-full max-w-6xl items-center px-6">
          <div className="max-w-md">
            <Kicker color={ORCHID}>02 · Signal</Kicker>
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight">A network you can watch think.</h2>
            <div className="mt-10 space-y-4">
              {SIGNAL_STATES.map((s, i) => (
                <div
                  key={i}
                  className="border-l-2 pl-4 transition-all duration-500"
                  style={{ borderColor: i === state ? ORCHID : "rgba(255,255,255,0.12)", opacity: i === state ? 1 : 0.4 }}
                >
                  <div className="font-mono text-xs uppercase tracking-[0.25em]" style={{ color: i === state ? ORCHID : undefined }}>
                    {s.label}
                  </div>
                  <p className="mt-1 text-white/75">{s.body}</p>
                </div>
              ))}
            </div>
            <p className="mt-10 text-sm text-white/45">
              Generated from a seed — 170 nodes, 500 connections, no model file. Scroll drives two numbers:
              how much fires, and whether it fires in step.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── 3 · Any script ─────────────────────────────────────────────────────── */

const SCRIPTS: { label: string; target: MorphTarget }[] = [
  { label: "English", target: { text: "Hello", weight: 800 } },
  { label: "العربية", target: { text: "مرحبا", weight: 700, rtl: true } },
  { label: "中文", target: { text: "你好", weight: 700 } },
  { label: "Русский", target: { text: "Привет", weight: 800 } },
  { label: "हिन्दी", target: { text: "नमस्ते", weight: 700 } },
  { label: "❄", target: { shape: "snowflake", spin: 0.12 } },
];

function ScriptSection() {
  const [i, setI] = useState(0);
  return (
    <section id="script" className="relative bg-transparent py-32 text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-[1fr_1.4fr]">
        <div>
          <Reveal>
            <Kicker color={VIOLET}>03 · Any script</Kicker>
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight">Every language the browser can set.</h2>
            <p className="mt-6 text-lg text-white/65 leading-relaxed">
              Text becomes particles by being drawn first — with the same font engine as the rest of the page.
              Arabic joins, Devanagari stacks, CJK renders, because the browser already knows how.
            </p>
          </Reveal>
          <div className="mt-10 flex flex-wrap gap-2" role="radiogroup" aria-label="Choose a script">
            {SCRIPTS.map((s, k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={k === i}
                onClick={() => setI(k)}
                className="rounded-full border px-4 py-2 text-sm transition-colors"
                style={{
                  borderColor: k === i ? ORCHID : "rgba(255,255,255,0.15)",
                  color: k === i ? ORCHID : "rgba(255,255,255,0.7)",
                  background: k === i ? "rgba(240,171,252,0.08)" : "transparent",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10">
          <StageView
            className="aspect-[4/3] w-full"
            index={6}
            poster={<div className="flex h-full items-center justify-center text-6xl">{"text" in SCRIPTS[i].target ? SCRIPTS[i].target.text : "❄"}</div>}
          >
            <StageCamera position={[0, 0, 10]} fov={34} />
            <ParticleMorph
              targets={SCRIPTS.map((s) => s.target)}
              progress={i}
              colors={[VIOLET, ORCHID, CYAN]}
              count={14000}
              size={1.8}
              seed={23}
            />
          </StageView>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6">
        <Callout color={VIOLET}>
          The hard part of multilingual motion was never the motion. It was shaping text — and the browser has
          been doing that correctly for years.
        </Callout>
      </div>
    </section>
  );
}

/* ─── 4 · Graceful everywhere ────────────────────────────────────────────── */

const FALLBACKS = [
  { when: "Print / Save as PDF", then: "No canvas. Each view prints its poster — a still, or the words it spells." },
  { when: "No WebGL", then: "Same as print. The deck reads as a well-set document." },
  { when: "Reduced motion", then: "Scenes hold still. Morphs cut between shapes instead of flowing." },
  { when: "Integrated or mobile GPU", then: "7,000 particles at 1× pixel ratio instead of 42,000 at 2×." },
  { when: "Frames start dropping", then: "The stage lowers its pixel ratio until the frame rate recovers." },
  { when: "?stage=low in the URL", then: "The presenter's override for a struggling projector laptop." },
];

function DeviceReadout() {
  const { quality, live } = useStage();
  if (quality.pending) return null;
  return (
    <div className="rounded-2xl border px-6 py-5" style={{ borderColor: `${AMBER}55`, background: `${AMBER}0d` }}>
      <div className="font-mono text-xs uppercase tracking-[0.3em]" style={{ color: AMBER }}>
        This device, right now
      </div>
      <div className="mt-3 text-3xl font-semibold tabular-nums">
        {live ? `${quality.tier.toUpperCase()} · ${quality.particles.toLocaleString("en-US")} particles` : "Posters only"}
      </div>
      <div className="mt-1 text-sm text-white/55">
        Pixel ratio {quality.dpr[0]}–{quality.dpr[1]}× · {quality.reducedMotion ? "reduced motion on" : "full motion"}
      </div>
    </div>
  );
}

function GraceSection() {
  return (
    <section id="grace" className="relative bg-bg-dark py-32 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <Kicker color={AMBER}>04 · Graceful everywhere</Kicker>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight max-w-4xl">
            The magic is optional. The deck is not.
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-10 md:grid-cols-[1.5fr_1fr] md:items-start">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <tbody>
                {FALLBACKS.map((f, i) => (
                  <tr key={i} className="border-b border-white/10 align-top">
                    <td className="py-4 pr-6 font-mono text-sm whitespace-nowrap" style={{ color: AMBER }}>
                      {f.when}
                    </td>
                    <td className="py-4 text-white/75">{f.then}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DeviceReadout />
        </div>
        <Callout color={AMBER}>
          A 3D section used to print as a grey box saying &ldquo;interactive in browser&rdquo;. Now the PDF of a deck
          is as considered as the deck.
        </Callout>
      </div>
    </section>
  );
}

/* ─── 5 · Build with it ──────────────────────────────────────────────────── */

const SNIPPET = `<Stage className="bg-bg-dark">
  <section className="h-screen bg-transparent">
    <StageView className="absolute inset-0" poster={<h1>Round 4</h1>}>
      <StageCamera />
      <ParticleMorph
        targets={[{ shape: "scatter" }, { text: "ROUND 4" }, { shape: "globe" }]}
        progress={step}
      />
    </StageView>
  </section>
</Stage>`;

function BuildSection() {
  return (
    <section id="build" className="relative bg-bg-dark py-32 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <Kicker>05 · Build with it</Kicker>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight">Nine lines to a morphing hero.</h2>
        </Reveal>
        <pre className="mt-12 overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-6 text-sm leading-relaxed text-white/80">
          <code>{SNIPPET}</code>
        </pre>
        <div className="mt-16 text-center font-mono text-sm uppercase tracking-[0.35em] text-white/45">{TAGLINE}</div>
      </div>
    </section>
  );
}

/* ─── Root ───────────────────────────────────────────────────────────────── */

export default function Stagecraft() {
  const print = usePrintMode();
  return (
    <Stage className="bg-bg-dark">
      <main className={`relative ${print ? "print-mode" : ""}`}>
        <ScrollProgress />
        <ChapterNav chapters={CHAPTERS} rootMargin="-20% 0px -20% 0px" />
        <DeckControls />
        <HeroSection />
        <CanvasSection />
        <SignalSection />
        <ScriptSection />
        <GraceSection />
        <BuildSection />
      </main>
    </Stage>
  );
}
