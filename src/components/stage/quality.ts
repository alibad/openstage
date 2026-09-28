"use client";

import { useSyncExternalStore } from "react";
import { usePrintMode } from "@/lib/print-mode";

/**
 * How much 3D this device should be asked to do.
 *
 * - `off`  — no canvas at all: print/PDF export, no WebGL, or `?stage=off`.
 *            Every StageView renders its `poster` instead.
 * - `low`  — integrated or mobile GPUs. Fewer particles, 1× pixel ratio.
 * - `mid`  — decent laptops.
 * - `high` — Apple Silicon, discrete GPUs: the full show.
 *
 * Detection is local and synchronous — it reads the WebGL renderer string
 * rather than fetching a benchmark table, so a deck on a venue laptop with
 * no internet still picks the right budget. A presenter can force a tier
 * with `?stage=low` (or mid/high/off) when a projector laptop struggles.
 */
export type StageTier = "off" | "low" | "mid" | "high";

export interface StageQuality {
  tier: StageTier;
  /** The reader asked the OS for less motion: scenes hold still, morphs cut. */
  reducedMotion: boolean;
  /** Device-pixel-ratio bounds for the shared canvas: [floor, ceiling]. */
  dpr: [number, number];
  /** Particle budget for ParticleMorph-style scenes. */
  particles: number;
}

const BUDGET: Record<Exclude<StageTier, "off">, { particles: number; dpr: [number, number] }> = {
  low: { particles: 7000, dpr: [1, 1] },
  mid: { particles: 20000, dpr: [1, 1.5] },
  high: { particles: 42000, dpr: [1, 2] },
};

const TIERS: StageTier[] = ["off", "low", "mid", "high"];

function probeTier(): StageTier {
  const forced = new URLSearchParams(window.location.search).get("stage");
  if (forced && (TIERS as string[]).includes(forced)) return forced as StageTier;

  let renderer = "";
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ?? canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return "off";
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? "").toLowerCase();
    // Hand the probe context straight back: browsers cap live contexts at ~16.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    return "off";
  }

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;

  if (/swiftshader|llvmpipe|software|basic render/.test(renderer)) return "low";
  if (coarse) return memory >= 6 && cores >= 6 ? "mid" : "low";
  // Safari reports every Apple Silicon GPU as "apple gpu".
  if (/apple m\d|apple gpu|nvidia|geforce|rtx|quadro|radeon rx|radeon pro/.test(renderer)) return "high";
  if (/intel|iris|uhd/.test(renderer)) return cores >= 8 ? "mid" : "low";
  return cores >= 8 && memory >= 8 ? "high" : "mid";
}

let cachedTier: StageTier | null = null;
const getTier = () => (cachedTier ??= probeTier());
const getServerTier = (): StageTier | "pending" => "pending";
const subscribeNever = () => () => {};

const REDUCED = "(prefers-reduced-motion: reduce)";
function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getReduced = () => window.matchMedia(REDUCED).matches;
const getServerReduced = () => false;

/**
 * Resolve the device's stage quality. Returns `pending` for the tier during
 * SSR and the hydration pass — callers render nothing then, rather than
 * flashing a poster that is about to be replaced.
 */
export function useStageQuality(): StageQuality & { pending: boolean } {
  const print = usePrintMode();
  const detected = useSyncExternalStore(subscribeNever, getTier, getServerTier);
  const reducedMotion = useSyncExternalStore(subscribeReduced, getReduced, getServerReduced);

  const pending = detected === "pending" && !print;
  const tier: StageTier = print || detected === "pending" ? "off" : detected;
  const budget = tier === "off" ? BUDGET.low : BUDGET[tier];
  return {
    tier,
    pending,
    reducedMotion,
    dpr: budget.dpr,
    particles: budget.particles,
  };
}
