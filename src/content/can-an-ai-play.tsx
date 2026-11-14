"use client";

/*
 * "Can an AI play our game?" — the AI Tinkerers Doha Round 5 talk (Monday 16 Nov 2026, 15 minutes).
 *
 * Click-first (12 Nov 2026, the owner's ask: "make things clickable instead of scrollable", "show the 3D models",
 * "open the actual web experience"). One Next button (or → / Space / a clicker) moves the whole talk: it shows the
 * next step of the screen in view (the next product, a board's next row), then glides to the next screen. The page
 * still scrolls. Every product picture is a link that opens the real thing in its own tab: the game needs a sign-in
 * and its own browser isolation, so it cannot run inside this page. The unit models are real files you can turn.
 *
 * Laid out as whole screens (14 Nov 2026, the owner: "not clear and so much unnecessary space"): every stop is one
 * window, its heading and its content together in the middle of it, its picture as large as the window allows. See
 * Screen and Fill below. A wide window (`wide:`) puts things side by side; a tall one stacks them.
 *
 * One line: AI made building cheap. What got expensive was knowing what is true.
 *
 * Seven parts (rebuilt 12 Nov 2026 from the full history of the project, on the owner's ask: the talk had told only the
 * "models against rules" experiment and showed none of the product or of what building it with agents was like):
 *   built     What we built: the desktop game, the web game, the battle simulator, real-place maps, the Faction Studio.
 *   done      It said done. It wasn't: three reports whose numbers were true while the job was not finished.
 *   ruler     Give it a ruler: generated art beside the original game's; then check the ruler itself.
 *   selfplay  Let the game play itself: thousands of bot games, and the bugs only they found.
 *   play      So: can an AI play it? Three models and a page of rules on the same 16 games; why; one switch at a
 *             time; who wrote the rules. (The experiment that used to be five parts.)
 *   human     What no ruler catches: taste and attention, and what the owner built for themself.
 *   home      Take it home: four tips, each with its number, and where to play tonight.
 *
 * The new parts' numbers are constants beside each part, each with its source file or commit in a comment.
 *
 * One theme throughout, the game's own "Command Red" (13 Nov 2026, the owner's asks: "more like a red alert with the
 * red color present and visible", then "make sure the red colors come from the red color that is in the game ... use
 * the theme of the game"): the game's charcoal ground lit red at the top of every part, its red for the talk's voice
 * and its alarms, its gold for our rules and for what passed, grey for the models, green only for won. The game's
 * squarer buttons (dark type on red), its corner brackets and its screen lines come along.
 * One type family (sans) for words; mono only for code and small labels. Every part reflows from a phone to a projector:
 * below 768 px wide (or under 600 px tall) the stepped boards show everything at once.
 *
 * Every number comes from ./data/can-an-ai-play.json: real games in the RTS AI Arena, the voice-order bench and the
 * git history of the rules, exported by tools/to-openstage.mjs from the talk folder
 * (D:\Generated\RTSAI\talk-brains-match-up-20261104 on the owner's PC). Change the data there and export again.
 * The imagery is real: the game's own footage, the project's own art, and the agents' generated designs shown as
 * evidence. Pictures that are only the original game's sprites stay out (the project keeps them out of its repos).
 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import dynamic from "next/dynamic";
import { QRCodeSVG } from "qrcode.react";
import { Reveal, ScrollProgress, ScrollRevealText } from "@/components/animations";
import { ChapterNav } from "@/components/chapter-nav";
import { DeckControls } from "@/components/deck-controls";
import { DeckNext, useStepped } from "@/components/deck-stepper";
import { PresentationTimer } from "@/components/presentation-timer";
import { usePrintMode } from "@/lib/print-mode";
import data from "./data/can-an-ai-play.json";

// The theme is the game's own: "Command Red", the identity the owner picked for RTS AI. Every colour here is read
// from the web game's interface (RTSAI-WebGame web/src/ui/command-red.css, 13 Nov 2026), not chosen for the talk.
// Red is the talk's own voice and its alarms: the tags on every heading, the Next control, the doors to the real
// pages, and every number that was bad news. Gold stays for what is ours and what is good: our rules on the boards,
// the wins, the checks that pass. Green only ever means "won".
const RED = "#e15a43"; // --command-accent: fills, rules and glows
const RED_INK = "#f18470"; // --command-accent-hi: red type and small marks on the dark ground
const ON_RED = "#151719"; // the game writes its dark ground colour on red buttons
const BUTTON = `linear-gradient(180deg, ${RED_INK}, ${RED})`; // the game's main button
const WIN = "#2f9e44";
const OURS = "#d8b66c"; // --hud-gold
// The game's ground, ink, quiet text and edges, for every section of the talk.
const GROUND = { "--color-background": "#151719", "--color-foreground": "#f5efe4", "--color-muted": "#b5b8b8", "--color-border": "#42494e" } as CSSProperties;
// The fine screen lines the game's menu draws over its ground.
const SCANLINES = "repeating-linear-gradient(0deg, rgba(255,255,255,.022) 0 1px, transparent 1px 3px)";
const GREY = "#8f8e88";
const LIGHT = "#c3c2b7";
const MEDIA = "/talks/can-an-ai-play";
// Three.js loads only in the browser, and only once a model is asked for.
const UnitModel = dynamic(() => import("@/components/3d/unit-model").then((m) => m.UnitModel), { ssr: false });
const TAGLINE = "Read · Switch · Play · Keep · Repeat";

const CHAPTERS = [
  { id: "built", label: "Built", dark: true },
  { id: "done", label: "Done?", dark: true },
  { id: "ruler", label: "Ruler", dark: true },
  { id: "selfplay", label: "Self-play", dark: true },
  { id: "play", label: "Play", dark: true },
  { id: "human", label: "Human", dark: true },
  { id: "home", label: "Home", dark: true },
] as const;

// The 15-minute slot, per part: 14 minutes planned.
const BUDGET = [
  { id: "built", label: "What we built", minutes: 2 },
  { id: "done", label: "It said done", minutes: 1.5 },
  { id: "ruler", label: "The ruler", minutes: 2 },
  { id: "selfplay", label: "Self-play", minutes: 1.5 },
  { id: "play", label: "Can an AI play it?", minutes: 3.5 },
  { id: "human", label: "The human", minutes: 2 },
  { id: "home", label: "Home", minutes: 1.5 },
];

const LEVELS: Record<string, string> = { normal: "Normal", rush: "Rush", hard: "Hard", brutal: "Brutal" };
const LEVEL_HINT: Record<string, string> = { normal: "the standard AI", rush: "attacks early", hard: "Rush + 5,000 credits", brutal: "Rush + 15,000 credits" };
const GLYPH: Record<string, string> = { win: "✓", draw: "–", loss: "✕", stopped: "·" };
const WORD: Record<string, string> = { win: "won", loss: "lost", draw: "draw", stopped: "stopped by hand" };
const FACTION: Record<number, string> = { 1000: "China", 1001: "Iran", 1002: "Turkey", 1003: "Saudi" };

const num = (n: number) => n.toLocaleString("en");
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const clock = (min: number) => mmss(Math.round(min * 60));
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

const R = data.results;
const W = data.why;
const P = data.prompt;
const RL = data.rules;
const H = data.help;
const ev = (k: string) => RL.evening.rows.find((r) => r.key === k)!;
const fl = (k: string) => RL.flags.rows.find((r) => r.key === k)!;
const run = (k: string) => H.runs.find((r) => r.key === k)!;
const bestModel = Math.max(...R.brains.filter((b) => b.provider !== "scripted").map((b) => b.wins));
const oursWins = R.brains.find((b) => b.provider === "scripted")!.wins;

/* ─── One type scale, one ground ────────────────────────────────────────── */

// Every size follows the window's width and its height, whichever is the scarcer: a screen of the talk has to fit
// a short laptop window as well as a tall one.
const TYPE = {
  h2: "text-[clamp(1.9rem,min(4.6vw,7.4vh),4.75rem)] font-semibold leading-[0.98] tracking-[-0.04em]",
  h3: "text-[clamp(1.35rem,min(2.9vw,4.8vh),2.9rem)] font-semibold leading-[1.08] tracking-[-0.025em]",
  h4: "text-[clamp(1.05rem,min(1.6vw,2.8vh),1.6rem)] font-semibold leading-tight",
  lede: "text-[clamp(1rem,min(1.65vw,2.8vh),1.6rem)] leading-[1.45] text-muted",
  text: "text-[clamp(0.9rem,min(1.15vw,2.1vh),1.2rem)] leading-snug",
  kicker: "font-mono text-[clamp(0.7rem,0.9vw,0.85rem)] uppercase tracking-[0.25em]",
  big: "text-[clamp(1.9rem,min(4.4vw,7.2vh),4.6rem)] font-bold leading-none tracking-[-0.03em]",
};
// The one number a screen is about, when the screen holds little else.
const HUGE = "whitespace-nowrap text-[clamp(3rem,min(9vw,15vh),9rem)] font-bold leading-none tracking-[-0.04em]";
// Three of them side by side on such a screen.
const LARGE = "whitespace-nowrap text-[clamp(2.2rem,min(5.4vw,9vh),5.6rem)] font-bold leading-none tracking-[-0.03em]";
// Space between the things on a screen, and between two groups of them: both give way on a short window.
const GAP = "gap-[clamp(0.7rem,2.4vh,1.75rem)]";
const GROUP = "mt-[clamp(0.4rem,2.2vh,1.75rem)]";

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
// Below 768 px wide, or under 600 px tall, a stepped board is a reading page: show every row at once.
const useCompact = () => useMedia("(max-width: 767px), (max-height: 600px)");

// Every part sits on the same dark ground. w-full is load-bearing.
// `lit` puts the red light at its top: a part's first section has it (any section with an id, or by asking).
function Part({ id, lit = !!id, className = "", children }: { id?: string; lit?: boolean; className?: string; children: ReactNode }) {
  return (
    <section id={id} style={GROUND} className={`slide-dark relative bg-background text-foreground ${className}`}>
      {lit && <RedLight />}
      <div className="relative w-full">{children}</div>
    </section>
  );
}

// The alert light: a red line across the top of a part and a glow falling from it. Decoration only.
function RedLight() {
  return (
    <div aria-hidden data-red-light className="pointer-events-none absolute inset-x-0 top-0 h-[70vh]"
      style={{ borderTop: `3px solid ${RED}`, background: `${SCANLINES}, linear-gradient(180deg, rgba(225,90,67,.22), rgba(225,90,67,.06) 45%, transparent)` }} />
  );
}

// The game's card corners: four small brackets in its lighter red. The parent must be positioned.
function Brackets() {
  const b = `2px solid ${RED_INK}`;
  return (
    <span aria-hidden data-brackets className="pointer-events-none absolute inset-0 z-10">
      <i className="absolute left-2 top-2 h-[18px] w-[18px]" style={{ borderTop: b, borderLeft: b }} />
      <i className="absolute right-2 top-2 h-[18px] w-[18px]" style={{ borderTop: b, borderRight: b }} />
      <i className="absolute bottom-2 left-2 h-[18px] w-[18px]" style={{ borderBottom: b, borderLeft: b }} />
      <i className="absolute bottom-2 right-2 h-[18px] w-[18px]" style={{ borderBottom: b, borderRight: b }} />
    </span>
  );
}

// Clear of the chapter dots on the right edge (lg and up).
function Wrap({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1800px] px-5 sm:px-8 lg:pl-16 lg:pr-28 ${className}`}>{children}</div>;
}

/*
 * One screen of the talk (14 Nov 2026, the owner: "not clear and so much unnecessary space"). A screen is exactly one
 * window high, and what is on it sits together in the middle of the room the controls leave: no heading alone above
 * an empty window, nothing of the next screen showing below. Next rests on each screen's top, and nothing inside a
 * screen is a stop of its own.
 *
 * Pictures and films marked to give way (Fill, or `shrink` with a min-height) take the room the words leave, so the
 * same screen fits a short laptop window and fills a tall one. If the words alone cannot fit (a very short window),
 * the screen grows instead of running into the next one. On a phone and in print a screen is simply as tall as its
 * content.
 */
function Screen({ children, className = "", refEl, ...rest }: { children: ReactNode; className?: string; refEl?: RefObject<HTMLDivElement | null> } & Record<`data-${string}`, string | number | undefined>) {
  const print = usePrintMode();
  const own = useRef<HTMLDivElement>(null);
  const ref = refEl ?? own;
  const [loose, setLoose] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || print) return;
    let timer = 0, heals = 0;
    // Does the content run past the window even with every picture given way? Looked at once things have settled.
    // A screen that grew and then turned out not to need it (a board still finding its size) goes back, a few times
    // at most so it cannot flip for ever.
    const look = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (el.dataset.loose === undefined) { if (el.scrollHeight > el.clientHeight + 2) setLoose(true); }
        else if (el.clientHeight <= window.innerHeight + 1 && heals++ < 3) { setLoose(false); look(); }
      }, 160);
    };
    const again = () => { heals = 0; setLoose(false); look(); };
    const ro = new ResizeObserver(look);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    window.addEventListener("resize", again);
    look();
    return () => { window.clearTimeout(timer); ro.disconnect(); window.removeEventListener("resize", again); };
  }, [ref, print]);
  const tall = print ? "py-10" : `py-12 md:pb-[5.25rem] md:pt-[clamp(2.5rem,6vh,4.25rem)] ${loose ? "md:min-h-[100svh]" : "md:h-[100svh]"}`;
  return (
    <div ref={ref} data-screen data-stop="0" data-nostop data-loose={loose ? "" : undefined} {...rest} className={`relative flex flex-col ${tall} ${className}`}>
      <Wrap className={`flex min-h-0 flex-1 flex-col [container-type:inline-size] [justify-content:safe_center] ${GAP}`}>{children}</Wrap>
    </div>
  );
}

// A picture or a film at its own shape, as large as its screen has room for. On a short window it gives up height
// first and stays whole: its box shrinks, and the picture inside keeps its shape within it.
function Fill({ ratio, min = "9rem", className = "", children }: { ratio: number; min?: string; className?: string; children: ReactNode }) {
  return (
    <div data-fill className={`w-full shrink ${className}`} style={{ aspectRatio: String(ratio), minHeight: min, containerType: "size" }}>
      <div className="relative" style={{ width: `min(100cqw, calc(100cqh * ${ratio}))`, height: `min(100cqh, calc(100cqw / ${ratio}))` }}>{children}</div>
    </div>
  );
}

// A picture or a film with the words that belong to it. In a tall window they stand one under the other: `before`,
// the picture, `after`. In a window wide enough that its height holds the picture back (`wider:`), the picture
// stands on the left as tall as the screen allows, and the words are a column on its right.
function MediaRow({ ratio, before, after, children }: { ratio: number; before?: ReactNode; after?: ReactNode; children: ReactNode }) {
  return (
    <div data-media-row className={`flex min-h-0 shrink flex-col ${GAP} wider:max-h-[calc((100cqw-21rem)*var(--tall))] wider:min-h-[11rem] wider:flex-1 wider:flex-row wider:gap-x-[clamp(1.25rem,2.4vw,2.5rem)]`} style={{ "--tall": 1 / ratio } as CSSProperties}>
      <div className="contents wider:order-2 wider:flex wider:min-w-0 wider:flex-1 wider:flex-col wider:justify-center wider:gap-[clamp(0.75rem,2.6vh,1.75rem)]">
        {before && <div className="order-1 shrink-0">{before}</div>}
        {after && <div className="order-3 shrink-0">{after}</div>}
      </div>
      <Fill ratio={ratio} min="11rem" className="order-2 wider:order-1 wider:h-full wider:w-auto wider:shrink-0">{children}</Fill>
    </div>
  );
}

function PartHead({ n, label, title, lede }: { n: string; label: string; title: ReactNode; lede?: ReactNode }) {
  return (
    <Reveal className="shrink-0">
      <div className={`${TYPE.kicker} mb-[clamp(0.5rem,1.6vh,1.25rem)] flex items-center gap-3`} style={{ color: RED_INK }}>
        <span className="rounded-[3px] px-2 py-1 font-bold" style={{ background: RED, color: ON_RED }}>{n}</span><span className="h-0.5 w-10" style={{ background: RED }} /><span>{label}</span>
      </div>
      <h2 className={TYPE.h2}>{title}</h2>
      {lede && <p className={`${TYPE.lede} mt-[clamp(0.5rem,1.6vh,1.1rem)] max-w-5xl`}>{lede}</p>}
    </Reveal>
  );
}

// Each part ends on one claim: something new, not a summary.
// `big` is for a screen that holds little else: the claim is then the screen.
function Claim({ children, className = "", big = false }: { children: ReactNode; className?: string; big?: boolean }) {
  return (
    <blockquote className={`${big ? "max-w-6xl" : "max-w-5xl"} shrink-0 border-l-[6px] py-[clamp(0.3rem,1vh,0.6rem)] pl-6 ${className}`} style={{ borderLeftColor: RED, background: "linear-gradient(90deg, rgba(225,90,67,.18), transparent 75%)" }}>
      <p className={`${big ? "text-[clamp(1.6rem,min(4vw,6.4vh),4.2rem)] leading-[1.12] tracking-[-0.03em]" : "text-[clamp(1.2rem,min(2.5vw,4vh),2.5rem)] leading-snug tracking-[-0.015em]"} font-semibold`}>{children}</p>
    </blockquote>
  );
}

// Where a screen's numbers come from. One click away, so the screen itself stays clear; written out in print.
function Evidence({ children }: { children: ReactNode }) {
  const print = usePrintMode();
  if (print) return <p className="max-w-5xl text-[0.85rem] leading-relaxed text-muted">{children}</p>;
  return (
    <details data-sources className="group relative w-fit shrink-0">
      <summary className={`${TYPE.kicker} cursor-pointer list-none text-white/45 transition-colors hover:text-white/85 [&::-webkit-details-marker]:hidden`}>
        Sources <span aria-hidden className="inline-block transition-transform group-open:rotate-90">›</span>
      </summary>
      <div className="absolute bottom-full left-0 z-30 mb-2 w-[min(46rem,84vw)] rounded-lg p-4 text-[0.9rem] leading-relaxed shadow-2xl ring-1 ring-[#56616a]" style={{ background: "#1d2023", color: "#e4dfd5" }}>{children}</div>
    </details>
  );
}

// One number and what it counts.
function Stat({ n, children, color, line = "var(--color-border)", big = false }: { n: ReactNode; children: ReactNode; color?: string; line?: string; big?: boolean }) {
  return (
    <div className="border-t-2 pt-[clamp(0.5rem,1.6vh,1rem)]" style={{ borderTopColor: line }}>
      <b className={`${big ? LARGE : TYPE.big} block`} style={color ? { color } : undefined}>{n}</b>
      <span className={`${big ? TYPE.lede : `${TYPE.text} text-muted`} mt-[clamp(0.3rem,1.2vh,0.75rem)] block`}>{children}</span>
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
  // No game yet (a lane still waiting its turn): an empty slot.
  if (!g) return <span className={cls} style={{ ...box, background: "rgba(255,255,255,.03)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.07)" }} />;
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
// opponents named once above. The squares fill the width and shrink on a short window, so a board always fits its
// screen. A board with more than four lanes puts the name beside the squares in a wide window (where height is the
// scarce side) and above them in a tall one. Lanes past `shown` wait: named, empty and dimmed.
function Board({ rows, seeds, shown, ringed }: { rows: BoardRow[]; seeds: number[]; shown: number; ringed?: Set<string> }) {
  const opponents = RL.opponents;
  const side = rows.length > 4;
  const tip = (g: Cell, oi: number, si: number) => (g ? `${LEVELS[opponents[oi]]} (${LEVEL_HINT[opponents[oi]]}), start ${seeds[si] - 999} as ${FACTION[seeds[si]]}: ${WORD[g.result]} at ${clock(g.minutes)}` : undefined);
  // How tall a square may be. On a screen of the talk it is measured: the room the window leaves, shared by the
  // lanes, so the board fills the screen it has and never runs past it. Until measured (and in print) a safe guess
  // from the window height stands in, and the width caps it either way.
  const root = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<number | null>(null);
  const lanes = rows.length;
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let last: number | null = null, tries = 0, raf = 0;
    const measure = () => {
      const pin = el.closest<HTMLElement>("[data-screen]"), inner = pin?.firstElementChild as HTMLElement | null | undefined, sq = el.querySelector<HTMLElement>("[title]");
      // A screen that is as tall as its content (a phone, print) has no room to share out.
      if (!pin || !inner || !sq || Math.abs(pin.clientHeight - window.innerHeight) > 2) { last = null; setFit(null); return; }
      const cs = getComputedStyle(pin);
      const first = inner.firstElementChild, end = inner.lastElementChild;
      if (!first || !end) return;
      const used = end.getBoundingClientRect().bottom - first.getBoundingClientRect().top;
      const free = pin.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - used - 6;
      const step = free / lanes;
      // Shrink whenever the board runs over; grow only when there is real room, so it settles instead of flickering.
      if (step > 0 && step < 1.5) return;
      const next = Math.floor(Math.max(16, Math.min(side ? 56 : 76, sq.offsetHeight + step))); // never round up past the room there is
      if (next === last) return;
      last = next;
      setFit(next);
      // A lane is as tall as its name until its squares outgrow it, so one look is not always enough.
      if (tries++ < 12) { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); }
    };
    const fresh = () => { tries = 0; measure(); };
    fresh();
    const ro = new ResizeObserver(measure);
    if (el.parentElement) ro.observe(el.parentElement);
    window.addEventListener("resize", fresh);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener("resize", fresh); };
  }, [lanes, side]);
  const square = fit !== null ? `${fit}px` : side ? `min(3rem, max(1.1rem, (100svh - 500px) / ${lanes * 1.6}))` : `min(4rem, max(1.1rem, (100svh - 640px) / ${lanes}))`;
  const group: CSSProperties = { maxWidth: `calc(4 * ${square} + 3 * 0.4rem)` };
  const lane = side
    ? "grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 wide:grid-cols-[minmax(11rem,0.42fr)_1fr_5rem] wide:gap-x-6"
    : "grid grid-cols-[1fr_auto] items-end gap-x-4 gap-y-[clamp(0.35rem,1vh,0.6rem)]";
  const pad = "px-[clamp(0.75rem,1.3vw,1.4rem)]";
  const games = "grid grid-cols-4 gap-x-[clamp(0.6rem,2.2vw,2rem)]";
  return (
    <div ref={root} className="grid gap-[clamp(0.35rem,1vh,0.65rem)]">
      <div className={`${lane} ${pad}`}>
        <div className={side ? "hidden wide:block" : "hidden"} />
        <div className={`${games} col-span-2 ${side ? "wide:col-span-1" : ""}`}>
          {opponents.map((o) => <div key={o} className="text-[clamp(0.7rem,0.95vw,1.05rem)] font-semibold text-muted"><span className="hidden sm:inline">vs </span>{LEVELS[o]}</div>)}
        </div>
        <div className={side ? "hidden wide:block" : "hidden"} />
      </div>
      {rows.map((r, ri) => {
        // A lane still waiting its turn is there from the start, named and empty: the board keeps its shape, and the
        // result stays a surprise.
        const wait = ri >= shown, lit = r.accent && !wait;
        return (
          <div key={r.key} data-lane={wait ? "waiting" : "shown"} className={`${lane} ${pad} rounded-2xl py-[clamp(0.45rem,1.1vh,0.9rem)] transition-all duration-500 ${wait ? "opacity-45" : ""}`}
            style={{ background: lit ? "rgba(216,182,108,.12)" : "rgba(255,255,255,.035)", boxShadow: `inset 0 0 0 ${lit ? `1.5px ${OURS}` : "1px rgba(255,255,255,.06)"}` }}>
            <div className="order-1 min-w-0">
              <b className={`${side ? "block" : "mr-3 inline-block"} text-[clamp(1.05rem,min(1.55vw,2.7vh),1.8rem)] leading-tight`} style={lit ? { color: OURS } : undefined}>{r.label}</b>
              {r.sub && <span className={`${side ? "block" : "inline-block"} text-[clamp(0.78rem,min(0.95vw,1.75vh),1.05rem)] leading-snug text-muted`}>{r.sub}</span>}
            </div>
            <div className={`order-2 shrink-0 whitespace-nowrap text-right transition-opacity duration-500 ${wait ? "opacity-0" : ""} ${side ? "wide:order-3" : ""}`}>
              <b className="text-[clamp(1.6rem,min(2.6vw,4.4vh),3rem)] font-bold leading-none" style={lit ? { color: OURS } : undefined}>{r.total}</b>
              <span className="ml-1.5 text-[clamp(0.75rem,0.9vw,1rem)] text-muted">{r.of}</span>
            </div>
            <div className={`${games} order-3 col-span-2 ${side ? "wide:order-2 wide:col-span-1" : ""}`}>
              {opponents.map((o, oi) => (
                <div key={o} className="grid grid-cols-4 gap-[clamp(3px,0.45vw,0.4rem)]" style={group}>
                  {r.games[oi].map((g, si) => <Tile key={si} g={wait ? null : g} ours={r.accent} ring={!wait && ringed?.has(`${r.key}|${o}|${seeds[si]}`)} tip={wait ? undefined : tip(g, oi, si)} />)}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// A block shown one step at a time: Next, a key or a click moves it on. In print every step is shown; so it is on a
// phone, unless the block is a set of tabs (`tabs`), which works the same at every size.
function useSteps(count: number, tabs = false) {
  const print = usePrintMode();
  const compact = useCompact();
  const flat = print || (compact && !tabs);
  const { ref, at, setAt } = useStepped(flat ? 1 : count);
  return { ref, flat, print, at: flat ? count - 1 : Math.min(at, count - 1), setAt, last: count - 1 };
}

// Plain bars: bold label, the bar, the value. The label column shrinks on a phone.
function Bars({ items, max }: { items: { label: string; value: number; display: string; caption?: string; ours?: boolean }[]; max: number }) {
  return (
    <div className="grid shrink-0 gap-[clamp(0.2rem,0.8vh,0.5rem)]">
      {items.map((it) => {
        const w = Math.max(0.8, Math.min(100, (100 * it.value) / max)) * 0.6;
        return (
          <div key={it.label} className="grid min-h-[clamp(2.2rem,5.6vh,3.6rem)] grid-cols-[minmax(6.5rem,13rem)_1fr] items-center gap-3">
            <div className="min-w-0">
              <b className={`${TYPE.text} block leading-tight`} style={it.ours ? { color: OURS } : undefined}>{it.label}</b>
              {it.caption && <span className="block text-xs leading-snug text-muted">{it.caption}</span>}
            </div>
            <div className="relative h-[clamp(1.5rem,3.6vh,2.4rem)]">
              <div className="absolute inset-y-0 left-0 rounded-r" style={{ width: `${w}%`, background: it.ours ? OURS : GREY }} />
              <span className="absolute inset-y-0 flex items-center whitespace-nowrap text-[clamp(0.95rem,min(1.3vw,2.4vh),1.4rem)] font-bold" style={{ left: `calc(${w}% + 10px)` }}>{it.display}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Under a stepped block's heading: what a click does, and a way to see it all at once.
function StepHint({ flat, done, onNext, onAll, what }: { flat: boolean; done: boolean; onNext: () => void; onAll: () => void; what: string }) {
  if (flat) return <p className={`${TYPE.text} text-muted`}>Each row is one {what}.</p>;
  return (
    <p className={`${TYPE.text} flex min-h-[2.2em] shrink-0 flex-wrap items-center gap-x-4 gap-y-1 text-muted`}>
      <span>One {what} at a time.</span>
      {!done && <button type="button" onClick={onNext} className="rounded-md px-3.5 py-1 font-bold" style={{ color: ON_RED, background: BUTTON }}>Next {what} ›</button>}
      {!done && <button type="button" onClick={onAll} className="underline underline-offset-4 hover:text-white">Show all</button>}
    </p>
  );
}

// The stepped thing itself: while steps remain, a click anywhere on it shows the next one (the button above and
// the keys do the same, so nothing depends on the mouse).
function StepArea({ flat, done, onNext, children }: { flat: boolean; done: boolean; onNext: () => void; children: ReactNode }) {
  if (flat || done) return <div>{children}</div>;
  return <div role="presentation" onClick={onNext} className="cursor-pointer">{children}</div>;
}

/* ─── The title ─────────────────────────────────────────────────────────── */

const PARTS = ["What we built", "It said done", "Give it a ruler", "The game plays itself", "Can an AI play it?", "What no ruler catches", "Take it home"];

// Glide to a part's first screen (the title screen's list of parts).
const goToPart = (id: string) => {
  const el = document.querySelector<HTMLElement>(`[data-part="${id}"]`);
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: "smooth" });
};

// The title: one screen. In a wide window the tank stands beside the words; in a tall one it stands below them and
// takes all the height that is left.
function Hero() {
  return (
    <section data-screen data-stop="0" data-nostop style={GROUND} className="slide-dark relative flex min-h-[100svh] flex-col overflow-hidden bg-background text-foreground">
      {/* Command Red: a red bar across the top, red light behind the tank, the menu's screen lines over the ground. */}
      <div aria-hidden data-red-light className="pointer-events-none absolute inset-0"
        style={{ borderTop: `4px solid ${RED}`, background: `${SCANLINES}, radial-gradient(46% 58% at 76% 46%, rgba(225,90,67,.44), rgba(225,90,67,.13) 55%, transparent 78%), linear-gradient(180deg, rgba(225,90,67,.18), transparent 34%)` }} />
      <div className="relative z-10 border-b border-white/10">
        <Wrap className={`${TYPE.kicker} flex items-center justify-between py-5 text-white/55`}>
          <span>AI Tinkerers · Doha · Round 5</span>
          <span className="hidden sm:inline">16 Nov 2026</span>
        </Wrap>
      </div>
      <div className="relative z-10 flex min-h-0 flex-1 flex-col py-[clamp(1rem,3.5vh,2.5rem)]">
        <Wrap className="flex min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(12rem,1fr)] gap-x-8 gap-y-[clamp(0.75rem,2.5vh,1.75rem)] wide:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] wide:grid-rows-1 wide:items-center">
            <Reveal>
              <div className={`${TYPE.kicker} mb-[clamp(0.6rem,2vh,1.5rem)]`} style={{ color: RED_INK }}>One person · coding agents · one real-time strategy game</div>
              {/* As on the game's own title: the ink with a hard shadow and a red glow, and "AI" in the lighter red. */}
              <h1 className="mb-[clamp(0.75rem,2.6vh,2rem)] text-[clamp(2.6rem,min(6.3vw,10.5vh),6.75rem)] font-semibold leading-[0.92] tracking-[-0.05em]" style={{ textShadow: "0 3px 0 #000, 0 0 36px rgba(225,90,67,.22)" }}>
                Can an <span style={{ color: RED_INK }}>AI</span> play <br className="hidden wide:block" />our game?
              </h1>
              <p data-spine className="mb-[clamp(0.6rem,2vh,1.5rem)] max-w-5xl text-[clamp(1.25rem,min(2.2vw,3.7vh),2.3rem)] font-semibold leading-snug tracking-[-0.015em]">
                AI made building cheap. <span style={{ color: RED_INK }}>What got expensive was knowing what is true.</span>
              </p>
              <p className={`${TYPE.lede} max-w-4xl`}>
                We built a real-time strategy game with coding agents, learned to check their work the hard way, and then asked whether an AI could play it.
                Every number here comes from the project’s own logs and history.
              </p>
            </Reveal>
            <div data-hero-model className="flex min-h-0 flex-col wide:block">
              <UnitModel src={`${MEDIA}/models/qilin.glb`} poster={`${MEDIA}/models/qilin.jpg`} label="Our Qilin battle tank as a 3D model, turning slowly" className="min-h-0 w-full flex-1 wide:aspect-[4/3] wide:max-h-[62svh]" />
              <p className="mt-1 text-center font-mono text-[11px] uppercase tracking-[0.22em] text-white/45">Our Qilin tank · a generated 3D model · drag to turn</p>
            </div>
          </div>
        </Wrap>
      </div>
      <div className="relative z-10 pb-8 md:pb-[5.25rem]">
        <Wrap>
          {/* The seven parts, each a door to its first screen. */}
          <nav aria-label="The seven parts" className="grid grid-cols-2 gap-x-2 gap-y-1 border-t border-white/10 pt-3 sm:grid-cols-4 xl:grid-cols-7">
            {CHAPTERS.map((c, i) => (
              <button key={c.id} type="button" onClick={() => goToPart(c.id)} className="group flex items-baseline gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-white/[0.07]">
                <span className="font-mono text-sm font-bold" style={{ color: RED_INK }}>0{i + 1}</span>
                <span className="text-[clamp(0.8rem,1vw,1rem)] font-semibold leading-tight text-white/75 transition-colors group-hover:text-white">{PARTS[i]}</span>
              </button>
            ))}
          </nav>
        </Wrap>
      </div>
    </section>
  );
}

const cost = (b: (typeof R.brains)[number]) => (b.provider === "scripted" || b.provider === "local" ? "free" : `$${b.usd.toFixed(2)}`);
const speed = (b: (typeof R.brains)[number]) => (b.msPerTurn < 10 ? "under 0.01 s a turn" : `${(b.msPerTurn / 1000).toFixed(1)} s a turn`);

function SixteenGames() {
  const { ref, flat, at, setAt, last } = useSteps(R.brains.length + 1);
  const rows: BoardRow[] = R.brains.map((b) => ({
    key: b.provider, label: b.name, sub: <>{b.what} · {cost(b)} · {speed(b)}</>, accent: b.provider === "scripted",
    games: b.games.map((list) => R.seeds.map((s) => list.find((g) => g.seed === s) ?? null)), total: b.wins, of: `of ${b.played}`,
  }));
  const page = R.brains.find((b) => b.page)?.page;
  const fallbacks = R.brains.filter((b) => b.provider !== "scripted" && b.fallbacks).map((b) => `${b.name} ${b.fallbacks} of ${num(b.turns)}`);
  return (
    <Part>
      <Screen refEl={ref} data-board="games" data-step={at}>
        <div className="shrink-0">
          <h3 className={TYPE.h3}>Same 16 games. Four brains.</h3>
          <StepHint flat={flat} done={at >= last} onNext={() => setAt(Math.min(last, at + 1))} onAll={() => setAt(last)} what="brain" />
        </div>
        <StepArea flat={flat} done={at >= last} onNext={() => setAt(at + 1)}>
          <Board rows={rows} seeds={R.seeds} shown={at + 1} />
        </StepArea>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-8 gap-y-2">
          <Legend />
          <Evidence>
            Real games in our AI Arena, {day(R.madeAt)} 2026, on the live web game{page ? ` (page ${page.page})` : ""}. Map {R.map}, mirror factions, starts 1–4 = China, Iran, Turkey, Saudi. The game pauses
            while a model thinks, so its speed doesn’t change the result.{fallbacks.length ? ` Turns a model failed to answer, played by our rules instead: ${fallbacks.join(", ")}.` : ""}
          </Evidence>
        </div>
        <div className="shrink-0 transition-opacity duration-500" style={{ opacity: at >= R.brains.length ? 1 : 0 }}>
          <Claim>The hype isn’t what you need. Plain rules won {oursWins}; the best model won {bestModel}.</Claim>
        </div>
      </Screen>
    </Part>
  );
}

/* ─── 01 · What we built ────────────────────────────────────────────────── */

// Counted on 12 Nov 2026 with `git log --no-merges` in RTSAI-Mod, RTSAI-WebGame, RTSAI-Web and RTSAI-Art; "signed"
// means the commit names Claude as co-author (Codex adds no such line to its commits, so its share is in the rest).
// The clips are cut by the talk folder's built-clips.sh. `where` is the address a visitor opens; each was opened
// signed out on 12 Nov: the download needs no account, the others ask for the one free account.
const BUILT_COUNT = { commits: 1520, signed: 942, day: "12 Nov 2026" };
// `open` is the label of the button that opens the real thing. The web parts open live in their own tab (they need
// the one free account, and the game needs a browser tab of its own to run); the Windows game is a download.
const BUILT: { key: string; name: string; line: string; where: string; href: string; open: string }[] = [
  { key: "desktop", name: "Desktop game", line: "A Windows game with three games inside: Classic, RA2 and our own RTS.", where: "rtsai.net/download", href: "https://rtsai.net/download", open: "Get it for Windows" },
  { key: "web", name: "Web game", line: "The isometric game in a browser tab. Nothing to install.", where: "rtsai.net/play", href: "https://rtsai.net/play/", open: "Play it live" },
  { key: "simulator", name: "Battle simulator", line: "Pick any two armies, drop them on a map and press Fight.", where: "rtsai.net/play › Battle simulator", href: "https://rtsai.net/play/?mode=simulator", open: "Open it live" },
  { key: "places", name: "Real places", line: "Pick any place on Earth. It becomes a map you can play.", where: "rtsai.net/play › Map editor", href: "https://rtsai.net/play/?mode=earth", open: "Open it live" },
  { key: "studio", name: "Faction Studio", line: "Where every unit is made and checked: design, 3D model, sprite, animation, sound, cost.", where: "rtsai.net/faction-studio", href: "https://rtsai.net/faction-studio", open: "Open it live" },
];
const WHERE_PILL = "rounded-md bg-black/75 px-3.5 py-1.5 font-mono text-[clamp(0.8rem,1.05vw,1.1rem)] font-semibold backdrop-blur-sm";

// One thing at a time, big. Click a name (or press Next) to change it; click the picture to open the real thing.
function BuiltTour() {
  const { ref, print, at, setAt } = useSteps(BUILT.length, true);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  useEffect(() => {
    if (print) return;
    videos.current.forEach((v, i) => {
      if (!v) return;
      if (i === at) { v.currentTime = 0; void v.play().catch(() => {}); } else v.pause();
    });
  }, [at, print]);
  const now = BUILT[at];
  return (
    <Part lit>
      {print ? (
        <Screen data-part="built">
          <PartHead n="01" label="What we built" title="First, what we built." lede="Five things you can open today." />
          <div className="grid gap-x-8 gap-y-12 md:grid-cols-2">
            {BUILT.map((b, i) => (
              <div key={b.key}>
                <video src={`${MEDIA}/built-${b.key}.mp4`} poster={`${MEDIA}/built-${b.key}.jpg`} autoPlay muted loop playsInline preload="metadata" className="aspect-video w-full rounded-2xl bg-black" />
                <div className={`${TYPE.kicker} mt-4`} style={{ color: RED_INK }}>0{i + 1} · {b.name}</div>
                <p className="mt-2 text-[clamp(1.1rem,2vw,1.6rem)] font-semibold leading-snug">{b.line}</p>
                <a href={b.href} target="_blank" rel="noreferrer" className="mt-2 inline-block font-mono text-sm font-semibold underline underline-offset-4" style={{ color: RED_INK }}>{b.where} →</a>
              </div>
            ))}
          </div>
        </Screen>
      ) : (
        // One screen: the heading, the five names, the picture of the one that is picked, and what it is.
        <Screen refEl={ref} data-part="built" data-built-tour data-step={at}>
          <PartHead n="01" label="What we built" title="First, what we built." />
          {/* The picture is the door: one click opens the real thing in its own tab. */}
          <MediaRow ratio={16 / 9}
            before={
              <div role="tablist" aria-label="What we built" className="flex flex-wrap gap-x-[clamp(0.4rem,1vw,1rem)] gap-y-2 wider:flex-col wider:flex-nowrap wider:items-stretch">
                {BUILT.map((b, i) => (
                  <button key={b.key} type="button" role="tab" aria-selected={i === at} onClick={() => setAt(i)}
                    className="rounded-md px-[clamp(0.7rem,1.2vw,1.2rem)] py-[clamp(0.35rem,1vh,0.55rem)] text-left text-[clamp(0.9rem,min(1.35vw,2.4vh),1.4rem)] font-semibold transition-colors duration-200 hover:text-white"
                    style={i === at ? { background: BUTTON, color: ON_RED } : { color: "rgba(245,239,228,.62)", boxShadow: "inset 0 0 0 1px #56616a" }}>
                    {b.name}
                  </button>
                ))}
              </div>
            }
            after={<p className="min-h-[1.4em] max-w-6xl text-[clamp(1.05rem,min(1.9vw,3.2vh),1.9rem)] font-semibold leading-snug wider:min-h-[5.6em] wider:text-[clamp(1rem,min(1.5vw,2.7vh),1.55rem)]">{now.line}</p>}>
            <a href={now.href} target="_blank" rel="noreferrer" data-built-stage aria-label={`${now.open}: ${now.where}`}
              className="group absolute inset-0 block overflow-hidden rounded-lg bg-black ring-1 ring-[#56616a] transition hover:ring-2 hover:ring-[#e15a43]">
              {BUILT.map((b, i) => (
                <video key={b.key} ref={(el) => { videos.current[i] = el; }} src={`${MEDIA}/built-${b.key}.mp4`} poster={`${MEDIA}/built-${b.key}.jpg`} muted loop playsInline preload="metadata"
                  aria-hidden={i !== at} className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500" style={{ opacity: i === at ? 1 : 0 }} />
              ))}
              <Brackets />
              <span data-built-where className={`${WHERE_PILL} absolute bottom-[4%] left-[2.5%] z-10 text-white`}>{now.where}</span>
              <span data-built-open className="absolute bottom-[4%] right-[2.5%] z-10 flex items-center gap-2 rounded-md px-[clamp(0.8rem,1.4vw,1.4rem)] py-[clamp(0.3rem,1vh,0.5rem)] text-[clamp(0.85rem,min(1.25vw,2.3vh),1.3rem)] font-bold shadow-lg transition group-hover:scale-105" style={{ background: BUTTON, color: ON_RED }}>
                {now.open} <span aria-hidden>↗</span>
              </span>
            </a>
          </MediaRow>
        </Screen>
      )}
      <Screen>
        <div className="grid shrink-0 gap-x-8 gap-y-6 sm:grid-cols-3">
          <Stat big n={num(BUILT_COUNT.commits)}>commits in four repositories: the game, the web game, the website and the art</Stat>
          <Stat big n={num(BUILT_COUNT.signed)}>of them signed by Claude as co-author</Stat>
          <Stat big n="8½ hours" color={OURS} line={OURS}>from the web game’s first commit to a battle you could play</Stat>
        </div>
        <Claim big className={GROUP}>All of it was built with coding agents. Building was not the hard part.</Claim>
        <Evidence>
          Counted on {BUILT_COUNT.day} with git log, merges left out: {num(BUILT_COUNT.commits)} commits in four repositories (game, web game, website, art);{" "}
          {num(BUILT_COUNT.signed)} are signed by Claude as co-author; Codex does not sign its commits, so its share is in the rest. On screen: screenshots of the
          1 Nov Windows release, the website’s trailer, the live web game filmed on 11 and 12 Nov, and the Faction Studio on our own machine. The web game:
          first commit at 02:28 and a playable skirmish at 11:03 on 7 Oct. The live pages open in their own tab and ask for the one free account.
        </Evidence>
      </Screen>
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

/* ─── 02 · It said done. It wasn't. ─────────────────────────────────────── */

// What an agent reported, and what was really there. Each pair read from its source on 12 Nov 2026:
//   models  hq/games/HANDOFF-claude-2026-10-05.md: "122 / 122 GLB jobs"; new native exports "0 VXL, 0 HVA, 0 SHP"; clips "0 / 0".
//   tests   hq/games/artifacts/quality-check-20261025/CHECK.md: 77 scripts, 24 pass, 51 not run, 7 named as out of date.
//   score   RTSAI-Art README (pilot, 3 Oct): Qilin voxel-v2 scored 81.5 against a bar of 70;
//           RTSAI-Art docs/original-vs-generated.md: the same tank failed 9 of 15 checks beside the original game's vehicles.
const RECEIPTS: { when: string; said: string; saidNote: string; had: string; hadNote: string }[] = [
  { when: "5 Oct", said: "122 of 122", saidNote: "3D models generated, one for every new unit",
    had: "0", hadNote: "in the game. None was converted to the game’s own format, and none could move." },
  { when: "25 Oct", said: "77", saidNote: "test scripts written for the web game",
    had: "24", hadNote: "ran and passed. 51 had not been run, and 7 waited for buttons that no longer existed." },
  { when: "3 Oct", said: "81.5 of 100", saidNote: "the art pipeline’s score for its own tank (pass mark 70)",
    had: "9 of 15", hadNote: "checks failed, once the tank stood beside the original game’s tanks." },
];

// Eight of the generated designs (cut from the art repository's review sheet of 4 Oct) and the 3D model each one got.
// The models here are talk-sized copies: 10,000 of their 30,000 triangles and smaller textures, to load quickly.
const MODELS: [string, string][] = [
  ["qilin", "Qilin Battle Tank"], ["seadragon", "Sea Dragon IFV"], ["lynx", "Lynx Command Scout"], ["mantis", "Mantis Air Defense"],
  ["longbow", "Longbow Rocket Artillery"], ["skyspear", "Skyspear Interceptor"], ["cloud", "Cloud Recon Drone"], ["crane", "Crane Airlift"],
];

// Click a design; its generated 3D model loads on the stage, and you can turn it. In print the designs stand alone.
function ModelShelf() {
  const [pick, setPick] = useState(0);
  const [id, name] = MODELS[pick];
  // The stage takes the room the screen leaves. In a wide window the eight designs stand in a column beside it; in a
  // tall one they are a row below it.
  return (
    <div data-model-shelf className="flex min-h-0 shrink flex-col gap-3 wide:h-[min(60svh,42rem)] wide:min-h-[13rem] wide:flex-row">
      <div className="relative aspect-video min-h-[11rem] w-full shrink overflow-hidden rounded-lg ring-1 ring-[#56616a] wide:aspect-auto wide:min-h-0 wide:w-auto wide:min-w-0 wide:flex-1" style={{ background: "linear-gradient(180deg, rgba(43,48,52,.96), rgba(21,23,25,.96))" }}>
        <Brackets />
        <UnitModel key={id} src={`${MEDIA}/models/${id}.glb`} poster={`${MEDIA}/models/${id}.jpg`} label={`${name}: the generated 3D model, turning slowly`} className="!absolute inset-0" />
        <div className={`${TYPE.kicker} absolute left-9 top-6`} style={{ color: RED_INK }}>{name} · generated 3D model</div>
        <div className="absolute bottom-5 right-9 font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">Drag to turn</div>
      </div>
      <div className="grid shrink-0 grid-cols-4 gap-2 sm:grid-cols-8 wide:aspect-[2/3] wide:h-full wide:grid-cols-2 wide:grid-rows-4">
        {MODELS.map(([mid, mname], i) => (
          <button key={mid} type="button" aria-pressed={i === pick} aria-label={`Show the 3D model of the ${mname}`} title={mname} onClick={() => setPick(i)}
            className="aspect-[4/3] min-h-0 overflow-hidden rounded-md transition hover:opacity-100 wide:aspect-auto" style={{ boxShadow: `0 0 0 ${i === pick ? `3px ${RED}` : "1px rgba(255,255,255,.12)"}`, opacity: i === pick ? 1 : 0.7 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${MEDIA}/models/${mid}.jpg`} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

function DonePart() {
  return (
    <Part id="done">
      <Screen data-part="done">
        <PartHead n="02" label="The catch" title="It said done. It wasn’t."
          lede="Three reports from the agents. Every number in them was true. None of the three jobs was finished." />
        <ModelShelf />
        <p className={`${TYPE.text} shrink-0 text-muted`}>
          Eight of the 122 unit designs the agents generated on 4 Oct, and the 3D model each one got. Click a design, then turn its model. They looked finished.
        </p>
      </Screen>
      <Screen>
        <div className="shrink-0">
          {RECEIPTS.map((r) => (
            <div key={r.said} data-receipt className="grid items-start gap-x-6 gap-y-3 border-t border-border py-[clamp(0.6rem,2.3vh,1.75rem)] md:grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)]">
              <div>
                <div className={`${TYPE.kicker} mb-[clamp(0.3rem,1.2vh,0.75rem)] text-white/50`}>{r.when} · the report</div>
                <b className={`${TYPE.big} block`} style={{ color: LIGHT }}>{r.said}</b>
                <span className={`${TYPE.text} mt-[clamp(0.3rem,1.2vh,0.75rem)] block max-w-lg text-muted`}>{r.saidNote}</span>
              </div>
              <div className="hidden pt-[clamp(1.25rem,4vh,2.25rem)] text-3xl text-muted md:block" aria-hidden>→</div>
              <div>
                <div className={`${TYPE.kicker} mb-[clamp(0.3rem,1.2vh,0.75rem)]`} style={{ color: RED_INK }}>What was there</div>
                <b className={`${TYPE.big} block`} style={{ color: RED_INK }}>{r.had}</b>
                <span className={`${TYPE.text} mt-[clamp(0.3rem,1.2vh,0.75rem)] block max-w-lg`}>{r.hadNote}</span>
              </div>
            </div>
          ))}
        </div>
        <Claim>An agent counts what it made. I had to look at what I got.</Claim>
        <Evidence>
          Models: the 5 Oct handoff note between agents (122 of 122 model jobs; 0 exports to the game’s formats; 0 animations). Tests: the 25 Oct check of
          the web game’s tools folder. Score: the art pipeline’s own gate on its pilot tank, 3 Oct, and the comparison written the same day.
        </Evidence>
      </Screen>
    </Part>
  );
}

/* ─── 03 · Give it a ruler ──────────────────────────────────────────────── */

// The ruler was the original game: 15 measured checks against its own vehicles (RTSAI-Art docs/original-vs-generated.md,
// 3 Oct). A prototype that changed only the light, the scale and the palette went from 9 failed checks to 0.
// Icons, against the original game's build-menu icons: RTSAI-Art a305e23e (image-model icons 0 of 122; first renders 76),
// 7f56f859 (120), e5e0e8d1 (122 of 122), 5 and 6 Oct.
// The ruler's own faults: RTSAI-Art docs/sprite-vs-voxel.md (previews drew 0.63 px per voxel, the engine draws 1.267);
// RTSAI-Mod 1e0a5e0 and 31912c4 (3 Oct: unfair duel lines; 8-0 became 4-4 and 3-5); RTSAI-WebGame bb7e949 (4 Nov).
const ICONS = [
  { label: "Painted by an image model", value: 0, display: "0 of 122 pass" },
  { label: "Rendered from the unit’s own 3D model", value: 76, display: "76" },
  { label: "Second pass", value: 120, display: "120" },
  { label: "Third pass", value: 122, display: "122 of 122", ours: true },
];
const RULER_FAULTS: [string, string][] = [
  ["The preview drew every unit at half size", "0.63 pixels per block, where the game draws 1.27. The first art was judged at the wrong size."],
  ["The duel test was unfair", "One side always started on the same line. Once that was fixed, an 8–0 became 4–4 and another became 3–5."],
  ["A model that never answered", "Two local models spent their whole answer thinking, so every turn quietly fell back to our rules."],
];

function RulerPart() {
  const strip = "absolute inset-0 h-full w-full rounded-xl [image-rendering:pixelated]";
  const STRIP = 1320 / 252; // the two strips' own shape
  return (
    <Part id="ruler">
      {/* The tank, first try and as shipped, and its three scores: beside the strips in a wide window, under them in a tall one. */}
      <Screen data-part="ruler">
        <PartHead n="03" label="The ruler" title="Give it a ruler."
          lede="A score means nothing until it stands beside something you know is good. Our ruler was the original game." />
        <div className={`flex min-h-0 shrink flex-col gap-x-10 ${GAP} wide:flex-row`}>
          <div className="flex min-h-0 shrink flex-col justify-center gap-[clamp(0.3rem,1vh,0.6rem)] wide:min-w-0 wide:flex-[1.5]">
            <div className={`${TYPE.kicker} shrink-0 text-white/50`}>First try · generated, then turned into game blocks</div>
            <Fill ratio={STRIP} min="3rem">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${MEDIA}/ruler-first.png`} alt="The generated tank from four sides at game size: dark, muddy and hard to read" className={strip} />
            </Fill>
            <div className={`${TYPE.kicker} mt-[clamp(0.3rem,1.4vh,1rem)] shrink-0`} style={{ color: OURS }}>The same model, drawn as a sprite · the route that shipped</div>
            <Fill ratio={STRIP} min="3rem">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${MEDIA}/ruler-shipped.png`} alt="The same tank from four sides, drawn as a sprite: lighter, with clear camouflage and a readable shape" className={strip} />
            </Fill>
            <p className="shrink-0 text-sm text-muted">Our own tank, the Qilin, three times the size it has in the game.</p>
          </div>
          <div className="grid shrink-0 gap-x-6 gap-y-[clamp(0.6rem,2.2vh,1.5rem)] sm:grid-cols-3 wide:flex-1 wide:shrink wide:grid-cols-1 wide:content-center">
            {[
              ["Its own score", "81.5", "of 100, pass mark 70", LIGHT],
              ["Beside the original game’s tanks", "9 failed", "of 15 measured checks", RED_INK],
              ["After changing only light, size and colours", "0 failed", "same model, same checks", OURS],
            ].map(([k, n, s, c]) => (
              <div key={k} className="border-t border-border pt-[clamp(0.4rem,1.4vh,1rem)]">
                <div className={`${TYPE.text} text-muted`}>{k}</div>
                <b className={`${TYPE.big} mt-[clamp(0.2rem,0.9vh,0.5rem)] block`} style={{ color: c }}>{n}</b>
                <span className="mt-1 block text-sm text-muted">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </Screen>

      {/* The icons, then the ruler's own faults: two columns in a wide window, one under the other in a tall one. */}
      <Screen>
        <div className={`grid shrink-0 gap-x-12 ${GAP} wide:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] wide:items-start`}>
          <div>
            <h3 className={TYPE.h3}>The same ruler, for 122 build-menu icons</h3>
            <p className={`${TYPE.text} mb-[clamp(0.6rem,2vh,1.25rem)] mt-1 text-muted`}>How many pass, measured against the original game’s icons.</p>
            <Bars max={122} items={ICONS} />
          </div>
          <div>
            <h3 className={`${TYPE.h3} mb-[clamp(0.6rem,2vh,1.25rem)]`}>Then check the ruler.</h3>
            <div className="grid gap-x-8 gap-y-[clamp(0.6rem,2vh,1.25rem)] md:grid-cols-3 wide:grid-cols-1">
              {RULER_FAULTS.map(([h, b]) => (
                <div key={h} className="border-t border-border pt-[clamp(0.4rem,1.4vh,0.9rem)]">
                  <h4 className={TYPE.h4}>{h}</h4>
                  <p className={`${TYPE.text} mt-1 text-muted`}>{b}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Claim className={GROUP}>Compare it with something you know is good. Then check the ruler.</Claim>
        <Evidence>
          The 15 checks measure light, size, colour and detail against the original game’s own vehicles, which all pass against each other. The 9 and the 0
          are the same generated model before and after a change to light, scale and palette only (3 Oct). The icons: 5 and 6 Oct.
        </Evidence>
      </Screen>
    </Part>
  );
}

/* ─── 04 · Let the game play itself ─────────────────────────────────────── */

// RTSAI-Mod 46dcbd3 (2 Oct): "30-minute game takes ~45-120 s of wall time". Balance games: 8,808 match rows in
// RTSAI-Mod docs/balance-data (counted 12 Nov 2026; the two duel files are left out).
// Showdown: RTSAI-WebGame evals/faction-showdown-20261022 (21 and 22 Oct): 120 games before the fixes and 230 after,
// bugs.json B1 to B7, and the effects audit (329 of 3,912 deaths drew nothing; after the fix, 0).
const SELF_PLAY: [string, string][] = [
  ["8,808", "balance games, to set what every unit costs"],
  ["350", "games, every faction against every faction"],
  ["7", "bugs that no person had found"],
];
const SELF_BUGS: [string, string][] = [
  ["40 minutes", "Starting with $2,500, each army built a power plant, then stood idle for the whole game. Nobody could ever afford a refinery."],
  ["329 of 3,912", "unit deaths showed nothing on screen: the unit just vanished. After the fix: 0."],
  ["Mind control", "did nothing at all for nine of the countries. Neither did two ships’ aircraft."],
];

function SelfPlayPart() {
  return (
    <Part id="selfplay">
      <Screen data-part="selfplay">
        <PartHead n="04" label="Self-play" title="Let the game play itself." />
        <MediaRow ratio={16 / 9}
          before={<p className={`${TYPE.lede} max-w-5xl`}>A 30-minute battle runs in about a minute with nobody watching. So the game played itself, thousands of times.</p>}
          after={<p className={`${TYPE.text} text-muted`}>AI against AI, 21 and 22 Oct: three of the 350 games. Nobody is playing.</p>}>
          <video data-bots src={`${MEDIA}/bots.mp4`} poster={`${MEDIA}/bots.jpg`} autoPlay muted loop playsInline preload="metadata" className="absolute inset-0 h-full w-full rounded-xl bg-black object-cover" />
        </MediaRow>
      </Screen>
      <Screen>
        <div className="grid shrink-0 gap-x-8 gap-y-6 sm:grid-cols-3">
          {SELF_PLAY.map(([n, t], i) => <Stat key={t} n={n} color={i === 2 ? RED_INK : undefined} line={i === 2 ? RED : undefined}>{t}</Stat>)}
        </div>
        <div className={`${GROUP} shrink-0`}>
          <h3 className={`${TYPE.h3} mb-[clamp(0.5rem,1.8vh,1.25rem)]`}>Three of the seven</h3>
          {SELF_BUGS.map(([n, t]) => (
            <div key={n} className="grid items-baseline gap-x-8 gap-y-1 border-t border-border py-[clamp(0.5rem,1.9vh,1.25rem)] md:grid-cols-[minmax(0,17rem)_1fr]">
              <b className="text-[clamp(1.4rem,min(2.6vw,4.2vh),2.6rem)] font-bold leading-none tracking-[-0.02em]" style={{ color: RED_INK }}>{n}</b>
              <span className="text-[clamp(1rem,min(1.3vw,2.3vh),1.35rem)] leading-snug">{t}</span>
            </div>
          ))}
        </div>
        <Claim>Our best tester was the game itself, played thousands of times.</Claim>
        <Evidence>
          Balance: bot against bot on the desktop game, 2 to 8 Oct, six rounds. Showdown: all 16 factions on the live web game, 120 games before the fixes
          and 230 after; the film is from its own record. The seven bugs and their fixes are listed in that record.
        </Evidence>
      </Screen>
    </Part>
  );
}

/* ─── 05 · So: can an AI play it? ───────────────────────────────────────── */

// The experiment, folded into one part on 12 Nov 2026 (it was five parts). What went: the turn-loop diagram, the code
// screens, the prompt and the duel, the rules timeline and the git log. The two boards and the numbers stay.
function WhyBrief() {
  const order = R.brains.map((b) => W.brains.find((w) => w.provider === b.provider)!);
  const at = (p: string) => order.find((w) => w.provider === p)!.firstBarracksMin;
  const firstWins = P.models.reduce((s, m) => s + m.first.wins, 0);
  const coachedWins = P.models.reduce((s, m) => s + m.coached.wins, 0);
  const usd = P.models.reduce((s, m) => s + m.coached.usd, 0);
  const facts: [ReactNode, string][] = [
    [<><span style={{ color: OURS }}>{clock(at("scripted"))}</span> <span className="text-muted">vs</span> {clock(at("jev"))}</>, "When the army started: our rules, then Jev and Gemma"],
    [<>{firstWins} <span className="text-muted">→</span> <span style={{ color: OURS }}>{coachedWins}</span></>, "Then we gave the models our rules as advice. Games won, of 48"],
    [<><span style={{ color: RED_INK }}>0</span> <span className="text-[0.5em] font-semibold text-muted">of 24</span></>, "Against Hard and Brutal, with the advice"],
  ];
  return (
    <Part>
      <Screen>
        <div className="shrink-0">
          <h3 className={TYPE.h3}>Why the models lost: they did what we told them.</h3>
          <p className={`${TYPE.lede} mt-[clamp(0.3rem,1.2vh,0.9rem)] max-w-5xl`}>Their instructions said “Economy first.” So they saved money while the enemy built an army.</p>
        </div>
        <div className={`grid shrink-0 gap-x-12 ${GAP} wide:grid-cols-2 wide:items-center`}>
          <div>
            <h4 className={`${TYPE.h4} mb-[clamp(0.4rem,1.6vh,1rem)]`}>Money left unspent at minute 5</h4>
            <Bars max={10000} items={order.map((w) => ({ label: w.name, value: w.creditsAt5, display: num(Math.round(w.creditsAt5)), ours: w.provider === "scripted" }))} />
          </div>
          <div className="grid gap-x-6 gap-y-[clamp(0.5rem,1.8vh,1.25rem)] sm:grid-cols-3 wide:grid-cols-1">
            {facts.map(([n, t]) => (
              <div key={t} className="border-t border-border pt-[clamp(0.4rem,1.4vh,0.9rem)] wide:grid wide:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] wide:items-center wide:gap-x-5">
                <b className={`${TYPE.big} block whitespace-nowrap`}>{n}</b>
                <span className={`${TYPE.text} mt-2 block text-muted wide:mt-0`}>{t}</span>
              </div>
            ))}
          </div>
        </div>
        <Claim className={GROUP}>Better advice fixed the opening. It didn’t fix the hard games.</Claim>
        <Evidence>
          The middle of each brain’s 16 games. Luna started its army at {clock(at("openai"))}. With the advice: {P.models.map((m) => `${m.name} ${m.coached.wins}–${m.coached.draws}–${m.coached.losses}`).join(", ")} (won–draw–lost),
          for ${usd.toFixed(2)}; every one of those wins came against Normal or Rush.
        </Evidence>
      </Screen>
    </Part>
  );
}

type RuleRow = (typeof RL.evening.rows)[number] | (typeof RL.flags.rows)[number];
const ruleRow = (r: RuleRow): BoardRow => ({
  key: r.key, label: r.label, sub: r.what, accent: r.key === "both", games: r.games as Cell[][], total: r.wins,
  of: `of ${r.finished}${r.played > r.finished ? " finished" : ""}`,
});

function Switches() {
  const { ref, flat, at, setAt, last } = useSteps(RL.flags.rows.length + 1);
  const ringed = new Set(at >= RL.flags.rows.length ? RL.together.flatMap((t) => ["counters", "hunt", "both"].map((k) => `${k}|${t.opponent}|${t.seed}`)) : []);
  return (
    <Part>
      {/* Why one switch at a time: the evening several rules changed at once. */}
      <Screen>
        <h3 className={`${TYPE.h3} shrink-0`}>How the rules got good: one switch at a time.</h3>
        <div className={`grid shrink-0 items-center gap-x-10 ${GAP} md:grid-cols-[auto_minmax(0,1fr)]`}>
          <b className={HUGE}>
            {ev("base").wins} <span className="text-muted">→</span> <span style={{ color: RED_INK }}>{ev("defence").wins}</span>
          </b>
          <p className={`${TYPE.lede} max-w-3xl`}>
            wins of {ev("base").finished}, the evening we changed several rules at once. Nothing told us which rule had hurt.
          </p>
        </div>
        <p className={`${GROUP} max-w-5xl shrink-0 text-[clamp(1.2rem,min(2.5vw,4vh),2.5rem)] font-semibold leading-snug tracking-[-0.015em]`} style={{ color: OURS }}>
          So each idea became one switch, tested alone on the same 16 games.
        </p>
      </Screen>
      <Screen refEl={ref} data-board="switches" data-step={at}>
        <div className="shrink-0">
          <h3 className={TYPE.h3}>One switch at a time, the same 16 games</h3>
          <StepHint flat={flat} done={at >= last} onNext={() => setAt(Math.min(last, at + 1))} onAll={() => setAt(last)} what="switch" />
        </div>
        <StepArea flat={flat} done={at >= last} onNext={() => setAt(at + 1)}>
          <Board rows={RL.flags.rows.map(ruleRow)} seeds={RL.flags.seeds} shown={at + 1} ringed={ringed} />
        </StepArea>
        <p className="shrink-0 text-[clamp(1.05rem,min(1.7vw,2.9vh),1.75rem)] font-semibold transition-opacity duration-500" style={{ color: OURS, opacity: at >= RL.flags.rows.length ? 1 : 0 }}>
          Each switch alone lost the ringed games. Together they won {RL.together.length === 2 ? "both" : "them all"}.
        </p>
      </Screen>
      {/* The claim, and the caution that belongs beside it. */}
      <Screen>
        <Claim big>Our rules aren’t clever. They were tested, one switch at a time.</Claim>
        <div data-caution className={`${GROUP} grid shrink-0 items-center gap-x-10 ${GAP} md:grid-cols-[auto_minmax(0,1fr)]`}>
          <b className={HUGE}>
            <span style={{ color: OURS }}>{fl("both").wins}</span> <span className="text-muted">→</span> {oursWins}
          </b>
          <p className={`${TYPE.lede} max-w-3xl`}>
            <b className="text-foreground">One caution.</b> Ten days later the same rules played the same 16 games again and won {oursWins}, not {fl("both").wins}.
            One game per square is a small sample, and results move between runs.
          </p>
        </div>
        <Evidence>
          Map {RL.map}, starts 1–4 = China, Iran, Turkey, Saudi. Where a start was played twice, the later game counts. On a map the rules had never seen,
          they went from {RL.newMap.before.wins} to {RL.newMap.adopted.wins} wins of {RL.newMap.adopted.played}. The models were never tried on a second map.
        </Evidence>
      </Screen>
    </Part>
  );
}

function Twist() {
  const commits = H.brain.commits;
  const coBy = commits.filter((c) => /Claude/.test(c.coAuthor ?? "")).length;
  const loop = ["Read a lost game’s log", "Add one idea as a switch", "Play the same 16 games", "Keep it or drop it"];
  return (
    <Part>
      <Screen>
        <h3 className={`${TYPE.h3} shrink-0`}>So who wrote our rules?</h3>
        <div className={`grid shrink-0 items-center gap-x-10 ${GAP} md:grid-cols-[auto_minmax(0,1fr)]`}>
          <b className={HUGE} style={{ color: RED_INK }}>
            {coBy} <span className="text-[0.4em] font-semibold tracking-normal text-muted">of {commits.length}</span>
          </b>
          <div>
            <p className={TYPE.lede}>commits to the rules were co-authored by Claude.</p>
            <p className="mt-2 font-mono text-[clamp(0.8rem,min(1.05vw,1.9vh),1.1rem)] text-white/45">git log tools/arena/brain.mjs</p>
          </div>
        </div>
        <div className={`${GROUP} grid shrink-0 gap-[clamp(0.4rem,1vw,0.9rem)] sm:grid-cols-2 lg:grid-cols-4`}>
          {loop.map((t, i) => (
            <div key={t} className="rounded-lg px-4 py-[clamp(0.6rem,2vh,1.25rem)] ring-1 ring-[#56616a]" style={{ background: "rgba(255,255,255,.035)" }}>
              <div className="font-mono text-xs font-bold" style={{ color: RED_INK }}>{i < loop.length - 1 ? `0${i + 1} →` : `0${i + 1} ↺`}</div>
              <div className={`${TYPE.h4} mt-1`}>{t}</div>
            </div>
          ))}
        </div>
      </Screen>
      <Screen>
        <div className="max-w-6xl shrink-0">
          <ScrollRevealText mode="word" stagger={0.09} className="text-[clamp(2.3rem,min(7.4vw,12vh),7.5rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-white">
            The AI that wins isn’t the one playing. It’s the one that wrote the player.
          </ScrollRevealText>
        </div>
      </Screen>
    </Part>
  );
}

function PlayPart() {
  return (
    <div id="play">
      <Part lit>
        <Screen data-part="play">
          <PartHead n="05" label="The bet" title="So: can an AI play it?" />
          <MediaRow ratio={16 / 9}
            before={<p className={`${TYPE.lede} max-w-5xl`}>The same ruler, pointed at the AI itself. Three AI models and one page of plain rules each played the same 16 games against the game’s own AI.</p>}
            after={<p className={`${TYPE.text} text-muted`}><b className="text-foreground">Same start. Same enemy. Four brains.</b> Brutal, start 1 (China): the four games side by side, clocks in step.</p>}>
            <video src={`${MEDIA}/four-brains.mp4`} poster={`${MEDIA}/four-brains.jpg`} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full rounded-xl bg-black object-cover" />
          </MediaRow>
        </Screen>
      </Part>
      <SixteenGames />
      <WhyBrief />
      <Switches />
      <Twist />
    </div>
  );
}

/* ─── 06 · What no ruler catches ────────────────────────────────────────── */

// Taste: RTSAI-WebGame docs/PLAYTEST-LOG.md, the owner's reports of 26 Oct (2 to 4: three art bugs; 6 and 7: the shots),
// and 9c733d8 (1 Nov): eleven unit types whose turret always pointed north. The pictures are from that fix's own
// before/after capture (hq/games/artifacts/playtest-20261101/muzzle).
// Attention: the owner's instruction files (51 folders and 381 GB left on one drive, 8 to 27 Oct; one fix that grew
// into 11 sessions, by 10 Nov); hq/games/artifacts/build-journey-20261024/OUTLINE.md, beat 9 (a release on 26 Oct
// went out without two finished fixes, every check green; they shipped on 1 Nov).
const TASTE: [string, ReactNode][] = [
  ["I played for ten minutes", <>and said: the shots look wrong.</>],
  ["We measured 90 shells", <>They landed 2 pixels from the target. Not a bug.</>],
  ["The measuring found the real one", <>On 11 kinds of unit the turret always pointed north.</>],
];
const ATTENTION: [string, string][] = [
  ["381 GB", "of leftover copies of the project in 51 folders. None held anything new."],
  ["11 sessions", "grew out of one small fix. Half my turns were clicks on whatever a session offered."],
  ["6 days", "two finished fixes waited, after a second agent released without them. Every check was green."],
];
const FOR_ME: [string, string][] = [
  ["One release command", "It builds only from the latest code, and it refuses when something is off."],
  ["Rules with their reason", "Written where every agent reads them, each with the incident that caused it."],
  ["A step back", "Before any big job, one question: which of my goals does this serve?"],
];

function HumanPart() {
  const shot = "absolute inset-0 h-full w-full rounded-xl [image-rendering:pixelated]";
  const SHOT = 600 / 540; // the two pictures' own shape
  return (
    <Part id="human">
      {/* Taste: the three steps, and the turret before and after. Side by side in a wide window, stacked in a tall one. */}
      <Screen data-part="human">
        <PartHead n="06" label="The human" title="What no ruler catches."
          lede="Two things stayed mine the whole way: taste and attention." />
        <div className={`flex min-h-0 shrink flex-col gap-x-10 ${GAP} wide:flex-row`}>
          <div className="flex shrink-0 flex-col justify-center wide:min-w-0 wide:flex-1 wide:shrink">
            {TASTE.map(([h, b], i) => (
              <div key={h} className="grid grid-cols-[2.25rem_1fr] gap-x-3 border-t border-border py-[clamp(0.5rem,1.9vh,1.25rem)]">
                <span className="font-mono text-sm font-bold" style={{ color: RED_INK }}>0{i + 1}</span>
                <div>
                  <b className="block text-[clamp(1.1rem,min(1.7vw,3vh),1.75rem)] leading-tight">{h}</b>
                  <span className="mt-1 block text-[clamp(0.95rem,min(1.3vw,2.3vh),1.35rem)] leading-snug text-muted">{b}</span>
                </div>
              </div>
            ))}
            <p className="mt-[clamp(0.4rem,1.6vh,1.25rem)] text-[clamp(1.1rem,min(1.8vw,3.1vh),1.75rem)] font-semibold" style={{ color: OURS }}>My eye found it. The ruler located it.</p>
          </div>
          <div className="flex min-h-0 shrink flex-col justify-center gap-2 wide:min-w-0 wide:flex-[1.1]">
            <div className="flex min-h-0 shrink gap-4">
              <Fill ratio={SHOT} min="8rem">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${MEDIA}/human-turret-before.png`} alt="A tank firing at a target to its right while its turret and muzzle flash point straight up the screen" className={shot} />
              </Fill>
              <Fill ratio={SHOT} min="8rem">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${MEDIA}/human-turret-after.png`} alt="The same tank after the fix, its turret and muzzle flash pointing right at the target" className={shot} />
              </Fill>
            </div>
            <p className="shrink-0 text-sm text-muted">
              <b className="text-foreground">Before:</b> the target is to the right, the turret points north. <b className="text-foreground">After:</b> on target.
              The same ten minutes found three art bugs that no test could see.
            </p>
          </div>
        </div>
      </Screen>

      {/* Attention, and what it led the owner to build. */}
      <Screen>
        <h3 className={`${TYPE.h3} shrink-0`}>The agents never ran out of output. I ran out of attention.</h3>
        <div className="grid shrink-0 gap-x-8 gap-y-6 sm:grid-cols-3">
          {ATTENTION.map(([n, t]) => <Stat key={n} n={n}>{t}</Stat>)}
        </div>
        <h3 className={`${TYPE.h3} ${GROUP} shrink-0`}>So the most useful things I built were for me.</h3>
        <div className="grid shrink-0 gap-x-8 gap-y-6 md:grid-cols-3">
          {FOR_ME.map(([h, b]) => (
            <div key={h} className="border-t-2 pt-[clamp(0.5rem,1.6vh,1rem)]" style={{ borderTopColor: RED }}>
              <h4 className={TYPE.h4}>{h}</h4>
              <p className={`${TYPE.text} mt-[clamp(0.3rem,1.2vh,0.75rem)] text-muted`}>{b}</p>
            </div>
          ))}
        </div>
        <Claim className={GROUP}>The scarce thing isn’t code. It’s taste and attention.</Claim>
        <Evidence>
          The play session: 26 Oct, on the live game; the turret fix shipped on 1 Nov. The folders were counted on one drive between 8 and 27 Oct. The
          release that went out without the two fixes: 26 Oct; they shipped on 1 Nov.
        </Evidence>
      </Screen>
    </Part>
  );
}

/* ─── 07 · Take it home ─────────────────────────────────────────────────── */

// Where the room can open what the talk showed. Checked signed out on 12 Nov 2026: play asks for one free account
// (Google in one click), the installer downloads straight from the public GitHub release, the repository is public.
const TRY: [string, string, string, string][] = [
  ["Play in your browser", "rtsai.net/play", "https://rtsai.net/play/", "One free account, one click with Google. Best on a laptop."],
  ["Download for Windows", "rtsai.net/download", "https://rtsai.net/download", "288 MB, no account. An unsigned alpha: Windows asks before it runs."],
  ["Read the rules that won", "github.com/alibad/RTSAI-WebGame", "https://github.com/alibad/RTSAI-WebGame/tree/main/tools/arena", "The rules brain, its notebook of experiments and the bench that ran every game: tools/arena."],
];

function HomePart() {
  const withModel = H.runs.filter((r) => r.how === "both");
  const tips: [string, string, string][] = [
    ["Give the agent a ruler before the task", "9 → 0", "failed checks on a generated tank, once it stood beside the original game’s. Its own score had been 81.5 of 100."],
    ["Race the dumbest thing that could work", `${oursWins} vs ${bestModel}`, "Plain rules against the best model, the same 16 games. Then read each loser’s decision log."],
    ["Change one thing at a time", `${fl("counters").wins} + ${fl("hunt").wins} → ${fl("both").wins}`, `of ${fl("both").finished}: two switches, each tested alone, then together. Several changes at once had cut the wins from ${ev("base").wins} to ${ev("defence").wins}.`],
    ["Put the model where rules can’t reach", `${run("rules").correct} → ${withModel[0].correct} %`, `of ${H.orders} spoken orders read right: rules first, a model only for the ${withModel[0].modelCalls} they couldn’t read. A model for every order: at most ${Math.max(...H.runs.filter((r) => r.how === "model").map((r) => r.correct))} %.`],
  ];
  return (
    <Part id="home">
      <Screen data-part="home">
        <PartHead n="07" label="Take it home" title="Four things to try on Monday." />
        <div className="grid shrink-0 gap-x-10 gap-y-[clamp(0.75rem,2.6vh,2.25rem)] md:grid-cols-2">
          {tips.map(([h, n, b], i) => (
            <div key={h} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-2 border-t border-border pt-[clamp(0.5rem,1.6vh,1.1rem)]">
              <div className="pt-1 font-mono text-sm font-bold" style={{ color: RED_INK }}>0{i + 1}</div>
              <div>
                <h3 className="text-[clamp(1.15rem,min(1.8vw,3.1vh),1.85rem)] font-semibold leading-tight">{h}</h3>
                <div className={`${TYPE.big} mt-[clamp(0.3rem,1.3vh,0.9rem)]`} style={{ color: OURS }}>{n}</div>
                <p className={`${TYPE.text} mt-[clamp(0.3rem,1.2vh,0.75rem)] text-muted`}>{b}</p>
              </div>
            </div>
          ))}
        </div>
      </Screen>
      {/* The last screen: three doors, and the talk itself as a code to scan. */}
      <Screen data-try-it>
        <h3 className={`${TYPE.h2} shrink-0`}>Try it tonight.</h3>
        <div className="grid shrink-0 gap-[clamp(0.6rem,1.4vw,1.25rem)] md:grid-cols-3">
          {TRY.map(([what, where, href, note]) => (
            <a key={where} href={href} target="_blank" rel="noreferrer" className="group relative block rounded-lg p-[clamp(0.9rem,2.4vh,1.6rem)] ring-1 ring-[#56616a] transition hover:ring-2 hover:ring-[#e15a43]" style={{ background: "rgba(255,255,255,.035)" }}>
              <h4 className={TYPE.h4}>{what}</h4>
              <div className="mt-[clamp(0.4rem,1.4vh,0.9rem)] inline-flex items-center gap-2 rounded-md px-3 py-1.5 font-mono text-[clamp(0.85rem,min(1.15vw,2.1vh),1.2rem)] font-bold transition group-hover:scale-[1.03]" style={{ background: BUTTON, color: ON_RED }}>{where} <span aria-hidden>↗</span></div>
              <p className={`${TYPE.text} mt-[clamp(0.4rem,1.4vh,0.9rem)] text-muted`}>{note}</p>
            </a>
          ))}
        </div>
        <div className={`${GROUP} flex shrink-0 flex-col items-start gap-6 md:flex-row md:items-center md:justify-between`}>
          <div>
            <div className={`${TYPE.kicker} text-white/70`}>{TAGLINE}</div>
            <p className="mt-3 max-w-xl text-sm text-muted">The model games were played on our own machine on 3 to 5 Nov 2026; the numbers on these pages come from those games’ logs. Ali Badereddin · AI Tinkerers Doha · 16 Nov 2026.</p>
          </div>
          <div className="flex items-center gap-4 rounded-2xl bg-white p-4 text-[#120907]">
            <QRCodeSVG value="https://present.humanquest.net/can-an-ai-play" size={132} />
            <div className="text-sm leading-snug"><b className="block text-lg">This talk</b>present.humanquest.net<br />/can-an-ai-play</div>
          </div>
        </div>
      </Screen>
    </Part>
  );
}

/* ─── The deck ──────────────────────────────────────────────────────────── */

export default function CanAnAiPlay() {
  const print = usePrintMode();
  return (
    <main className={`relative bg-background ${print ? "print-mode" : ""}`}>
      <ScrollProgress />
      <ChapterNav chapters={CHAPTERS} toneOnDark={{ activeDot: "bg-[#e15a43]", activeText: "text-[#f18470]", activeGlow: "shadow-[0_0_12px_rgba(225,90,67,0.7)]", inactiveDot: "bg-white/25 group-hover:bg-white/50", inactiveTextHover: "group-hover:text-white/60" }} />
      <DeckNext accent={RED} hi={RED_INK} ink={ON_RED} solid />
      {/* On a phone the timer and controls would sit on the words: they show from 768 px. */}
      <div className="hidden md:block">
        <DeckControls />
        <PresentationTimer targetMinutes={15} sections={BUDGET} />
      </div>
      <BuiltPart />
      <DonePart />
      <RulerPart />
      <SelfPlayPart />
      <PlayPart />
      <HumanPart />
      <HomePart />
    </main>
  );
}
