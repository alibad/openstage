"use client";

import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";

export type ParticlePreset =
  | "constellation"
  | "ambient"
  | "snow"
  | "fireflies"
  | "rising"
  | "matrix";

interface ParticleFieldProps {
  /** Pre-built configuration */
  preset?: ParticlePreset;
  /** Override with raw tsParticles options */
  options?: ISourceOptions;
  /** Primary particle color (hex) */
  color?: string;
  /** Secondary color for links/trails */
  colorSecondary?: string;
  /** Particle count (adjusted per preset) */
  count?: number;
  /** Overall opacity of the canvas */
  opacity?: number;
  className?: string;
}

function buildPreset(
  preset: ParticlePreset,
  color: string,
  colorSecondary: string,
  count: number,
): ISourceOptions {
  const base: ISourceOptions = {
    fullScreen: false,
    fpsLimit: 60,
    detectRetina: true,
    background: { color: "transparent" },
  };

  switch (preset) {
    case "constellation":
      return {
        ...base,
        particles: {
          number: { value: count, density: { enable: true } },
          color: { value: color },
          opacity: { value: { min: 0.2, max: 0.6 } },
          size: { value: { min: 1, max: 2.5 } },
          links: {
            enable: true,
            color: colorSecondary,
            distance: 150,
            opacity: 0.15,
            width: 1,
          },
          move: {
            enable: true,
            speed: 0.8,
            direction: "none",
            outModes: "bounce",
          },
        },
        interactivity: {
          events: {
            onHover: { enable: true, mode: "grab" },
          },
          modes: {
            grab: { distance: 180, links: { opacity: 0.35 } },
          },
        },
      };

    case "ambient":
      return {
        ...base,
        particles: {
          number: { value: count },
          color: { value: [color, colorSecondary] },
          opacity: {
            value: { min: 0.05, max: 0.3 },
            animation: { enable: true, speed: 0.3, sync: false },
          },
          size: { value: { min: 0.5, max: 2 } },
          move: {
            enable: true,
            speed: 0.3,
            direction: "none",
            outModes: "out",
            random: true,
          },
        },
      };

    case "snow":
      return {
        ...base,
        particles: {
          number: { value: count },
          color: { value: "#ffffff" },
          opacity: { value: { min: 0.1, max: 0.5 } },
          size: { value: { min: 1, max: 4 } },
          move: {
            enable: true,
            speed: 1.5,
            direction: "bottom",
            outModes: "out",
            straight: false,
          },
          wobble: {
            enable: true,
            distance: 10,
            speed: 5,
          },
        },
      };

    case "fireflies":
      return {
        ...base,
        particles: {
          number: { value: Math.min(count, 30) },
          color: { value: [color, "#FBBF24", "#34D399"] },
          opacity: {
            value: { min: 0, max: 0.8 },
            animation: { enable: true, speed: 1.5, sync: false },
          },
          size: { value: { min: 2, max: 5 } },
          shadow: {
            enable: true,
            color: color,
            blur: 15,
          },
          move: {
            enable: true,
            speed: 0.6,
            direction: "none",
            outModes: "bounce",
            random: true,
          },
        },
      };

    case "rising":
      return {
        ...base,
        particles: {
          number: { value: count },
          color: { value: color },
          opacity: {
            value: { min: 0.1, max: 0.4 },
            animation: { enable: true, speed: 0.5, sync: false },
          },
          size: { value: { min: 1, max: 3 } },
          move: {
            enable: true,
            speed: 1.2,
            direction: "top",
            outModes: "out",
            straight: false,
          },
        },
      };

    case "matrix":
      return {
        ...base,
        particles: {
          number: { value: count },
          color: { value: "#10B981" },
          opacity: {
            value: { min: 0.1, max: 0.6 },
            animation: { enable: true, speed: 2, sync: false },
          },
          size: { value: { min: 1, max: 2 } },
          move: {
            enable: true,
            speed: 3,
            direction: "bottom",
            outModes: "out",
            straight: true,
          },
          shape: { type: "square" },
        },
      };
  }
}

const DEFAULT_COUNTS: Record<ParticlePreset, number> = {
  constellation: 60,
  ambient: 40,
  snow: 80,
  fireflies: 20,
  rising: 50,
  matrix: 100,
};

let engineInitPromise: Promise<void> | null = null;

export function ParticleField({
  preset = "constellation",
  options,
  color = "#7DD3FC",
  colorSecondary = "#818CF8",
  count,
  opacity = 1,
  className,
}: ParticleFieldProps) {
  const print = usePrintMode();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (print) return;
    if (!engineInitPromise) {
      engineInitPromise = initParticlesEngine(async (engine) => {
        await loadSlim(engine);
      });
    }
    engineInitPromise.then(() => setReady(true));
  }, [print]);

  if (print || !ready) return null;

  const resolvedCount = count ?? DEFAULT_COUNTS[preset];
  const resolvedOptions =
    options ?? buildPreset(preset, color, colorSecondary, resolvedCount);

  return (
    <div
      className={cn("absolute inset-0 pointer-events-none", className)}
      style={{ opacity }}
    >
      <Particles className="w-full h-full" options={resolvedOptions} />
    </div>
  );
}
