"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import {
  Reveal,
  StaggerChildren,
  StaggerItem,
  FlipNumber,
  WebGLHero,
  Marquee,
  Spectrum,
  StickyMedia,
  HorizontalPin,
  ParticleField,
  ScrollProgress,
} from "@/components/animations";
import { ChapterNav } from "@/components/chapter-nav";
import { DeckControls } from "@/components/deck-controls";
import { usePrintMode, useM } from "@/lib/print-mode";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  Copy,
  Database,
  HardDrive,
  KeyRound,
  Lock,
  Rocket,
} from "lucide-react";
import {
  AUDIT_ROWS,
  BUILDS,
  LEAN_ROWS,
  PLATFORM_ROWS,
  REPLIT_POINT,
  RIVALS,
  SOURCES,
  type Band,
  type Build,
  type Camp,
  type Grade,
} from "./the-power-of-replit.data";

/**
 * The Power of Replit — a field guide, November 2026.
 *
 * What is verified and what is not:
 * - The five screenshots are of Replit's public site, captured 17 Nov 2026.
 *   The "450+ integrations" count, the five output types on the home prompt
 *   box and the plan prices are read straight off those pages.
 * - Revenue and valuation are third-party figures and are labelled as such.
 * - The positioning map and the Replit-vs-Claude chart are editorial judgment.
 *   Both say so on screen. Do not present them as measurements.
 * - "The audit" is a desk review of public evidence. Nothing was tested against
 *   Replit or any rival. Replit's rows were checked against its own security
 *   page; rival rows are what each vendor reports about itself.
 *
 * English only: Openstage has no i18n port yet (see CLAUDE.md).
 */

const TAGLINE = "Describe · Build · Connect · Secure · Ship";

const C = {
  orange: "#F26207",
  orangeSoft: "#FF9A5C",
  teal: "#5EEAD4",
  violet: "#A5B4FC",
  gray: "#9CA3AF",
};

const SHOTS = "/talks/the-power-of-replit";

const CHAPTERS = [
  { id: "hero", label: "The power of Replit", dark: true },
  { id: "shift", label: "The shift", dark: true },
  { id: "loop", label: "One tab", dark: true },
  { id: "box", label: "In the box", dark: false },
  { id: "connect", label: "Connect", dark: true },
  { id: "builds", label: "Ten builds", dark: true },
  { id: "prove", label: "Prove it", dark: true },
  { id: "security", label: "The audit", dark: true },
  { id: "price", label: "The price", dark: false },
  { id: "field", label: "The field", dark: true },
  { id: "versus", label: "Replit vs Claude", dark: true },
  { id: "fit", label: "The sweet spot", dark: true },
  { id: "cta", label: "Start", dark: true },
] as const;

/* ─── Shared pieces ───────────────────────────────────────────────────── */

type Tone = "ink" | "ink2" | "cream";

const TONE_CLASS: Record<Tone, string> = {
  ink: "bg-[#0b0d10] text-white",
  ink2: "bg-[#12151a] text-white",
  cream: "bg-[#faf7f2] text-[#14110f]",
};

/* w-full on the inner wrapper is load-bearing: see the scroll-deck pitfalls. */
function Section({
  id,
  tone = "ink",
  className,
  children,
}: {
  id: string;
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`relative ${TONE_CLASS[tone]} ${className ?? ""}`}>
      <div className="relative z-10 w-full">{children}</div>
    </section>
  );
}

function Kicker({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <div
      className={`mb-4 font-mono text-xs uppercase tracking-[0.3em] ${light ? "text-black/45" : "text-white/45"}`}
    >
      {children}
    </div>
  );
}

function Head({
  kicker,
  title,
  em,
  body,
  light,
}: {
  kicker: string;
  title: string;
  em: string;
  body?: string;
  light?: boolean;
}) {
  return (
    <Reveal>
      <Kicker light={light}>{kicker}</Kicker>
      <h2 className="max-w-4xl text-5xl font-semibold leading-[0.96] tracking-[-0.045em] md:text-7xl">
        {title}
        <span
          className={`editorial-italic block font-normal ${light ? "text-black/40" : "text-white/40"}`}
        >
          {em}
        </span>
      </h2>
      {body && (
        <p
          className={`mt-6 max-w-2xl text-lg leading-relaxed ${light ? "text-black/60" : "text-white/60"}`}
        >
          {body}
        </p>
      )}
    </Reveal>
  );
}

function Callout({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <Reveal delay={0.2}>
      <blockquote
        className={`relative max-w-3xl rounded-2xl border-l-4 px-7 py-6 ${
          light ? "bg-black/[0.04] text-black/80" : "bg-white/[0.04] text-white/85"
        }`}
        style={{ borderLeftColor: C.orange }}
      >
        <p className="text-base italic leading-relaxed md:text-lg">&ldquo;{children}&rdquo;</p>
      </blockquote>
    </Reveal>
  );
}

/** A real screenshot inside a plain browser chrome, so it reads as evidence. */
function BrowserFrame({
  src,
  alt,
  url,
  width,
  height,
  light,
  priority,
}: {
  src: string;
  alt: string;
  url: string;
  width: number;
  height: number;
  light?: boolean;
  priority?: boolean;
}) {
  return (
    <figure
      className={`overflow-hidden rounded-2xl border ${
        light
          ? "border-black/10 bg-white shadow-[0_30px_80px_rgba(20,17,15,0.14)]"
          : "border-white/12 bg-[#1a1d22] shadow-[0_40px_120px_rgba(0,0,0,0.55)]"
      }`}
    >
      <div
        className={`flex items-center gap-2 border-b px-4 py-2.5 ${light ? "border-black/8" : "border-white/8"}`}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-2.5 w-2.5 rounded-full ${light ? "bg-black/15" : "bg-white/18"}`}
          />
        ))}
        <span
          className={`ml-3 truncate rounded-md px-3 py-1 font-mono text-[10px] ${
            light ? "bg-black/5 text-black/50" : "bg-white/6 text-white/50"
          }`}
        >
          {url}
        </span>
      </div>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        // Five small images. Eager, because a lazy one prints as a blank frame.
        loading={priority ? undefined : "eager"}
        sizes="(min-width: 1024px) 1000px, 100vw"
        className="block h-auto w-full"
      />
    </figure>
  );
}

function Captured({ light }: { light?: boolean }) {
  return (
    <p className={`mt-3 font-mono text-[10px] uppercase tracking-[0.2em] ${light ? "text-black/40" : "text-white/35"}`}>
      Replit&rsquo;s public site · captured 17 Nov 2026
    </p>
  );
}

/* ─── 0. Hero — the screenshot rises into place as you scroll ─────────── */

function HeroSection() {
  const print = usePrintMode();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.25"] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.84, 1]);
  const rotateX = useTransform(scrollYProgress, [0, 1], [16, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [60, 0]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0.55, 1]);

  return (
    <section id="hero" className="relative overflow-hidden bg-[#0b0d10] text-white">
      <div className="relative flex min-h-screen flex-col">
        <WebGLHero
          colors={["#0b0d10", "#7a2e05", "#F26207", "#0b0d10"]}
          speed={0.3}
          grain={0.08}
          fadeBottom
          className="absolute inset-0"
        />
        <div className="relative z-10 border-b border-white/5">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 font-mono text-xs uppercase tracking-[0.3em] text-white/50">
            <span>Human Quest · Field guide</span>
            <span className="hidden sm:inline">November 2026</span>
          </div>
        </div>
        <div className="relative z-10 flex flex-1 items-center">
          <div className="mx-auto w-full max-w-6xl px-6">
            <Reveal>
              <div className="mb-5 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.28em] text-white/55">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: C.orange, boxShadow: `0 0 18px ${C.orange}` }}
                />
                Ten builds · two comparisons · one audit
              </div>
              <h1 className="mb-10 text-5xl font-semibold leading-[0.9] tracking-[-0.06em] sm:text-6xl md:text-7xl lg:text-[7rem]">
                The Power of Replit.
                <span className="editorial-italic mt-3 block text-[0.62em] font-normal leading-none tracking-[-0.03em] text-white/55">
                  A sentence in. A live app out.
                </span>
              </h1>
              <p className="mb-9 max-w-2xl text-lg leading-relaxed text-white/72 md:text-2xl">
                What it does when the editor, the agent, the database, the sign-in and the hosting
                all live in one browser tab — and how to prompt it so the result is worth shipping.
              </p>
              <div className="font-mono text-sm uppercase tracking-[0.2em] text-white/60 md:text-base">
                {TAGLINE}
              </div>
            </Reveal>
          </div>
        </div>
        <div className="relative z-10 pb-8">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-6 text-[10px] uppercase tracking-[0.3em] text-white/42">
            <motion.span
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            >
              ↓
            </motion.span>
            <span>Scroll to begin</span>
          </div>
        </div>
      </div>

      <div
        ref={ref}
        className="relative z-10 mx-auto max-w-6xl px-6 pb-28 md:pb-36"
        style={{ perspective: 1400 }}
      >
        <motion.div
          style={print ? undefined : { scale, rotateX, y, opacity, transformOrigin: "50% 0%" }}
        >
          <BrowserFrame
            src={`${SHOTS}/home.png`}
            alt="Replit's home page: a single prompt box under the headline 'What will you build?'"
            url="replit.com"
            width={1440}
            height={900}
            priority
          />
        </motion.div>
        <Captured />
      </div>
    </section>
  );
}

/* ─── 1. The shift — stats ────────────────────────────────────────────── */

function ShiftSection() {
  const stats = [
    { v: 450, suffix: "+", label: "integrations", sub: "the count on replit.com/integrations", color: C.orange },
    { v: 5, label: "outputs from one box", sub: "website · mobile · design · slides · animation", color: C.teal },
    { v: 9, prefix: "$", suffix: "B", label: "valuation", sub: "as reported, March 2026", color: C.violet },
    { v: 525, prefix: "~$", suffix: "M", label: "annualized revenue", sub: "Sacra estimate, April 2026", color: C.orangeSoft },
  ];
  return (
    <Section id="shift" tone="ink" className="overflow-hidden py-28 md:py-36">
      <ParticleField preset="ambient" opacity={0.08} className="absolute inset-0" />
      <div className="relative mx-auto max-w-7xl px-6 md:px-10">
        <Head
          kicker="01 · The shift"
          title="The tab is the whole stack."
          em="Nothing to install. Nothing to wire."
          body="For twenty years, starting a project meant choosing an editor, a framework, a database, a login system and a host — before writing a line that mattered. Replit collapses those choices into one prompt box."
        />

        <div className="my-16 grid grid-cols-2 border-y border-white/12 md:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={i} delay={0.08 + i * 0.08}>
              <div className="min-h-44 min-w-0 border-white/12 px-4 py-8 first:border-l-0 md:border-l md:px-7">
                <div
                  className="text-4xl font-semibold leading-none tracking-[-0.05em] md:text-5xl lg:text-6xl"
                  style={{ color: s.color }}
                >
                  <FlipNumber value={s.v} prefix={s.prefix} suffix={s.suffix} />
                </div>
                <div className="mt-5 text-sm font-semibold uppercase tracking-[0.08em] text-white">
                  {s.label}
                </div>
                <div className="mt-1 text-xs leading-snug text-white/42">{s.sub}</div>
              </div>
            </Reveal>
          ))}
        </div>

        <Callout>
          The scarce skill stopped being typing code. It is describing, precisely, what done looks
          like.
        </Callout>
      </div>
    </Section>
  );
}

/* ─── 2. One tab — pinned screenshot, five steps ──────────────────────── */

function LoopSection() {
  const steps = [
    { n: "01 · Describe", t: "Say what you want in plain language.", b: "A sentence is enough to start: who it is for, what it does, and what done looks like." },
    { n: "02 · Plan", t: "The agent proposes before it builds.", b: "A data model, a list of pages and a task order you can approve, change or reject — before anything is written." },
    { n: "03 · Build", t: "Code, database and sign-in arrive together.", b: "The agent writes the app and provisions what it needs in the same workspace. There is nothing to install." },
    { n: "04 · Test", t: "It opens the app and uses it.", b: "The agent clicks through its own work in a browser, reports what broke, and fixes it." },
    { n: "05 · Ship", t: "One step to a public URL.", b: "Choose how it runs — on demand, always on, or on a schedule — and it is live." },
  ];
  return (
    <section id="loop" className="relative bg-[#12151a] text-white">
      <div className="mx-auto max-w-7xl px-6 pt-28 md:px-10 md:pt-36">
        <Head
          kicker="02 · One tab"
          title="Five moves."
          em="None of them is setup."
          body="The screen on the left is where every Replit project starts. Everything on the right happens without leaving it."
        />
      </div>
      <StickyMedia
        media={
          <div className="w-full px-8 lg:px-14">
            <BrowserFrame
              src={`${SHOTS}/home.png`}
              alt="Replit's home page prompt box, with Website, Mobile, Design, Slides and Animation modes"
              url="replit.com"
              width={1440}
              height={900}
            />
          </div>
        }
        stepGap="30vh"
        verticalPadding="28vh"
      >
        {steps.map((s, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/10 bg-[#0b0d10]/80 p-6 backdrop-blur"
          >
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em]" style={{ color: C.orangeSoft }}>
              {s.n}
            </p>
            <h3 className="mb-3 text-2xl font-semibold tracking-[-0.02em]">{s.t}</h3>
            <p className="text-base leading-relaxed text-white/60">{s.b}</p>
          </div>
        ))}
      </StickyMedia>
      <div className="mx-auto max-w-7xl px-6 pb-28 md:px-10 md:pb-36">
        <Callout>
          The agent is not the product. The loop is — and it only closes because nothing ever
          leaves the tab.
        </Callout>
      </div>
    </section>
  );
}

/* ─── 3. In the box ───────────────────────────────────────────────────── */

function BoxSection() {
  const parts = [
    { Icon: Bot, t: "Agent", b: "Plans, builds, tests and fixes from a conversation." },
    { Icon: Database, t: "Database", b: "PostgreSQL, created the moment the app needs it." },
    { Icon: KeyRound, t: "Auth", b: "Sign-in without building a login system." },
    { Icon: HardDrive, t: "App storage", b: "Files and uploads, kept out of the database." },
    { Icon: Lock, t: "Secrets", b: "Keys live outside the code, where they belong." },
    { Icon: Rocket, t: "Deployments", b: "On demand, always on, static, or on a schedule." },
  ];
  return (
    <Section id="box" tone="cream" className="py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Head
          light
          kicker="03 · In the box"
          title="Six services."
          em="Zero accounts to create."
          body="Each of these is normally a separate vendor, a separate dashboard and a separate bill. Here the agent reaches for them the way you would reach for a drawer."
        />
        <div className="mt-16 grid gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <Reveal>
            <BrowserFrame
              light
              src={`${SHOTS}/database.png`}
              alt="Replit's Agent page: a chat message 'Create a database for my app' answered with a live database overview"
              url="replit.com/products/agent"
              width={1040}
              height={670}
            />
            <Captured light />
          </Reveal>
          <StaggerChildren className="border-b border-black/10">
            {parts.map(({ Icon, t, b }, i) => (
              <StaggerItem key={i}>
                <div className="flex items-start gap-5 border-t border-black/10 py-5">
                  <Icon className="mt-1 h-5 w-5 shrink-0" style={{ color: C.orange }} />
                  <div>
                    <h3 className="text-xl font-semibold tracking-[-0.02em]">{t}</h3>
                    <p className="mt-1 text-base leading-relaxed text-black/60">{b}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
        <div className="mt-16">
          <Callout light>
            Every service you did not have to choose is a decision you never have to defend in a
            design review.
          </Callout>
        </div>
      </div>
    </Section>
  );
}

/* ─── 4. Connect ──────────────────────────────────────────────────────── */

function ConnectSection() {
  const points = [
    { k: "450+", b: "Integrations in the library, by Replit's own count." },
    { k: "Sign in once", b: "Authorize a service and the agent can use it. No key pasted into a chat." },
    { k: "No connector?", b: "Call the service's official API and keep the key in Secrets." },
  ];
  return (
    <Section id="connect" tone="ink" className="overflow-hidden py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Head
          kicker="04 · Connect"
          title="Already plugged in."
          em="Stripe, Slack, GitHub, Notion, Drive."
          body="The real power is not that Replit builds an app. It is that the app arrives already talking to the systems your work lives in."
        />
        <Reveal delay={0.1}>
          <div className="mx-auto mt-16 max-w-5xl">
            <BrowserFrame
              src={`${SHOTS}/integrations.png`}
              alt="Replit's integrations page: 'Connect tools. Ship products.' with over 450 integrations"
              url="replit.com/integrations"
              width={1440}
              height={900}
            />
            <Captured />
          </div>
        </Reveal>
        <StaggerChildren className="my-16 grid gap-10 md:grid-cols-3">
          {points.map((p, i) => (
            <StaggerItem key={i}>
              <div className="border-t border-white/18 pt-6">
                <h3 className="text-3xl font-semibold tracking-[-0.03em]" style={{ color: C.orangeSoft }}>
                  {p.k}
                </h3>
                <p className="mt-3 max-w-xs text-base leading-relaxed text-white/55">{p.b}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
        <Callout>
          Wiring an integration is the easy half. Deciding what it is allowed to touch is the work.
        </Callout>
      </div>
    </Section>
  );
}

/* ─── 5. Ten builds — pinned horizontal track, each card copies a prompt ─ */

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

function BuildCard({ i, total, b }: { i: number; total: number; b: Build }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const onCopy = async () => {
    const ok = await copyText(b.prompt);
    setState(ok ? "copied" : "failed");
    window.setTimeout(() => setState("idle"), 2200);
  };
  const edge = i === 0 ? "pl-6 md:pl-10" : i === total - 1 ? "pr-6 md:pr-10" : "";
  return (
    <div className={`w-full ${edge}`}>
      <article className="flex min-h-[24rem] flex-col rounded-3xl border border-white/10 bg-white/[0.035] p-7">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[11px] tracking-[0.22em] text-white/40">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em]"
            style={{ borderColor: `${C.orange}59`, background: `${C.orange}1a`, color: C.orangeSoft }}
          >
            <Lock className="h-3 w-3" aria-hidden />
            {b.guard}
          </span>
        </div>
        <h3 className="mt-8 text-3xl font-semibold tracking-[-0.03em]">{b.title}</h3>
        <p className="mt-3 text-base leading-relaxed text-white/60">{b.line}</p>
        <p className="mt-5 font-mono text-xs leading-relaxed text-white/40">{b.taps}</p>
        <button
          type="button"
          onClick={onCopy}
          className="mt-auto inline-flex items-center gap-2 self-start rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition-colors hover:border-white/40 hover:text-white"
        >
          {state === "copied" ? (
            <Check className="h-4 w-4" aria-hidden />
          ) : (
            <Copy className="h-4 w-4" aria-hidden />
          )}
          {state === "copied"
            ? "Copied"
            : state === "failed"
              ? "Copy blocked by the browser"
              : "Copy the build prompt"}
        </button>
      </article>
    </div>
  );
}

function BuildsSection() {
  return (
    <section
      id="builds"
      className="relative bg-[#12151a] text-white"
      style={{ "--horizontal-pin-bg": "#12151a" } as React.CSSProperties}
    >
      <HorizontalPin
        panelWidth="min(26rem, 84vw)"
        gap="1.25rem"
        title={
          <div>
            <Kicker>05 · Ten builds</Kicker>
            <h2 className="max-w-4xl text-4xl font-semibold leading-[0.98] tracking-[-0.04em] md:text-6xl">
              Ten things worth building.
              <span className="editorial-italic block font-normal text-white/40">
                Each card copies a full prompt.
              </span>
            </h2>
          </div>
        }
      >
        {BUILDS.map((b, i) => (
          <BuildCard key={i} i={i} total={BUILDS.length} b={b} />
        ))}
      </HorizontalPin>
      <div className="mx-auto max-w-7xl px-6 py-24 md:px-10">
        <p className="mb-10 max-w-2xl text-lg leading-relaxed text-white/60">
          The orange tag on each card is the security problem that prompt forces the agent to
          solve. The line under the title is what it plugs into.
        </p>
        <Callout>
          The prompt that ships is not the longest one. It is the one that says how you will know
          it worked.
        </Callout>
      </div>
    </section>
  );
}

/* ─── 6. Prove it — the anatomy of a prompt that holds ────────────────── */

function ProveSection() {
  const parts = [
    { n: "01", t: "Features", b: "The product, specific enough that the agent cannot invent scope." },
    { n: "02", t: "Platform", b: "Which connectors, which database, which kind of deployment." },
    { n: "03", t: "Security", b: "Concrete rules. Never the phrase “make it secure”." },
    { n: "04", t: "Prove it", b: "An attack the agent must run on its own build, and show you." },
  ];
  return (
    <Section id="prove" tone="ink" className="overflow-hidden py-28 md:py-36">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(242,98,7,.10),transparent_30%)]" />
      <div className="relative mx-auto max-w-7xl px-6 md:px-10">
        <Head
          kicker="06 · Prove it"
          title="Four parts."
          em="The fourth is the one people skip."
          body="An agent will happily tell you a build is secure. Asking it to demonstrate that — against its own work, with the requests on screen — is what turns a claim into evidence."
        />

        <StaggerChildren className="my-16 grid md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:items-start">
          {parts.flatMap(({ n, t, b }, i) => [
            <StaggerItem key={i}>
              <div className="border-t border-white/18 pt-6">
                <span className="font-mono text-[10px] text-white/35">{n}</span>
                <h3
                  className="mt-6 text-3xl font-semibold tracking-[-0.04em] md:text-4xl"
                  style={i === 3 ? { color: C.orangeSoft } : undefined}
                >
                  {t}
                </h3>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/50">{b}</p>
              </div>
            </StaggerItem>,
            i < parts.length - 1 ? (
              <ArrowRight
                key={`arrow-${i}`}
                className="mx-5 mt-8 hidden h-5 w-5 text-white/18 md:block"
                aria-hidden
              />
            ) : null,
          ])}
        </StaggerChildren>

        <div className="mb-16 grid gap-10 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <BrowserFrame
              src={`${SHOTS}/security.png`}
              alt="Replit's security page: 'Secure by default — enterprise-grade security from sandbox to production'"
              url="replit.com/security"
              width={1440}
              height={900}
            />
            <Captured />
          </Reveal>
          <Reveal delay={0.12}>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
              What a &ldquo;prove it&rdquo; clause looks like
            </p>
            <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/10 bg-white/[0.03] p-6 font-mono text-sm leading-relaxed text-white/75">
{`Seed two client organisations.
Log in as client A and try to open
client B's project, file URL and
invoice by ID.

Show me each request and the
refusal it gets.`}
            </pre>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/55">
              The platform is secure by default. Your app is not — it is exactly as secure as the
              rules you wrote and the attack you made the agent run.
            </p>
          </Reveal>
        </div>

        <Callout>
          A security section the agent was not made to attack is a wish list.
        </Callout>
      </div>
    </Section>
  );
}

/* ─── 7. The audit — is the platform itself secure? ───────────────────── */

const GRADE: Record<Grade, { label: string; color: string }> = {
  strong: { label: "Strong", color: C.teal },
  watch: { label: "Watch", color: "#FBBF24" },
  gap: { label: "Gap", color: "#FB7185" },
};

const BAND_COLOR: Record<Band, string> = {
  more: C.teal,
  replit: C.orange,
  similar: C.gray,
  less: "#FB7185",
};

function SecuritySection() {
  const tally = (["strong", "watch", "gap"] as Grade[]).map((g) => ({
    g,
    n: AUDIT_ROWS.filter((r) => r.grade === g).length,
  }));
  return (
    <Section id="security" tone="ink2" className="overflow-hidden py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Head
          kicker="07 · The audit"
          title="Secure platform."
          em="Unproven apps."
          body="“Is Replit secure?” is two questions. Is the company and its infrastructure sound? On the public evidence, yes — with one gap and one scar. Is the app its agent built for you sound? Nobody has checked that but you."
        />

        <div className="my-14 grid grid-cols-3 border-y border-white/12">
          {tally.map(({ g, n }, i) => (
            <Reveal key={i} delay={0.08 + i * 0.08}>
              <div className="min-w-0 border-white/12 px-4 py-7 first:border-l-0 md:border-l md:px-7">
                <div
                  className="text-4xl font-semibold leading-none tracking-[-0.05em] md:text-6xl"
                  style={{ color: GRADE[g].color }}
                >
                  <FlipNumber value={n} />
                </div>
                <div className="mt-4 text-sm font-semibold uppercase tracking-[0.08em] text-white">
                  {GRADE[g].label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <StaggerChildren className="border-b border-white/10">
          {AUDIT_ROWS.map((r, i) => (
            <StaggerItem key={i}>
              <div className="grid gap-x-8 gap-y-2 border-t border-white/10 py-5 md:grid-cols-[15rem_6rem_1fr] md:items-baseline">
                <h3 className="text-lg font-semibold tracking-[-0.01em]">{r.area}</h3>
                <span
                  className="inline-flex w-fit items-center rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em]"
                  style={{
                    color: GRADE[r.grade].color,
                    borderColor: `${GRADE[r.grade].color}59`,
                    background: `${GRADE[r.grade].color}14`,
                  }}
                >
                  {GRADE[r.grade].label}
                </span>
                <p className="text-base leading-relaxed text-white/60">{r.finding}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>

        <Reveal>
          <h3 className="mt-24 text-3xl font-semibold tracking-[-0.03em] md:text-5xl">
            Against the others.
            <span className="editorial-italic ml-3 font-normal text-white/40">More to less.</span>
          </h3>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60">
            {(
              [
                ["More evidence than Replit", BAND_COLOR.more],
                ["Replit", BAND_COLOR.replit],
                ["About the same", BAND_COLOR.similar],
                ["Less", BAND_COLOR.less],
              ] as const
            ).map(([label, color]) => (
              <span key={label} className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
        </Reveal>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                <th className="pb-3 font-normal">Platform</th>
                <th className="pb-3 font-normal">Our read</th>
                <th className="pb-3 font-normal">Audits it reports</th>
                <th className="pb-3 font-normal">Checks before you publish</th>
                <th className="pb-3 font-normal">On the record</th>
              </tr>
            </thead>
            <tbody>
              {PLATFORM_ROWS.map((p, i) => (
                <tr
                  key={i}
                  className={`border-t border-white/10 align-top ${p.band === "replit" ? "bg-white/[0.05]" : ""}`}
                >
                  <td className="py-4 pl-3 pr-5">
                    <span className="inline-flex items-center gap-2 whitespace-nowrap font-semibold text-white">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: BAND_COLOR[p.band] }}
                      />
                      {p.name}
                    </span>
                  </td>
                  <td className="py-4 pr-5" style={{ color: BAND_COLOR[p.band] }}>
                    {p.read}
                  </td>
                  <td className="py-4 pr-5 text-white/70">{p.audits}</td>
                  <td className="py-4 pr-5 text-white/70">{p.checks}</td>
                  <td className="py-4 pr-3 text-white/70">{p.record}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-white/45">
          A desk review of public evidence on 17 November 2026; nothing was tested. The audit
          column is what each vendor reports about itself. Incidents are those found in public
          reporting. The read is editorial judgment, and an audit covers the vendor, not the app
          you build on it.
        </p>
        <div className="mt-12">
          <Callout>
            A SOC 2 report audits the vendor. Nobody audits what the agent built for you — which
            is why the prompt has to.
          </Callout>
        </div>
      </div>
    </Section>
  );
}

/* ─── 8. The price ────────────────────────────────────────────────────── */

function PriceSection() {
  const plans = [
    { t: "Core", p: "$18 a month, billed annually", b: "Includes $20 toward more powerful models." },
    { t: "Pro", p: "$90 a month, billed annually", b: "$100 toward the most powerful models, up to 15 collaborators." },
    { t: "Enterprise", p: "Custom", b: "SSO, SCIM, audit logs and private networking." },
  ];
  return (
    <Section id="price" tone="cream" className="py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Head
          light
          kicker="08 · The price"
          title="A subscription buys credits."
          em="The agent spends them by effort."
        />
        <div className="mt-16 grid gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <Reveal>
            <BrowserFrame
              light
              src={`${SHOTS}/pricing.png`}
              alt="Replit's pricing page showing the Core, Pro and Enterprise plans"
              url="replit.com/pricing"
              width={1440}
              height={900}
            />
            <Captured light />
          </Reveal>
          <StaggerChildren className="border-b border-black/10">
            {plans.map((pl, i) => (
              <StaggerItem key={i}>
                <div className="border-t border-black/10 py-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <h3 className="text-2xl font-semibold tracking-[-0.02em]">{pl.t}</h3>
                    <span className="font-mono text-sm" style={{ color: "#B4460A" }}>
                      {pl.p}
                    </span>
                  </div>
                  <p className="mt-2 text-base leading-relaxed text-black/60">{pl.b}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
        <p className="mt-10 max-w-2xl text-sm leading-relaxed text-black/50">
          As listed on replit.com/pricing on 17 November 2026. Prices and allowances change —
          check the page before you budget.
        </p>
        <div className="mt-10">
          <Callout light>
            You are not paying for seats so much as for effort, which makes a vague prompt a line
            item.
          </Callout>
        </div>
      </div>
    </Section>
  );
}

/* ─── 9. The field — positioning map + the ten rivals ─────────────────── */

const CAMP_COLOR: Record<Camp, string> = {
  replit: C.orange,
  builder: C.teal,
  devtool: C.violet,
};

function PositioningMap({
  active,
  setActive,
}: {
  active: number | null;
  setActive: (i: number | null) => void;
}) {
  const m = useM();
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="mb-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60">
          {(
            [
              ["Replit", C.orange],
              ["Browser app builders", C.teal],
              ["Developer coding tools", C.violet],
            ] as const
          ).map(([label, color]) => (
            <span key={label} className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
        <div className="relative h-[440px] border-b border-l border-white/20 md:h-[520px]">
          <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-white/10" />
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/10" />
          <span className="absolute right-3 top-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
            Full platform: hosting, database, auth
          </span>
          <span className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
            Writes code only
          </span>

          <m.div
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="absolute flex -translate-y-1/2 items-center gap-2.5 whitespace-nowrap text-lg font-semibold"
            style={{ left: `${REPLIT_POINT.x}%`, top: `${100 - REPLIT_POINT.y}%` }}
          >
            <span
              className="h-4 w-4 rounded-full"
              style={{ background: C.orange, boxShadow: `0 0 22px ${C.orange}` }}
            />
            {REPLIT_POINT.name}
          </m.div>

          {RIVALS.map((r, i) => (
            <m.button
              key={i}
              type="button"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              initial={{ opacity: 0, scale: 0.6 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.05 }}
              className={`absolute flex -translate-y-1/2 items-center gap-2 whitespace-nowrap text-sm transition-colors ${
                r.side === "left" ? "-translate-x-full flex-row-reverse" : ""
              } ${active === i ? "text-white" : "text-white/65 hover:text-white"}`}
              style={{ left: `${r.x}%`, top: `${100 - r.y}%` }}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  background: CAMP_COLOR[r.camp],
                  boxShadow: active === i ? `0 0 14px ${CAMP_COLOR[r.camp]}` : undefined,
                }}
              />
              {r.name}
            </m.button>
          ))}
        </div>
        <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
          <span>No code</span>
          <span>Who it is built for</span>
          <span>Professional developer</span>
        </div>
      </div>
    </div>
  );
}

function FieldSection() {
  const [active, setActive] = useState<number | null>(null);
  return (
    <Section id="field" tone="ink2" className="overflow-hidden py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Head
          kicker="09 · The field"
          title="Ten rivals."
          em="Two different fights."
          body="Five compete for the same person: describe an app, get it live. Five are where developers go when the project outgrows a browser tab. Hover a name to see its edge."
        />

        <div className="mt-16 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-10">
          <PositioningMap active={active} setActive={setActive} />
        </div>

        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                <th className="w-10 pb-3 font-normal">#</th>
                <th className="pb-3 font-normal">Competitor</th>
                <th className="pb-3 font-normal">What it is</th>
                <th className="pb-3 font-normal">Its edge over Replit</th>
                <th className="pb-3 font-normal">Replit&rsquo;s edge</th>
              </tr>
            </thead>
            <tbody>
              {RIVALS.map((r, i) => (
                <tr
                  key={i}
                  onMouseEnter={() => setActive(i)}
                  className={`border-t border-white/10 align-top transition-colors ${
                    active === i ? "bg-white/[0.05]" : ""
                  }`}
                >
                  <td className="py-3.5 pr-3 font-mono text-xs text-white/35">{i + 1}</td>
                  <td className="py-3.5 pr-5">
                    <span className="inline-flex items-center gap-2 whitespace-nowrap font-semibold text-white">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: CAMP_COLOR[r.camp] }}
                      />
                      {r.name}
                    </span>
                  </td>
                  <td className="py-3.5 pr-5 text-white/55">{r.what}</td>
                  <td className="py-3.5 pr-5 text-white/75">{r.edge}</td>
                  <td className="py-3.5 text-white/75">{r.replitEdge}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-white/45">
          Ranked by how directly each one competes for the same person, not by revenue. Positions
          on the map are editorial judgment, not measurements.
        </p>
        <div className="mt-12">
          <Callout>
            Replit&rsquo;s rivals are not other editors. They are anything that turns a sentence
            into a URL.
          </Callout>
        </div>
      </div>
    </Section>
  );
}

/* ─── 10. Replit vs Claude — dots slide to their side as you scroll ────── */

function LeanDot({
  lean,
  progress,
  print,
}: {
  lean: number;
  progress: MotionValue<number>;
  print: boolean;
}) {
  const left = useTransform(progress, [0, 1], ["50%", `${lean}%`]);
  const color = lean < 45 ? C.orange : lean > 55 ? C.violet : C.gray;
  return (
    <motion.span
      className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{ left: print ? `${lean}%` : left, background: color, boxShadow: `0 0 12px ${color}66` }}
    />
  );
}

function LeanChart() {
  const print = usePrintMode();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "center 0.5"] });
  return (
    <div ref={ref} className="relative">
      <div className="mb-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60">
        {(
          [
            ["Leans Replit", C.orange],
            ["Even", C.gray],
            ["Leans Claude", C.violet],
          ] as const
        ).map(([label, color]) => (
          <span key={label} className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-[minmax(0,10rem)_1fr] items-center gap-5 border-b border-white/25 pb-3 md:grid-cols-[minmax(0,20rem)_1fr]">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">Job</span>
        <span className="flex justify-between text-sm font-semibold">
          <span>Replit</span>
          <span>Claude</span>
        </span>
      </div>
      {LEAN_ROWS.map((row, i) => (
        <div
          key={i}
          className="grid grid-cols-[minmax(0,10rem)_1fr] items-center gap-5 border-b border-white/10 py-3.5 md:grid-cols-[minmax(0,20rem)_1fr]"
        >
          <span className="text-sm leading-snug text-white/80 md:text-base">{row.job}</span>
          <span className="relative block h-5">
            <span className="absolute inset-x-0 top-1/2 border-t border-white/20" />
            <span className="absolute inset-y-1 left-1/2 border-l border-white/20" />
            <LeanDot lean={row.lean} progress={scrollYProgress} print={print} />
          </span>
        </div>
      ))}
    </div>
  );
}

function VersusSection() {
  const sides = [
    {
      t: "Replit",
      em: "where the app lives",
      color: C.orangeSoft,
      items: [
        "Editor, agent, database, auth and hosting in one tab.",
        "Routes work across more than one model vendor.",
        "A subscription plus credits, spent by effort.",
      ],
    },
    {
      t: "Claude",
      em: "who does the work",
      color: C.violet,
      items: [
        "An assistant; Claude Code is its coding agent.",
        "Works in your repository and your stack. You choose where it deploys.",
        "Anthropic models only, on flat plans with usage limits.",
      ],
    },
  ];
  return (
    <Section id="versus" tone="ink" className="overflow-hidden py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Head
          kicker="10 · Replit vs Claude"
          title="Not the same job."
          em="One hosts. One works."
          body="Ten jobs, placed on a line between the two. Scroll and each dot settles on the side that does it better."
        />

        <div className="mt-16 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-10">
          <LeanChart />
        </div>

        <StaggerChildren className="my-16 grid gap-10 md:grid-cols-2">
          {sides.map((s, i) => (
            <StaggerItem key={i}>
              <div className="border-t border-white/18 pt-6">
                <h3 className="text-4xl font-semibold tracking-[-0.04em]" style={{ color: s.color }}>
                  {s.t}
                  <span className="editorial-italic ml-3 text-2xl font-normal text-white/45">
                    {s.em}
                  </span>
                </h3>
                <ul className="mt-5 space-y-3">
                  {s.items.map((it, j) => (
                    <li key={j} className="flex gap-3 text-base leading-relaxed text-white/60">
                      <span
                        className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: s.color }}
                      />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>

        <p className="mb-12 max-w-3xl text-sm leading-relaxed text-white/45">
          In October 2026 Replit&rsquo;s chief executive named OpenAI its preferred model partner.
          Claude remains selectable inside Replit, and reports differ on the wider relationship.
          Dot positions are editorial judgment, not measurements.
        </p>

        <Callout>
          They overlap less than the pricing pages suggest. Plenty of people use both: one to get
          something live this afternoon, the other for the codebase that has to last.
        </Callout>
      </div>
    </Section>
  );
}

/* ─── 11. The sweet spot — a scrubbable continuum ─────────────────────── */

function FitSection() {
  const sides = [
    {
      t: "Reach for Replit",
      b: "A prototype by Friday. An internal tool nobody will staff. A bot that has to stay awake. A first version you need in front of a customer before you know it is worth building properly.",
    },
    {
      t: "Reach for something else",
      b: "A codebase with years of history, a team with its own pipeline, or a stack you already run and trust. The tab stops being an advantage the moment the project is bigger than it.",
    },
  ];
  return (
    <Section id="fit" tone="ink2" className="overflow-hidden py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Head
          kicker="11 · The sweet spot"
          title="Strongest at the start."
          em="Weakest at year ten."
          body="Every tool has a range. Replit's runs from an idea you have not validated to a product with its first paying customers."
        />

        <div className="mt-16 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 text-white md:p-10">
          <Spectrum
            // Five items, short axis labels: the axis labels sit on the lower row
            // at each end, so a sixth item (or a long label) collides with them.
            axis={{ left: "Day one", right: "Year ten" }}
            items={[
              { label: "Weekend prototype", position: 7, color: C.orange },
              { label: "Internal tool", position: 27, color: C.orange },
              { label: "Bot or automation", position: 47, color: C.orange },
              { label: "SaaS first version", position: 67, color: C.orange, highlight: true },
              { label: "Legacy monolith", position: 91, color: C.gray },
            ]}
            color={C.orange}
            scrub
            className="mx-auto w-full max-w-[760px]"
          />
        </div>

        <StaggerChildren className="my-16 grid gap-10 md:grid-cols-2">
          {sides.map((s, i) => (
            <StaggerItem key={i}>
              <div className="border-t border-white/18 pt-6">
                <h3 className="text-3xl font-semibold tracking-[-0.03em]">{s.t}</h3>
                <p className="mt-3 max-w-md text-base leading-relaxed text-white/55">{s.b}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>

        <Callout>
          Start where setup costs nothing. Leave when the codebase outgrows the tab — and not a
          day before.
        </Callout>
      </div>
    </Section>
  );
}

/* ─── 12. CTA ─────────────────────────────────────────────────────────── */

function CtaSection() {
  return (
    <section id="cta" className="relative overflow-hidden bg-[#0b0d10] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_30%,rgba(242,98,7,0.16),transparent_32%),radial-gradient(circle_at_12%_85%,rgba(165,180,252,0.08),transparent_30%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.14)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.05]" />
      <div className="relative mx-auto max-w-6xl px-6 py-28 md:py-36">
        <Reveal>
          <Kicker>12 · Start</Kicker>
          <h2 className="max-w-4xl text-5xl font-semibold leading-[0.94] tracking-[-0.055em] sm:text-6xl md:text-7xl lg:text-[5.7rem]">
            Start with a sentence.
            <span className="editorial-italic mt-2 block font-normal" style={{ color: C.orangeSoft }}>
              End with a URL.
            </span>
          </h2>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-white/58 md:text-lg">
            Pick one of the ten builds. Paste the prompt. Then make the agent attack its own
            security section before you believe a word of it.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#builds"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[#14110f] transition-transform hover:-translate-y-0.5"
              style={{ background: C.orange }}
            >
              Back to the ten builds <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <a
              href="https://replit.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm text-white/80 transition-colors hover:border-white/50 hover:text-white"
            >
              Open Replit <ArrowUpRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
          <p className="mt-12 font-mono text-[10px] uppercase tracking-[0.28em] text-white/35">
            {TAGLINE}
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-20 border-t border-white/12 pt-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">Sources</p>
            <ul className="mt-4 grid gap-x-10 gap-y-2 md:grid-cols-2">
              {SOURCES.map((s, i) => (
                <li key={i}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start gap-1.5 text-sm leading-relaxed text-white/55 transition-colors hover:text-white"
                  >
                    {s.label}
                    <ArrowUpRight className="mt-1 h-3 w-3 shrink-0" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-8 max-w-3xl text-xs leading-relaxed text-white/35">
              An independent field guide, not affiliated with or endorsed by Replit. Screenshots
              show Replit&rsquo;s public website and remain its property. Revenue and valuation
              are third-party figures; the comparison charts are opinion. Features and prices
              change — check Replit&rsquo;s own pages before relying on any of this.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── Root ────────────────────────────────────────────────────────────── */

export default function ThePowerOfReplit() {
  const print = usePrintMode();
  return (
    <main className={`relative ${print ? "print-mode" : ""}`}>
      <ScrollProgress />
      <ChapterNav
        chapters={CHAPTERS}
        toneOnDark={{
          activeDot: "bg-[#F26207]",
          activeText: "text-[#FF9A5C]",
          activeGlow: "shadow-[0_0_10px_rgba(242,98,7,0.5)]",
          inactiveDot: "bg-white/25 group-hover:bg-white/50",
          inactiveTextHover: "group-hover:text-white/60",
        }}
        toneOnLight={{
          activeDot: "bg-[#F26207]",
          activeText: "text-[#B4460A]",
          inactiveDot: "bg-black/25 group-hover:bg-black/50",
          inactiveTextHover: "group-hover:text-black/60",
        }}
        rootMargin="-20% 0px -20% 0px"
      />
      <DeckControls hasNarration={false} />
      <HeroSection />
      <ShiftSection />
      <LoopSection />
      <BoxSection />
      <ConnectSection />
      <BuildsSection />
      <ProveSection />
      <SecuritySection />
      <PriceSection />
      <FieldSection />
      <VersusSection />
      <FitSection />
      {/* The background sits on a wrapper, not on the Marquee: its edge fade is a
          mask over the whole strip, so a background on the Marquee itself fades
          out too and the light page shows through as two pale bars. */}
      <div className="bg-[#0b0d10]">
        <Marquee
          speed={40}
          className="py-6 font-mono text-sm uppercase tracking-[0.3em] text-white/30"
        >
          <span className="px-8">Describe</span><span className="px-8">·</span>
          <span className="px-8">Build</span><span className="px-8">·</span>
          <span className="px-8">Connect</span><span className="px-8">·</span>
          <span className="px-8">Secure</span><span className="px-8">·</span>
          <span className="px-8">Ship</span><span className="px-8">·</span>
        </Marquee>
      </div>
      <CtaSection />
    </main>
  );
}
