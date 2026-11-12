"use client";

/*
 * "Can an AI play our game?" — the AI Tinkerers Doha Round 5 talk (Monday 16 Nov 2026, 15 minutes), as a scroll story.
 *
 * Seven parts, one arc (rebuilt 10 Nov 2026 from ten chapters: the owner found the old one wandered, changed theme from
 * chapter to chapter and didn't fit a laptop window; 12 Nov: the owner missed the product itself, so it now opens on it):
 *   built  What we built: the desktop game, the web game, the battle simulator, real-place maps, the Faction Studio.
 *   bet    The bet: three AI models and a page of plain rules play the same 16 games. The first win, then the board.
 *   loop   How it plays: one loop, and one function decides who plays.
 *   why    Why the models lost: they did what we told them ("Economy first"); better advice fixed only the easy games.
 *   rules  How the rules got good: one switch at a time.
 *   who    The twist: who wrote the rules.
 *   home   Take it home: four tips, each with its number (the voice-order bench is tip 4).
 *
 * One theme throughout: the dark ground, one gold accent for our rules, grey for the models, green/red only for won/lost.
 * One type family (sans) for words; mono only for code and small labels. Every part reflows from a phone to a projector:
 * below 768 px wide (or under 600 px tall) the scroll-pinned boards become plain sections with everything shown.
 *
 * Every number comes from ./data/can-an-ai-play.json: real games in the RTS AI Arena, the voice-order bench and the
 * git history of the rules, exported by tools/to-openstage.mjs from the talk folder
 * (D:\Generated\RTSAI\talk-brains-match-up-20261104 on the owner's PC). Change the data there and export again.
 * The imagery is the game's own replay footage, not generated art: the talk is about what really happened.
 */

import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { motion, useMotionValueEvent } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Reveal, StaggerChildren, StaggerItem, ScrollProgress, Spectrum, ScrollRevealText, useSectionProgress } from "@/components/animations";
import { AnimatedTimeline } from "@/components/charts";
import { ChapterNav } from "@/components/chapter-nav";
import { DeckControls } from "@/components/deck-controls";
import { PresentationTimer } from "@/components/presentation-timer";
import { usePrintMode } from "@/lib/print-mode";
import data from "./data/can-an-ai-play.json";

const WIN = "#2f9e44";
const LOSS = "#c9423f";
const OURS = "#F2C14E";
const GREY = "#8f8e88";
const LIGHT = "#c3c2b7";
const MEDIA = "/talks/can-an-ai-play";
const TAGLINE = "Read · Switch · Play · Keep · Repeat";

const CHAPTERS = [
  { id: "built", label: "Built", dark: true },
  { id: "bet", label: "Bet", dark: true },
  { id: "loop", label: "Loop", dark: true },
  { id: "why", label: "Why", dark: true },
  { id: "rules", label: "Rules", dark: true },
  { id: "who", label: "Twist", dark: true },
  { id: "home", label: "Home", dark: true },
] as const;

// The 15-minute slot, per part.
const BUDGET = [
  { id: "built", label: "What we built", minutes: 2 },
  { id: "bet", label: "The bet", minutes: 2.5 },
  { id: "loop", label: "How it plays", minutes: 1.5 },
  { id: "why", label: "Why", minutes: 2.5 },
  { id: "rules", label: "Rules", minutes: 2.5 },
  { id: "who", label: "Twist", minutes: 1.5 },
  { id: "home", label: "Home", minutes: 1.5 },
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
const ev = (k: string) => RL.evening.rows.find((r) => r.key === k)!;
const fl = (k: string) => RL.flags.rows.find((r) => r.key === k)!;
const run = (k: string) => H.runs.find((r) => r.key === k)!;
const bestModel = Math.max(...R.brains.filter((b) => b.provider !== "scripted").map((b) => b.wins));
const oursWins = R.brains.find((b) => b.provider === "scripted")!.wins;

/* ─── One type scale, one ground ────────────────────────────────────────── */

const TYPE = {
  h1: "text-[clamp(2.75rem,8.5vw,8.5rem)] font-semibold leading-[0.9] tracking-[-0.05em]",
  h2: "text-[clamp(2.25rem,5.6vw,5.75rem)] font-semibold leading-[0.95] tracking-[-0.04em]",
  h3: "text-[clamp(1.5rem,3vw,3rem)] font-semibold leading-[1.05] tracking-[-0.025em]",
  lede: "text-[clamp(1.05rem,1.7vw,1.65rem)] leading-relaxed text-muted",
  body: "text-[clamp(1rem,1.25vw,1.3rem)] leading-relaxed",
  kicker: "font-mono text-[clamp(0.7rem,0.9vw,0.85rem)] uppercase tracking-[0.25em]",
  big: "text-[clamp(2.25rem,4.6vw,4.75rem)] font-bold leading-none tracking-[-0.03em]",
};

function useMedia(query: string) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    const f = () => setOn(m.matches);
    f();
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, [query]);
  return on;
}
// Below 768 px wide, or under 600 px tall, pinned scroll boards would be cut off: show them as plain sections instead.
const useCompact = () => useMedia("(max-width: 767px), (max-height: 600px)");

// Every part sits on the same dark ground. w-full is load-bearing.
function Part({ id, className = "", children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={`slide-dark relative bg-background text-foreground ${className}`}>
      <div className="relative w-full">{children}</div>
    </section>
  );
}

// Clear of the chapter dots on the right edge (lg and up).
function Wrap({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:pl-16 lg:pr-28 ${className}`}>{children}</div>;
}

function Block({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`py-[clamp(3.5rem,9vh,8rem)] ${className}`}>{children}</div>;
}

function PartHead({ n, label, title, lede }: { n: string; label: string; title: ReactNode; lede?: ReactNode }) {
  return (
    <Reveal>
      <div className={`${TYPE.kicker} mb-5 flex items-center gap-3`} style={{ color: OURS }}>
        <span>{n}</span><span className="h-px w-10" style={{ background: OURS }} /><span>{label}</span>
      </div>
      <h2 className={`${TYPE.h2} max-w-5xl`}>{title}</h2>
      {lede && <p className={`${TYPE.lede} mt-5 max-w-3xl`}>{lede}</p>}
    </Reveal>
  );
}

// Each part ends on one claim: something new, not a summary.
function Claim({ children }: { children: ReactNode }) {
  return (
    <Reveal delay={0.1}>
      <blockquote className="max-w-4xl border-l-4 py-1 pl-6" style={{ borderLeftColor: OURS }}>
        <p className="text-[clamp(1.35rem,2.6vw,2.6rem)] font-semibold leading-snug tracking-[-0.015em]">{children}</p>
      </blockquote>
    </Reveal>
  );
}

function Evidence({ children }: { children: ReactNode }) {
  return <p className="mt-5 max-w-5xl text-[clamp(0.8rem,0.95vw,0.95rem)] leading-relaxed text-muted">{children}</p>;
}

// The code on screen is the real code, cut with "…". It wraps on a phone and scrolls sideways nowhere.
const TOKENS = /(\/\/.*$)|("(?:[^"\\]|\\.)*")(?=\s*:)|("(?:[^"\\]|\\.)*")|\b(export|async|function|const|return|if|true|false)\b|(\b\d+(?:\.\d+)?\b)/g;
const TOKEN_COLOR = [GREY, LIGHT, "#d8b37a", "#9fb7d6", OURS];
function Code({ src, marks = [], where }: { src: string; marks?: number[]; where?: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0b0605]">
      {where && <div className="border-b border-white/10 px-4 py-2.5 font-mono text-[clamp(0.68rem,0.85vw,0.8rem)] text-white/50">{where}</div>}
      <pre className="py-3 font-mono text-[clamp(0.72rem,1.12vw,1.1rem)] leading-[1.6] text-[#f0efec]">
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
            <span key={i} className="block whitespace-pre-wrap break-words px-4 lg:whitespace-pre lg:break-normal"
              style={{ borderLeft: `3px solid ${hl ? OURS : "transparent"}`, background: hl ? "rgba(242,193,78,.12)" : undefined }}>
              {line ? parts : " "}
            </span>
          );
        })}
      </pre>
    </div>
  );
}

/* ─── The game boards ───────────────────────────────────────────────────── */

type Cell = { seed: number; result: string; minutes: number } | null;

// One game is one square. A win lights up (gold on our own lane); a loss stays a quiet slot, so a lane reads as
// "how much is lit". With no `size` the square fills its grid column.
function Tile({ g, size, ring = false, tip, ours = false }: { g: Cell; size?: number; ring?: boolean; tip?: string; ours?: boolean }) {
  const box: CSSProperties = { ...(size ? { width: size } : {}), containerType: "inline-size", outline: `3px solid ${ring ? OURS : "transparent"}`, outlineOffset: 2, transition: "outline-color .4s" };
  const cls = `${size ? "inline-grid shrink-0" : "grid w-full"} aspect-square place-items-center rounded-[18%] font-bold leading-none`;
  if (!g) return <span className={cls} style={box} />;
  const look: Record<string, CSSProperties> = {
    win: ours ? { background: OURS, color: "#221a05" } : { background: WIN, color: "#fff" },
    draw: { background: "rgba(255,255,255,.17)", color: "rgba(255,255,255,.78)" },
    loss: { background: "rgba(255,255,255,.04)", color: "rgba(255,255,255,.24)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.08)" },
    stopped: { color: GREY, border: `2px dashed ${GREY}` },
  };
  return (
    <span title={tip} className={cls} style={{ ...box, ...look[g.result] }}>
      <span style={{ fontSize: "46cqw" }}>{GLYPH[g.result] ?? "?"}</span>
    </span>
  );
}

function Legend() {
  const items: [string, string][] = [["win", "won"], ["draw", "draw after 40 minutes"], ["loss", "lost"]];
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
      {items.map(([r, t]) => <span key={t} className="flex items-center gap-2"><Tile g={{ seed: 0, result: r, minutes: 0 }} size={18} />{t}</span>)}
    </div>
  );
}

type BoardRow = { key: string; label: ReactNode; sub?: ReactNode; games: Cell[][]; total: number; of: string; accent?: boolean };

// One lane per brain: its name and its wins on one line, its games below as big squares, four per opponent, with the
// opponents named once above. The squares fill the width and shrink on a short window, so a pinned board always
// fits its screen. A board with more than four lanes puts the name beside the squares from 1024 px. Lanes past
// `shown` wait, faded out.
function Board({ rows, seeds, shown, ringed }: { rows: BoardRow[]; seeds: number[]; shown: number; ringed?: Set<string> }) {
  const opponents = RL.opponents;
  const side = rows.length > 4;
  const tip = (g: Cell, oi: number, si: number) => (g ? `${LEVELS[opponents[oi]]} (${LEVEL_HINT[opponents[oi]]}), start ${seeds[si] - 999} as ${FACTION[seeds[si]]}: ${WORD[g.result]} at ${clock(g.minutes)}` : undefined);
  // How tall a square may be. On a pinned screen it is measured: the room the window leaves, shared by the lanes, so
  // the board fills the screen it has and never runs past it. Until measured (and unpinned) a safe guess from the
  // window height stands in, and the width caps it either way.
  const root = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<number | null>(null);
  const lanes = rows.length;
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () => {
      const pin = el.closest<HTMLElement>("[data-pinned]"), inner = pin?.firstElementChild as HTMLElement | null | undefined, sq = el.querySelector<HTMLElement>("[title]");
      if (!pin || !inner || !sq) { setFit(null); return; }
      const free = pin.clientHeight - parseFloat(getComputedStyle(pin).paddingBottom) - inner.offsetHeight - 12;
      const next = Math.round(Math.max(16, Math.min(side ? 48 : 64, sq.offsetHeight + free / lanes)));
      setFit((cur) => (cur === next ? cur : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (el.parentElement) ro.observe(el.parentElement);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [lanes, side]);
  const square = fit !== null ? `${fit}px` : side ? `min(3rem, max(1.1rem, (100svh - 420px) / ${lanes * 1.6}))` : `min(4rem, max(1.1rem, (100svh - 640px) / ${lanes}))`;
  const group: CSSProperties = { maxWidth: `calc(4 * ${square} + 3 * 0.4rem)` };
  const lane = side
    ? "grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 lg:grid-cols-[minmax(11rem,15rem)_1fr_5rem] lg:gap-x-6"
    : "grid grid-cols-[1fr_auto] items-end gap-x-4 gap-y-[clamp(0.35rem,1vh,0.6rem)]";
  const pad = "px-[clamp(0.75rem,1.3vw,1.4rem)]";
  const games = "grid grid-cols-4 gap-x-[clamp(0.6rem,2.2vw,2rem)]";
  return (
    <div ref={root} className="grid gap-[clamp(0.35rem,1vh,0.65rem)]">
      <div className={`${lane} ${pad}`}>
        <div className={side ? "hidden lg:block" : "hidden"} />
        <div className={`${games} col-span-2 ${side ? "lg:col-span-1" : ""}`}>
          {opponents.map((o) => <div key={o} className="text-[clamp(0.7rem,0.95vw,1.05rem)] font-semibold text-muted"><span className="hidden sm:inline">vs </span>{LEVELS[o]}</div>)}
        </div>
        <div className={side ? "hidden lg:block" : "hidden"} />
      </div>
      {rows.map((r, ri) => (
        <div key={r.key} className={`${lane} ${pad} rounded-2xl py-[clamp(0.45rem,1.1vh,0.9rem)] transition-all duration-500 ${ri >= shown ? "translate-y-2 opacity-0" : ""}`}
          style={{ background: r.accent ? "rgba(242,193,78,.09)" : "rgba(255,255,255,.03)", boxShadow: `inset 0 0 0 ${r.accent ? `1.5px ${OURS}` : "1px rgba(255,255,255,.06)"}` }}>
          <div className="order-1 min-w-0">
            <b className={`${side ? "block" : "mr-3 inline-block"} text-[clamp(1.1rem,1.55vw,1.8rem)] leading-tight`} style={r.accent ? { color: OURS } : undefined}>{r.label}</b>
            {r.sub && <span className={`${side ? "block" : "inline-block"} text-[clamp(0.8rem,0.95vw,1.05rem)] leading-snug text-muted`}>{r.sub}</span>}
          </div>
          <div className={`order-2 shrink-0 whitespace-nowrap text-right ${side ? "lg:order-3" : ""}`}>
            <b className="text-[clamp(1.75rem,2.6vw,3rem)] font-bold leading-none" style={r.accent ? { color: OURS } : undefined}>{r.total}</b>
            <span className="ml-1.5 text-[clamp(0.75rem,0.9vw,1rem)] text-muted">{r.of}</span>
          </div>
          <div className={`${games} order-3 col-span-2 ${side ? "lg:order-2 lg:col-span-1" : ""}`}>
            {opponents.map((o, oi) => (
              <div key={o} className="grid grid-cols-4 gap-[clamp(3px,0.45vw,0.4rem)]" style={group}>
                {r.games[oi].map((g, si) => <Tile key={si} g={g} ours={r.accent} ring={ringed?.has(`${r.key}|${o}|${seeds[si]}`)} tip={tip(g, oi, si)} />)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// A section that pins its content for `runway` of scroll and turns the scroll into a whole-number step.
// Compact screens and print show every step at once, unpinned.
function useSteps(steps: number) {
  const { ref, progress, print } = useSectionProgress(["start start", "end end"]);
  const compact = useCompact();
  const [step, setStep] = useState(0);
  useMotionValueEvent(progress, "change", (v) => setStep(Math.min(steps, Math.floor(v * (steps + 0.6)))));
  const flat = print || compact;
  return { ref, flat, step: flat ? steps : step };
}

function Pinned({ innerRef, runway, flat, children }: { innerRef: React.RefObject<HTMLDivElement | null>; runway: string; flat: boolean; children: ReactNode }) {
  return (
    <div ref={innerRef} className="relative" style={{ height: flat ? "auto" : runway }}>
      <div data-pinned={flat ? undefined : ""} className={flat ? "py-12" : "sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden pb-16"}>{children}</div>
    </div>
  );
}

// Plain bars: bold label, the bar, the value. The label column shrinks on a phone.
function Bars({ items, max }: { items: { label: string; value: number; display: string; caption?: string; ours?: boolean }[]; max: number }) {
  return (
    <div className="grid gap-1.5">
      {items.map((it) => {
        const w = Math.max(0.8, Math.min(100, (100 * it.value) / max)) * 0.6;
        return (
          <div key={it.label} className="grid min-h-[44px] grid-cols-[minmax(6.5rem,12rem)_1fr] items-center gap-3">
            <div className="min-w-0">
              <b className="block text-[clamp(0.95rem,1.15vw,1.15rem)] leading-tight" style={it.ours ? { color: OURS } : undefined}>{it.label}</b>
              {it.caption && <span className="block text-xs leading-snug text-muted">{it.caption}</span>}
            </div>
            <div className="relative h-7">
              <div className="absolute left-0 top-0 h-7 rounded-r" style={{ width: `${w}%`, background: it.ours ? OURS : GREY }} />
              <span className="absolute top-0 whitespace-nowrap text-[clamp(0.95rem,1.25vw,1.25rem)] font-bold leading-7" style={{ left: `calc(${w}% + 10px)` }}>{it.display}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── The title, and the first win (part 02) ──────────────────────────────────────────────────────── */

const PARTS = ["What we built", "The bet", "How it plays", "Why the models lost", "How the rules got good", "The twist", "Take it home"];

function Hero() {
  return (
    <section className="slide-dark relative flex min-h-[100svh] flex-col bg-background text-foreground">
      <div className="border-b border-white/10">
        <Wrap className={`${TYPE.kicker} flex items-center justify-between py-5 text-white/55`}>
          <span>AI Tinkerers · Doha · Round 5</span>
          <span className="hidden sm:inline">16 Nov 2026</span>
        </Wrap>
      </div>
      <div className="flex flex-1 items-center py-12">
        <Wrap>
          <Reveal>
            <div className={`${TYPE.kicker} mb-6`} style={{ color: OURS }}>Four brains · the same sixteen games</div>
            <h1 className={`${TYPE.h1} mb-8`}>Can an AI play<br />our game?</h1>
            <p className={`${TYPE.lede} mb-10 max-w-3xl`}>
              We built a real-time strategy game with coding agents. Then three AI models and a page of plain rules each played the
              same 16 games. Every game was really played; every number comes from its log.
            </p>
            <div className="flex flex-wrap gap-2.5">
              {R.brains.map((b) => (
                <span key={b.name} className="rounded-full border px-4 py-2 text-[clamp(0.9rem,1.1vw,1.1rem)] font-semibold"
                  style={b.provider === "scripted" ? { borderColor: OURS, color: OURS } : { borderColor: "rgba(255,255,255,.18)" }}>
                  {b.name}
                </span>
              ))}
            </div>
          </Reveal>
        </Wrap>
      </div>
      <div className="pb-8">
        <Wrap>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-white/10 pt-5 md:grid-cols-4 xl:grid-cols-7">
            {PARTS.map((p, i) => (
              <div key={p} className="flex items-baseline gap-2.5">
                <span className="font-mono text-xs" style={{ color: OURS }}>0{i + 1}</span>
                <span className="text-xs uppercase tracking-[0.16em] text-white/55">{p}</span>
              </div>
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

// The reader's scroll is the game clock. Captions sit under the film, never over the game.
function FirstWin() {
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
  const captions: [string, ReactNode][] = [
    [`${day(g.finishedAt)} · our AI Arena`, <>Our side plays {cap(g.ours)}. The enemy is Brutal, the game’s hardest AI: it attacks early, with 15,000 extra credits.</>],
    ["Before this game", <>{O.brutalBefore.finished} games against Brutal. Not one won, by any brain.</>],
    ["Your scroll is the clock", <>Eighteen minutes of play: the army builds, pushes out, and finds the enemy base.</>],
    [`${mmss(g.gameSeconds)} of play`, <>Won. The first time our side ever beat Brutal.</>],
  ];
  const stats: [string, string][] = [
    [mmss(g.gameSeconds), "game time to win"],
    [num(g.theyLost), `what Brutal lost, in credits; we lost ${num(g.weLost)}`],
    [String(g.buildingsDestroyed), `enemy buildings destroyed; we lost ${g.ourBuildingsLost || "none"}`],
    [`${O.brutalBefore.won} of ${O.brutalBefore.finished}`, "Brutal games won before this one, by any brain"],
  ];
  return (
    <>
      {print ? (
        <Part><Wrap className="py-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${MEDIA}/frame-final-attack.jpg`} alt="The final attack on the enemy base, from the game's replay" className="w-full rounded-2xl" />
        </Wrap></Part>
      ) : (
        <div ref={ref} className="slide-dark relative bg-black text-white" style={{ height: "380vh" }}>
          <div className="sticky top-0 flex h-[100svh] w-full flex-col justify-center overflow-hidden">
            <div className="relative aspect-video w-full shrink-0 md:aspect-auto md:min-h-0 md:flex-1">
              <video ref={video} src={`${MEDIA}/cold-open-scrub.mp4`} poster={`${MEDIA}/cold-open-start.jpg`} muted playsInline preload="auto" className="absolute inset-0 h-full w-full object-contain" />
            </div>
            <div className="relative h-[clamp(9rem,28vh,16rem)] shrink-0 border-t border-white/10 bg-background">
              {captions.map(([k, t], i) => (
                <div key={k} className="absolute inset-0 flex items-center transition-all duration-500 md:bottom-20" style={{ opacity: caption === i ? 1 : 0, transform: `translateY(${caption === i ? 0 : 12}px)` }} aria-hidden={caption !== i}>
                  <Wrap>
                    <div className={`${TYPE.kicker} mb-2`} style={{ color: OURS }}>{k}</div>
                    <p className="max-w-4xl text-[clamp(1.15rem,2.3vw,2.2rem)] font-semibold leading-snug">{t}</p>
                  </Wrap>
                </div>
              ))}
            </div>
            <motion.div className="absolute bottom-0 left-0 h-1 w-full origin-left" style={{ scaleX: progress, background: OURS }} />
          </div>
        </div>
      )}
      <Part>
        <Wrap><Block>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 xl:grid-cols-4">
            {stats.map(([b, t], i) => (
              <Reveal key={t} delay={i * 0.08}>
                <div className="border-t-2 border-border pt-4">
                  <b className={`${TYPE.big} block`}>{b}</b>
                  <span className="mt-3 block text-[clamp(0.9rem,1.1vw,1.1rem)] leading-snug text-muted">{t}</span>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-14"><Claim>The first win over Brutal didn’t come from the smartest brain we had. Hold that thought.</Claim></div>
          <Evidence>
            Arena game {g.id} · map {g.map}, start {g.seed - 999} ({cap(g.ours)} against {cap(g.theirs)}), speed {g.speed}: {mmss(g.gameSeconds)} of play in {mmss(g.wallSeconds)}. The film is the game’s own replay.
          </Evidence>
        </Block></Wrap>
      </Part>
    </>
  );
}

const cost = (b: (typeof R.brains)[number]) => (b.provider === "scripted" || b.provider === "local" ? "free" : `$${b.usd.toFixed(2)}`);
const speed = (b: (typeof R.brains)[number]) => (b.msPerTurn < 10 ? "under 0.01 s a turn" : `${(b.msPerTurn / 1000).toFixed(1)} s a turn`);

function SixteenGames() {
  const { ref, flat, step } = useSteps(R.brains.length + 1);
  const rows: BoardRow[] = R.brains.map((b) => ({
    key: b.provider, label: b.name, sub: <>{b.what} · {cost(b)} · {speed(b)}</>, accent: b.provider === "scripted",
    games: b.games.map((list) => R.seeds.map((s) => list.find((g) => g.seed === s) ?? null)), total: b.wins, of: `of ${b.played}`,
  }));
  const page = R.brains.find((b) => b.page)?.page;
  const fallbacks = R.brains.filter((b) => b.provider !== "scripted" && b.fallbacks).map((b) => `${b.name} ${b.fallbacks} of ${num(b.turns)}`);
  return (
    <Part>
      <Wrap>
        <Block className="pb-0">
          <Reveal>
            <h3 className={`${TYPE.h3} max-w-4xl`}>Same start. Same enemy. Four brains.</h3>
            <p className={`${TYPE.lede} mt-4 max-w-3xl`}>Each plays our side against the game’s own AI, Normal to Brutal, on the same four starts: 16 games each.</p>
          </Reveal>
          <Reveal delay={0.1}>
            <video src={`${MEDIA}/four-brains.mp4`} poster={`${MEDIA}/four-brains.jpg`} autoPlay muted loop playsInline className="mt-10 w-full rounded-2xl bg-black" />
            <p className="mt-3 text-sm text-muted">Brutal, start 1 (China): the four games side by side, clocks in step.</p>
          </Reveal>
        </Block>
      </Wrap>
      <Pinned innerRef={ref} runway="300vh" flat={flat}>
        <Wrap>
          <h3 className={`${TYPE.h3} mb-1`}>Same 16 games. Four brains.</h3>
          <p className="mb-6 text-[clamp(0.95rem,1.15vw,1.15rem)] text-muted">{flat ? "Each row is one brain." : "Scroll: one brain at a time."}</p>
          <Board rows={rows} seeds={R.seeds} shown={step + 1} />
          <div className="mt-5"><Legend /></div>
          <div className="mt-8 transition-opacity duration-500" style={{ opacity: step >= R.brains.length ? 1 : 0 }}>
            <Claim>The hype isn’t what you need. Plain rules won {oursWins}; the best model won {bestModel}.</Claim>
          </div>
        </Wrap>
      </Pinned>
      <Wrap className="pb-[clamp(3.5rem,9vh,8rem)]">
        <Evidence>
          Real games in our AI Arena, {day(R.madeAt)} 2026, on the live web game{page ? ` (page ${page.page})` : ""}. Map {R.map}, mirror factions, starts 1–4 = China, Iran, Turkey, Saudi. The game pauses
          while a model thinks, so its speed doesn’t change the result.{fallbacks.length ? ` Turns a model failed to answer, played by our rules instead: ${fallbacks.join(", ")}.` : ""}
        </Evidence>
      </Wrap>
    </Part>
  );
}

/* ─── 01 · What we built ────────────────────────────────────────────────── */

// Counted on 12 Nov 2026 with `git log --no-merges` in RTSAI-Mod, RTSAI-WebGame, RTSAI-Web and RTSAI-Art; "with an
// agent" means the commit names Claude or Codex as co-author. The clips are cut by the talk folder's built-clips.sh.
const BUILT_COUNT = { commits: 1517, withAgent: 939, day: "12 Nov 2026" };
const BUILT: { key: string; name: string; line: string }[] = [
  { key: "desktop", name: "Desktop game", line: "A Windows game with three games inside: Classic, RA2 and our own RTS." },
  { key: "web", name: "Web game", line: "The isometric game in a browser tab, at rtsai.net/play. Nothing to install." },
  { key: "simulator", name: "Battle simulator", line: "Pick any two armies, drop them on a map and press Fight." },
  { key: "places", name: "Real places", line: "Pick any place on Earth. It becomes a map you can play." },
  { key: "studio", name: "Faction Studio", line: "Where every unit is made and checked: design, 3D model, sprite, animation, sound, cost." },
];

// One thing at a time, big: the scroll steps through the five clips. Only the clip on screen plays.
function BuiltTour() {
  const { ref, flat, step } = useSteps(BUILT.length - 1);
  const at = Math.min(step, BUILT.length - 1);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  useEffect(() => {
    if (flat) return;
    videos.current.forEach((v, i) => {
      if (!v) return;
      if (i === at) { v.currentTime = 0; void v.play().catch(() => {}); } else v.pause();
    });
  }, [at, flat]);
  return (
    <Part>
      <Wrap>
        <Block className="pb-0">
          <PartHead n="01" label="What we built" title="First, what we built." lede="Five things you can open today. All of it made with coding agents." />
        </Block>
      </Wrap>
      {flat ? (
        <Wrap className="py-12">
          <div className="grid gap-x-8 gap-y-12 md:grid-cols-2">
            {BUILT.map((b, i) => (
              <div key={b.key}>
                <video src={`${MEDIA}/built-${b.key}.mp4`} poster={`${MEDIA}/built-${b.key}.jpg`} autoPlay muted loop playsInline preload="metadata" className="aspect-video w-full rounded-2xl bg-black" />
                <div className={`${TYPE.kicker} mt-4`} style={{ color: OURS }}>0{i + 1} · {b.name}</div>
                <p className="mt-2 text-[clamp(1.1rem,2vw,1.6rem)] font-semibold leading-snug">{b.line}</p>
              </div>
            ))}
          </div>
        </Wrap>
      ) : (
        <Pinned innerRef={ref} runway="340vh" flat={false}>
          <Wrap>
            <div className="flex flex-wrap gap-x-[clamp(1rem,2.4vw,2.5rem)] gap-y-1">
              {BUILT.map((b, i) => (
                <span key={b.key} className="border-b-2 pb-1.5 text-[clamp(0.95rem,1.45vw,1.5rem)] font-semibold transition-colors duration-300"
                  style={{ color: i === at ? OURS : "rgba(255,255,255,.42)", borderColor: i === at ? OURS : "transparent" }}>
                  {b.name}
                </span>
              ))}
            </div>
            <div className="relative mt-5 aspect-video overflow-hidden rounded-2xl bg-black" style={{ width: "min(100%, calc((100svh - 19rem) * 16 / 9))" }}>
              {BUILT.map((b, i) => (
                <video key={b.key} ref={(el) => { videos.current[i] = el; }} src={`${MEDIA}/built-${b.key}.mp4`} poster={`${MEDIA}/built-${b.key}.jpg`} muted loop playsInline preload="metadata"
                  aria-hidden={i !== at} className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500" style={{ opacity: i === at ? 1 : 0 }} />
              ))}
            </div>
            <p className="mt-4 min-h-[2.7em] max-w-4xl text-[clamp(1.15rem,2.3vw,2.2rem)] font-semibold leading-snug">{BUILT[at].line}</p>
          </Wrap>
        </Pinned>
      )}
      <Wrap className="pb-[clamp(3.5rem,9vh,8rem)]">
        <Claim>We built all of this with coding agents. So the next question was obvious: can an AI also play it?</Claim>
        <Evidence>
          Counted on {BUILT_COUNT.day} with git log, merges left out: {num(BUILT_COUNT.commits)} commits in four repositories (game, web game, website, art);{" "}
          {num(BUILT_COUNT.withAgent)} name Claude or Codex as co-author. On screen: screenshots of the 1 Nov Windows release, the website’s trailer, the live web
          game filmed on 11 and 12 Nov, and the Faction Studio on our own machine.
        </Evidence>
      </Wrap>
    </Part>
  );
}

function BuiltPart() {
  return (
    <div id="built">
      <Hero />
      <BuiltTour />
    </div>
  );
}

/* ─── 02 · The bet ──────────────────────────────────────────────────────── */

function BetPart() {
  return (
    <div id="bet">
      <Part>
        <Wrap>
          <Block>
            <PartHead n="02" label="The bet" title="So: can an AI play it?"
              lede="Three AI models and one page of plain rules, each against the game’s own AI. First, how one of those games ended." />
          </Block>
        </Wrap>
      </Part>
      <FirstWin />
      <SixteenGames />
    </div>
  );
}

/* ─── 03 · How it plays ─────────────────────────────────────────────────── */

const NODES: { t: string; d: string; e?: string; chips?: boolean; c: string }[] = [
  { t: "The live game", d: "The same page as rtsai.net/play, against the game’s own AI", c: "window.game" },
  { t: "What a player sees", d: "Our side only: the fog of war hides the rest", e: "credits, buildings, units, enemies in sight", c: "adviserObserve()" },
  { t: "Closed questions", d: "Only what is possible now, plus Wait", e: "“Which building should we start next?”", c: "plan()" },
  { t: "A brain picks", d: "", chips: true, c: "decide()" },
  { t: "Player orders", d: "What a click would send; the replay plays them back", e: "build · gapile", c: "adviserExecute()" },
];

const CALLS: Record<string, [string, string]> = {
  jev: ["POST /v1/systemone", "typesafe/jev-1.13, through OpenRouter"],
  openai: ["POST /v1/decisions", "gpt-6-luna, one choice question each"],
  local: ["POST /v1/chat/completions", "Ollama on our own GPU"],
  scripted: ["scriptedAnswers()", "plain code, same process, no network"],
};

function LoopPart() {
  const luna = R.brains.find((b) => b.provider === "openai");
  const facts: [string, string][] = [
    ["The game pauses while a model thinks", "so a slow answer never loses on speed"],
    ["No answer? Our rules play that turn", `flagged in the log: Luna, ${luna?.fallbacks} of ${num(luna?.turns ?? 0)} turns`],
    ["Every turn is written down", "the question, each option’s probability, the orders sent"],
  ];
  return (
    <Part id="loop">
      <Wrap><Block>
        <PartHead n="03" label="How it plays" title="One loop for every brain. Only the brain changes."
          lede="Every 2 game seconds: what to build next. Every 5: what the army does." />
        <StaggerChildren staggerDelay={0.1} className="mt-12 flex flex-col gap-1 xl:flex-row xl:items-stretch xl:gap-0">
          {NODES.map((n, i) => (
            <Fragment key={n.t}>
              {i > 0 && (
                <StaggerItem className="flex items-center justify-center text-2xl text-muted xl:px-2">
                  <span className="xl:hidden" aria-hidden>↓</span><span className="hidden xl:inline" aria-hidden>→</span>
                </StaggerItem>
              )}
              <StaggerItem className="flex-1">
                <div className="flex h-full flex-col rounded-xl border bg-white/[0.03] p-4" style={{ borderColor: n.chips ? OURS : "var(--color-border)" }}>
                  <b className="text-[clamp(1.05rem,1.3vw,1.35rem)] leading-tight">{n.t}</b>
                  {n.d && <span className="mt-1.5 text-sm leading-snug text-muted">{n.d}</span>}
                  {n.e && <span className="mt-2 text-sm leading-snug">{n.e}</span>}
                  {n.chips && (
                    <div className="mt-2 grid grid-cols-2 gap-1.5 xl:grid-cols-1">
                      {R.brains.map((b) => (
                        <span key={b.name} className="rounded-md border px-2.5 py-1 text-sm font-semibold"
                          style={b.provider === "scripted" ? { borderColor: OURS, color: OURS } : { borderColor: "var(--color-border)" }}>{b.name}</span>
                      ))}
                    </div>
                  )}
                  <code className="mt-auto pt-3 font-mono text-xs" style={{ color: OURS }}>{n.c}</code>
                </div>
              </StaggerItem>
            </Fragment>
          ))}
        </StaggerChildren>
        <p className="mt-3 text-sm text-muted">↺ The orders go back into the game, and the loop runs again.</p>

        <div className="mt-16 grid items-start gap-10 xl:grid-cols-[1.25fr_1fr]">
          <Reveal>
            <h3 className={`${TYPE.h3} mb-5`}>One function decides who plays.</h3>
            <Code marks={[1, 3]} where={`RTSAI-WebGame ${CODE.commit} · tools/arena/providers.mjs:${lineOf("decide")}`} src={`export async function decide(provider, obs, questions, credential = {}, opts = {}) {
  if (provider === "scripted") {
    …
    return { answers: scriptedAnswers(obs, questions, opts), …, usd: 0 };
  }
  // Otherwise a model reads the prompt (the rubric by default) and the battlefield.
  return askQuestions(provider,
    { text: PROMPTS[opts.prompt] ?? RUBRIC, json: describe(obs) }, questions, credential);
}`} />
          </Reveal>
          <Reveal delay={0.1}>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
              {R.brains.map((b) => (
                <div key={b.name} className="rounded-xl border bg-white/[0.03] px-4 py-3" style={{ borderColor: b.provider === "scripted" ? OURS : "var(--color-border)" }}>
                  <b className="block text-base" style={b.provider === "scripted" ? { color: OURS } : undefined}>{b.name}</b>
                  <code className="block font-mono text-xs text-white/70">{CALLS[b.provider][0]}</code>
                  <span className="text-sm text-muted">{CALLS[b.provider][1]}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {facts.map(([b, t]) => (
            <div key={b} className="border-t border-border pt-3 text-sm text-muted"><b className="mb-1 block text-base text-foreground">{b}</b>{t}</div>
          ))}
        </div>
        <div className="mt-14"><Claim>Our rules answer exactly like a model: a choice and a probability for every option. The brain is the only thing that changes.</Claim></div>
      </Block></Wrap>
    </Part>
  );
}

/* ─── 04 · Why the models lost ──────────────────────────────────────────── */

const RUBRIC_BEFORE = "You command one side in a real-time strategy match (Red Alert 2 style) against a computer opponent. Win by destroying every enemy building. ";
const RUBRIC_KEY = "Economy first (power, refineries, harvesters)";
const RUBRIC_AFTER = ", then production, then a large army that attacks together. Defend when the enemy is at the base. Never leave credits unspent for long. Answer each question for the state given.";

function Duel() {
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      {[jev, oursTurn].map((b, i) => {
        const ours = b.provider === "scripted";
        return (
          <Reveal key={b.name} delay={i * 0.2}>
            <div className="rounded-2xl border p-5 sm:p-6" style={{ borderColor: ours ? OURS : "var(--color-border)" }}>
              <h4 className="text-[clamp(1.35rem,2vw,2rem)] font-semibold" style={ours ? { color: OURS } : undefined}>{b.name}</h4>
              <p className="mb-4 text-sm text-muted">asked at {clockT(b.tick)} · {ours ? "answered in under 0.01 s" : `answered in ${(b.ms / 1000).toFixed(2)} s while the game paused`}</p>
              {b.options.map((o) => {
                const chosen = o.value === b.choice;
                return (
                  <div key={o.value} className="grid min-h-[34px] grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_3.5rem] items-center gap-3">
                    <span className={`truncate text-[clamp(0.85rem,1.05vw,1.05rem)] ${chosen ? "font-bold text-foreground" : "text-muted"}`}>{o.label}</span>
                    <div className="h-5"><div className="h-5 rounded-r" style={{ width: o.p ? `max(3px, ${o.p * 100}%)` : 0, background: ours ? OURS : GREY }} /></div>
                    <span className={`text-right text-[clamp(0.85rem,1.05vw,1.05rem)] ${chosen ? "font-bold text-foreground" : "text-muted"}`}>{pct(o.p)}</span>
                  </div>
                );
              })}
              <p className="mt-4 flex items-start gap-2.5 text-[clamp(0.9rem,1.1vw,1.1rem)]">
                <span className="mt-0.5"><Tile g={{ seed: 0, result: b.result, minutes: 0 }} size={22} /></span>
                <span>Army worth {num(b.atMinute3.army)} at minute 3, {num(b.atMinute3.credits)} unspent · {WORD[b.result]} at {mmss(b.gameSeconds)}</span>
              </p>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

function WhyPart() {
  const order = R.brains.map((b) => W.brains.find((w) => w.provider === b.provider)!);
  const usd = P.models.reduce((s, m) => s + m.coached.usd, 0);
  const firstWins = P.models.reduce((s, m) => s + m.first.wins, 0);
  const coachedWins = P.models.reduce((s, m) => s + m.coached.wins, 0);
  const pos = (min: number) => Math.round((min / 5) * 1000) / 10;
  const at = (p: string) => order.find((w) => w.provider === p)!.firstBarracksMin;
  return (
    <Part id="why">
      <Wrap><Block>
        <PartHead n="04" label="Why the models lost" title="They did what we told them." lede="Every model read this, every turn, beside the battlefield as JSON:" />
        <Reveal delay={0.1}>
          <blockquote className="mt-8 max-w-5xl rounded-xl border border-border bg-white/[0.03] p-5 text-[clamp(1.05rem,1.6vw,1.55rem)] leading-relaxed text-foreground/85 sm:p-7">
            {RUBRIC_BEFORE}<mark className="rounded bg-transparent px-0.5 font-semibold" style={{ color: OURS, boxShadow: `inset 0 -0.35em 0 rgba(242,193,78,.18)` }}>{RUBRIC_KEY}</mark>{RUBRIC_AFTER}
          </blockquote>
          <p className="mt-3 text-sm text-muted">The rubric, word for word · tools/arena/brain.mjs:{lineOf("rubric")}</p>
        </Reveal>

        <h3 className={`${TYPE.h3} mb-2 mt-20`}>Same moment, two brains.</h3>
        <p className={`${TYPE.lede} mb-8 max-w-3xl`}>Brutal, start 1 ({cap(oursTurn.faction)}). A minute in, each brain is asked: “{oursTurn.instructions}”</p>
        <Duel />
        <Reveal delay={0.1}>
          <div className="mt-10 grid items-start gap-6 xl:grid-cols-[1.3fr_1fr]">
            <Code marks={[1]} where={`Why our rules said Barracks · brain.mjs:${lineOf("refinery")}`} src={`refinery: !has("refinery") ? 6
  : refineries < 2 && minutes > 2 && expand ? 3.5 : …,
barracks: !has("barracks") && !queued("barracks") ? 4.5 : -1,`} />
            <p className={TYPE.body}>Our rules score a second refinery below zero until minute 2. The rubric told every model <b style={{ color: OURS }}>“Economy first.”</b> <span className="text-muted">{jev.name} obeyed.</span></p>
          </div>
        </Reveal>

        <h3 className={`${TYPE.h3} mb-2 mt-20`}>When each brain started its army</h3>
        <p className="mb-6 text-sm text-muted">The middle of each brain’s 16 games. Drag along the line.</p>
        <Spectrum axis={{ left: "0:00, game start", right: "5:00" }} scrub color={OURS} items={[
          { label: `Our rules ${clock(at("scripted"))}`, position: pos(at("scripted")), highlight: true, color: OURS },
          { label: `Luna ${clock(at("openai"))}`, position: pos(at("openai")) },
          { label: `Jev and Gemma ${clock(at("jev"))}`, position: pos(at("jev")) },
        ]} />
        <div className="mt-14 grid gap-12 xl:grid-cols-2">
          <div>
            <h4 className="mb-4 text-[clamp(1.1rem,1.5vw,1.5rem)] font-semibold">Money left unspent at minute 5</h4>
            <Bars max={10000} items={order.map((w) => ({ label: w.name, value: w.creditsAt5, display: num(Math.round(w.creditsAt5)), ours: w.provider === "scripted" }))} />
          </div>
          <div>
            <h4 className="mb-4 text-[clamp(1.1rem,1.5vw,1.5rem)] font-semibold">Army at minute 3, in credits</h4>
            <Bars max={3500} items={order.map((w) => ({ label: w.name, value: w.armyAt3, display: num(Math.round(w.armyAt3)), ours: w.provider === "scripted" }))} />
          </div>
        </div>
        <Evidence>Towers built by minute 5: {order.map((w) => `${w.name} ${w.towersBy5}`).join(", ")}. Credits are the game’s money; refineries make more of it.</Evidence>
        <div className="mt-12"><Claim>The models saved money and built towers. Our rules built an army.</Claim></div>

        <h3 className={`${TYPE.h3} mb-2 mt-24`}>So we told the models what our rules know.</h3>
        <p className={`${TYPE.lede} mb-8 max-w-3xl`}>Our rules, written as six lines of advice, replaced the rubric. Nothing else changed. The same 16 games each, again.</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Reveal><div className="h-full rounded-2xl border border-border p-5">
            <div className="text-sm text-muted">Games won by the three models, of 48</div>
            <div className={`${TYPE.big} mt-3`}>{firstWins} <span className="text-muted">→</span> <span style={{ color: OURS }}>{coachedWins}</span></div>
            <div className="mt-2 text-sm text-muted">first prompt → coached</div>
          </div></Reveal>
          <Reveal delay={0.08}><div className="h-full rounded-2xl border border-border p-5">
            <div className="text-sm text-muted">Against Hard and Brutal, coached</div>
            <div className={`${TYPE.big} mt-3`}>0 <span className="text-[0.5em] font-semibold text-muted">of 24</span></div>
            <div className="mt-2 text-sm text-muted">our rules: 2 of 8</div>
          </div></Reveal>
          <Reveal delay={0.16}><div className="h-full rounded-2xl border border-border p-5 sm:col-span-2 xl:col-span-1">
            <div className="text-sm text-muted">When the army started (middle of 16 games)</div>
            <div className="mt-3 grid gap-1">
              {P.models.map((m) => (
                <div key={m.name} className="flex items-baseline justify-between gap-3 text-[clamp(0.9rem,1.1vw,1.1rem)]">
                  <span className="truncate">{m.name}</span>
                  <span className="whitespace-nowrap font-semibold"><span className="text-muted">{clock(m.first.firstBarracksMin)} →</span> {clock(m.coached.firstBarracksMin)}</span>
                </div>
              ))}
            </div>
          </div></Reveal>
        </div>
        <Evidence>
          Prompt: brain.mjs:{lineOf("coached")}, PROMPTS.coached. Coached games: {P.models.map((m) => `${m.name} ${m.coached.wins}–${m.coached.draws}–${m.coached.losses}`).join(", ")} (won–draw–lost); they cost ${usd.toFixed(2)}. Every coached win came against Normal or Rush.
        </Evidence>
        <div className="mt-12"><Claim>Better advice fixed the opening. It didn’t fix the hard games.</Claim></div>
      </Block></Wrap>
    </Part>
  );
}

/* ─── 05 · How the rules got good ───────────────────────────────────────── */

type RuleRow = (typeof RL.evening.rows)[number] | (typeof RL.flags.rows)[number];
const ruleRow = (r: RuleRow): BoardRow => ({
  key: r.key, label: r.label, sub: r.what, accent: r.key === "both", games: r.games as Cell[][], total: r.wins,
  of: `of ${r.finished}${r.played > r.finished ? " finished" : ""}`,
});

function RulesPart() {
  const { ref, flat, step } = useSteps(RL.flags.rows.length + 1);
  const ringed = new Set(step >= RL.flags.rows.length ? RL.together.flatMap((t) => ["counters", "hunt", "both"].map((k) => `${k}|${t.opponent}|${t.seed}`)) : []);
  const nodes = [
    { date: "23 Oct, evening", title: `The brain wins ${ev("base").wins} of ${ev("base").finished}`, description: "Brutal attacks in the first minutes, so we taught the brain to defend: several rules at a time.", color: GREY },
    { date: "Try 1", title: `Early defence: ${ev("defence").wins} of ${ev("defence").finished}`, description: "Towers first, army home, economy paused. Worse.", color: LOSS },
    { date: "Tries 2 and 3", title: `A smarter mix, then a real bug fixed: ${ev("adaptive").wins} and ${ev("scouting").wins}`, description: "The bug (Defend chased any enemy a scout saw) was the brain’s only push toward the enemy.", color: LOSS },
    { date: "That night", title: "We put the old brain back", description: "Many rules changed at once: no way to tell which one hurt.", color: GREY },
    { date: "24 Oct, morning", title: "One idea, one switch", description: "Each idea became one flag, and each played the same 16 games as the brain without it.", color: OURS },
  ];
  return (
    <Part id="rules">
      <Wrap><Block className="pb-0">
        <PartHead n="05" label="How the rules got good" title="Not by being clever. One switch at a time."
          lede="Two days in the Arena, 23 and 24 October: first the smart idea, then the boring method." />
        <div className="mt-12 grid items-start gap-10 xl:grid-cols-[1fr_420px]">
          <AnimatedTimeline nodes={nodes} color={OURS} />
          <div className="hidden xl:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${MEDIA}/frame-final-attack.jpg`} alt="The counters + hunt brain's final attack on Brutal's base, 24 Oct" className="sticky top-24 w-full rounded-2xl" />
            <p className="mt-3 text-sm text-muted">The brain that came out of it, reaching Brutal’s base on 24 Oct: the game at the start of this talk.</p>
          </div>
        </div>
      </Block></Wrap>
      <Pinned innerRef={ref} runway="320vh" flat={flat}>
        <Wrap>
          <h3 className={`${TYPE.h3} mb-1`}>One switch at a time, the same 16 games</h3>
          <p className="mb-6 text-[clamp(0.95rem,1.15vw,1.15rem)] text-muted">24 Oct, morning. Each row is the brain with one switch on.{flat ? "" : " Scroll: one switch at a time."}</p>
          <Board rows={RL.flags.rows.map(ruleRow)} seeds={RL.flags.seeds} shown={step + 1} ringed={ringed} />
          <p className="mt-6 text-[clamp(1.1rem,1.8vw,1.75rem)] font-semibold transition-opacity duration-500" style={{ color: OURS, opacity: step >= RL.flags.rows.length ? 1 : 0 }}>
            Each switch alone lost the ringed games. Together they won {RL.together.length === 2 ? "both" : "them all"}. One is the Brutal win from the start.
          </p>
        </Wrap>
      </Pinned>
      <Wrap><Block className="pt-6">
        <Claim>Our rules aren’t clever. They were tested, one switch at a time, and the switches that lost are still in the code.</Claim>
        <Evidence>
          Map {RL.map}, starts 1–4 = China, Iran, Turkey, Saudi. Where a start was played twice, the later game counts. Adopted as “24 Oct counters+hunt” (BRAIN_VERSION, brain.mjs:{lineOf("version")}): the brain that played the match-up. On a map it had never seen it went from {RL.newMap.before.wins} to {RL.newMap.adopted.wins} wins of {RL.newMap.adopted.played}.
        </Evidence>
      </Block></Wrap>
    </Part>
  );
}

/* ─── 06 · The twist ────────────────────────────────────────────────────── */

const MARK = new Set(["585723b", "e241116", "984c6db"]);

function WhoPart() {
  const commits = H.brain.commits;
  const coBy = commits.filter((c) => /Claude/.test(c.coAuthor ?? "")).length;
  return (
    <Part id="who">
      <Wrap><Block>
        <PartHead n="06" label="The twist" title="So who wrote our rules?" />
        <p className="mb-8 mt-4 font-mono text-[clamp(0.8rem,1vw,1rem)] text-muted">git log tools/arena/brain.mjs · {commits.length} commits, {coBy} co-authored by Claude</p>
        <StaggerChildren staggerDelay={0.1} className="grid">
          {commits.map((c) => (
            <StaggerItem key={c.hash}>
              <div className="grid grid-cols-[4.5rem_1fr] items-baseline gap-x-4 border-t border-border py-2.5 md:grid-cols-[5.5rem_4.5rem_1fr_9rem]" title={`${c.hash} · ${c.date} · ${c.author}`}>
                <code className="font-mono text-sm" style={{ color: OURS }}>{c.hash}</code>
                <span className="hidden text-sm text-muted md:block">{day(c.date)}</span>
                <span className={`text-[clamp(0.95rem,1.2vw,1.2rem)] leading-snug ${MARK.has(c.hash) ? "font-semibold text-foreground" : "text-muted"}`}>{c.subject}</span>
                <span className="col-start-2 font-mono text-xs md:col-start-auto md:text-right md:text-sm" style={{ color: OURS }}>{(c.coAuthor ?? "none").split(" <")[0]}</span>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
        <Reveal delay={0.15}>
          <div className="mt-12 flex flex-wrap items-center gap-2.5">
            {["Read a lost game’s log", "Add one idea as a switch", "Play the same 16 games", "Keep it or drop it"].map((t, i) => (
              <span key={t} className="flex items-center gap-2.5">
                {i > 0 && <span className="text-xl text-muted" aria-hidden>→</span>}
                <span className="rounded-lg border border-border px-3.5 py-2 text-[clamp(0.9rem,1.1vw,1.1rem)] font-semibold">{t}</span>
              </span>
            ))}
            <span className="text-xl text-muted" aria-hidden>↺</span>
          </div>
        </Reveal>
        <div className="mt-24 max-w-5xl">
          <ScrollRevealText mode="word" scrub className={`${TYPE.h2} text-white`}>
            The AI that wins isn’t the one playing. It’s the one that wrote the player.
          </ScrollRevealText>
        </div>
      </Block></Wrap>
    </Part>
  );
}

/* ─── 07 · Take it home ─────────────────────────────────────────────────── */

function HomePart() {
  const withModel = H.runs.filter((r) => r.how === "both");
  const tips: [string, string, string][] = [
    ["Race the dumbest thing that could work", `${oursWins} vs ${bestModel}`, "Plain rules against the best model, the same 16 games. Then read each loser’s decision log."],
    ["Change one thing at a time", `${ev("base").wins} → ${ev("defence").wins}`, "when we changed several rules at once; the next two tries won none."],
    ["Test good ideas together, then somewhere new", `${fl("counters").wins} + ${fl("hunt").wins} → ${fl("both").wins}`, `of ${fl("both").finished}, two switches together. On a new map: ${RL.newMap.before.wins} → ${RL.newMap.adopted.wins}.`],
    ["Put the model where rules can’t reach", `${run("rules").correct} → ${withModel[0].correct} %`, `of ${H.orders} spoken orders read right: rules first, a model only for the ${withModel[0].modelCalls} they couldn’t read. A model for every order: at most ${Math.max(...H.runs.filter((r) => r.how === "model").map((r) => r.correct))} %.`],
  ];
  return (
    <Part id="home">
      <Wrap><Block className="md:pb-36">
        <PartHead n="07" label="Take it home" title="Four things to try on Monday." />
        <div className="mt-12 grid gap-x-10 gap-y-10 md:grid-cols-2">
          {tips.map(([h, n, b], i) => (
            <Reveal key={h} delay={i * 0.08}>
              <div className="border-t border-border pt-5">
                <div className="font-mono text-xs" style={{ color: OURS }}>0{i + 1}</div>
                <h3 className="mt-2 text-[clamp(1.25rem,1.9vw,1.9rem)] font-semibold leading-tight">{h}</h3>
                <div className={`${TYPE.big} mt-4`} style={{ color: OURS }}>{n}</div>
                <p className="mt-3 text-[clamp(0.95rem,1.15vw,1.15rem)] leading-relaxed text-muted">{b}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-20 flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className={`${TYPE.kicker} text-white/70`}>{TAGLINE}</div>
            <p className="mt-4 max-w-xl text-sm text-muted">Every game in this talk is in our AI Arena, with its decision log and its replay. Ali Badereddin · AI Tinkerers Doha · 16 Nov 2026.</p>
          </div>
          <div className="flex items-center gap-4 rounded-2xl bg-white p-4 text-[#120907]">
            <QRCodeSVG value="https://present.humanquest.net/can-an-ai-play" size={104} />
            <div className="text-sm leading-snug"><b className="block text-base">This talk</b>present.humanquest.net<br />/can-an-ai-play</div>
          </div>
        </div>
      </Block></Wrap>
    </Part>
  );
}

/* ─── The deck ──────────────────────────────────────────────────────────── */

export default function CanAnAiPlay() {
  const print = usePrintMode();
  return (
    <main className={`relative bg-background ${print ? "print-mode" : ""}`}>
      <ScrollProgress />
      <ChapterNav chapters={CHAPTERS} />
      {/* On a phone the timer and controls would sit on the words: they show from 768 px. */}
      <div className="hidden md:block">
        <DeckControls />
        <PresentationTimer targetMinutes={15} sections={BUDGET} />
      </div>
      <BuiltPart />
      <BetPart />
      <LoopPart />
      <WhyPart />
      <RulesPart />
      <WhoPart />
      <HomePart />
    </main>
  );
}
