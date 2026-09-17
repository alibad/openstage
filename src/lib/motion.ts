/**
 * Motion design tokens — single source of truth for the presentations framework.
 *
 * Use these instead of inline cubic-beziers, stiffness/damping values, or ad-hoc
 * duration numbers. They define the motion grammar of the system: how things
 * enter, how they respond, how fast things feel.
 *
 * Import and spread/use:
 *   transition={{ duration: duration.base, ease: ease.outExpo }}
 *   transition={spring.ui}
 *   transition={{ staggerChildren: stagger.base }}
 */

import type { Transition } from "framer-motion";

// ─── Easings ────────────────────────────────────────────────────────────────
// Named cubic-beziers. Prefer these over inline arrays.

export const ease = {
  /** Snappy deceleration (our legacy default) — good for most UI reveals */
  outQuart: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
  /** Very aggressive ease-out — hero text landing, big reveals */
  outExpo: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** Soft overshoot — playful badges, icons, stats */
  outBack: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
  /** Symmetric smoothness — for back-and-forth transitions */
  inOutQuart: [0.76, 0, 0.24, 1] as [number, number, number, number],
  /** Slow start, slow end — cinematic transitions */
  inOutExpo: [0.87, 0, 0.13, 1] as [number, number, number, number],
  /** Mask/clip reveal (kept for back-compat with mask-reveal) */
  outCirc: [0.33, 1, 0.68, 1] as [number, number, number, number],
  /** Standard linear for light continuous motion */
  linear: [0, 0, 1, 1] as [number, number, number, number],
} as const;

// ─── Durations ──────────────────────────────────────────────────────────────
// Seconds. Pick the bucket by feel, not by millisecond-precision.

export const duration = {
  /** 250ms — micro-interactions, hover states */
  fast: 0.25,
  /** 450ms — default UI transitions, slide changes */
  base: 0.45,
  /** 700ms — reveal animations, most scroll entries */
  reveal: 0.7,
  /** 1.1s — heavier animations with payoff */
  slow: 1.1,
  /** 1.6s — hero moments, landing animations */
  cinematic: 1.6,
} as const;

// ─── Springs ────────────────────────────────────────────────────────────────
// Named spring configurations. Two flavors:
//   - `springConfig.*` — raw { stiffness, damping, restDelta } for useSpring()
//   - `spring.*` — Framer Motion Transition objects (include `type: "spring"`)

export const springConfig = {
  /** Snappy UI feedback — buttons, toggles, magnetic elements */
  ui: { stiffness: 150, damping: 15, restDelta: 0.001 },
  /** Smooth scroll-linked motion — progress bars, scroll indicators */
  gentle: { stiffness: 100, damping: 30, restDelta: 0.001 },
  /** Overshooting playful — reveal pops, attention-getters */
  bouncy: { stiffness: 260, damping: 20, restDelta: 0.001 },
  /** Heavy, cinematic — large transforms, layout shifts */
  smooth: { stiffness: 120, damping: 28, restDelta: 0.001 },
} as const;

export const spring: Record<keyof typeof springConfig, Transition> = {
  ui: { type: "spring", ...springConfig.ui },
  gentle: { type: "spring", ...springConfig.gentle },
  bouncy: { type: "spring", ...springConfig.bouncy },
  smooth: { type: "spring", ...springConfig.smooth },
};

// ─── Stagger ────────────────────────────────────────────────────────────────
// Use as `staggerChildren` values.

export const stagger = {
  /** 40ms — characters, dense lists */
  tight: 0.04,
  /** 80ms — words, card grids */
  base: 0.08,
  /** 120ms — standard list reveals (legacy default) */
  list: 0.12,
  /** 200ms — spacious, cinematic reveals */
  cinematic: 0.2,
} as const;

// ─── Viewport ───────────────────────────────────────────────────────────────
// Default viewport props for scroll-triggered reveals.

export const viewportMargin = {
  /** Triggers slightly early — most comfortable for reveals */
  default: "-80px",
  /** Triggers earlier — for tall sections or heroes */
  early: "-120px",
  /** Triggers closer to full visibility — for below-the-fold content */
  late: "-40px",
} as const;

// ─── Convenience transition presets ──────────────────────────────────────────
// Ready-to-spread transition objects for the most common animations.

export const tx = {
  /** Fast fade/slide — default UI */
  fast: { duration: duration.fast, ease: ease.outQuart } as Transition,
  /** Balanced reveal — default for <Reveal> */
  reveal: { duration: duration.reveal, ease: ease.outQuart } as Transition,
  /** Strong, expressive reveal — for hero moments */
  hero: { duration: duration.slow, ease: ease.outExpo } as Transition,
  /** Playful bounce */
  bounce: { duration: duration.reveal, ease: ease.outBack } as Transition,
  /** Cinematic sweep */
  cinematic: { duration: duration.cinematic, ease: ease.inOutExpo } as Transition,
  /** Mask / clip reveal (keep for back-compat) */
  mask: { duration: 1, ease: ease.outCirc } as Transition,
  /** Snappy slide transition (legacy slide-deck default) */
  slide: { duration: duration.base, ease: ease.outQuart } as Transition,
} as const;

// ─── Variants ───────────────────────────────────────────────────────────────
// Shared variant dictionaries used across components.

export const fadeVariants = {
  fadeUp: {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0 },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: 48 },
    visible: { opacity: 1, x: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: -48 },
    visible: { opacity: 1, x: 0 },
  },
  blurUp: {
    hidden: { opacity: 0, y: 12, filter: "blur(8px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  },
} as const;
