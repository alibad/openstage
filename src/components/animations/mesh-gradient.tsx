"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";

interface MeshGradientProps {
  /** Up to 4 blob colors. Defaults to the active brand palette */
  colors?: [string, string, string, string];
  /** Animation speed: "slow" (30s), "normal" (20s), "fast" (12s) */
  speed?: "slow" | "normal" | "fast";
  /** Overall opacity (0-1) */
  intensity?: number;
  /** Additional CSS classes */
  className?: string;
  children?: React.ReactNode;
}

const SPEED_MAP = { slow: 30, normal: 20, fast: 12 };

// CSS-var defaults so the mesh follows the active brand. Callers can
// pass real hex values to lock the mesh to a specific palette.
const DEFAULT_COLORS: [string, string, string, string] = [
  "var(--color-brand-1)",
  "var(--color-brand-2)",
  "var(--color-brand-3)",
  "var(--color-brand-5)",
];

const BLOB_PATHS = [
  {
    initial: "40% 60% 70% 30% / 50% 60% 40% 50%",
    animate: [
      "40% 60% 70% 30% / 50% 60% 40% 50%",
      "60% 40% 30% 70% / 40% 50% 60% 50%",
      "50% 50% 50% 50% / 60% 40% 50% 50%",
      "40% 60% 70% 30% / 50% 60% 40% 50%",
    ],
    pos: { top: "-20%", left: "-10%" },
    size: "70%",
  },
  {
    initial: "60% 40% 50% 50% / 40% 60% 50% 50%",
    animate: [
      "60% 40% 50% 50% / 40% 60% 50% 50%",
      "50% 50% 60% 40% / 50% 50% 40% 60%",
      "40% 60% 40% 60% / 60% 40% 60% 40%",
      "60% 40% 50% 50% / 40% 60% 50% 50%",
    ],
    pos: { top: "-10%", right: "-15%" },
    size: "65%",
  },
  {
    initial: "50% 50% 40% 60% / 60% 40% 60% 40%",
    animate: [
      "50% 50% 40% 60% / 60% 40% 60% 40%",
      "40% 60% 60% 40% / 50% 50% 50% 50%",
      "60% 40% 50% 50% / 40% 60% 40% 60%",
      "50% 50% 40% 60% / 60% 40% 60% 40%",
    ],
    pos: { bottom: "-15%", left: "10%" },
    size: "60%",
  },
  {
    initial: "45% 55% 55% 45% / 55% 45% 55% 45%",
    animate: [
      "45% 55% 55% 45% / 55% 45% 55% 45%",
      "55% 45% 45% 55% / 45% 55% 45% 55%",
      "50% 50% 50% 50% / 50% 50% 50% 50%",
      "45% 55% 55% 45% / 55% 45% 55% 45%",
    ],
    pos: { bottom: "-20%", right: "0%" },
    size: "55%",
  },
];

export function MeshGradient({
  colors = DEFAULT_COLORS,
  speed = "normal",
  intensity = 0.5,
  className,
  children,
}: MeshGradientProps) {
  const print = usePrintMode();
  const dur = SPEED_MAP[speed];

  if (print) {
    return <div className={cn("relative", className)}>{children}</div>;
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: intensity, filter: "blur(80px) saturate(1.5)" }}
      >
        {BLOB_PATHS.map((blob, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              ...blob.pos,
              width: blob.size,
              aspectRatio: "1",
              // `colors[i]` may be a CSS variable reference — use color-mix
              // for the alpha steps instead of hex-alpha concat.
              background: `radial-gradient(circle, color-mix(in srgb, ${colors[i]} 53%, transparent) 0%, color-mix(in srgb, ${colors[i]} 0%, transparent) 70%)`,
              borderRadius: blob.initial,
            }}
            animate={{ borderRadius: blob.animate }}
            transition={{
              duration: dur + i * 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}
