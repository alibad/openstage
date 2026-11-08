"use client";

/*
 * "Can an AI play our game?" — the AI Tinkerers Doha Round 5 talk (Monday 16 Nov 2026, 15 minutes).
 *
 * Every number on these slides comes from ./data/can-an-ai-play.json: real games in the RTS AI Arena, the voice-order
 * bench and the git history of the rules, exported with the spoken notes and the time plan by tools/to-openstage.mjs
 * from the talk folder (D:\Generated\RTSAI\talk-brains-match-up-20261104 on the owner's PC). Change the data there and
 * export again; don't edit the JSON by hand. One slide per click: a screen that builds up is several slides in a row,
 * joined with transition "none", so each click adds one thing. Sized for a projector: nothing below text-sm except
 * the evidence line at the foot of a slide.
 */

import type { CSSProperties, ReactNode } from "react";
import type { Presentation, Slide } from "@/lib/types";
import { SectionTag, SlideHeading, SlideSubtitle } from "@/components/slide-primitives";
import data from "./data/can-an-ai-play.json";

const WIN = "#0ca30c";
const DRAW = "#5d5c57";
const LOSS = "#d03b3b";
const OURS = "#F2C14E";
const GREY = "#8f8e88";
const LIGHT = "#c3c2b7";
const MEDIA = "/talks/can-an-ai-play";

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

/* ─── Shared pieces ─── */

// Every slide root: the deck's foreground colour (slides don't inherit it), centred in the slide area.
function SlideRoot({ gap = "gap-6", children }: { gap?: string; children: ReactNode }) {
  return <div className={`flex h-full flex-col justify-center text-foreground ${gap}`}>{children}</div>;
}

function Head({ tag, title, sub }: { tag: string; title: ReactNode; sub?: ReactNode }) {
  return (
    <div>
      <SectionTag label={tag} />
      <SlideHeading>{title}</SlideHeading>
      {sub && <SlideSubtitle className="max-w-5xl text-xl">{sub}</SlideSubtitle>}
    </div>
  );
}

function Where({ children }: { children: ReactNode }) {
  return <p className="-mt-2 font-mono text-base text-muted">{children}</p>;
}

function Close({ on = true, children, className = "text-3xl" }: { on?: boolean; children: ReactNode; className?: string }) {
  return (
    <p className={`font-semibold leading-snug transition-opacity duration-500 ${className}`} style={{ color: OURS, opacity: on ? 1 : 0 }}>
      {children}
    </p>
  );
}

function Foot({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-relaxed text-muted">{children}</p>;
}

function Fade({ on, children, className = "" }: { on: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={`transition-opacity duration-300 ${className}`} style={{ opacity: on ? 1 : 0 }} aria-hidden={!on}>
      {children}
    </div>
  );
}

function Lab({ children, code }: { children: ReactNode; code?: ReactNode }) {
  return (
    <div className="mb-2 text-base text-muted">
      {children}
      {code && <code className="ml-3 font-mono" style={{ color: OURS }}>{code}</code>}
    </div>
  );
}

// The code on screen is the real code, cut with "…"; a few colours, nothing more.
const TOKENS = /(\/\/.*$)|("(?:[^"\\]|\\.)*")(?=\s*:)|("(?:[^"\\]|\\.)*")|\b(export|async|function|const|return|if|true|false)\b|(\b\d+(?:\.\d+)?\b)/g;
const TOKEN_COLOR = [GREY, LIGHT, "#d8b37a", "#9fb7d6", OURS];
function Code({ src, marks = [], size = 18 }: { src: string; marks?: number[]; size?: number }) {
  return (
    <pre className="overflow-hidden rounded-xl border border-border bg-code-bg py-4 font-mono text-[#f0efec]" style={{ fontSize: size, lineHeight: 1.5 }}>
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
  );
}

type Cell = { seed: number; result: string; minutes: number; faction?: string } | null;

function Tile({ g, size, ring = false, tip }: { g: Cell; size: number; ring?: boolean; tip?: string }) {
  const base: CSSProperties = { width: size, height: size, fontSize: size * 0.5, outline: `3px solid ${ring ? OURS : "transparent"}`, outlineOffset: 2, transition: "outline-color .35s" };
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
    <div className="flex flex-wrap items-center gap-7 text-base text-muted">
      {items.map(([r, t]) => (
        <span key={t} className="flex items-center gap-2"><Tile g={{ seed: 0, result: r, minutes: 0 }} size={24} />{t}</span>
      ))}
    </div>
  );
}

type BoardRow = { key: string; label: ReactNode; sub?: ReactNode; games: Cell[][]; total: number; of: string; accent?: boolean };

// One row per brain; per opponent, one tile per start; the wins on the right. Rows past `shown` are hidden in place.
function Board({ rows, seeds, shown, ringed, tile, label, dense = false }: { rows: BoardRow[]; seeds: number[]; shown: number; ringed?: Set<string>; tile: number; label: number; dense?: boolean }) {
  const opponents = RL.opponents;
  return (
    <div className="grid items-center gap-x-5" style={{ gridTemplateColumns: `${label}px repeat(${opponents.length}, auto) 72px` }}>
      <div />
      {opponents.map((o) => <div key={o} className="pb-2 text-base font-semibold text-muted">vs {LEVELS[o]}</div>)}
      <div className="pb-2 text-right text-base font-semibold text-muted">won</div>
      {rows.flatMap((r, ri) => {
        const cls = `border-t border-border ${dense ? "py-1.5" : "py-2.5"} transition-opacity duration-300 ${ri >= shown ? "opacity-0" : ""}`;
        return [
          <div key={`${r.key}-l`} className={cls}>
            <b className="block text-xl leading-tight" style={r.accent ? { color: OURS } : undefined}>{r.label}</b>
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
            <span className="text-sm text-muted">{r.of}</span>
          </div>,
        ];
      })}
    </div>
  );
}

/* ─── 1 · The cold open ─── */

function HoldSlide() {
  return (
    <div className="absolute inset-0 bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${MEDIA}/cold-open-start.jpg`} alt="The first frame of the cold-open film: the replay at 0:00" className="h-full w-full object-contain" />
    </div>
  );
}

function ColdSlide() {
  return (
    <div className="absolute inset-0 bg-black">
      <video src={`${MEDIA}/cold-open.mp4`} poster={`${MEDIA}/cold-open-start.jpg`} autoPlay muted playsInline preload="auto" className="h-full w-full object-contain" />
    </div>
  );
}

function AskSlide() {
  const g = O.game;
  const stats: [string, string][] = [
    [mmss(g.gameSeconds), "game time to win"],
    [num(g.theyLost), `what Brutal lost, in credits; we lost ${num(g.weLost)}`],
    [String(g.buildingsDestroyed), `enemy buildings destroyed; we lost ${g.ourBuildingsLost || "none"}`],
    [`${O.brutalBefore.won} of ${O.brutalBefore.finished}`, "Brutal games won before this one, by any brain"],
  ];
  return (
    <SlideRoot gap="gap-12">
      <div>
        <SectionTag label={`01 · ${day(g.finishedAt)}, our AI Arena`} />
        <h1 className="text-7xl font-semibold leading-[0.95] tracking-tight">Can an AI play our game?</h1>
        <p className="mt-6 max-w-5xl text-2xl leading-relaxed text-muted">
          That was the first time our side beat Brutal, the game’s hardest AI: it attacks early, with 15,000 extra credits.
        </p>
      </div>
      <div className="grid grid-cols-4 gap-8">
        {stats.map(([b, t]) => (
          <div key={t} className="min-w-0 border-t-4 border-border pt-4">
            <b className="block text-5xl font-bold leading-none">{b}</b>
            <span className="mt-3 block text-base leading-snug text-muted">{t}</span>
          </div>
        ))}
      </div>
      <Close className="text-4xl">Four brains took that seat. Here’s what happened.</Close>
      <Foot>
        Arena game {g.id} · map {g.map}, start {g.seed - 999} ({cap(g.ours)} against {cap(g.theirs)}), speed {g.speed}: {mmss(g.gameSeconds)} of play in {mmss(g.wallSeconds)} · The film is the
        game’s own replay, the first 18 minutes sped up, then the final attack at replay speed.
      </Foot>
    </SlideRoot>
  );
}

/* ─── 2 · How a brain plays: the one diagram ─── */

const NODES: { t: string; d?: string[]; e?: string[]; chips?: boolean; c: string }[] = [
  { t: "The live game", d: ["The same page and data", "as rtsai.net/play,", "against the game’s", "own AI"], c: "window.game" },
  { t: "What a player sees", d: ["Our side only: the fog", "of war hides the rest"], e: ["credits, buildings,", "units, enemies in sight"], c: "adviserObserve()" },
  { t: "Closed questions", d: ["Only what is possible", "now, plus Wait"], e: ["“Which building", "should we start next?”"], c: "plan()" },
  { t: "A brain picks", chips: true, c: "decide()" },
  { t: "Player orders", d: ["The orders a click", "sends; the replay", "plays them back"], e: ["action: \"build\"", "item_type: \"gapile\""], c: "adviserExecute()" },
];
const NODE_STEP = [0, 0, 1, 2, 3];

function ArchSlide({ step }: { step: number }) {
  const NW = 312, NG = 58, NY = 20, NH = 400;
  const nx = (i: number) => i * (NW + NG);
  const luna = R.brains.find((b) => b.provider === "openai");
  const facts: [string, string][] = [
    ["The game pauses while a model thinks", "so a slow answer never loses on speed"],
    ["No answer? Our rules play that turn", `flagged in the log: Luna, ${luna?.fallbacks} of ${num(luna?.turns ?? 0)} turns`],
    ["Every turn is written down", "question, probabilities and orders sent"],
  ];
  const ink = { fill: "var(--color-foreground)" };
  const muted = { fill: "var(--color-muted)" };
  return (
    <SlideRoot>
      <Head tag="02 · How a brain plays" title="How a brain plays our game" sub="One loop for every brain. Only the brain in the middle changes." />
      <svg viewBox="0 0 1792 560" className="h-auto w-full overflow-visible" role="img" aria-label="The live game, then what a player sees, then closed questions, then a brain picks, then player orders go back into the game.">
        <defs>
          <marker id="arch-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" style={{ fill: GREY }} />
          </marker>
        </defs>
        {NODES.map((n, i) => {
          const X = nx(i);
          return (
            <g key={n.t} style={{ opacity: NODE_STEP[i] <= step ? 1 : 0, transition: "opacity .35s" }}>
              {i > 0 && <line x1={nx(i - 1) + NW + 8} y1={NY + NH / 2} x2={X - 12} y2={NY + NH / 2} stroke={GREY} strokeWidth={3} markerEnd="url(#arch-head)" />}
              <rect x={X} y={NY} width={NW} height={NH} rx={14} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)" strokeWidth={2} />
              <text x={X + 24} y={NY + 62} fontSize={34} fontWeight={700} style={ink}>{n.t}</text>
              {n.d?.map((l, j) => <text key={j} x={X + 24} y={NY + 112 + j * 34} fontSize={27} style={muted}>{l}</text>)}
              {n.e?.map((l, j) => (
                <text key={j} x={X + 24} y={NY + 240 + j * 34} fontSize={n.c === "adviserExecute()" ? 24 : 27} style={n.c === "adviserExecute()" ? { fill: OURS, fontFamily: "var(--font-mono)" } : ink}>{l}</text>
              ))}
              {n.chips && R.brains.map((b, j) => (
                <g key={b.name}>
                  <rect x={X + 20} y={NY + 90 + j * 64} width={NW - 40} height={52} rx={10} fill="rgba(0,0,0,0.25)" stroke={b.provider === "scripted" ? OURS : "rgba(255,255,255,0.14)"} strokeWidth={2} />
                  <text x={X + 40} y={NY + 125 + j * 64} fontSize={29} fontWeight={600} style={ink}>{b.name}</text>
                </g>
              ))}
              <text x={X + 24} y={NY + NH - 28} fontSize={25} style={{ fill: OURS, fontFamily: "var(--font-mono)" }}>{n.c}</text>
              {i === NODES.length - 1 && (
                <>
                  <path d={`M ${X + NW / 2} ${NY + NH} V ${NY + NH + 50} H ${NW / 2} V ${NY + NH + 12}`} fill="none" stroke={GREY} strokeWidth={3} markerEnd="url(#arch-head)" />
                  <text x={896} y={NY + NH + 100} textAnchor="middle" fontSize={30} style={muted}>Every 2 game seconds: what to build next. Every 5: what the army does.</text>
                </>
              )}
            </g>
          );
        })}
      </svg>
      <Fade on={step >= 3} className="grid grid-cols-3 gap-8">
        {facts.map(([b, t]) => (
          <div key={b} className="border-t-2 border-border pt-3 text-base text-muted">
            <b className="mb-1 block text-lg text-foreground">{b}</b>{t}
          </div>
        ))}
      </Fade>
    </SlideRoot>
  );
}

/* ─── 3 · The code ─── */

const CALLS: Record<string, [string, string]> = {
  jev: ["POST /v1/systemone", "typesafe/jev-1.13, through OpenRouter"],
  openai: ["POST /v1/decisions", "gpt-6-luna, one choice question each"],
  local: ["POST /v1/chat/completions", "Ollama on our own GPU; the answer must be one of the options"],
  scripted: ["scriptedAnswers()", "plain code in the same process, no network"],
};

function DecideSlide({ step }: { step: number }) {
  return (
    <SlideRoot gap="gap-5">
      <Head tag="03 · The code" title="The brain is one argument" />
      <Where>tools/arena/providers.mjs:{lineOf("decide")} · RTSAI-WebGame {CODE.commit}</Where>
      <Code marks={[6, 7]} src={`export async function decide(provider, obs, questions, credential = {}, opts = {}) {
  if (provider === "scripted") {
    …
    return { answers: scriptedAnswers(obs, questions, opts), …, usd: 0 };
  }
  // Otherwise a model reads the prompt (the rubric by default) and the battlefield.
  return askQuestions(provider,
    { text: PROMPTS[opts.prompt] ?? RUBRIC, json: describe(obs) }, questions, credential);
}`} />
      <Fade on={step >= 1}>
        <div className="grid grid-cols-4 gap-4">
          {R.brains.map((b) => (
            <div key={b.name} className="rounded-xl border bg-surface p-4" style={{ borderColor: b.provider === "scripted" ? OURS : "var(--color-border)" }}>
              <b className="block text-xl">{b.name}</b>
              <code className="mt-1 block font-mono text-sm" style={{ color: OURS }}>{CALLS[b.provider][0]}</code>
              <span className="text-base text-muted">{CALLS[b.provider][1]}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xl text-muted">Each brain returns <b className="text-foreground">a choice and a probability for every option</b>, so the games differ only in the choices made.</p>
      </Fade>
    </SlideRoot>
  );
}

const RUBRIC = "You command one side in a real-time strategy match (Red Alert 2 style) against a computer opponent. "
  + "Win by destroying every enemy building. Economy first (power, refineries, harvesters), then production, then a large "
  + "army that attacks together. Defend when the enemy is at the base. Never leave credits unspent for long. "
  + "Answer each question for the state given.";

function PromptSlide() {
  const ours = T.brains.find((b) => b.provider === "scripted")!;
  return (
    <SlideRoot gap="gap-6">
      <Head tag="03 · The code" title="What a model reads, every turn" sub="Jev, Luna and Gemma all get these three parts. Our rules read the game’s state directly." />
      <div>
        <Lab code={`brain.mjs:${lineOf("rubric")}`}>1 · The rubric</Lab>
        <blockquote className="border-l-4 border-border pl-5 text-xl leading-relaxed">{RUBRIC}</blockquote>
      </div>
      <div>
        <Lab code="describe(obs)">2 · The battlefield, as JSON</Lab>
        <div className="flex flex-wrap gap-2">
          {["time", "credits", "power", "harvesters", "buildings", "army", "producing", "enemySeen", "threat", "mapExplored"].map((k) => (
            <span key={k} className="rounded-md border border-border bg-surface px-3 py-1 font-mono text-base">{k}</span>
          ))}
        </div>
      </div>
      <div>
        <Lab code="plan(obs)">3 · The questions</Lab>
        <p className="mb-3 text-2xl font-semibold">“{ours.instructions}”</p>
        <div className="flex flex-wrap gap-2">
          {ours.options.map((o) => <span key={o.value} className="rounded-md border border-border bg-surface px-3 py-1 text-base">{o.label}</span>)}
        </div>
        <p className="mt-3 text-base text-muted">Each option comes with one line: <code className="font-mono text-foreground">“‹name›: ‹what it does›; costs ‹n›; you have ‹n›.”</code> Also asked: which infantry, vehicle or defense; and what the army does.</p>
      </div>
    </SlideRoot>
  );
}

function RulesSlide() {
  return (
    <SlideRoot gap="gap-5">
      <Head tag="03 · The code" title="Our rules: a page of scores" />
      <Where>tools/arena/brain.mjs:{lineOf("need")} and :{lineOf("softmax")}, inside scriptedAnswers() · RTSAI-WebGame {CODE.commit}</Where>
      <Code src={`const need = {
  power: spare < 10 ? 6 : spare < 60 && obs.cash > 1500 ? 1.5 : -1,
  refinery: !has("refinery") ? 6 : refineries < 2 && minutes > 2 && expand ? 3.5 : …,
  barracks: !has("barracks") && !queued("barracks") ? 4.5 : -1,
  factory: !has("factory") && has("refinery") ? 5 : -1,
  radar: !has("radar") && has("factory") ? 3 : -1, …
};
…
// Scores become probabilities (softmax), so our rules answer exactly like a model.
const max = Math.max(...scores), exp = scores.map((s) => Math.exp((s - max) * 1.5)), …;`} />
      <p className="text-xl text-muted">What each building is worth right now; the best score wins. <b className="text-foreground">About 75 lines like these. No model, no training.</b> Tuned in the Arena, one change at a time.</p>
    </SlideRoot>
  );
}

function LogSlide() {
  const ours = T.brains.find((b) => b.provider === "scripted")!;
  const r = ours.record, q = r.questions[0], J = JSON.stringify;
  const lines = [
    "{", `  "tick": ${r.tick},`, `  "auto": ${J(r.auto)},`, '  "questions": [{',
    `    "name": ${J(q.name)},`, `    "instructions": ${J(q.instructions)},`, `    "choice": ${J(q.choice)},`, '    "options": [',
    ...q.options.map((o, i) => `      { "value": ${J(o.value)}, "label": ${J(o.label)}, "p": ${o.p} }${i < q.options.length - 1 ? "," : ""}`),
    "    ],", `    "accepted": ${q.accepted}`, "  }],",
    `  "ms": ${r.ms}, "usd": ${r.usd}, "inputTokens": ${r.inputTokens}, "fallback": ${r.fallback}`, "}",
  ];
  return (
    <SlideRoot gap="gap-4">
      <Head tag="03 · The code" title="One turn, as the log keeps it" />
      <Where>decisions/{ours.game}.json · {ours.name}, {LEVELS[T.opponent]}, start {T.seed - 999} ({cap(ours.faction)}), {clockT(r.tick)}</Where>
      <Code size={16} src={lines.join("\n")} marks={[8 + q.options.findIndex((o) => o.value === q.choice)]} />
      <p className="text-xl text-muted">Every turn of all 64 games is kept like this, beside the game’s replay.</p>
    </SlideRoot>
  );
}

/* ─── 4 · The match-up ─── */

function FilmSlide() {
  return (
    <SlideRoot gap="gap-4">
      <Head tag="04 · The match-up" title="Same start, same enemy, four brains" sub="Each brain plays our side against Brutal, the game’s own AI with 15,000 extra credits." />
      <video src={`${MEDIA}/four-brains.mp4`} poster={`${MEDIA}/four-brains.jpg`} autoPlay muted playsInline preload="auto" className="max-h-[66vh] w-full rounded-xl bg-black object-contain" />
    </SlideRoot>
  );
}

const cost = (b: (typeof R.brains)[number]) => (b.provider === "scripted" || b.provider === "local" ? "free" : `$${b.usd.toFixed(2)}`);
const speed = (b: (typeof R.brains)[number]) => (b.msPerTurn < 10 ? "under 0.01 s a turn" : `${(b.msPerTurn / 1000).toFixed(1)} s a turn`);

function BoardSlide({ shown, lesson }: { shown: number; lesson: boolean }) {
  const rows: BoardRow[] = R.brains.map((b) => ({
    key: b.provider, label: b.name, sub: <>{b.what}<br />{cost(b)} · {speed(b)}</>, accent: b.provider === "scripted",
    games: b.games.map((list) => R.seeds.map((s) => list.find((g) => g.seed === s) ?? null)), total: b.wins, of: `of ${b.played}`,
  }));
  const page = R.brains.find((b) => b.page)?.page;
  const fallbacks = R.brains.filter((b) => b.provider !== "scripted" && b.fallbacks).map((b) => `${b.name} ${b.fallbacks} of ${num(b.turns)}`);
  return (
    <SlideRoot gap="gap-5">
      <Head tag="04 · The match-up" title="Same 16 games. Four brains." sub="Each brain plays our side against the game’s own AI. Same map, same four starts, four levels of opponent." />
      <Board rows={rows} seeds={R.seeds} shown={shown} tile={32} label={280} />
      <Legend />
      <Close on={lesson} className="text-4xl">The hype isn’t what you need. Plain rules won 9; the best model won 2.</Close>
      <Foot>
        Real games in our AI Arena, {day(R.madeAt)} 2026, on the live web game{page ? ` (page ${page.page})` : ""}. Map {R.map}, mirror factions, starts 1–4 = China, Iran, Turkey, Saudi.
        The game pauses while a model thinks, so its speed doesn’t change the result.{fallbacks.length ? ` Turns a model failed to answer, played by our rules instead: ${fallbacks.join(", ")}.` : ""}
      </Foot>
    </SlideRoot>
  );
}

/* ─── 5 · Why, and the better prompt ─── */

function TurnSlide({ step }: { step: number }) {
  const model = T.brains.find((b) => b.provider !== "scripted")!;
  const ours = T.brains.find((b) => b.provider === "scripted")!;
  return (
    <SlideRoot gap="gap-5">
      <Head tag="05 · Why" title="Same moment, two brains" sub={`${LEVELS[T.opponent]}, start ${T.seed - 999} (${cap(ours.faction)}). A minute in, each brain is asked: “${ours.instructions}”`} />
      <div className="grid grid-cols-2 gap-12">
        {[model, ours].map((b, i) => (
          <Fade key={b.name} on={step >= i}>
            <h3 className="text-3xl font-semibold">{b.name}</h3>
            <p className="mb-3 text-base text-muted">asked at {clockT(b.tick)} · {b.provider === "scripted" ? "answered in under 0.01 s" : `answered in ${(b.ms / 1000).toFixed(2)} s while the game paused`}</p>
            {b.options.map((o) => {
              const chosen = o.value === b.choice;
              return (
                <div key={o.value} className="grid h-9 grid-cols-[200px_1fr_72px] items-center gap-3">
                  <span className={`truncate text-base ${chosen ? "font-bold text-foreground" : "text-muted"}`}>{o.label}</span>
                  <div className="h-6"><div className="h-6 rounded-r" style={{ width: o.p ? `max(3px, ${o.p * 100}%)` : 0, background: b.provider === "scripted" ? OURS : GREY }} /></div>
                  <span className={`text-right text-base ${chosen ? "font-bold text-foreground" : "text-muted"}`}>{pct(o.p)}</span>
                </div>
              );
            })}
          </Fade>
        ))}
      </div>
      <Fade on={step >= 2} className="grid grid-cols-[1fr_420px] items-start gap-10">
        <div>
          <Lab code={`brain.mjs:${lineOf("refinery")}`}>Why our rules said Barracks</Lab>
          <Code size={16} marks={[1]} src={`refinery: !has("refinery") ? 6
  : refineries < 2 && minutes > 2 && expand ? 3.5 : …,
barracks: !has("barracks") && !queued("barracks") ? 4.5 : -1,`} />
        </div>
        <div>
          <Lab>At minute 3, and how it ended</Lab>
          {[model, ours].map((b) => (
            <div key={b.name} className="mb-3 flex items-center gap-3">
              <Tile g={{ seed: 0, result: b.result, minutes: 0 }} size={36} />
              <span className="text-base"><b className="text-lg">{b.name}</b><br />army worth {num(b.atMinute3.army)} · {num(b.atMinute3.credits)} unspent · {WORD[b.result]} at {mmss(b.gameSeconds)}</span>
            </div>
          ))}
        </div>
      </Fade>
      <Close on={step >= 2}>We told every model “Economy first.” {model.name.split(" ").at(-1)} obeyed. Our rules wait until minute 2.</Close>
    </SlideRoot>
  );
}

const MEASURES = [
  { key: "firstBarracksMin", head: "Started its army", unit: "first barracks, minute of the game", max: 5, show: (v: number) => clock(v) },
  { key: "creditsAt5", head: "Money left unspent", unit: "credits in the bank at minute 5", max: 10000, show: (v: number) => num(Math.round(v)) },
  { key: "armyAt3", head: "Army at minute 3", unit: "what its units are worth, in credits", max: 3500, show: (v: number) => num(Math.round(v)) },
] as const;

function WhySlide({ step }: { step: number }) {
  const order = R.brains.map((b) => W.brains.find((w) => w.provider === b.provider)!);
  return (
    <SlideRoot gap="gap-6">
      <Head tag="05 · Why" title="Why the models lost" sub="What each brain did in the first minutes, read from its decision log." />
      <div className="grid items-center gap-x-8" style={{ gridTemplateColumns: "230px repeat(3, 1fr)" }}>
        <div />
        {MEASURES.map((m, i) => (
          <Fade key={m.key} on={step >= i}><div className="text-xl font-semibold">{m.head}</div><div className="pb-3 text-sm text-muted">{m.unit}</div></Fade>
        ))}
        {order.map((w) => [
          <div key={`${w.provider}-n`} className="border-t border-border py-5 text-xl font-bold">{w.name}</div>,
          ...MEASURES.map((m, i) => {
            const v = w[m.key];
            return (
              <Fade key={`${w.provider}-${m.key}`} on={step >= i} className="flex items-center gap-3 border-t border-border py-5">
                <div className="h-8 rounded-r" style={{ width: `${Math.max(1, Math.min(100, (100 * v) / m.max)) * 0.6}%`, background: w.provider === "scripted" ? OURS : GREY }} />
                <span className="whitespace-nowrap text-2xl font-bold">{m.show(v)}</span>
              </Fade>
            );
          }),
        ])}
      </div>
      <Close on={step >= 2}>The models saved money and built towers. Our rules built an army.</Close>
      <Foot>Middle value of each brain’s {order[0].games} games. Towers built by minute 5: {order.map((w) => `${w.name} ${w.towersBy5}`).join(", ")}. Credits are the game’s money; refineries make more of it.</Foot>
    </SlideRoot>
  );
}

const ADVICE = [
  "Build power, a refinery, barracks, a war factory, then radar. More power when spare power is under 10.",
  <><mark className="rounded px-1 text-foreground" style={{ background: "rgba(242,193,78,.2)" }}>No second refinery before 2:00.</mark> Harvesters up to what the map supports.</>,
  "Spend: keep every barracks and factory training the strongest combat unit you can afford. Wait only under 300 credits.",
  "No towers or base defenses unless enemies are at the base (threat high or critical). No engineers, spies, dogs or scouts in the army.",
  "Counter what the enemy fields: anti-tank against vehicles, anti-infantry against infantry.",
  "Scout early. Defend when the threat is high or critical. Attack only with 10 or more gathered units worth at least 3,500 and more than the enemy army seen; once at the enemy base, keep attacking.",
];

// Two bars per model on one scale (first prompt, coached), our rules as a dashed line.
function PairBars({ first, coached, rule, max, show, label = false, width }: { first: number | null; coached: number | null; rule: number; max: number; show: (v: number) => string; label?: boolean; width: number }) {
  const at = (v: number) => Math.max(0, Math.min(100, (100 * v) / max)) * 0.72;
  // A value label that would sit on our rules' line goes just past the line.
  const labelAt = (v: number) => (at(rule) > at(v) - 1 && at(rule) < at(v) + (100 * (10 + 10 * show(v).length)) / width ? at(rule) : at(v));
  const one = (v: number | null, color: string) => (
    <div className="relative h-7">
      {v == null ? <span className="absolute left-0 text-base text-muted">…</span> : (
        <>
          <div className="absolute left-0 top-0 h-7 rounded-r" style={{ width: `${at(v)}%`, minWidth: 3, background: color }} />
          <span className="absolute top-0 whitespace-nowrap text-base font-bold leading-7" style={{ left: `calc(${labelAt(v)}% + 8px)` }}>{show(v)}</span>
        </>
      )}
    </div>
  );
  return (
    <div className="relative grid gap-1.5">
      {one(first, DRAW)}
      {one(coached, LIGHT)}
      <div className="absolute -bottom-1.5 -top-1.5" style={{ left: `${at(rule)}%`, borderLeft: `3px dashed ${OURS}` }}>
        {label && <span className="absolute -top-7 -translate-x-1/2 whitespace-nowrap text-sm" style={{ color: OURS }}>our rules {show(rule)}</span>}
      </div>
    </div>
  );
}

function PairKey() {
  return (
    <div className="flex flex-wrap items-center gap-6 text-base text-muted">
      <span className="flex items-center gap-2"><i className="inline-block h-3.5 w-7" style={{ background: DRAW }} />first prompt (“Economy first”)</span>
      <span className="flex items-center gap-2"><i className="inline-block h-3.5 w-7" style={{ background: LIGHT }} />coached prompt</span>
      <span className="flex items-center gap-2"><i className="inline-block h-5 w-0" style={{ borderLeft: `3px dashed ${OURS}` }} />our rules</span>
    </div>
  );
}

function CoachSlide({ step }: { step: number }) {
  return (
    <SlideRoot gap="gap-5">
      <Head tag="05 · The better prompt" title="So we told the models what our rules know" />
      <Where>tools/arena/brain.mjs:{lineOf("coached")}, PROMPTS.coached · it replaces the rubric, nothing else changes</Where>
      <div className="grid grid-cols-[1fr_400px] items-start gap-10">
        <div className="border-l-4 border-border pl-5 text-[17px] leading-snug text-muted">
          <p className="mb-2">You command one side in a real-time strategy match (Red Alert 2 style) against a computer opponent that attacks early. Win by destroying every enemy building. Advice from a strong player:</p>
          <ol className="grid list-decimal gap-1.5 pl-6 text-foreground">{ADVICE.map((a, i) => <li key={i}>{a}</li>)}</ol>
          <p className="mt-2">Answer each question for the state given.</p>
        </div>
        <Fade on={step >= 1}>
          <h3 className="text-2xl font-semibold">Started its army</h3>
          <p className="mb-9 text-sm text-muted">first barracks, minute of the game, middle of each model’s games</p>
          {P.models.map((m, i) => (
            <div key={m.name} className="grid grid-cols-[120px_1fr] items-center gap-3 border-t border-border py-3">
              <b className="text-base">{m.name}</b>
              <PairBars first={m.first.firstBarracksMin} coached={m.coached.firstBarracksMin} rule={P.rules.firstBarracksMin} max={5} show={clock} label={i === 0} width={260} />
            </div>
          ))}
          <div className="mt-3"><PairKey /></div>
        </Fade>
      </div>
    </SlideRoot>
  );
}

const PMEASURES = [
  { key: "wins", head: "Games won", unit: "of 16", max: 16, show: (v: number) => String(v) },
  { key: "creditsAt5", head: "Money left unspent", unit: "credits in the bank at minute 5", max: 10000, show: (v: number) => num(Math.round(v)) },
  { key: "armyAt3", head: "Army at minute 3", unit: "what its units are worth, in credits", max: 4000, show: (v: number) => num(Math.round(v)) },
] as const;

function CoachResultSlide({ close }: { close: boolean }) {
  const total = (k: "first" | "coached") => P.models.reduce((s, m) => s + m[k].wins, 0);
  const usd = P.models.reduce((s, m) => s + m.coached.usd, 0);
  return (
    <SlideRoot gap="gap-6">
      <Head tag="05 · The better prompt" title="Did a better prompt help?" sub={`The same 16 games each, again. The three models won ${total("first")} between them first, ${total("coached")} coached; our rules won ${P.rules.wins}.`} />
      <div className="grid gap-x-8" style={{ gridTemplateColumns: "180px repeat(3, 1fr)" }}>
        <div />
        {PMEASURES.map((m) => <div key={m.key}><div className="text-xl font-semibold">{m.head}</div><div className="pb-9 text-sm text-muted">{m.unit}</div></div>)}
        {P.models.map((b, i) => [
          <div key={`${b.name}-n`} className="border-t border-border py-4 text-xl font-bold">{b.name}</div>,
          ...PMEASURES.map((m) => (
            <div key={`${b.name}-${m.key}`} className="border-t border-border py-4">
              <PairBars first={b.first[m.key]} coached={b.coached.played ? b.coached[m.key] : null} rule={P.rules[m.key]} max={m.max} show={m.show} label={i === 0} width={260} />
            </div>
          )),
        ])}
      </div>
      <PairKey />
      <Close on={close}>The advice fixed the opening, and wins went from 3 to 11. Against Hard and Brutal the models still won none of 24; our rules won 2 of 8.</Close>
      <Foot>
        Coached games: {P.models.map((m) => `${m.name} ${m.coached.wins}–${m.coached.draws}–${m.coached.losses}`).join(", ")} (won–draw–lost). They cost ${usd.toFixed(2)}. Towers by minute 5, first → coached:{" "}
        {P.models.map((m) => `${m.name.split(" ")[m.provider === "local" ? 0 : 1]} ${m.first.towersBy5} → ${m.coached.towersBy5}`).join(", ")}. Same page, map, starts and opponents as the first games.
      </Foot>
    </SlideRoot>
  );
}

/* ─── 6 · How the rules got good ─── */

type RuleRow = (typeof RL.evening.rows)[number] | (typeof RL.flags.rows)[number];
const ruleRow = (r: RuleRow): BoardRow => ({
  key: r.key, label: r.label, sub: r.what, accent: r.key === "both", games: r.games as Cell[][], total: r.wins,
  of: `of ${r.finished}${r.played > r.finished ? " finished" : ""}`,
});

function FailSlide({ step }: { step: number }) {
  return (
    <SlideRoot gap="gap-6">
      <Head tag="06 · How the rules got good" title="First we tried the smart idea" sub="Brutal attacks in the first minutes with 15,000 extra credits. So on 23 Oct we taught the brain to defend, several rules at a time." />
      <Board rows={RL.evening.rows.map(ruleRow)} seeds={RL.evening.seeds} shown={[1, 2, 4, 4][step]} tile={44} label={400} />
      <Legend stopped />
      <Close on={step === 3}>Worse every time, and with many rules changed at once, no way to tell which one hurt.</Close>
      <Foot>We put the old brain back. Try 3 fixed a real bug (Defend chased any enemy a scout saw), but that bug was the brain’s only push toward the enemy. Starts 1–2: China, Iran.</Foot>
    </SlideRoot>
  );
}

function FlagsSlide() {
  return (
    <SlideRoot gap="gap-5">
      <Head tag="06 · How the rules got good" title="Then: one idea, one switch" />
      <Where>tools/arena/brain.mjs:{lineOf("experiments")} and :{lineOf("hunt")} · RTSAI-WebGame {CODE.commit}</Where>
      <Code size={16} marks={[4, 12]} src={`export const EXPERIMENTS = {
  counters: "Units are picked against what the enemy fields (riflemen against infantry, …), not by price.",
  scouting: "Scouts move without stopping to fight, and Defend answers only enemies near our base, …",
  budget: "The opening keeps credits for the army: the second refinery … wait for minute 3 …",
  hunt: "While the enemy base is unknown, sweeps and scouts work through points across the whole map, …",
  …
};
const on = (opts, name) => {
  const asked = String(opts?.experiment ?? "").split("+");
  return (ADOPTED.has(name) && !asked.includes("before")) || asked.includes(name);
};
…
const to = on(opts, "hunt") ? huntPoint(obs, memory, base, front.far, "scoutRoute", [], 40) : front.far;`} />
      <p className="text-xl text-muted">Each switch plays <b className="text-foreground">the same 16 games as the brain without it</b>: same map, same four starts, Normal to Brutal. The switches that lost stay in the code, and their games stay in the record.</p>
    </SlideRoot>
  );
}

function ExpSlide({ step }: { step: number }) {
  const ringed = new Set(step === 3 ? RL.together.flatMap((t) => ["counters", "hunt", "both"].map((k) => `${k}|${t.opponent}|${t.seed}`)) : []);
  return (
    <SlideRoot gap="gap-5">
      <Head tag="06 · How the rules got good" title="One switch at a time, the same 16 games" sub="24 Oct, the next morning. Each row is the brain with one switch on." />
      <Board rows={RL.flags.rows.map(ruleRow)} seeds={RL.flags.seeds} shown={[1, 5, 6, 6][step]} ringed={ringed} tile={30} label={300} dense />
      <Close on={step === 3}>Each alone lost the ringed games. Together they won {RL.together.length === 2 ? "both" : "them all"}. One is the Brutal win you saw first.</Close>
      <Foot>Map {RL.map}, starts 1–4 = China, Iran, Turkey, Saudi. The morning’s brain is “24 Oct towers”; each switch is one flag in EXPERIMENTS. Where a start was played twice, the later game counts.</Foot>
    </SlideRoot>
  );
}

function LearnSlide() {
  const ev = (k: string) => RL.evening.rows.find((r) => r.key === k)!;
  const fl = (k: string) => RL.flags.rows.find((r) => r.key === k)!;
  const cards: [string, string, string][] = [
    ["Change one thing at a time", `${ev("base").wins} → ${ev("defence").wins}`, `games won of ${ev("base").finished} after the first try; the next two won none. Several rules at once taught us nothing.`],
    ["Test good ideas together", `${fl("counters").wins} + ${fl("hunt").wins} → ${fl("both").wins}`, `of ${fl("both").finished}: counters alone, hunt alone, then both, on the same games.`],
    ["Rerun it somewhere new", `${RL.newMap.before.wins} → ${RL.newMap.adopted.wins}`, `of ${RL.newMap.adopted.played} on a map it had never seen (Little Big Lake). Better, but much of the jump was the first map.`],
  ];
  const brutalWins = fl("both").games[3].filter((g) => g?.result === "win").length;
  return (
    <SlideRoot gap="gap-12">
      <Head tag="06 · How the rules got good" title="What it taught us" />
      <div className="grid grid-cols-3 gap-10">
        {cards.map(([b, n, p]) => (
          <div key={b} className="border-t-4 border-border pt-4">
            <b className="block text-2xl leading-tight">{b}</b>
            <span className="my-6 block whitespace-nowrap text-6xl font-bold leading-none">{n}</span>
            <p className="text-lg text-muted">{p}</p>
          </div>
        ))}
      </div>
      <Close className="text-4xl">Our rules aren’t clever. They were tested, one switch at a time.</Close>
      <Foot>The rules that beat the models in the match-up are this brain, “24 Oct counters+hunt” (BRAIN_VERSION, brain.mjs:{lineOf("version")}). Brutal is still hard: {brutalWins} win in 4.</Foot>
    </SlideRoot>
  );
}

/* ─── 7 · Where models do help ─── */

const ms = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)} s` : `${v} ms`);

function VoiceSlide({ step }: { step: number }) {
  const run = (k: string) => H.runs.find((r) => r.key === k)!;
  const withModel = H.runs.filter((r) => r.how === "both");
  const sameScore = withModel.every((r) => r.correct === withModel[0].correct);
  const unread = H.handedOver.filter((h) => !h.rulesRight).sort((a, b) => Number(b.withModelRight) - Number(a.withModelRight));
  const short = (t: string) => { const s = t.split(/(?<=[.?!])\s/)[0]; return s.length > 52 ? `${s.slice(0, 50).trimEnd()}…` : s; };
  const fixed = unread.filter((h) => h.withModelRight).length;
  const row = (name: string, sub: string, r: (typeof H.runs)[number], ours: boolean) => (
    <div key={name} className="grid min-h-[48px] grid-cols-[230px_1fr] items-center gap-3" title={`${r.title}: ${r.right} of ${r.cases} right, ${ms(r.msMedian)} an order (median)`}>
      <div><b className="block text-lg" style={ours ? { color: OURS } : undefined}>{name}</b>{sub && <span className="block text-sm text-muted">{sub}</span>}</div>
      <div className="relative h-7">
        <div className="absolute left-0 top-0 h-7 rounded-r" style={{ width: `${r.correct * 0.5}%`, background: ours ? OURS : GREY }} />
        <span className="absolute top-0 whitespace-nowrap text-base leading-7 text-muted" style={{ left: `calc(${r.correct * 0.5}% + 10px)` }}><b className="text-lg text-foreground">{r.correct} %</b> · {ms(r.msMedian)}</span>
      </div>
    </div>
  );
  return (
    <SlideRoot gap="gap-5">
      <Head tag="07 · Where models do help" title="Where a model does help: what a player says" sub={`The voice companion, 23 Oct: ${H.orders} real spoken or typed orders, slang and misheard words included. How many each brain read right:`} />
      <div className="grid grid-cols-[1fr_420px] items-start gap-10">
        <div>
          <div className="mb-1 text-base text-muted">Rules first</div>
          {row("Our rules alone", "no model", run("rules"), true)}
          {row("Rules, then a model", `asked only ${withModel[0].modelCalls} times in ${H.orders}`, withModel[0], true)}
          <div className="mb-1 mt-5 text-base text-muted">A model for every order</div>
          {H.runs.filter((r) => r.how === "model").map((r) => row(r.name, "", r, false))}
        </div>
        <Fade on={step >= 1}>
          <h3 className="mb-2 text-xl font-semibold">The {unread.length} orders our rules couldn’t read</h3>
          {unread.map((h) => (
            <div key={h.id} className="grid grid-cols-[30px_1fr] items-start gap-3 border-t border-border py-1.5" title={`${h.id}: ${h.withModelRight ? "right with the model" : "still wrong with the model"}`}>
              <Tile g={{ seed: 0, result: h.withModelRight ? "win" : "loss", minutes: 0 }} size={28} />
              <div><q className="text-base">{h.said}</q><span className="block text-sm text-muted">{short(h.model)}</span></div>
            </div>
          ))}
        </Fade>
      </div>
      <Close on={step >= 1}>Rules first, a model for what’s left: {fixed} more orders right.{sameScore ? " And then every model scored the same." : ""}</Close>
      <Foot>
        Graded by the companion’s own bench: commands, refusals and questions. With the model, {run("rules+llm").unsafeAccepts} order it should have refused got through; our rules alone let{" "}
        {run("rules").unsafeAccepts || "none"} through. Replies shown are gpt-4.1-mini’s; Laya ran on the CPU.
      </Foot>
    </SlideRoot>
  );
}

const MARK = new Set(["585723b", "e241116", "984c6db"]);

function WhoSlide({ step }: { step: number }) {
  const commits = H.brain.commits;
  const coBy = commits.filter((c) => /Claude/.test(c.coAuthor ?? "")).length;
  return (
    <SlideRoot gap="gap-5">
      <Head tag="07 · Where models do help" title="So who wrote our rules?" />
      <Where>git log tools/arena/brain.mjs · RTSAI-WebGame · {commits.length} commits, {coBy} co-authored by Claude</Where>
      <div className="grid grid-cols-[96px_76px_1fr_150px] gap-x-4 text-base">
        {["commit", "date", "message", "co-author"].map((h) => <div key={h} className="pb-1 text-sm text-muted">{h}</div>)}
        {commits.flatMap((c) => {
          const tip = `${c.hash} · ${c.date} · ${c.author}${c.coAuthor ? ` with ${c.coAuthor.split(" <")[0]}` : ""}`;
          return [
            <code key={`${c.hash}-h`} title={tip} className="border-t border-border py-2 font-mono" style={{ color: OURS }}>{c.hash}</code>,
            <span key={`${c.hash}-d`} className="border-t border-border py-2 text-muted">{day(c.date)}</span>,
            <span key={`${c.hash}-s`} className={`border-t border-border py-2 leading-snug ${MARK.has(c.hash) ? "font-semibold text-foreground" : "text-muted"}`}>{c.subject}</span>,
            <span key={`${c.hash}-c`} className="truncate border-t border-border py-2 font-mono text-sm leading-6 text-muted">{(c.coAuthor ?? "none").split(" <")[0]}</span>,
          ];
        })}
      </div>
      <Fade on={step >= 1} className="flex flex-wrap items-center gap-3">
        {["Read a lost game’s log", "Add one idea as a switch", "Play the same 16 games", "Keep it or drop it"].map((t, i) => (
          <span key={t} className="flex items-center gap-3">
            {i > 0 && <span className="text-2xl text-muted">→</span>}
            <span className="rounded-lg border border-border bg-surface px-4 py-2 text-lg font-semibold">{t}</span>
          </span>
        ))}
        <span className="text-2xl text-muted">↺</span>
      </Fade>
      <Close on={step >= 2} className="text-4xl">The AI that wins isn’t the one playing. It’s the one that wrote the player.</Close>
    </SlideRoot>
  );
}

/* ─── The deck: one slide per click, with the spoken notes ─── */

const NOTES: Record<string, { say: string; do?: string }> = data.notes.steps;
const note = (k: string, say?: string) => {
  const n = NOTES[k];
  if (!n && !say) return undefined;
  return `${say ?? n.say}${n?.do ? ` (${n.do})` : ""}`;
};
const s = (id: string, content: ReactNode, first: boolean, notes = note(id)): Slide => ({ id, content, notes, transition: first ? "fade" : "none" });

const slides: Slide[] = [
  s("hold", <HoldSlide />, true, "[Wait for the room. Then click: the film rolls, silent, 34 seconds.]"),
  s("cold", <ColdSlide />, false, note("cold", NOTES.cold.say.replace(/^\[[^\]]*\]\s*/, "[Say nothing for 15 seconds.] "))),
  s("ask", <AskSlide />, true),
  ...[0, 1, 2, 3].map((i) => s(`arch${i}`, <ArchSlide step={i} />, i === 0)),
  ...[0, 1].map((i) => s(`code${i}`, <DecideSlide step={i} />, i === 0)),
  s("prompt", <PromptSlide />, true),
  s("rules", <RulesSlide />, true),
  s("log", <LogSlide />, true),
  s("film", <FilmSlide />, true),
  ...R.brains.map((_, i) => s(`row${i}`, <BoardSlide shown={i + 1} lesson={false} />, i === 0)),
  s("lesson", <BoardSlide shown={R.brains.length} lesson />, false),
  ...[0, 1, 2].map((i) => s(`turn${i}`, <TurnSlide step={i} />, i === 0)),
  ...[0, 1, 2].map((i) => s(`why${i}`, <WhySlide step={i} />, i === 0)),
  ...[0, 1].map((i) => s(`coach${i}`, <CoachSlide step={i} />, i === 0)),
  ...[0, 1].map((i) => s(`coachR${i}`, <CoachResultSlide close={i === 1} />, i === 0)),
  ...[0, 1, 2, 3].map((i) => s(`fail${i}`, <FailSlide step={i} />, i === 0)),
  s("flags", <FlagsSlide />, true),
  ...[0, 1, 2, 3].map((i) => s(`exp${i}`, <ExpSlide step={i} />, i === 0)),
  s("learn", <LearnSlide />, true),
  ...[0, 1].map((i) => s(`voice${i}`, <VoiceSlide step={i} />, i === 0)),
  ...[0, 1, 2].map((i) => s(`who${i}`, <WhoSlide step={i} />, i === 0)),
];

export const canAnAiPlay: Presentation = {
  slug: "can-an-ai-play",
  title: "Can an AI Play Our Game?",
  subtitle: "Four brains, the same 16 games, and who really won",
  author: "Ali Badereddin",
  date: "November 16, 2026",
  description:
    "The AI Tinkerers Doha Round 5 talk: three AI models and a page of rules play the same real-time strategy games. Why the rules won, how they got good one switch at a time, where models do help, and who wrote the rules.",
  accentColor: OURS,
  slides,
};
