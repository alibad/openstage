"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Reveal,
  StaggerChildren,
  StaggerItem,
  FlipNumber,
  EditorialGrid,
  EditorialCell,
  WebGLHero,
  Marquee,
  Spectrum,
  StickyMedia,
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
  CheckCircle2,
  Repeat,
  Package,
  Globe,
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
  { id: "problem", label: "Rebuilt five times", dark: true },
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
            <div className="text-white/50 text-2xl md:text-3xl font-light mb-3">
              This isn&rsquo;t a deck. Your rule says it can&rsquo;t be.
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight leading-[1.02] mb-8">
              AI Patterns.
              <br />
              <span className="text-white/40">Running, not described.</span>
            </h1>
            <p className="text-lg md:text-2xl text-white/70 max-w-2xl leading-relaxed mb-8">
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
      <div className="relative z-10 pb-10">
        <div className="max-w-6xl mx-auto px-6 w-full flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
          <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} aria-hidden>
            ↓
          </motion.span>
          <span>Scroll to begin</span>
        </div>
      </div>
    </section>
  );
}

/* ─── 1. The problem — rebuilt five times ─────────────────────────────── */

function ProblemSection() {
  return (
    <Section id="problem" dark className="py-32">
      <ParticleField preset="ambient" opacity={0.12} className="absolute inset-0" />
      <div className="relative max-w-6xl mx-auto px-6">
        <Reveal>
          <Kicker dark>01 · The tell</Kicker>
          <h2 className="text-5xl md:text-6xl font-semibold tracking-tight leading-tight mb-4 max-w-3xl">
            I kept building the same five things.
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mb-16">
            Every app in the fleet needed a way to report bugs from inside it, a way to show it,
            a way to test it end-to-end, and a way for an agent to drive it. I wrote each one
            from scratch. Every time.
          </p>
        </Reveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-16">
          {[
            { v: 8, label: "domain MVPs in the fleet", sub: "each shipped with feedback baked in" },
            { v: 4, label: "times I built the MCP layer", sub: "before noticing it was one thing" },
            { v: 18, label: "skills in my skills dirs", sub: "12 in Claude Code · 6 in Codex" },
            { v: 3, label: "platforms for the feedback widget", sub: "web · React Native · Flutter" },
          ].map((s, i) => (
            <Reveal key={i} delay={0.1 + i * 0.08}>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 h-full flex flex-col gap-2 min-w-0">
                <div className="text-5xl md:text-6xl font-semibold tracking-tight leading-none" style={{ color: "var(--color-brand-1)" }}>
                  <FlipNumber value={s.v} />
                </div>
                <div className="text-sm font-semibold text-white">{s.label}</div>
                <div className="text-xs text-white/50 leading-snug">{s.sub}</div>
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

/* ─── 2. Feedback — pattern #1, running in the corner ─────────────────── */

function FeedbackSection() {
  return (
    <Section id="feedback" className="py-32">
      <div className="max-w-6xl mx-auto px-6">
        <Reveal>
          <Kicker>02 · Pattern one · running in the control pill</Kicker>
          <h2 className="text-5xl md:text-6xl font-semibold tracking-tight leading-tight mb-4 max-w-3xl">
            Feedback. <span className="text-foreground/40">File a bug against this page.</span>
          </h2>
          <p className="text-lg text-muted max-w-2xl mb-12">
            The feedback button in the pill at the bottom of your screen is the pattern. Hit it.
            Pick an element, annotate the screenshot, add a voice note if you want, submit — and a
            GitHub issue lands in the repo you&rsquo;re looking at, live.
          </p>
        </Reveal>

        <EditorialGrid className="mb-12">
          <EditorialCell span="lede">
            <Reveal>
              <div className="rounded-2xl border-2 border-border bg-surface p-8 h-full">
                <MessageSquareWarning className="w-8 h-8 mb-4" style={{ color: "var(--color-brand-2)" }} />
                <h3 className="text-2xl font-semibold mb-3">Close the loop from inside the app</h3>
                <p className="text-base text-muted leading-relaxed">
                  DevTools-style element selection, native screenshots, canvas annotation, voice
                  notes and screen recording — delivered as a GitHub or Linear issue with the
                  element path, viewport and console attached. The reporter never leaves the page.
                </p>
              </div>
            </Reveal>
          </EditorialCell>
          <EditorialCell span="aside">
            <Reveal delay={0.15}>
              <div className="rounded-2xl p-8 h-full text-white flex flex-col gap-4" style={{ background: "var(--color-brand-2)" }}>
                <div className="text-xs uppercase tracking-[0.25em] font-mono text-white/70">Ported to</div>
                {["Web · Next.js / React", "React Native · Expo", "Flutter"].map((p) => (
                  <div key={p} className="flex items-center gap-2 text-base font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> {p}
                  </div>
                ))}
                <div className="mt-auto text-xs text-white/70 font-mono">alibad/feedback-widget · public</div>
              </div>
            </Reveal>
          </EditorialCell>
        </EditorialGrid>

        <Callout>
          The best bug report is the one the user files without knowing they filed one. The
          moment you make them open a form somewhere else, you&rsquo;ve lost the bug.
        </Callout>

        <Reveal delay={0.4}>
          <div className="mt-12 rounded-2xl border-2 border-border bg-surface p-7 max-w-3xl">
            <div className="text-xs uppercase tracking-[0.25em] text-muted mb-3">Presentations · Openstage</div>
            <h3 className="text-2xl font-semibold mb-3">The presentation is part of the proof.</h3>
            <p className="text-base text-muted leading-relaxed">
              This page is Openstage: a presentation built as a running web app. It can carry the
              feedback control, live data and the hand-off into the real demo. That is the useful
              point; the demo still happens in the system itself.
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

/* ─── 3. Walkthrough — the artifact is the demo ──────────────────────── */

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
    <Section id="walkthrough" className="py-32">
      <div className="max-w-6xl mx-auto px-6 mb-12">
        <Reveal>
          <Kicker>03 · Living documentation</Kicker>
          <h2 className="text-5xl md:text-6xl font-semibold tracking-tight leading-tight mb-4 max-w-3xl">
            Walkthrough. <span className="text-foreground/40">Playwright drives it. You keep the proof.</span>
          </h2>
          <p className="text-lg text-muted max-w-2xl">
            Point it at any web app. It catalogs every feature, walks each one in desktop and
            mobile with video, walks every persona&rsquo;s journey, verifies recent fixes, and
            generates the admin dashboard. Twenty reference docs of hard-won rules, version 2.3.
          </p>
        </Reveal>
      </div>

      <StickyMedia
        mediaPosition="left"
        media={
          <div className="w-full h-full min-h-[420px] rounded-2xl border-2 border-border bg-bg-dark text-white p-8 flex flex-col justify-between overflow-hidden relative">
            <ParticleField preset="ambient" opacity={0.1} className="absolute inset-0" />
            <div className="relative">
              <div className="text-xs uppercase tracking-[0.25em] font-mono text-white/40 mb-3">Catalog</div>
              <div className="text-6xl md:text-7xl font-semibold tracking-tight leading-none" style={{ color: "var(--color-brand-1)" }}>
                {features === null ? "—" : <FlipNumber value={features} />}
              </div>
              <div className="text-sm text-white/60 mt-2">{caption}</div>
            </div>
            <div className="relative font-mono text-[11px] text-white/40 leading-relaxed">
              catalog → capture → personas → dashboard → verify
            </div>
          </div>
        }
      >
        {[
          { h: "It refuses to lie", b: "Three 'different' steps that hash identical are not documentation — the catalog rejects them. Frontend up with the backend down produces screenshots of empty states; the preflight blocks the run." },
          { h: "It never edits your app", b: "Read-only on application source. If a feature throws on render, it records the failure and files the issue — it does not stub the page to unblock itself." },
          { h: "The output is the demo", b: "MDX guides, a searchable catalog, per-feature videos, and an admin dashboard you can hand to a teammate or a customer." },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl border-2 border-border bg-surface p-7 mb-5">
            <h3 className="text-xl font-semibold mb-2">{s.h}</h3>
            <p className="text-sm text-muted leading-relaxed">{s.b}</p>
          </div>
        ))}
      </StickyMedia>

      <div className="max-w-6xl mx-auto px-6 mt-12">
        <Callout>
          A walkthrough that looks fine and is wrong is worse than no walkthrough, because it
          teaches the reader the wrong product. So it would rather refuse than ship.
        </Callout>
      </div>
    </Section>
  );
}

/* ─── 5. MCP — pattern #4, discovered and invoked live ────────────────── */

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
    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-6 md:p-8 font-mono text-sm">
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
    <Section id="mcp" dark className="py-32">
      <div className="max-w-6xl mx-auto px-6">
        <Reveal>
          <Kicker dark>04 · Console + MCP · operate, then expose</Kicker>
          <h2 className="text-5xl md:text-6xl font-semibold tracking-tight leading-tight mb-4 max-w-3xl">
            Console + MCP. <span className="text-white/40">One shows the system. One lets an agent drive it.</span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mb-12">
            Hangar is the local console for the AI services running across my machines: what is
            available, what fits in memory, what is running, and what every call did. MCP is the
            controlled surface that lets an agent discover and invoke actions instead of requiring
            a human to click every control.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-7">
              <div className="text-xs uppercase tracking-[0.25em] text-white/40 mb-3">Console · Hangar</div>
              <h3 className="text-2xl font-semibold mb-3">The operator sees the real machine.</h3>
              <p className="text-sm text-white/60 leading-relaxed">
                Services, models, memory budgets and call history live in one local control room.
                The console stays local because its start and stop controls are powerful.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-7">
              <div className="text-xs uppercase tracking-[0.25em] text-white/40 mb-3">MCP · controlled actions</div>
              <h3 className="text-2xl font-semibold mb-3">The agent gets a steering wheel.</h3>
              <p className="text-sm text-white/60 leading-relaxed">
                A good MCP surface exposes deliberate actions with useful descriptions and clear
                limits. The valuable half is writing to a system and reading the result back.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <McpPanel />
        </Reveal>

        <div className="mt-12">
          <Callout dark>
            The console is observability for the human. MCP is agency for the machine. Neither is
            safe unless the available actions match the authority you meant to grant.
          </Callout>
        </div>
      </div>
    </Section>
  );
}

/* ─── 6. The meta — the unit of reuse ─────────────────────────────────── */

function MetaSection() {
  return (
    <Section id="meta" className="py-32">
      <div className="max-w-6xl mx-auto px-6">
        <Reveal>
          <Kicker>05 · The move underneath all three</Kicker>
          <h2 className="text-5xl md:text-6xl font-semibold tracking-tight leading-tight mb-4 max-w-3xl">
            The unit of reuse isn&rsquo;t a library anymore.
          </h2>
          <p className="text-lg text-muted max-w-2xl mb-16">
            Every system here follows the same three-step move. A library gives you code; a Skill gives
            an agent the judgment to apply it — the rules, the pitfalls, the things that broke.
          </p>
        </Reveal>

        <div className="mb-16">
          <Spectrum
            axis={{ left: "a snippet you paste", right: "a product with a domain" }}
            items={[
              { label: "Library", position: 0.15 },
              { label: "Skill", position: 0.55, highlight: true },
              { label: "Pattern", position: 0.85 },
            ]}
            light
            scrub
          />
        </div>

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
          {[
            { Icon: Repeat, t: "Workflow", b: "Notice the thing you've done three times. The fourth is when it becomes visible." },
            { Icon: Package, t: "Skill", b: "Package it — not just the code, the rules and the scars. That's what an agent needs to run it unattended." },
            { Icon: Globe, t: "Domain", b: "Give it a name and a URL. A pattern nobody can point to is a pattern nobody reuses." },
          ].map(({ Icon, t, b }) => (
            <StaggerItem key={t}>
              <div className="rounded-2xl border-2 border-border bg-surface p-7 h-full flex flex-col gap-3">
                <Icon className="w-6 h-6" style={{ color: "var(--color-brand-2)" }} />
                <h3 className="text-2xl font-semibold">{t}</h3>
                <p className="text-sm text-muted leading-relaxed">{b}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>

        <Callout>
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
    <Section id="cta" dark className="min-h-screen flex items-center overflow-hidden">
      <MeshGradient speed="slow" intensity={0.14} colors={["#FBBF24", "#F59E0B", "#6476ce", "#31439b"]} className="absolute inset-0" />
      <div className="absolute inset-0" style={{ background: "rgba(11,15,31,0.6)" }} />
      <div className="relative max-w-5xl mx-auto px-6 w-full py-32">
        <Reveal>
          <Kicker dark>06 · Take them home</Kicker>
          <h2 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[0.98] mb-6 max-w-3xl">
            One take-home page. <span className="text-white/40">No QR scavenger hunt.</span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mb-12">
            Feedback + Openstage, Walkthroughs, and Console + MCP. The event deck has the only
            audience QR, and it points to one page with the live references and honest availability.
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <a
            href="https://www.humanquest.net/ai-patterns"
            target="_blank"
            rel="noopener noreferrer"
            className="chunky-brand inline-flex items-center gap-2 px-6 py-3 text-base font-semibold mb-16"
          >
            humanquest.net/ai-patterns <ArrowRight className="w-4 h-4" />
          </a>
        </Reveal>

        <Reveal delay={0.4}>
          <p style={{ fontFamily: "var(--font-marker)" }} className="text-3xl md:text-4xl text-center">
            <span style={{ color: "var(--color-brand-1)" }}>{TAGLINE}</span>
          </p>
        </Reveal>
      </div>
    </Section>
  );
}

/* ─── Narration ───────────────────────────────────────────────────────── */

const NARRATION_SECTIONS: NarrationSection[] = [
  { sectionId: "hero", label: "The pattern", text: "Three systems I kept rebuilding until the repeated work became visible: capture the problem, prove what happened, and give the agent a controlled way to act." },
  { sectionId: "problem", label: "Rebuilt five times", text: "Eight domain MVPs in the fleet. Four separate times I built the MCP layer before noticing it was one thing. Eighteen skills across two skills directories. The fourth time you build something isn't a productivity failure — it's the first time the pattern is visible enough to name." },
  { sectionId: "feedback", label: "Feedback + Openstage", text: "First: Feedback. File a report from the running page and inspect the issue it creates. The presentation carrying the demo is Openstage — a web app that can hold live controls and then get out of the way when the real demo starts." },
  { sectionId: "walkthrough", label: "Walkthroughs", text: "Second: Walkthroughs drives a real web app and keeps the evidence — catalog, desktop and mobile captures, video, journeys and findings. It refuses to ship a misleading walkthrough: byte-identical screenshots get rejected, and a dead backend blocks the run." },
  { sectionId: "mcp", label: "Console + MCP", text: "Third: Console plus MCP. Hangar shows the real services, models, memory budgets and calls across local machines. MCP exposes deliberate actions so an agent can drive a system and then read the result back." },
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
