"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  Reveal,
  StaggerChildren,
  StaggerItem,
  FlipNumber,
  WebGLHero,
  Marquee,
  Spectrum,
  StickyMedia,
  VisualStage,
  MeshGradient,
  ParticleField,
  ScrollProgress,
} from "@/components/animations";
import { ChapterNav } from "@/components/chapter-nav";
import { DeckControls } from "@/components/deck-controls";
import { ScrollNarrator, type NarrationSection } from "@/components/scroll-narrator";
import { usePrintMode } from "@/lib/print-mode";
import {
  MessageSquareWarning,
  Terminal,
  ArrowRight,
  Repeat,
  Package,
  Globe,
  Crosshair,
  ScanSearch,
  FileCheck2,
  Activity,
  ShieldCheck,
  Cpu,
  Database,
  Layers3,
} from "lucide-react";

/**
 * AI Patterns — the talk for AI Tinkerers Doha Round 3 (Sep 21, 2026).
 *
 * The rule of that room is "demos, not decks — working code or nothing." So
 * the talk is organised as three live dives: Feedback (with a short Openstage
 * aside), Walkthroughs, and Console + MCP.
 *
 * Every number below is verified, not vibes: 12 skills in ~/.claude/skills +
 * 6 in ~/.codex/skills; walkthrough skill v2.3.0 with 20 reference docs;
 * feedback ported to web, React Native and Flutter; the MCP layer built four
 * separate times (inner_quest, done_os, tinkerer-presenter, humanquest-codex);
 * 8 domain-MVP repos in the fleet, each shipping with feedback baked in.
 */

const TAGLINE = "Workflow · Skill · Domain · Rinse · Repeat";

const CHAPTERS = [
  { id: "hero", label: "The pattern", dark: true },
  { id: "problem", label: "The repeat signal", dark: true },
  { id: "feedback", label: "1 · Feedback + Openstage", dark: false },
  { id: "walkthrough", label: "2 · Walkthroughs", dark: false },
  { id: "mcp", label: "3 · Console + MCP", dark: true },
  { id: "meta", label: "The unit of reuse", dark: false },
  { id: "cta", label: "Take them home", dark: true },
] as const;

/* ─── Section (w-full is load-bearing: see scroll-deck pitfalls) ────────── */

function Section({
  id,
  dark,
  className,
  children,
}: {
  id: string;
  dark?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={`relative ${dark ? "bg-bg-dark text-white" : "bg-bg-light text-foreground"} ${className ?? ""}`}
    >
      {dark && <div className="noise-overlay absolute inset-0 pointer-events-none" />}
      <div className="relative z-10 w-full">{children}</div>
    </section>
  );
}

function Kicker({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div
      className={`text-xs uppercase tracking-[0.3em] mb-4 ${dark ? "text-white/40" : "text-muted"}`}
    >
      {children}
    </div>
  );
}

function Callout({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <Reveal delay={0.3}>
      <blockquote
        className={`relative max-w-3xl px-7 py-6 rounded-2xl border-l-4 ${
          dark ? "bg-white/[0.04] text-white/85" : "bg-surface text-foreground/85"
        }`}
        style={{ borderLeftColor: "var(--color-brand-2)" }}
      >
        <p className="text-base md:text-lg leading-relaxed italic">&ldquo;{children}&rdquo;</p>
      </blockquote>
    </Reveal>
  );
}

function StageCopy({
  number,
  label,
  title,
  muted,
  body,
  accent,
}: {
  number: string;
  label: string;
  title: string;
  muted: string;
  body: string;
  accent: string;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
      <Reveal>
        <div className="mb-7 flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.28em] text-white/60">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white">
            {number}
          </span>
          <span>{label}</span>
        </div>
        <h2 className="max-w-5xl text-5xl font-semibold leading-[0.94] tracking-[-0.05em] md:text-7xl lg:text-[6.5rem]">
          {title}
          <br />
          <span className="editorial-italic font-normal" style={{ color: accent }}>
            {muted}
          </span>
        </h2>
        <p className="mt-8 max-w-xl text-base leading-relaxed text-white/68 md:text-xl">
          {body}
        </p>
      </Reveal>
    </div>
  );
}

/* ─── 0. Hero ─────────────────────────────────────────────────────────── */

function HeroSection() {
  return (
    <section id="hero" className="relative bg-bg-dark text-white min-h-screen flex flex-col overflow-hidden">
      <WebGLHero
        colors={["#0b1220", "#31439b", "#6476ce", "#0b1220"]}
        speed={0.35}
        grain={0.08}
        fadeBottom
        className="absolute inset-0"
      />
      <div className="relative z-10 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/50 font-mono">
          <span>AI Tinkerers · Doha · Round 3</span>
          <span className="hidden sm:inline">Sep 21, 2026</span>
        </div>
      </div>
      <div className="relative z-10 flex-1 flex items-center">
        <div className="max-w-6xl mx-auto px-6 w-full">
          <Reveal>
            <div className="mb-5 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.28em] text-white/55">
              <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_18px_rgba(252,211,77,.85)]" />
              Three live systems · one repeated move
            </div>
            <h1 className="text-6xl md:text-8xl lg:text-[9.5rem] font-semibold tracking-[-0.065em] leading-[0.86] mb-10">
              AI Patterns.
              <br />
              <span className="editorial-italic font-normal text-white/45">Running, not described.</span>
            </h1>
            <p className="text-lg md:text-2xl text-white/72 max-w-2xl leading-relaxed mb-9">
              Three systems I kept rebuilding until the repeated work became visible:
              capture the problem, prove what happened, and give the agent a controlled way to act.
            </p>
            <div
              className="inline-block text-sm md:text-base tracking-[0.2em] uppercase font-mono text-white/60"
              style={{ fontFamily: "var(--font-marker)" }}
            >
              {TAGLINE}
            </div>
          </Reveal>
        </div>
      </div>
      <div className="relative z-10 pb-8">
        <div className="max-w-6xl mx-auto px-6 w-full">
          <div className="grid grid-cols-3 gap-4 border-t border-white/12 pt-5">
            {[
              ["01", "Feedback", "Feedback + Openstage", "#F5B942"],
              ["02", "Walkthrough", "Walkthroughs", "#67E8F9"],
              ["03", "Console", "Console + MCP", "#A78BFA"],
            ].map(([n, short, label, color]) => (
              <div key={n} className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-[10px] md:text-xs" style={{ color }}>{n}</span>
                <span className="text-[9px] uppercase tracking-[0.14em] text-white/55 md:hidden">{short}</span>
                <span className="hidden truncate text-xs uppercase tracking-[0.18em] text-white/55 md:inline">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/42">
            <motion.span animate={{ y: [0, 5, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} aria-hidden>↓</motion.span>
            <span>Scroll to begin</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── The setup — repetition exposes the pattern ─────────────────────── */

function ProblemSection() {
  return (
    <Section id="problem" dark className="overflow-hidden py-28 md:py-36">
      <ParticleField preset="ambient" opacity={0.08} className="absolute inset-0" />
      <div className="relative mx-auto max-w-7xl px-6 md:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_.95fr] lg:items-end">
          <Reveal>
            <Kicker dark>00 · The tell</Kicker>
            <h2 className="max-w-4xl text-5xl font-semibold leading-[0.96] tracking-[-0.045em] md:text-7xl">
              Repetition is the signal.
              <span className="editorial-italic block font-normal text-white/40">The fourth build is evidence.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="max-w-xl text-lg leading-relaxed text-white/62">
              Every app needed the same jobs: capture a problem from inside it, prove what happened,
              and let an agent act through a controlled surface. Rebuilding them repo by repo hid the
              system in plain sight.
            </p>
          </Reveal>
        </div>

        <div className="my-16 grid grid-cols-2 border-y border-white/12 md:grid-cols-4">
          {[
            { v: 8, label: "domain MVPs", sub: "feedback inside every one", color: "#F5B942" },
            { v: 4, label: "MCP builds", sub: "before it became one layer", color: "#A78BFA" },
            { v: 18, label: "agent skills", sub: "rules packaged with code", color: "#67E8F9" },
            { v: 3, label: "feedback runtimes", sub: "web · React Native · Flutter", color: "#F97366" },
          ].map((s, i) => (
            <Reveal key={s.label} delay={0.08 + i * 0.08}>
              <div className="min-h-48 border-white/12 px-4 py-8 md:border-l md:px-7 first:border-l-0">
                <div className="text-6xl font-semibold leading-none tracking-[-0.06em] md:text-7xl" style={{ color: s.color }}>
                  <FlipNumber value={s.v} />
                </div>
                <div className="mt-5 text-sm font-semibold uppercase tracking-[0.08em] text-white">{s.label}</div>
                <div className="mt-1 text-xs leading-snug text-white/42">{s.sub}</div>
              </div>
            </Reveal>
          ))}
        </div>

        <Callout dark>
          The fourth time you build something is not a productivity failure. It&rsquo;s the first
          time the pattern is visible enough to name.
        </Callout>
      </div>
    </Section>
  );
}

/* ─── Live dive 1 — Feedback + Openstage ──────────────────────────────── */

function FeedbackSection() {
  return (
    <section id="feedback" className="relative bg-[#070a12] text-white">
      <VisualStage src="/generated/ai-patterns-feedback-stage.png" alt="" imageClassName="object-[64%_center] md:object-center">
        <StageCopy
          number="01"
          label="Feedback + Openstage"
          title="Catch the signal"
          muted="before the context disappears."
          body="The report begins inside the running product: select the broken thing, preserve the evidence, and send the issue to the repo that owns it."
          accent="#F5B942"
        />
      </VisualStage>

      <div className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32">
        <div className="grid gap-10 lg:grid-cols-[.78fr_1.22fr] lg:items-stretch">
          <Reveal>
            <div className="flex h-full flex-col justify-between border-t border-amber-300/35 pt-7">
              <div>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-amber-300 text-[#171007] shadow-[0_0_42px_rgba(245,185,66,.28)]">
                  <MessageSquareWarning className="h-5 w-5" />
                </div>
                <Kicker dark>Live proof · bottom control pill</Kicker>
                <h3 className="max-w-md text-4xl font-semibold leading-tight tracking-[-0.035em] md:text-5xl">
                  File a bug against this page.
                </h3>
                <p className="mt-5 max-w-md text-base leading-relaxed text-white/58">
                  Pick an element, mark the screenshot, add voice or video, submit. The issue lands
                  with the element path, viewport and console attached.
                </p>
              </div>
              <div className="mt-12 font-mono text-xs uppercase tracking-[0.2em] text-amber-200/75">
                Try it now ↘
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="relative min-h-[520px] overflow-hidden rounded-[2rem] border border-white/12 bg-[#0d111c] p-5 shadow-[0_40px_120px_rgba(0,0,0,.34)] md:p-8">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
                <span>capture session</span>
                <span className="flex items-center gap-2 text-emerald-300/70"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />live</span>
              </div>
              <div className="relative mt-6 h-64 overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_70%_20%,rgba(245,185,66,.18),transparent_32%),linear-gradient(135deg,#111827,#080b12)] md:h-72">
                <div className="absolute left-[12%] top-[16%] h-[58%] w-[62%] rounded-xl border border-white/8 bg-white/[0.025]" />
                <div className="absolute left-[20%] top-[31%] h-[32%] w-[42%] rounded-lg border-2 border-amber-300 shadow-[0_0_45px_rgba(245,185,66,.2)]" />
                <div className="absolute left-[20%] top-[23%] rounded bg-amber-300 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-black">selected</div>
                <Crosshair className="absolute left-[57%] top-[54%] h-6 w-6 text-amber-200" />
                <div className="absolute bottom-5 right-5 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-4 py-2 text-xs text-white/70 backdrop-blur-xl">
                  <span className="h-2 w-2 rounded-full bg-amber-300" /> Evidence attached
                </div>
              </div>
              <div className="mt-6 grid grid-cols-4 gap-2">
                {[
                  [Crosshair, "Select"],
                  [ScanSearch, "Capture"],
                  [Layers3, "Annotate"],
                  [FileCheck2, "Issue"],
                ].map(([Icon, label], i) => {
                  const StepIcon = Icon as typeof Crosshair;
                  return (
                    <div key={label as string} className="border-t border-white/12 pt-4">
                      <StepIcon className="mb-3 h-4 w-4" style={{ color: i === 3 ? "#F5B942" : "rgba(255,255,255,.42)" }} />
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/55">{label as string}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>

        <div className="my-16 border-y border-white/10 py-8">
          <div className="grid gap-8 md:grid-cols-[.7fr_1.3fr] md:items-center">
            <div className="font-mono text-xs uppercase tracking-[0.25em] text-white/38">Presentations · Openstage</div>
            <div>
              <h3 className="text-2xl font-semibold tracking-tight">The presentation is part of the proof.</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/52">
                This page carries the real feedback control, live data and the hand-off into the demo.
                Openstage should make running software visible, then get out of its way.
              </p>
            </div>
          </div>
        </div>

        <Callout dark>
          The best bug report is captured before the reporter has time to translate the failure into a story.
        </Callout>
      </div>
    </section>
  );
}

/* ─── Live dive 2 — Walkthroughs ─────────────────────────────────────── */

function WalkthroughSection() {
  // Two honest numbers from the real catalog: how many features were
  // discovered, and how many have actually been walked (screenshots, video).
  // Never conflate them — "14 walked" when 0 were is the exact lie the
  // walkthrough skill exists to refuse.
  const [cataloged, setCataloged] = useState<number | null>(null);
  const [walked, setWalked] = useState<number>(0);
  useEffect(() => {
    let cancelled = false;
    fetch("/walkthroughs/catalog.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j) return;
        const list = Array.isArray(j?.features) ? (j.features as { desktopStatus?: string; mobileStatus?: string }[]) : [];
        setCataloged(list.length);
        setWalked(list.filter((f) => f.desktopStatus === "done" || f.mobileStatus === "done").length);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  const features = cataloged === null ? null : walked > 0 ? walked : cataloged;
  const caption =
    cataloged === null
      ? "features · artifact drops in before the talk"
      : walked > 0
        ? `of ${cataloged} features walked — desktop + mobile + video`
        : "features cataloged · walks pending";

  return (
    <section id="walkthrough" className="relative bg-[#07131a] text-white">
      <VisualStage
        src="/generated/ai-patterns-walkthrough-stage.png"
        alt=""
        imageClassName="object-[68%_center] md:object-center"
        overlay="linear-gradient(90deg, rgba(4,13,19,.76) 0%, rgba(4,13,19,.42) 52%, rgba(4,13,19,.1) 78%, rgba(4,13,19,.34) 100%)"
      >
        <StageCopy
          number="02"
          label="Walkthroughs"
          title="Drive the product."
          muted="Keep the proof."
          body="A walkthrough is a recorded claim about what the product actually did — across viewports, personas and recent fixes."
          accent="#67E8F9"
        />
      </VisualStage>

      <div className="border-y border-cyan-200/10 bg-[#08171f]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-cyan-200/10 px-6 md:grid-cols-4 md:px-10">
          {[
            [features === null ? "—" : String(features), "features", caption],
            ["2", "viewports", "desktop + mobile"],
            ["20", "reference docs", "rules learned the hard way"],
            ["2.3", "skill version", "repeatable, not improvised"],
          ].map(([value, label, note]) => (
            <div key={label} className="px-4 py-7 md:px-7">
              <div className="text-3xl font-semibold tracking-[-0.04em] text-cyan-200 md:text-4xl">{value}</div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/80">{label}</div>
              <div className="mt-1 text-[11px] leading-snug text-white/38">{note}</div>
            </div>
          ))}
        </div>
      </div>

      <StickyMedia
        mediaPosition="left"
        stepGap="18vh"
        verticalPadding="20vh"
        className="bg-[#07131a]"
        media={
          <div className="relative h-full w-full overflow-hidden bg-[#0a1820]">
            <Image src="/generated/ai-patterns-walkthrough-studio-proof.png" alt="Walkthrough Studio evidence wall" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover opacity-80" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,19,26,.08),rgba(7,19,26,.72))]" />
            <div className="absolute inset-x-0 bottom-0 p-8 md:p-10">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-200/70">Real artifact · Walkthrough Studio</div>
              <div className="mt-3 max-w-md text-3xl font-semibold leading-tight tracking-[-0.03em]">The evidence wall is the product.</div>
            </div>
          </div>
        }
      >
        {[
          { n: "01", h: "Catalog before capture", b: "Name every surface first. A walkthrough cannot prove completeness if it never states what the product contains." },
          { n: "02", h: "Refuse false evidence", b: "Byte-identical steps, a dead backend or an empty render stop the run. A clean screenshot is not proof that the product worked." },
          { n: "03", h: "Keep the artifact", b: "Guides, captures, video, journeys and findings survive the session. A teammate can inspect exactly what the automation saw." },
        ].map((s) => (
          <div key={s.n} className="border-l border-cyan-200/35 pl-6 md:pl-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-200/55">{s.n}</div>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white">{s.h}</h3>
            <p className="mt-4 max-w-md text-base leading-relaxed text-white/52">{s.b}</p>
          </div>
        ))}
      </StickyMedia>

      <div className="mx-auto max-w-7xl px-6 pb-28 md:px-10 md:pb-36">
        <Callout dark>
          A beautiful walkthrough that is wrong is more dangerous than no walkthrough, because people trust the artifact.
        </Callout>
      </div>
    </section>
  );
}

/* ─── Live dive 3 — Console + MCP ─────────────────────────────────────── */

type ToolDescriptor = {
  name: string;
  description?: string;
  inputSchema?: { properties?: Record<string, unknown> };
  input_schema?: { properties?: Record<string, unknown> };
};

function McpPanel() {
  const [tools, setTools] = useState<ToolDescriptor[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/mcp")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        setTools(Array.isArray(j?.tools) ? j.tools : []);
      })
      .catch((e) => !cancelled && setErr(String(e)));
    return () => {
      cancelled = true;
    };
  }, []);

  async function invoke() {
    // Two-step arm → fire. This hits a real generation endpoint, so it's a
    // deliberate host action on stage, never a page-load side effect.
    if (!armed) {
      setArmed(true);
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const r = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "generate_presentation",
          arguments: {
            title: "AI Patterns — live from the room",
            audience: "AI Tinkerers Doha",
            intent: "A one-section proof that an agent can drive this app through its MCP layer.",
          },
        }),
      });
      const j = await r.json();
      const text = Array.isArray(j?.content) ? j.content.map((c: { text?: string }) => c.text ?? "").join("\n") : JSON.stringify(j, null, 2);
      setResult(text);
    } catch (e) {
      setResult(`Invocation failed: ${String(e)}`);
    } finally {
      setBusy(false);
      setArmed(false);
    }
  }

  const t = tools?.[0];
  const args = Object.keys(t?.inputSchema?.properties ?? t?.input_schema?.properties ?? {});

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-violet-300/15 bg-[#080a12]/90 p-6 font-mono text-sm shadow-[0_30px_100px_rgba(0,0,0,.35)] backdrop-blur-xl md:p-8">
      <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-[0.25em] mb-4">
        <Terminal className="w-4 h-4" /> GET /api/mcp · live
      </div>
      {err && <div className="text-rose-300">{err}</div>}
      {!tools && !err && <div className="text-white/40">discovering tools…</div>}
      {tools && tools.length === 0 && <div className="text-white/40">no tools advertised</div>}
      {t && (
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-white/40">tool</span>{" "}
            <span className="text-white font-semibold">{t.name}</span>
          </div>
          {t.description && <div className="text-white/60 leading-relaxed">{t.description}</div>}
          {args.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {args.map((a) => (
                <span key={a} className="px-2 py-1 rounded bg-white/5 ring-1 ring-white/10 text-white/70 text-xs">
                  {a}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={invoke}
              disabled={busy}
              className={`chunky-brand inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold disabled:opacity-50 ${armed ? "ring-2 ring-amber-400" : ""}`}
            >
              {busy ? "invoking…" : armed ? "Confirm — invoke it live" : "Invoke generate_presentation"}
              <ArrowRight className="w-4 h-4" />
            </button>
            {armed && !busy && (
              <button type="button" onClick={() => setArmed(false)} className="text-xs text-white/50 hover:text-white/80 uppercase tracking-wider">
                cancel
              </button>
            )}
          </div>
          {result && (
            <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-white/5 ring-1 ring-white/10 p-4 text-xs text-white/80 whitespace-pre-wrap">
              {result}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function McpSection() {
  return (
    <section id="mcp" className="relative bg-[#070711] text-white">
      <VisualStage
        src="/generated/ai-patterns-console-mcp-stage.png"
        alt=""
        imageClassName="object-[70%_center] md:object-center"
        overlay="linear-gradient(90deg, rgba(5,5,15,.94) 0%, rgba(5,5,15,.7) 38%, rgba(5,5,15,.1) 70%, rgba(5,5,15,.42) 100%)"
      >
        <StageCopy
          number="03"
          label="Console + MCP"
          title="Observe the machine."
          muted="Expose only the actions you mean."
          body="Hangar gives the operator the whole machine. MCP gives the agent a narrow, described and reviewable way to act."
          accent="#C4B5FD"
        />
      </VisualStage>

      <div className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/[0.025]">
            <div className="grid lg:grid-cols-[1fr_180px_1fr]">
              <div className="p-8 md:p-11">
                <div className="mb-8 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-violet-200/55">Console · Hangar</span>
                  <Activity className="h-5 w-5 text-cyan-200/65" />
                </div>
                <h3 className="text-4xl font-semibold tracking-[-0.04em]">The human sees everything.</h3>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-white/52">
                  Services, models, memory budgets and call history live in one local control room.
                  Start and stop controls stay local because they are powerful.
                </p>
                <div className="mt-9 grid grid-cols-3 gap-3">
                  {[[Cpu, "models"], [Database, "memory"], [Activity, "calls"]].map(([Icon, label]) => {
                    const StatIcon = Icon as typeof Cpu;
                    return <div key={label as string} className="border-t border-white/10 pt-4"><StatIcon className="h-4 w-4 text-cyan-200/65" /><div className="mt-3 font-mono text-[9px] uppercase tracking-[0.18em] text-white/42">{label as string}</div></div>;
                  })}
                </div>
              </div>

              <div className="relative flex min-h-52 items-center justify-center border-y border-white/10 bg-black/20 lg:min-h-full lg:border-x lg:border-y-0">
                <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-amber-300/60 to-transparent" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-amber-200/40 bg-[#0b0a12] shadow-[0_0_60px_rgba(245,185,66,.18)]">
                  <ShieldCheck className="h-7 w-7 text-amber-200" />
                </div>
              </div>

              <div className="p-8 md:p-11">
                <div className="mb-8 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-violet-200/55">MCP · controlled actions</span>
                  <Terminal className="h-5 w-5 text-violet-200/65" />
                </div>
                <h3 className="text-4xl font-semibold tracking-[-0.04em]">The agent gets a narrow surface.</h3>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-white/52">
                  Useful tool descriptions, explicit arguments and read-back after every write. The
                  interface carries only the authority the agent actually needs.
                </p>
                <div className="mt-9 flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-violet-100/65">
                  {['discover', 'invoke', 'read back'].map((item) => <span key={item} className="rounded-full border border-violet-200/15 bg-violet-300/[0.06] px-3 py-2">{item}</span>)}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-10">
          <Reveal delay={0.15}><McpPanel /></Reveal>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Reveal delay={0.2}>
            <a
              href="https://walkthrough.humanquest.net/doneos/features/write-read-back"
              target="_blank"
              rel="noreferrer"
              aria-label="Open the DoneOS MCP walkthrough in Walkthrough Studio"
              className="group block h-full overflow-hidden rounded-[1.75rem] border border-[#FF6B5F]/25 bg-[#17191C] p-6 transition hover:-translate-y-1 hover:border-[#FF6B5F]/55 hover:shadow-[0_24px_70px_rgba(255,107,95,.14)] md:p-8"
            >
              <div className="flex items-start gap-5">
                <Image src="/logos/doneos.svg" alt="DoneOS" width={76} height={76} className="h-16 w-16 rounded-2xl ring-1 ring-white/10" />
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#FF9A92]">Studio walkthrough · DoneOS MCP</div>
                  <h3 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-white">Connect it. Watch the task land.</h3>
                </div>
              </div>
              <p className="mt-6 text-sm leading-relaxed text-white/58">
                Start in DoneOS Connect, make the MCP call, then watch the exact task appear in Queue
                and the agent&apos;s name appear beside it in Activity.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white/60">
                {['in-app connect', 'task in Queue', 'agent attribution'].map((item) => <span key={item} className="rounded-full border border-white/10 px-3 py-2">{item}</span>)}
              </div>
              <div className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#FF9A92]">
                Open the evidence <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </a>
          </Reveal>

          <Reveal delay={0.28}>
            <a
              href="https://walkthrough.humanquest.net/inner-quest/features/repaired-write-path"
              target="_blank"
              rel="noreferrer"
              aria-label="Open the Inner Quest MCP walkthrough in Walkthrough Studio"
              className="group block h-full overflow-hidden rounded-[1.75rem] border border-violet-300/25 bg-[radial-gradient(circle_at_85%_10%,rgba(236,72,153,.18),transparent_34%),#10101d] p-6 transition hover:-translate-y-1 hover:border-violet-300/55 hover:shadow-[0_24px_70px_rgba(139,92,246,.16)] md:p-8"
            >
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/10">
                  <Image src="/logos/inner-quest.svg" alt="Inner Quest" width={76} height={76} className="h-14 w-14" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-violet-200">Studio walkthrough · Inner Quest MCP</div>
                  <h3 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-white">Connect securely. See the action.</h3>
                </div>
              </div>
              <p className="mt-6 text-sm leading-relaxed text-white/58">
                Inner Quest explains the secure connection in-app, then the exact fictional MCP action
                appears in My Action Items with its priority and detail intact.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white/60">
                {['in-app OAuth', 'action in Backlog', 'private by design'].map((item) => <span key={item} className="rounded-full border border-white/10 px-3 py-2">{item}</span>)}
              </div>
              <div className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-violet-200">
                Open the evidence <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </a>
          </Reveal>
        </div>

        <div className="mt-14">
          <Callout dark>
            Observability without agency leaves the agent blind. Agency without boundaries leaves the operator exposed.
          </Callout>
        </div>
      </div>
    </section>
  );
}

/* ─── 6. The meta — the unit of reuse ─────────────────────────────────── */

function MetaSection() {
  return (
    <Section id="meta" dark className="overflow-hidden py-28 md:py-36">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(103,232,249,.08),transparent_28%),radial-gradient(circle_at_15%_80%,rgba(167,139,250,.1),transparent_30%)]" />
      <div className="relative mx-auto max-w-7xl px-6 md:px-10">
        <Reveal>
          <Kicker dark>04 · The move underneath all three</Kicker>
          <h2 className="max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.045em] md:text-7xl">
            The reusable unit is judgment.
            <span className="editorial-italic block font-normal text-white/40">Code is only the payload.</span>
          </h2>
          <p className="mb-16 mt-6 max-w-2xl text-lg leading-relaxed text-white/58">
            Every system here follows the same three-step move. A library gives you code; a Skill gives
            an agent the judgment to apply it — the rules, the pitfalls, the things that broke.
          </p>
        </Reveal>

        <div className="mb-20 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-10">
          <Spectrum
            axis={{ left: "a snippet you paste", right: "a product with a domain" }}
            items={[
              { label: "Library", position: 0.15 },
              { label: "Skill", position: 0.55, highlight: true },
              { label: "Pattern", position: 0.85 },
            ]}
            scrub
          />
        </div>

        <StaggerChildren className="mb-20 grid md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-start">
          {[
            { Icon: Repeat, n: "01", t: "Workflow", b: "Notice the job repeated across products." },
            { Icon: Package, n: "02", t: "Skill", b: "Package the rules, failures and judgment with the code." },
            { Icon: Globe, n: "03", t: "Domain", b: "Give the pattern a stable name, place and owner." },
          ].flatMap(({ Icon, n, t, b }, index) => [
            <StaggerItem key={t}>
              <div className="border-t border-white/18 pt-6">
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-violet-200" />
                  <span className="font-mono text-[10px] text-white/32">{n}</span>
                </div>
                <h3 className="mt-8 text-4xl font-semibold tracking-[-0.04em]">{t}</h3>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/48">{b}</p>
              </div>
            </StaggerItem>,
            index < 2 ? <ArrowRight key={`${t}-arrow`} className="mx-7 mt-8 hidden h-5 w-5 text-white/18 md:block" /> : null,
          ])}
        </StaggerChildren>

        <Callout dark>
          Twelve of these live in a folder called <code>skills</code>. That folder is now more
          valuable than any single repo I own, because it&rsquo;s the only thing that makes the next
          app cheaper than the last.
        </Callout>
      </div>
    </Section>
  );
}

/* ─── 7. CTA ──────────────────────────────────────────────────────────── */

function CtaSection() {
  return (
    <section id="cta" className="relative min-h-screen overflow-hidden bg-[#070817] text-white">
      <MeshGradient
        speed="slow"
        intensity={0.2}
        colors={["#FBBF24", "#A78BFA", "#67E8F9", "#31439b"]}
        className="absolute inset-0"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_45%,rgba(103,232,249,0.12),transparent_28%),linear-gradient(105deg,rgba(7,8,23,0.98)_0%,rgba(7,8,23,0.88)_48%,rgba(7,8,23,0.56)_100%)]" />
      <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(rgba(255,255,255,.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.14)_1px,transparent_1px)] bg-[size:72px_72px]" />
      <div className="pointer-events-none absolute -left-8 top-1/2 hidden -translate-y-1/2 select-none text-[34vw] font-black leading-none tracking-[-0.1em] text-white/[0.018] lg:block">
        ONE
      </div>

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-14 px-6 py-24 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-20">
        <Reveal>
          <div>
            <Kicker dark>05 · Take them home</Kicker>
            <h2 className="mt-7 max-w-3xl text-5xl font-semibold leading-[0.94] tracking-[-0.055em] sm:text-6xl md:text-7xl lg:text-[5.7rem]">
              Keep the patterns.
              <span className="mt-2 block font-serif font-normal italic text-cyan-200/72">
                Use them tomorrow.
              </span>
            </h2>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-white/58 md:text-lg">
              Feedback, Openstage, Walkthroughs, Console and MCP — one page with the live
              references, source status and what is ready to try.
            </p>

            <div className="mt-12 grid max-w-xl grid-cols-3 border-y border-white/12 py-5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/42">
              <span><b className="mr-2 text-amber-300">01</b>Capture</span>
              <span><b className="mr-2 text-cyan-300">02</b>Prove</span>
              <span><b className="mr-2 text-violet-300">03</b>Act</span>
            </div>

            <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.28em] text-white/28">
              {TAGLINE}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.18}>
          <a
            href="https://www.humanquest.net/ai-patterns"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open the AI Patterns take-home page"
            className="group mx-auto block w-full max-w-[360px] rounded-[2rem] border border-white/16 bg-white/[0.07] p-3 shadow-[0_34px_100px_rgba(0,0,0,0.48)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1"
          >
            <div className="rounded-[1.45rem] bg-[#f7f5ef] p-5 text-[#0b0f1f] sm:p-6">
              <div className="mb-5 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-[#0b0f1f]/48">
                <span>One scan · all patterns</span>
                <span className="h-2 w-2 rounded-full bg-amber-400" />
              </div>

              <div className="mx-auto aspect-square w-full max-w-[244px] rounded-2xl bg-white p-3 shadow-[0_12px_35px_rgba(11,15,31,0.1)]">
                <QRCodeSVG
                  value="https://www.humanquest.net/ai-patterns"
                  size={220}
                  level="H"
                  marginSize={0}
                  bgColor="#ffffff"
                  fgColor="#0b0f1f"
                  className="h-full w-full"
                  title="QR code for humanquest.net/ai-patterns"
                />
              </div>

              <div className="mt-6 border-t border-[#0b0f1f]/10 pt-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-base font-semibold tracking-[-0.02em] sm:text-lg">
                    humanquest.net/ai-patterns
                  </span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0b0f1f] text-white transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#0b0f1f]/48">
                  Scan now. Keep the references after the room closes.
                </p>
              </div>
            </div>
          </a>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── Narration ───────────────────────────────────────────────────────── */

const NARRATION_SECTIONS: NarrationSection[] = [
  { sectionId: "hero", label: "The pattern", text: "Three systems I kept rebuilding until the repeated work became visible: capture the problem, prove what happened, and give the agent a controlled way to act." },
  { sectionId: "problem", label: "The repeat signal", text: "Eight domain MVPs in the fleet. Four separate times I built the MCP layer before noticing it was one thing. Eighteen skills across two skills directories. The fourth time you build something isn't a productivity failure — it's the first time the pattern is visible enough to name." },
  { sectionId: "feedback", label: "Feedback + Openstage", text: "First: Feedback. File a report from the running page and inspect the issue it creates. The presentation carrying the demo is Openstage — a web app that can hold live controls and then get out of the way when the real demo starts." },
  { sectionId: "walkthrough", label: "Walkthroughs", text: "Second: Walkthroughs drives a real web app and keeps the evidence — catalog, desktop and mobile captures, video, journeys and findings. It refuses to ship a misleading walkthrough: byte-identical screenshots get rejected, and a dead backend blocks the run." },
  { sectionId: "mcp", label: "Console + MCP", text: "Third: Console plus MCP. Hangar shows the real services, models, memory budgets and calls across local machines. MCP exposes deliberate actions so an agent can drive a system and then read the result back. DoneOS starts at Connect, creates a task and shows it in Queue and Activity. Inner Quest starts at its secure connection and shows the action inside My Action Items. Both open in Walkthrough Studio as features of the products they belong to, with the protocol proof one surface deeper." },
  { sectionId: "meta", label: "The unit of reuse", text: "Underneath all three is one move: notice the workflow, package it as a skill with its rules and its scars, and give people one reliable place to find it." },
  { sectionId: "cta", label: "Take them home", text: "One take-home page, no QR scavenger hunt. The event deck's only audience QR points to humanquest dot net slash A I patterns." },
];

/* ─── Root ────────────────────────────────────────────────────────────── */

export default function AiPatterns() {
  const print = usePrintMode();
  return (
    <main className={`relative ${print ? "print-mode" : ""}`}>
      <ScrollProgress />
      <ChapterNav chapters={CHAPTERS} />
      <ScrollNarrator sections={NARRATION_SECTIONS} hidden={print} />
      <DeckControls hasNarration />
      <HeroSection />
      <ProblemSection />
      <FeedbackSection />
      <WalkthroughSection />
      <McpSection />
      <MetaSection />
      <Marquee speed={40} fade className="py-6 bg-bg-dark text-white/30 text-sm uppercase tracking-[0.3em] font-mono">
        <span className="px-8">Feedback + Openstage</span><span className="px-8">·</span>
        <span className="px-8">Walkthroughs</span><span className="px-8">·</span>
        <span className="px-8">Console + MCP</span><span className="px-8">·</span>
      </Marquee>
      <CtaSection />
    </main>
  );
}
