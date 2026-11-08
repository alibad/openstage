"use client";

/*
 * "Can an AI play our game?" — the AI Tinkerers Doha Round 5 talk (Monday 16 Nov 2026, 15 minutes), as a scroll story.
 *
 * The storyline, one claim per chapter:
 *   hero       Four brains, the same sixteen games.
 *   cold open  The first win over Brutal, scrubbed by scroll: the reader's scroll is the game clock.
 *   loop       How a brain plays: only the brain changes (the diagram builds as you scroll).
 *   code       The brain is one argument (four panels, pinned and scrolled sideways).
 *   match-up   Plain rules won 9; the best model won 2 (the board fills in as you scroll).
 *   why        The models obeyed "Economy first"; a better prompt fixed the opening, not the hard games.
 *   rules      Our rules aren't clever: they were tested, one switch at a time.
 *   help       Where a model does help: what a player says.
 *   who        Who wrote the rules: every commit co-authored by Claude.
 *   cta        Take it home.
 *
 * Every number comes from ./data/can-an-ai-play.json: real games in the RTS AI Arena, the voice-order bench and the
 * git history of the rules, exported by tools/to-openstage.mjs from the talk folder
 * (D:\Generated\RTSAI\talk-brains-match-up-20261104 on the owner's PC). Change the data there and export again.
 * The imagery is the game's own replay footage, not generated art: the talk is about what really happened.
 */

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { motion, useMotionValueEvent } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  Reveal,
  StaggerChildren,
  StaggerItem,
  ScrollProgress,
  Spectrum,
  HorizontalPin,
  VisualStage,
  ScrollRevealText,
  Marquee,
  useSectionProgress,
} from "@/components/animations";
import { AnimatedTimeline, BeforeAfter } from "@/components/charts";
import { ChapterNav } from "@/components/chapter-nav";
import { DeckControls } from "@/components/deck-controls";
import { PresentationTimer } from "@/components/presentation-timer";
import { usePrintMode } from "@/lib/print-mode";
import data from "./data/can-an-ai-play.json";

const WIN = "#0ca30c";
const DRAW = "#5d5c57";
const LOSS = "#d03b3b";
const OURS = "#F2C14E";
const OURS_INK = "#A15C07"; // our colour as text on the light sections
const GREY = "#8f8e88";
const LIGHT = "#c3c2b7";
const MEDIA = "/talks/can-an-ai-play";
const TAGLINE = "Read · Switch · Play · Keep · Repeat";

const CHAPTERS = [
  { id: "hero", label: "The question", dark: true },
  { id: "cold-open", label: "The first win", dark: true },
  { id: "loop", label: "How a brain plays", dark: false },
  { id: "code", label: "The code", dark: true },
  { id: "match-up", label: "Sixteen games", dark: false },
  { id: "why", label: "Why the models lost", dark: true },
  { id: "rules", label: "How the rules got good", dark: false },
  { id: "help", label: "Where models help", dark: true },
  { id: "who", label: "Who wrote the rules", dark: true },
  { id: "cta", label: "Take it home", dark: true },
] as const;

// The 15-minute slot, per chapter (the talk folder's notes.js budgets, spread over the chapters).
const BUDGET = [
  { id: "hero", label: "Open", minutes: 0.25 },
  { id: "cold-open", label: "Cold open", minutes: 1 },
  { id: "loop", label: "Loop", minutes: 1.25 },
  { id: "code", label: "Code", minutes: 2.25 },
  { id: "match-up", label: "Match-up", minutes: 1.5 },
  { id: "why", label: "Why", minutes: 2.75 },
  { id: "rules", label: "Rules", minutes: 2.5 },
  { id: "help", label: "Help", minutes: 1.25 },
  { id: "who", label: "Who", minutes: 0.75 },
  { id: "cta", label: "Close", minutes: 0.25 },
];

const LEVELS: Record<string, string> = { normal: "Normal", rush: "Rush", hard: "Hard", brutal: "Brutal" };
const LEVEL_HINT: Record<string, string> = { normal: "the standard AI", rush: "attacks early", hard: "Rush + 5,000 credits", brutal: "Rush + 15,000 credits" };
const GLYPH: Record<string, string> = { win: "✓", draw: "–", loss: "✕", stopped: "·" };
const WORD: Record<string, string> = { win: "won", loss: "lost", draw: "draw", stopped: "stopped by hand" };
const FACTION: Record<number, string> = { 1000: "China", 1001: "Iran", 1002: "Turkey", 1003: "Saudi" };

const num = (n: number) => n.toLocaleString("en");
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const clock = (min: number) => mmss(Math.round(min * 60));
const clockT = (tick: number) => mmss(Math.floor(tick / 25));
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const pct = (p: number) => (p >= 0.995 && p < 1 ? `${(p * 100).toFixed(1)} %` : p > 0 && p < 0.01 ? "<1 %" : `${Math.round(p * 100)} %`);
const ms = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)} s` : `${v} ms`);

const R = data.results;
const W = data.why;
const T = data.turn;
const P = data.prompt;
const RL = data.rules;
const H = data.help;
const O = data.open;
const CODE = data.code;
const lineOf = (k: keyof typeof CODE) => {
  const v = CODE[k];
  return typeof v === "object" && v && "line" in v ? v.line : "?";
};
const jev = T.brains.find((b) => b.provider !== "scripted")!;
const oursTurn = T.brains.find((b) => b.provider === "scripted")!;

/* ─── Shared pieces ─────────────────────────────────────────────────────── */

// Dark chapters scope the deck's dark tokens (text-muted, border-border, bg-surface follow); w-full is load-bearing.
function Section({ id, dark, className = "", children }: { id?: string; dark?: boolean; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={`relative ${dark ? "slide-dark bg-background" : "bg-bg-light"} text-foreground ${className}`}>
      {dark && <div className="noise-overlay pointer-events-none absolute inset-0" />}
      <div className="relative z-10 w-full">{children}</div>
    </section>
  );
}

// `narrow` keeps the boards clear of the chapter dots on the right edge.
function Wrap({ children, className = "", narrow = false }: { children: ReactNode; className?: string; narrow?: boolean }) {
  return <div className={`mx-auto w-full ${narrow ? "max-w-6xl" : "max-w-7xl"} px-6 md:px-10 ${className}`}>{children}</div>;
}

function ChapterHead({ n, label, title, italic, lede, dark }: { n: string; label: string; title: ReactNode; italic?: ReactNode; lede?: ReactNode; dark?: boolean }) {
  return (
    <Reveal>
      <div className="mb-6 flex items-center gap-4 font-mono text-xs uppercase tracking-[0.28em] text-muted">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground">{n}</span>
        <span>{label}</span>
      </div>
      <h2 className="max-w-5xl text-5xl font-semibold leading-[0.95] tracking-[-0.04em] md:text-7xl">
        {title}
        {italic && (<><br /><span className="editorial-italic font-normal" style={{ color: dark ? OURS : OURS_INK }}>{italic}</span></>)}
      </h2>
      {lede && <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted md:text-2xl">{lede}</p>}
    </Reveal>
  );
}

// Each chapter ends on one claim: something new, not a summary.
function Claim({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <Reveal delay={0.15}>
      <blockquote className="max-w-4xl rounded-2xl border-l-4 bg-surface/60 px-7 py-6" style={{ borderLeftColor: dark ? OURS : OURS_INK }}>
        <p className="text-2xl font-semibold leading-snug tracking-[-0.01em] md:text-3xl">{children}</p>
      </blockquote>
    </Reveal>
  );
}

function Evidence({ children }: { children: ReactNode }) {
  return <p className="mt-4 max-w-5xl text-sm leading-relaxed text-muted">{children}</p>;
}

// The code on screen is the real code, cut with "…"; a few colours, nothing more.
const TOKENS = /(\/\/.*$)|("(?:[^"\\]|\\.)*")(?=\s*:)|("(?:[^"\\]|\\.)*")|\b(export|async|function|const|return|if|true|false)\b|(\b\d+(?:\.\d+)?\b)/g;
const TOKEN_COLOR = [GREY, LIGHT, "#d8b37a", "#9fb7d6", OURS];
function Code({ src, marks = [], size = 16, where }: { src: string; marks?: number[]; size?: number; where?: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-code-bg">
      {where && <div className="border-b border-white/10 px-5 py-2.5 font-mono text-xs text-white/50">{where}</div>}
      <pre className="overflow-x-auto py-4 font-mono text-[#f0efec]" style={{ fontSize: size, lineHeight: 1.55 }}>
        {src.split("\n").map((line, i) => {
          const parts: ReactNode[] = [];
          let at = 0;
          for (const m of line.matchAll(TOKENS)) {
            const kind = [1, 2, 3, 4, 5].findIndex((g) => m[g] !== undefined);
            parts.push(line.slice(at, m.index), <span key={m.index} style={{ color: TOKEN_COLOR[kind] }}>{m[0]}</span>);
            at = (m.index ?? 0) + m[0].length;
          }
          parts.push(line.slice(at));
          const hl = marks.includes(i);
          return (
            <span key={i} className="block whitespace-pre px-5" style={{ borderLeft: `4px solid ${hl ? OURS : "transparent"}`, background: hl ? "rgba(242,193,78,.13)" : undefined }}>
              {line ? parts : " "}
            </span>
          );
        })}
      </pre>
    </div>
  );
}

type Cell = { seed: number; result: string; minutes: number } | null;

function Tile({ g, size, ring = false, tip }: { g: Cell; size: number; ring?: boolean; tip?: string }) {
  const base: CSSProperties = { width: size, height: size, fontSize: size * 0.5, outline: `3px solid ${ring ? OURS : "transparent"}`, outlineOffset: 2, transition: "outline-color .4s, opacity .4s" };
  if (!g) return <span className="inline-block shrink-0" style={base} />;
  const stopped = g.result === "stopped";
  const bg = g.result === "win" ? WIN : g.result === "loss" ? LOSS : g.result === "draw" ? DRAW : "transparent";
  return (
    <span title={tip} className="inline-grid shrink-0 place-items-center rounded-md font-bold leading-none" style={{ ...base, background: bg, color: stopped ? GREY : "#fff", border: stopped ? `2px dashed ${GREY}` : undefined }}>
      {GLYPH[g.result] ?? "?"}
    </span>
  );
}

function Legend({ stopped = false }: { stopped?: boolean }) {
  const items: [string, string][] = [["win", "won"], ["draw", "draw after 40 minutes"], ["loss", "lost"], ...(stopped ? [["stopped", "stopped by hand"] as [string, string]] : [])];
  return (
    <div className="flex flex-wrap items-center gap-6 text-sm text-muted">
      {items.map(([r, t]) => <span key={t} className="flex items-center gap-2"><Tile g={{ seed: 0, result: r, minutes: 0 }} size={20} />{t}</span>)}
    </div>
  );
}

type BoardRow = { key: string; label: ReactNode; sub?: ReactNode; games: Cell[][]; total: number; of: string; accent?: boolean };

// One row per brain; per opponent, one tile per start; the wins on the right. Rows past `shown` wait, faded out.
function Board({ rows, seeds, shown, ringed, tile, label, dark }: { rows: BoardRow[]; seeds: number[]; shown: number; ringed?: Set<string>; tile: number; label: number; dark?: boolean }) {
  const opponents = RL.opponents;
  return (
    <div className="grid items-center gap-x-5" style={{ gridTemplateColumns: `${label}px repeat(${opponents.length}, auto) 72px` }}>
      <div />
      {opponents.map((o) => <div key={o} className="pb-2 text-sm font-semibold text-muted">vs {LEVELS[o]}</div>)}
      <div className="pb-2 text-right text-sm font-semibold text-muted">won</div>
      {rows.flatMap((r, ri) => {
        const cls = `border-t border-border py-2.5 transition-all duration-500 ${ri >= shown ? "opacity-0 translate-y-2" : ""}`;
        return [
          <div key={`${r.key}-l`} className={cls}>
            <b className="block text-xl leading-tight" style={r.accent ? { color: dark ? OURS : OURS_INK } : undefined}>{r.label}</b>
            {r.sub && <span className="block text-sm leading-snug text-muted">{r.sub}</span>}
          </div>,
          ...r.games.map((list, oi) => (
            <div key={`${r.key}-${oi}`} className={`${cls} flex gap-1.5`}>
              {list.map((g, si) => (
                <Tile key={si} g={g} size={tile} ring={ringed?.has(`${r.key}|${opponents[oi]}|${seeds[si]}`)}
                  tip={g ? `${LEVELS[opponents[oi]]} (${LEVEL_HINT[opponents[oi]]}), start ${seeds[si] - 999} as ${FACTION[seeds[si]]}: ${WORD[g.result]} at ${clock(g.minutes)}` : undefined} />
              ))}
            </div>
          )),
          <div key={`${r.key}-t`} className={`${cls} text-right`}>
            <b className="block text-4xl font-bold leading-none">{r.total}</b>
            <span className="text-xs text-muted">{r.of}</span>
          </div>,
        ];
      })}
    </div>
  );
}

// A section that pins its content for `runway` of scroll and turns the scroll into a whole-number step.
function useSteps(steps: number) {
  const { ref, progress, print } = useSectionProgress(["start start", "end end"]);
  const [step, setStep] = useState(0);
  useMotionValueEvent(progress, "change", (v) => setStep(Math.min(steps, Math.floor(v * (steps + 0.6)))));
  return { ref, progress, print, step: print ? steps : step };
}

function Pinned({ innerRef, runway, print, className = "", children }: { innerRef: React.RefObject<HTMLDivElement | null>; runway: string; print: boolean; className?: string; children: ReactNode }) {
  return (
    <div ref={innerRef} className={`relative ${className}`} style={{ height: print ? "auto" : runway }}>
      <div data-pinned className={print ? "py-24" : "sticky top-0 flex h-screen flex-col justify-center overflow-hidden"}>{children}</div>
    </div>
  );
}

/* ─── 0 · The question ──────────────────────────────────────────────────── */

function HeroSection() {
  const marks = [["01", "The first win"], ["04", "Sixteen games"], ["06", "One switch at a time"], ["08", "Who wrote the rules"]];
  return (
    <section id="hero" className="slide-dark relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <video src={`${MEDIA}/four-brains.mp4`} poster={`${MEDIA}/four-brains.jpg`} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(18,9,7,.7) 0%, rgba(18,9,7,.45) 45%, rgba(18,9,7,.97) 100%)" }} />
      <div className="relative z-10 border-b border-white/10">
        <Wrap className="flex items-center justify-between py-5 font-mono text-xs uppercase tracking-[0.3em] text-white/55">
          <span>AI Tinkerers · Doha · Round 5</span>
          <span className="hidden sm:inline">16 Nov 2026</span>
        </Wrap>
      </div>
      <div className="relative z-10 flex flex-1 items-center">
        <Wrap>
          <Reveal>
            <div className="mb-6 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.28em] text-white/60">
              <span className="h-2 w-2 rounded-full" style={{ background: OURS, boxShadow: `0 0 18px ${OURS}` }} />
              Four brains · the same sixteen games
            </div>
            <h1 className="mb-8 text-6xl font-semibold leading-[0.88] tracking-[-0.06em] md:text-8xl lg:text-[8.5rem]">
              Can an AI play
              <br />
              our game?
            </h1>
            <p className="mb-8 max-w-2xl text-xl leading-relaxed text-white/75 md:text-2xl">
              We built a real-time strategy game with coding agents. Then we gave its seat to three AI models and a page of plain
              rules. Every game here was really played, and every number comes from its log.
            </p>
            <div className="font-mono text-sm uppercase tracking-[0.25em] text-white/60">{TAGLINE}</div>
          </Reveal>
        </Wrap>
      </div>
      <div className="relative z-10 pb-8">
        <Wrap>
          <div className="grid grid-cols-2 gap-4 border-t border-white/12 pt-5 md:grid-cols-4">
            {marks.map(([n, label]) => (
              <div key={n} className="flex items-center gap-3"><span className="font-mono text-xs" style={{ color: OURS }}>{n}</span><span className="truncate text-xs uppercase tracking-[0.18em] text-white/60">{label}</span></div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-white/45">
            <motion.span animate={{ y: [0, 5, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} aria-hidden>↓</motion.span>
            <span>Scroll to begin</span>
          </div>
        </Wrap>
      </div>
    </section>
  );
}

/* ─── 1 · The first win: the reader's scroll is the game clock ──────────── */

// One caption at a time over the film, chosen in the same scroll handler that moves the film. (Not useTransform:
// framer-motion hands those to the browser's scroll timeline, which didn't follow this pinned section.)
function Caption({ on, kicker, children }: { on: boolean; kicker: string; children: ReactNode }) {
  return (
    <div className="absolute bottom-28 left-6 max-w-xl rounded-2xl bg-black/70 p-6 backdrop-blur-sm transition-all duration-500 md:left-12"
      style={{ opacity: on ? 1 : 0, transform: `translateY(${on ? 0 : 16}px)` }} aria-hidden={!on}>
      <div className="mb-2 font-mono text-xs uppercase tracking-[0.25em]" style={{ color: OURS }}>{kicker}</div>
      <p className="text-2xl font-semibold leading-snug text-white md:text-3xl">{children}</p>
    </div>
  );
}

// Plain bars, sized for a projector: bold label, the bar, the value in large type.
function Bars({ items, max, dark }: { items: { label: string; value: number; display: string; caption?: string; ours?: boolean }[]; max: number; dark?: boolean }) {
  return (
    <div className="grid gap-1">
      {items.map((it) => (
        <div key={it.label} className="grid min-h-[52px] grid-cols-[minmax(150px,220px)_1fr] items-center gap-4">
          <div>
            <b className="block text-lg leading-tight" style={it.ours ? { color: dark ? OURS : OURS_INK } : undefined}>{it.label}</b>
            {it.caption && <span className="block text-sm leading-snug text-muted">{it.caption}</span>}
          </div>
          <div className="relative h-8">
            <div className="absolute left-0 top-0 h-8 rounded-r" style={{ width: `${Math.max(0.6, Math.min(100, (100 * it.value) / max)) * 0.62}%`, background: it.ours ? OURS : GREY }} />
            <span className="absolute top-0 whitespace-nowrap text-xl font-bold leading-8" style={{ left: `calc(${Math.max(0.6, Math.min(100, (100 * it.value) / max)) * 0.62}% + 12px)` }}>{it.display}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ColdOpenSection() {
  const { ref, progress, print } = useSectionProgress(["start start", "end end"]);
  const video = useRef<HTMLVideoElement>(null);
  const raf = useRef(0);
  const [caption, setCaption] = useState(0);
  useMotionValueEvent(progress, "change", (v) => {
    setCaption(v < 0.25 ? 0 : v < 0.53 ? 1 : v < 0.86 ? 2 : 3);
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const el = video.current;
      if (el && el.duration && isFinite(el.duration)) el.currentTime = Math.min(el.duration - 0.04, v * el.duration);
    });
  });
  const g = O.game;
  const stats: [string, string][] = [
    [mmss(g.gameSeconds), "game time to win"],
    [num(g.theyLost), `what Brutal lost, in credits; we lost ${num(g.weLost)}`],
    [String(g.buildingsDestroyed), `enemy buildings destroyed; we lost ${g.ourBuildingsLost || "none"}`],
    [`${O.brutalBefore.won} of ${O.brutalBefore.finished}`, "Brutal games won before this one, by any brain"],
  ];
  return (
    <div id="cold-open">
      {print ? (
        <Section dark className="py-16"><Wrap>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${MEDIA}/frame-final-attack.jpg`} alt="The final attack on the enemy base, from the game's replay" className="w-full rounded-2xl" />
        </Wrap></Section>
      ) : (
        <div ref={ref} className="relative bg-black text-white" style={{ height: "420vh" }}>
          <div className="sticky top-0 h-screen w-full overflow-hidden">
            <video ref={video} src={`${MEDIA}/cold-open-scrub.mp4`} poster={`${MEDIA}/cold-open-start.jpg`} muted playsInline preload="auto" className="absolute inset-0 h-full w-full object-contain" />
            <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 45%)" }} />
            <Caption on={caption === 0} kicker={`${day(g.finishedAt)} · our AI Arena`}>
              Our side plays {cap(g.ours)}. The enemy is Brutal, the game’s hardest AI: it attacks early, with 15,000 extra credits.
            </Caption>
            <Caption on={caption === 1} kicker="Before this game">
              {O.brutalBefore.finished} games against Brutal. Not one won, by any brain.
            </Caption>
            <Caption on={caption === 2} kicker="Your scroll is the clock">
              Eighteen minutes of play: the army builds, pushes out, and finds the enemy base.
            </Caption>
            <Caption on={caption === 3} kicker={`${mmss(g.gameSeconds)} of play`}>
              Won. The first time our side ever beat Brutal.
            </Caption>
            <motion.div className="absolute bottom-0 left-0 h-1 w-full origin-left" style={{ scaleX: progress, background: OURS }} />
          </div>
        </div>
      )}
      <Section dark className="py-24 md:py-32">
        <Wrap>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map(([b, t], i) => (
              <Reveal key={t} delay={i * 0.08}>
                <div className="border-t-4 border-border pt-5">
                  <b className="block text-5xl font-bold leading-none tracking-[-0.03em] md:text-6xl">{b}</b>
                  <span className="mt-3 block text-base leading-snug text-muted">{t}</span>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-16"><Claim dark>The first win over Brutal didn’t come from the smartest brain we had. Hold that thought.</Claim></div>
          <Evidence>
            Arena game {g.id} · map {g.map}, start {g.seed - 999} ({cap(g.ours)} against {cap(g.theirs)}), speed {g.speed}: {mmss(g.gameSeconds)} of play in {mmss(g.wallSeconds)}.
            The film is the game’s own replay.
          </Evidence>
        </Wrap>
      </Section>
    </div>
  );
}

/* ─── 2 · How a brain plays: the diagram builds as you scroll ──────────── */

const NODES: { t: string; d?: string[]; e?: string[]; chips?: boolean; c: string }[] = [
  { t: "The live game", d: ["The same page and data", "as rtsai.net/play,", "against the game’s", "own AI"], c: "window.game" },
  { t: "What a player sees", d: ["Our side only: the fog", "of war hides the rest"], e: ["credits, buildings,", "units, enemies in sight"], c: "adviserObserve()" },
  { t: "Closed questions", d: ["Only what is possible", "now, plus Wait"], e: ["“Which building", "should we start next?”"], c: "plan()" },
  { t: "A brain picks", chips: true, c: "decide()" },
  { t: "Player orders", d: ["The orders a click", "sends; the replay", "plays them back"], e: ["action: \"build\"", "item_type: \"gapile\""], c: "adviserExecute()" },
];
const NODE_STEP = [0, 0, 1, 2, 3];

function LoopSection() {
  const { ref, print, step } = useSteps(4);
  const NW = 312, NG = 58, NY = 20, NH = 400;
  const nx = (i: number) => i * (NW + NG);
  const luna = R.brains.find((b) => b.provider === "openai");
  const facts: [string, string][] = [
    ["The game pauses while a model thinks", "so a slow answer never loses on speed"],
    ["No answer? Our rules play that turn", `flagged in the log: Luna, ${luna?.fallbacks} of ${num(luna?.turns ?? 0)} turns`],
    ["Every turn is written down", "question, probabilities, orders sent"],
  ];
  return (
    <section id="loop" className="relative bg-bg-light text-foreground">
      <Pinned innerRef={ref} runway="320vh" print={print}>
        <Wrap>
          <div className="mb-6 flex items-center gap-4 font-mono text-xs uppercase tracking-[0.28em] text-muted">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground">02</span>
            <span>How a brain plays</span>
          </div>
          <h2 className="max-w-5xl text-4xl font-semibold leading-[0.95] tracking-[-0.04em] md:text-6xl">
            One loop for every brain. <span className="editorial-italic font-normal" style={{ color: OURS_INK }}>Only the brain changes.</span>
          </h2>
          <svg viewBox="0 0 1792 560" className="mt-10 h-auto w-full overflow-visible" role="img" aria-label="The live game, then what a player sees, then closed questions, then a brain picks, then player orders go back into the game.">
            <defs>
              <marker id="loop-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={GREY} /></marker>
            </defs>
            {NODES.map((n, i) => {
              const X = nx(i);
              return (
                <g key={n.t} style={{ opacity: NODE_STEP[i] <= step ? 1 : 0.08, transition: "opacity .5s" }}>
                  {i > 0 && <line x1={nx(i - 1) + NW + 8} y1={NY + NH / 2} x2={X - 12} y2={NY + NH / 2} stroke={GREY} strokeWidth={3} markerEnd="url(#loop-head)" />}
                  <rect x={X} y={NY} width={NW} height={NH} rx={16} fill="#ffffff" stroke={n.chips ? OURS : "#e5e0d8"} strokeWidth={n.chips ? 3 : 2} />
                  <text x={X + 24} y={NY + 62} fontSize={34} fontWeight={700} fill="#1F2937">{n.t}</text>
                  {n.d?.map((l, j) => <text key={j} x={X + 24} y={NY + 112 + j * 34} fontSize={27} fill="#4B5563">{l}</text>)}
                  {n.e?.map((l, j) => (
                    <text key={j} x={X + 24} y={NY + 240 + j * 34} fontSize={n.c === "adviserExecute()" ? 24 : 27} fill={n.c === "adviserExecute()" ? OURS_INK : "#1F2937"} fontFamily={n.c === "adviserExecute()" ? "var(--font-mono)" : undefined}>{l}</text>
                  ))}
                  {n.chips && R.brains.map((b, j) => (
                    <g key={b.name}>
                      <rect x={X + 20} y={NY + 90 + j * 64} width={NW - 40} height={52} rx={10} fill={b.provider === "scripted" ? "#FDF3DC" : "#F6F2EC"} stroke={b.provider === "scripted" ? OURS : "#e5e0d8"} strokeWidth={2} />
                      <text x={X + 40} y={NY + 125 + j * 64} fontSize={29} fontWeight={600} fill="#1F2937">{b.name}</text>
                    </g>
                  ))}
                  <text x={X + 24} y={NY + NH - 28} fontSize={25} fill={OURS_INK} fontFamily="var(--font-mono)">{n.c}</text>
                  {i === NODES.length - 1 && (
                    <>
                      <path d={`M ${X + NW / 2} ${NY + NH} V ${NY + NH + 50} H ${NW / 2} V ${NY + NH + 12}`} fill="none" stroke={GREY} strokeWidth={3} markerEnd="url(#loop-head)" />
                      <text x={896} y={NY + NH + 100} textAnchor="middle" fontSize={30} fill="#4B5563">Every 2 game seconds: what to build next. Every 5: what the army does.</text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
          <div className="mt-8 grid grid-cols-1 gap-6 transition-opacity duration-500 md:grid-cols-3" style={{ opacity: step >= 4 ? 1 : 0 }}>
            {facts.map(([b, t]) => (
              <div key={b} className="border-t-2 border-border pt-3 text-base text-muted"><b className="mb-1 block text-lg text-foreground">{b}</b>{t}</div>
            ))}
          </div>
        </Wrap>
      </Pinned>
      <Section className="pb-28">
        <Wrap><Claim>The brain is the only thing that changes. The game, the questions and the log are the same for all four, so the games differ only in the choices made.</Claim></Wrap>
      </Section>
    </section>
  );
}

/* ─── 3 · The code: four panels, pinned and scrolled sideways ──────────── */

const CALLS: Record<string, [string, string]> = {
  jev: ["POST /v1/systemone", "typesafe/jev-1.13, through OpenRouter"],
  openai: ["POST /v1/decisions", "gpt-6-luna, one choice question each"],
  local: ["POST /v1/chat/completions", "Ollama on our own GPU; the answer must be one of the options"],
  scripted: ["scriptedAnswers()", "plain code in the same process, no network"],
};

const RUBRIC = "You command one side in a real-time strategy match (Red Alert 2 style) against a computer opponent. "
  + "Win by destroying every enemy building. Economy first (power, refineries, harvesters), then production, then a large "
  + "army that attacks together. Defend when the enemy is at the base. Never leave credits unspent for long. "
  + "Answer each question for the state given.";

function Panel({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <div className="flex h-full w-full flex-col justify-center">
      <div className="mb-3 font-mono text-xs uppercase tracking-[0.25em]" style={{ color: OURS }}>{n}</div>
      <h3 className="mb-6 text-3xl font-semibold tracking-[-0.02em] md:text-4xl">{title}</h3>
      {children}
    </div>
  );
}

function CodeSection() {
  const r = oursTurn.record, q = r.questions[0], J = JSON.stringify;
  const log = [
    "{", `  "tick": ${r.tick},`, `  "auto": ${J(r.auto)},`, '  "questions": [{',
    `    "name": ${J(q.name)},`, `    "instructions": ${J(q.instructions)},`, `    "choice": ${J(q.choice)},`, '    "options": [',
    ...q.options.map((o, i) => `      { "value": ${J(o.value)}, "label": ${J(o.label)}, "p": ${o.p} }${i < q.options.length - 1 ? "," : ""}`),
    "    ],", `    "accepted": ${q.accepted}`, "  }],",
    `  "ms": ${r.ms}, "usd": ${r.usd}, "inputTokens": ${r.inputTokens}, "fallback": ${r.fallback}`, "}",
  ].join("\n");
  return (
    <Section id="code" dark className="pt-28 md:pt-36">
      <Wrap><ChapterHead n="03" label="The code" title="The brain is one argument." italic="Everything else is the same." dark
        lede={<>RTSAI-WebGame, commit <code className="font-mono text-base">{CODE.commit}</code>. Scroll on: the panels move sideways.</>} /></Wrap>
      <HorizontalPin gap="3rem" panelWidth="min(1080px, 88vw)" className="mt-6">
        <Panel n="1 · providers.mjs" title="One function decides who plays">
          <Code size={17} marks={[6, 7]} where={`tools/arena/providers.mjs:${lineOf("decide")}`} src={`export async function decide(provider, obs, questions, credential = {}, opts = {}) {
  if (provider === "scripted") {
    …
    return { answers: scriptedAnswers(obs, questions, opts), …, usd: 0 };
  }
  // Otherwise a model reads the prompt (the rubric by default) and the battlefield.
  return askQuestions(provider,
    { text: PROMPTS[opts.prompt] ?? RUBRIC, json: describe(obs) }, questions, credential);
}`} />
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {R.brains.map((b) => (
              <div key={b.name} className="rounded-xl border bg-surface p-4" style={{ borderColor: b.provider === "scripted" ? OURS : "var(--color-border)" }}>
                <b className="block text-lg">{b.name}</b>
                <code className="mt-1 block font-mono text-xs" style={{ color: OURS }}>{CALLS[b.provider][0]}</code>
                <span className="text-sm text-muted">{CALLS[b.provider][1]}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel n={`2 · brain.mjs:${lineOf("rubric")}`} title="What a model reads, every turn">
          <blockquote className="border-l-4 pl-6 text-xl leading-relaxed text-foreground/90 md:text-2xl" style={{ borderLeftColor: OURS }}>{RUBRIC}</blockquote>
          <div className="mt-6 flex flex-wrap gap-2">
            {["time", "credits", "power", "harvesters", "buildings", "army", "producing", "enemySeen", "threat", "mapExplored"].map((k) => (
              <span key={k} className="rounded-md border border-border bg-surface px-3 py-1 font-mono text-sm">{k}</span>
            ))}
          </div>
          <p className="mt-6 text-2xl font-semibold">“{oursTurn.instructions}”</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {oursTurn.options.map((o) => <span key={o.value} className="rounded-md border border-border bg-surface px-3 py-1 text-base">{o.label}</span>)}
          </div>
          <p className="mt-4 text-base text-muted">The rubric, word for word; the battlefield as JSON; the question with its options. Our rules read the game’s state directly.</p>
        </Panel>
        <Panel n={`3 · brain.mjs:${lineOf("need")}`} title="Our rules: a page of scores">
          <Code size={17} where={`tools/arena/brain.mjs:${lineOf("need")} and :${lineOf("softmax")}, inside scriptedAnswers()`} src={`const need = {
  power: spare < 10 ? 6 : spare < 60 && obs.cash > 1500 ? 1.5 : -1,
  refinery: !has("refinery") ? 6 : refineries < 2 && minutes > 2 && expand ? 3.5 : …,
  barracks: !has("barracks") && !queued("barracks") ? 4.5 : -1,
  factory: !has("factory") && has("refinery") ? 5 : -1,
  radar: !has("radar") && has("factory") ? 3 : -1, …
};
…
// Scores become probabilities (softmax), so our rules answer exactly like a model.
const max = Math.max(...scores), exp = scores.map((s) => Math.exp((s - max) * 1.5)), …;`} />
          <p className="mt-5 text-xl text-muted">What each building is worth right now; the best score wins. <b className="text-foreground">About 75 lines like these. No model, no training.</b></p>
        </Panel>
        <Panel n="4 · the decision log" title="One turn, as the log keeps it">
          <Code size={14} marks={[8 + q.options.findIndex((o) => o.value === q.choice)]} where={`decisions/${oursTurn.game}.json · ${oursTurn.name}, ${LEVELS[T.opponent]}, start ${T.seed - 999}, ${clockT(r.tick)}`} src={log} />
          <p className="mt-4 text-lg text-muted">Every turn of all 64 games is kept like this, beside the game’s replay.</p>
        </Panel>
      </HorizontalPin>
      <Wrap className="pb-28 pt-10"><Claim dark>Our rules answer exactly like a model: a choice and a probability for every option. That is what makes the race fair.</Claim></Wrap>
    </Section>
  );
}

/* ─── 4 · Sixteen games: the board fills in as you scroll ───────────────── */

const cost = (b: (typeof R.brains)[number]) => (b.provider === "scripted" || b.provider === "local" ? "free" : `$${b.usd.toFixed(2)}`);
const speed = (b: (typeof R.brains)[number]) => (b.msPerTurn < 10 ? "under 0.01 s a turn" : `${(b.msPerTurn / 1000).toFixed(1)} s a turn`);

function MatchUpSection() {
  const { ref, print, step } = useSteps(R.brains.length + 1);
  const rows: BoardRow[] = R.brains.map((b) => ({
    key: b.provider, label: b.name, sub: <>{b.what} · {cost(b)} · {speed(b)}</>, accent: b.provider === "scripted",
    games: b.games.map((list) => R.seeds.map((s) => list.find((g) => g.seed === s) ?? null)), total: b.wins, of: `of ${b.played}`,
  }));
  const page = R.brains.find((b) => b.page)?.page;
  const fallbacks = R.brains.filter((b) => b.provider !== "scripted" && b.fallbacks).map((b) => `${b.name} ${b.fallbacks} of ${num(b.turns)}`);
  return (
    <section id="match-up" className="relative bg-bg-light text-foreground">
      <VisualStage src={`${MEDIA}/frame-four-brains.jpg`} alt="Four replays side by side: TypeSafe Jev, OpenAI Luna, Gemma 4 31B and our rules, the same Brutal game" overlay="linear-gradient(180deg, rgba(18,9,7,.25), rgba(18,9,7,.82))">
        <Wrap>
          <div className="mb-6 flex items-center gap-4 font-mono text-xs uppercase tracking-[0.28em] text-white/70">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-white">04</span><span>Sixteen games</span>
          </div>
          <h2 className="max-w-5xl text-5xl font-semibold leading-[0.95] tracking-[-0.04em] text-white md:text-7xl">
            Same start. Same enemy.<br /><span className="editorial-italic font-normal" style={{ color: OURS }}>Four brains.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-lg text-white/75 md:text-2xl">TypeSafe Jev, OpenAI Luna, Gemma 4 31B on our own GPU, and our rules: each plays our side against the game’s own AI, Normal to Brutal, on the same four starts.</p>
        </Wrap>
      </VisualStage>
      <Section className="py-20">
        <Wrap>
          <Reveal>
            <video src={`${MEDIA}/four-brains.mp4`} poster={`${MEDIA}/four-brains.jpg`} autoPlay muted loop playsInline className="w-full rounded-2xl bg-black shadow-2xl" />
            <p className="mt-3 text-sm text-muted">Brutal, start 1 (China): the four games side by side, clocks in step.</p>
          </Reveal>
        </Wrap>
      </Section>
      <Pinned innerRef={ref} runway="300vh" print={print}>
        <Wrap narrow>
          <h3 className="mb-2 text-3xl font-semibold tracking-[-0.02em] md:text-5xl">Same 16 games. Four brains.</h3>
          <p className="mb-8 text-lg text-muted">Scroll: one brain at a time.</p>
          <Board rows={rows} seeds={R.seeds} shown={step} tile={32} label={280} />
          <div className="mt-5"><Legend /></div>
          <p className="mt-8 text-3xl font-semibold transition-opacity duration-500 md:text-4xl" style={{ color: OURS_INK, opacity: step > R.brains.length - 1 ? 1 : 0 }}>
            The hype isn’t what you need. Plain rules won 9; the best model won 2.
          </p>
        </Wrap>
      </Pinned>
      <Section className="pb-24">
        <Wrap>
          <Evidence>
            Real games in our AI Arena, {day(R.madeAt)} 2026, on the live web game{page ? ` (page ${page.page})` : ""}. Map {R.map}, mirror factions, starts 1–4 = China, Iran, Turkey, Saudi. The game pauses
            while a model thinks, so its speed doesn’t change the result.{fallbacks.length ? ` Turns a model failed to answer, played by our rules instead: ${fallbacks.join(", ")}.` : ""}
          </Evidence>
        </Wrap>
      </Section>
    </section>
  );
}

/* ─── 5 · Why the models lost, and the better prompt ───────────────────── */

function Duel() {
  return (
    <div className="grid gap-10 md:grid-cols-2">
      {[jev, oursTurn].map((b, i) => (
        <Reveal key={b.name} delay={i * 0.25}>
          <h3 className="text-3xl font-semibold">{b.name}</h3>
          <p className="mb-4 text-base text-muted">asked at {clockT(b.tick)} · {b.provider === "scripted" ? "answered in under 0.01 s" : `answered in ${(b.ms / 1000).toFixed(2)} s while the game paused`}</p>
          {b.options.map((o) => {
            const chosen = o.value === b.choice;
            return (
              <div key={o.value} className="grid h-9 grid-cols-[180px_1fr_70px] items-center gap-3">
                <span className={`truncate text-base ${chosen ? "font-bold text-foreground" : "text-muted"}`}>{o.label}</span>
                <div className="h-6"><div className="h-6 rounded-r" style={{ width: o.p ? `max(3px, ${o.p * 100}%)` : 0, background: b.provider === "scripted" ? OURS : GREY }} /></div>
                <span className={`text-right text-base ${chosen ? "font-bold text-foreground" : "text-muted"}`}>{pct(o.p)}</span>
              </div>
            );
          })}
          <p className="mt-4 text-base">
            <span className="mr-2 inline-block align-middle"><Tile g={{ seed: 0, result: b.result, minutes: 0 }} size={26} /></span>
            Army worth {num(b.atMinute3.army)} at minute 3, {num(b.atMinute3.credits)} unspent · {WORD[b.result]} at {mmss(b.gameSeconds)}
          </p>
        </Reveal>
      ))}
    </div>
  );
}

const ADVICE = [
  "Build power, a refinery, barracks, a war factory, then radar. More power when spare power is under 10.",
  "No second refinery before 2:00. Harvesters up to what the map supports.",
  "Spend: keep every barracks and factory training the strongest combat unit you can afford. Wait only under 300 credits.",
  "No towers or base defenses unless enemies are at the base (threat high or critical). No engineers, spies, dogs or scouts in the army.",
  "Counter what the enemy fields: anti-tank against vehicles, anti-infantry against infantry.",
  "Scout early. Defend when the threat is high or critical. Attack only with 10 or more gathered units worth at least 3,500 and more than the enemy army seen; once at the enemy base, keep attacking.",
];

// One side of the before/after: the three models with the first prompt, or coached.
function PromptPanel({ side }: { side: "first" | "coached" }) {
  const wins = P.models.reduce((s, m) => s + m[side].wins, 0);
  return (
    <div className={`flex h-full flex-col justify-center gap-5 p-8 ${side === "first" ? "bg-[#1c1d1b]" : "bg-[#2a2310]"} text-white`}>
      <div className="font-mono text-xs uppercase tracking-[0.25em]" style={{ color: side === "first" ? LIGHT : OURS }}>
        {side === "first" ? "First prompt: “Economy first”" : "Coached: our rules, written as advice"}
      </div>
      <div className="flex items-baseline gap-4"><b className="text-7xl font-bold leading-none">{wins}</b><span className="text-lg text-white/70">games won of 48, the three models together</span></div>
      <div className="grid grid-cols-[150px_repeat(3,1fr)] gap-x-4 gap-y-2 text-base">
        <span /><span className="text-sm text-white/55">won of 16</span><span className="text-sm text-white/55">army started</span><span className="text-sm text-white/55">unspent at 5:00</span>
        {P.models.map((m) => [
          <b key={`${m.name}-n`}>{m.name}</b>,
          <span key={`${m.name}-w`} className="text-xl font-semibold">{m[side].wins}</span>,
          <span key={`${m.name}-b`} className="text-xl font-semibold">{clock(m[side].firstBarracksMin)}</span>,
          <span key={`${m.name}-c`} className="text-xl font-semibold">{num(Math.round(m[side].creditsAt5))}</span>,
        ])}
      </div>
    </div>
  );
}

function WhySection() {
  const order = R.brains.map((b) => W.brains.find((w) => w.provider === b.provider)!);
  const usd = P.models.reduce((s, m) => s + m.coached.usd, 0);
  const pos = (min: number) => Math.round((min / 5) * 1000) / 10;
  return (
    <Section id="why" dark className="py-28 md:py-36">
      <Wrap>
        <ChapterHead n="05" label="Why the models lost" title="They did what we told them." italic="Same moment, two brains." dark
          lede={`Brutal, start 1 (${cap(oursTurn.faction)}). A minute in, each brain is asked: “${oursTurn.instructions}”`} />
        <div className="mt-14"><Duel /></div>
        <Reveal delay={0.2}>
          <div className="mt-12 grid items-start gap-8 md:grid-cols-[1fr_380px]">
            <Code size={16} marks={[1]} where={`Why our rules said Barracks · brain.mjs:${lineOf("refinery")}`} src={`refinery: !has("refinery") ? 6
  : refineries < 2 && minutes > 2 && expand ? 3.5 : …,
barracks: !has("barracks") && !queued("barracks") ? 4.5 : -1,`} />
            <p className="text-xl leading-relaxed text-muted">Our rules score a second refinery below zero until minute 2. The rubric told every model <b className="text-foreground">“Economy first.”</b> {jev.name} obeyed.</p>
          </div>
        </Reveal>

        <h3 className="mb-2 mt-24 text-3xl font-semibold tracking-[-0.02em] md:text-4xl">When each brain started its army</h3>
        <p className="mb-6 text-lg text-muted">Middle of each brain’s 16 games. Drag along the line.</p>
        <Spectrum axis={{ left: "0:00, game start", right: "5:00" }} scrub color={OURS} items={[
          { label: `Our rules ${clock(order.find((w) => w.provider === "scripted")!.firstBarracksMin)}`, position: pos(order.find((w) => w.provider === "scripted")!.firstBarracksMin), highlight: true, color: OURS },
          { label: `Luna ${clock(order.find((w) => w.provider === "openai")!.firstBarracksMin)}`, position: pos(order.find((w) => w.provider === "openai")!.firstBarracksMin) },
          { label: `Jev and Gemma ${clock(order.find((w) => w.provider === "jev")!.firstBarracksMin)}`, position: pos(order.find((w) => w.provider === "jev")!.firstBarracksMin) },
        ]} />
        <div className="mt-16 grid gap-12 md:grid-cols-2">
          <div>
            <h4 className="mb-4 text-2xl font-semibold">Money left unspent at minute 5</h4>
            <Bars dark max={10000} items={order.map((w) => ({ label: w.name, value: w.creditsAt5, display: num(Math.round(w.creditsAt5)), ours: w.provider === "scripted" }))} />
          </div>
          <div>
            <h4 className="mb-4 text-2xl font-semibold">Army at minute 3, in credits</h4>
            <Bars dark max={3500} items={order.map((w) => ({ label: w.name, value: w.armyAt3, display: num(Math.round(w.armyAt3)), ours: w.provider === "scripted" }))} />
          </div>
        </div>
        <Evidence>Towers built by minute 5: {order.map((w) => `${w.name} ${w.towersBy5}`).join(", ")}. Credits are the game’s money; refineries make more of it.</Evidence>
        <div className="mt-12"><Claim dark>The models saved money and built towers. Our rules built an army.</Claim></div>

        <h3 className="mb-2 mt-28 text-3xl font-semibold tracking-[-0.02em] md:text-5xl">So we told the models what our rules know.</h3>
        <p className="mb-8 text-lg text-muted">
          <code className="font-mono text-base">brain.mjs:{lineOf("coached")}</code>, PROMPTS.coached. It replaces the rubric; nothing else changes. Same 16 games each, again.
        </p>
        <div className="grid items-start gap-10 md:grid-cols-[1fr_1.15fr]">
          <ol className="grid list-decimal gap-2 border-l-4 border-border pl-10 text-base leading-snug text-foreground/90">
            {ADVICE.map((a, i) => <li key={i} className={i === 1 ? "font-semibold" : ""} style={i === 1 ? { color: OURS } : undefined}>{a}</li>)}
          </ol>
          <div>
            <BeforeAfter before={<PromptPanel side="first" />} after={<PromptPanel side="coached" />} beforeLabel="First prompt" afterLabel="Coached" height="420px" initialPosition={94} dividerColor={OURS} className="overflow-hidden rounded-2xl" />
            <p className="mt-3 text-sm text-muted">Drag the line to the left to swap the first prompt for the coached one.</p>
          </div>
        </div>
        <Evidence>
          Coached games: {P.models.map((m) => `${m.name} ${m.coached.wins}–${m.coached.draws}–${m.coached.losses}`).join(", ")} (won–draw–lost); they cost ${usd.toFixed(2)}. Every coached win came against Normal or Rush.
        </Evidence>
        <div className="mt-12"><Claim dark>Better advice fixed the opening: wins went from 3 to 11. It didn’t fix the hard games. Against Hard and Brutal the models still won none of 24; our rules won 2 of 8.</Claim></div>
      </Wrap>
    </Section>
  );
}

/* ─── 6 · How the rules got good ────────────────────────────────────────── */

type RuleRow = (typeof RL.evening.rows)[number] | (typeof RL.flags.rows)[number];
const ruleRow = (r: RuleRow): BoardRow => ({
  key: r.key, label: r.label, sub: r.what, accent: r.key === "both", games: r.games as Cell[][], total: r.wins,
  of: `of ${r.finished}${r.played > r.finished ? " finished" : ""}`,
});
const ev = (k: string) => RL.evening.rows.find((r) => r.key === k)!;
const fl = (k: string) => RL.flags.rows.find((r) => r.key === k)!;

function RulesSection() {
  const { ref, print, step } = useSteps(RL.flags.rows.length + 1);
  const ringed = new Set(step > RL.flags.rows.length ? RL.together.flatMap((t) => ["counters", "hunt", "both"].map((k) => `${k}|${t.opponent}|${t.seed}`)) : []);
  const nodes = [
    { date: "23 Oct, evening", title: `The brain wins ${ev("base").wins} of ${ev("base").finished}`, description: "Starts 1–2, Normal to Brutal. Brutal attacks in the first minutes, so we taught the brain to defend: several rules at a time.", color: GREY },
    { date: "Try 1", title: `Early defence: ${ev("defence").wins} of ${ev("defence").finished}`, description: "Towers first, army home, economy paused. Worse.", color: LOSS },
    { date: "Tries 2 and 3", title: `A smarter mix, then a real bug fixed: ${ev("adaptive").wins} and ${ev("scouting").wins}`, description: "The bug (Defend chased any enemy a scout saw) was the brain’s only push toward the enemy.", color: LOSS },
    { date: "That night", title: "We put the old brain back", description: "Many rules changed at once: no way to tell which one hurt.", color: GREY },
    { date: "24 Oct, morning", title: "One idea, one switch", description: "Each idea became one flag in EXPERIMENTS, and each played the same 16 games as the brain without it. The losers stay in the code.", color: OURS },
    { date: "The switches", title: `Scouting ${fl("scouting").wins}, budget ${fl("budget").wins}, counters ${fl("counters").wins}, hunt ${fl("hunt").wins}`, description: "Two ideas helped; two didn’t.", color: OURS },
    { date: "Together", title: `Counters + hunt: ${fl("both").wins} of ${fl("both").finished}`, description: "Adopted as the brain that played the match-up.", color: WIN },
    { date: "A new map", title: `${RL.newMap.before.wins} → ${RL.newMap.adopted.wins} of ${RL.newMap.adopted.played} on Little Big Lake`, description: "Better, but much of the jump was the first map.", color: WIN },
  ];
  const lessons: [string, string, string][] = [
    ["Change one thing at a time", `${ev("base").wins} → ${ev("defence").wins}`, "after the first many-rules try; the next two won none. Several rules at once taught us nothing."],
    ["Test good ideas together", `${fl("counters").wins} + ${fl("hunt").wins} → ${fl("both").wins}`, `of ${fl("both").finished}: counters alone, hunt alone, then both, on the same games.`],
    ["Rerun it somewhere new", `${RL.newMap.before.wins} → ${RL.newMap.adopted.wins}`, `of ${RL.newMap.adopted.played} on a map it had never seen. Better, but much of the jump was the first map.`],
  ];
  return (
    <section id="rules" className="relative bg-bg-light text-foreground">
      <Section className="pb-12 pt-28 md:pt-36">
        <Wrap>
          <ChapterHead n="06" label="How the rules got good" title="Not by being clever." italic="One switch at a time."
            lede="Two days in the Arena, 23 and 24 October: first the smart idea, then the boring method." />
          {/* The timeline is drawn for a dark ground, so it sits on a dark panel inside this light chapter. */}
          <div className="slide-dark mt-14 grid gap-10 rounded-3xl bg-background p-8 text-foreground md:grid-cols-[1fr_380px] md:p-12">
            <AnimatedTimeline nodes={nodes} color={OURS} />
            <div className="hidden md:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${MEDIA}/frame-final-attack.jpg`} alt="The counters + hunt brain's final attack on Brutal's base, 24 Oct" className="sticky top-24 w-full rounded-2xl" />
              <p className="mt-3 text-sm text-muted">The counters + hunt brain reaching Brutal’s base, 24 Oct: the game you scrolled through at the start.</p>
            </div>
          </div>
        </Wrap>
      </Section>
      <Pinned innerRef={ref} runway="320vh" print={print}>
        <Wrap narrow>
          <h3 className="mb-2 text-3xl font-semibold tracking-[-0.02em] md:text-5xl">One switch at a time, the same 16 games</h3>
          <p className="mb-6 text-lg text-muted">24 Oct, the next morning. Each row is the brain with one switch on. Scroll: one switch at a time.</p>
          <Board rows={RL.flags.rows.map(ruleRow)} seeds={RL.flags.seeds} shown={step} ringed={ringed} tile={30} label={280} />
          <p className="mt-6 text-2xl font-semibold transition-opacity duration-500 md:text-3xl" style={{ color: OURS_INK, opacity: step > RL.flags.rows.length ? 1 : 0 }}>
            Each alone lost the ringed games. Together they won {RL.together.length === 2 ? "both" : "them all"}. One is the Brutal win you scrolled through at the start.
          </p>
        </Wrap>
      </Pinned>
      <Section className="pb-28">
        <Wrap>
          <div className="grid gap-10 md:grid-cols-3">
            {lessons.map(([b, n, p], i) => (
              <Reveal key={b} delay={i * 0.1}>
                <div className="border-t-4 border-border pt-5">
                  <b className="block text-2xl leading-tight">{b}</b>
                  <span className="my-5 block whitespace-nowrap text-6xl font-bold leading-none tracking-[-0.03em]">{n}</span>
                  <p className="text-lg text-muted">{p}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-14"><Claim>Our rules aren’t clever. They were tested, one switch at a time, and the switches that lost are still in the code.</Claim></div>
          <Evidence>Map {RL.map}, starts 1–4 = China, Iran, Turkey, Saudi. Where a start was played twice, the later game counts. The brain that played the match-up is “24 Oct counters+hunt” (BRAIN_VERSION, brain.mjs:{lineOf("version")}).</Evidence>
        </Wrap>
      </Section>
    </section>
  );
}

/* ─── 7 · Where a model does help ───────────────────────────────────────── */

function HelpSection() {
  const run = (k: string) => H.runs.find((r) => r.key === k)!;
  const withModel = H.runs.filter((r) => r.how === "both");
  const sameScore = withModel.every((r) => r.correct === withModel[0].correct);
  const unread = H.handedOver.filter((h) => !h.rulesRight).sort((a, b) => Number(b.withModelRight) - Number(a.withModelRight));
  const short = (t: string) => { const s = t.split(/(?<=[.?!])\s/)[0]; return s.length > 64 ? `${s.slice(0, 62).trimEnd()}…` : s; };
  const fixed = unread.filter((h) => h.withModelRight).length;
  const bars = [
    { label: "Our rules alone", value: run("rules").correct, display: `${run("rules").correct} % · ${ms(run("rules").msMedian)}`, caption: "no model", ours: true },
    { label: "Rules, then a model", value: withModel[0].correct, display: `${withModel[0].correct} % · ${ms(withModel[0].msMedian)}`, caption: `the model asked only ${withModel[0].modelCalls} times in ${H.orders}`, ours: true },
    ...H.runs.filter((r) => r.how === "model").map((r) => ({ label: r.name, value: r.correct, display: `${r.correct} % · ${ms(r.msMedian)}`, caption: "a model for every order" })),
  ];
  return (
    <Section id="help" dark className="py-28 md:py-36">
      <Wrap>
        <ChapterHead n="07" label="Where models do help" title="So are models useless here?" italic="No. Listen to the player." dark
          lede={`The voice companion, 23 Oct: ${H.orders} real spoken or typed orders, slang and misheard words included. How many each brain read right:`} />
        <div className="mt-14 grid items-start gap-14 md:grid-cols-[1fr_430px]">
          <Bars dark max={100} items={bars} />
          <div>
            <h3 className="mb-3 text-xl font-semibold">The {unread.length} orders our rules couldn’t read</h3>
            <StaggerChildren staggerDelay={0.08}>
              {unread.map((h, i) => (
                <StaggerItem key={i}>
                  <div className="grid grid-cols-[30px_1fr] items-start gap-3 border-t border-border py-2">
                    <Tile g={{ seed: 0, result: h.withModelRight ? "win" : "loss", minutes: 0 }} size={26} />
                    <div><q className="text-lg">{h.said}</q><span className="block text-sm text-muted">{short(h.model)}</span></div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerChildren>
          </div>
        </div>
        <Evidence>
          Graded by the companion’s own bench: commands, refusals and questions. With the model, {run("rules+llm").unsafeAccepts} order it should have refused got through; our rules alone let{" "}
          {run("rules").unsafeAccepts || "none"} through. Replies shown are gpt-4.1-mini’s; Laya ran on the CPU.
        </Evidence>
        <div className="mt-12"><Claim dark>Rules first, a model for what’s left: {fixed} more orders right.{sameScore ? " And with the rules in front, every model scored the same." : ""}</Claim></div>
      </Wrap>
    </Section>
  );
}

/* ─── 8 · Who wrote the rules ───────────────────────────────────────────── */

const MARK = new Set(["585723b", "e241116", "984c6db"]);

function WhoSection() {
  const commits = H.brain.commits;
  const coBy = commits.filter((c) => /Claude/.test(c.coAuthor ?? "")).length;
  return (
    <section id="who" className="slide-dark relative bg-black text-foreground">
      <div className="relative z-10 py-28 md:py-36">
        <Wrap>
          <ChapterHead n="08" label="The twist" title="So who wrote our rules?" dark />
          <p className="-mt-2 mb-10 font-mono text-base text-muted">git log tools/arena/brain.mjs · RTSAI-WebGame · {commits.length} commits, {coBy} co-authored by Claude</p>
          <StaggerChildren staggerDelay={0.12} className="grid gap-0">
            {commits.map((c) => (
              <StaggerItem key={c.hash}>
                <div className="grid grid-cols-[90px_70px_1fr] items-baseline gap-x-5 border-t border-border py-3 md:grid-cols-[100px_80px_1fr_170px]" title={`${c.hash} · ${c.date} · ${c.author}`}>
                  <code className="font-mono text-base" style={{ color: OURS }}>{c.hash}</code>
                  <span className="text-base text-muted">{day(c.date)}</span>
                  <span className={`text-lg leading-snug ${MARK.has(c.hash) ? "font-semibold text-foreground" : "text-muted"}`}>{c.subject}</span>
                  <span className="hidden font-mono text-sm md:block" style={{ color: OURS }}>{(c.coAuthor ?? "none").split(" <")[0]}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
          <Reveal delay={0.2}>
            <div className="mt-14 flex flex-wrap items-center gap-3">
              {["Read a lost game’s log", "Add one idea as a switch", "Play the same 16 games", "Keep it or drop it"].map((t, i) => (
                <span key={t} className="flex items-center gap-3">
                  {i > 0 && <span className="text-2xl text-muted">→</span>}
                  <span className="rounded-lg border border-border bg-surface px-4 py-2 text-lg font-semibold">{t}</span>
                </span>
              ))}
              <span className="text-2xl text-muted">↺</span>
            </div>
          </Reveal>
          <div className="mt-28 max-w-5xl">
            <ScrollRevealText mode="word" scrub className="text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-white md:text-7xl">
              The AI that wins isn’t the one playing. It’s the one that wrote the player.
            </ScrollRevealText>
          </div>
        </Wrap>
      </div>
    </section>
  );
}

/* ─── 9 · Take it home ──────────────────────────────────────────────────── */

function CtaSection() {
  const tips = [
    ["Race the dumbest thing that could work", "Same seeds, same games, before you buy the smartest brain. Then read its decision log to see why it lost."],
    ["Change one thing at a time", "One idea, one switch, the same games as without it. Keep the switches that lost, and their games."],
    ["Test good ideas together, then somewhere new", "Two switches that each won 5 won 12 together; a new map keeps you honest."],
    ["Put the model where rules can’t reach", "Rules first, a model for what they can’t read: right more often, and every model scores the same."],
  ];
  return (
    <section id="cta" className="slide-dark relative overflow-hidden bg-background text-foreground">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${MEDIA}/frame-win.jpg`} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-15" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(18,9,7,.96) 0%, rgba(18,9,7,.8) 50%, rgba(18,9,7,.96) 100%)" }} />
      <div className="relative z-10 py-28 md:py-36">
        <Wrap>
          <ChapterHead n="09" label="Take it home" title="Four things to try on Monday." dark />
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {tips.map(([h, b], i) => (
              <Reveal key={h} delay={i * 0.08}>
                <div className="border-t border-border pt-5">
                  <div className="font-mono text-xs" style={{ color: OURS }}>0{i + 1}</div>
                  <h3 className="mt-2 text-2xl font-semibold leading-tight">{h}</h3>
                  <p className="mt-2 text-lg text-muted">{b}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-20 flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="font-mono text-sm uppercase tracking-[0.25em] text-white/70">{TAGLINE}</div>
              <p className="mt-4 max-w-xl text-base text-muted">Every game in this talk is in our AI Arena, with its decision log and its replay. Ali Badereddin · AI Tinkerers Doha · 16 Nov 2026.</p>
            </div>
            <div className="flex items-center gap-4 rounded-2xl bg-white p-4 text-[#120907]">
              <QRCodeSVG value="https://present.humanquest.net/can-an-ai-play" size={112} />
              <div className="text-sm leading-snug"><b className="block text-base">This talk</b>present.humanquest.net<br />/can-an-ai-play</div>
            </div>
          </div>
        </Wrap>
      </div>
    </section>
  );
}

/* ─── The deck ──────────────────────────────────────────────────────────── */

export default function CanAnAiPlay() {
  const print = usePrintMode();
  return (
    <main className={`relative ${print ? "print-mode" : ""}`}>
      <ScrollProgress />
      <ChapterNav chapters={CHAPTERS} />
      <DeckControls />
      <PresentationTimer targetMinutes={15} sections={BUDGET} />
      <HeroSection />
      <ColdOpenSection />
      <LoopSection />
      <CodeSection />
      <MatchUpSection />
      <WhySection />
      <RulesSection />
      <HelpSection />
      <WhoSection />
      <Marquee speed={40} fade className="bg-black py-6 font-mono text-sm uppercase tracking-[0.3em] text-white/35">
        {TAGLINE.split(" · ").map((w) => <span key={w} className="px-8">{w} ·</span>)}
      </Marquee>
      <CtaSection />
    </main>
  );
}
