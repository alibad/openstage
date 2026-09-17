"use client";

import { lazy, Suspense } from "react";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";
import { Loader2 } from "lucide-react";

const Spline = lazy(() => import("@splinetool/react-spline"));

interface SplineEmbedProps {
  /** Spline scene URL (from Spline export → React) */
  scene: string;
  /** Height of the container */
  height?: string;
  /** Fallback text for print mode */
  fallbackText?: string;
  className?: string;
}

export function SplineEmbed({
  scene,
  height = "500px",
  fallbackText = "Interactive 3D scene (view in browser)",
  className,
}: SplineEmbedProps) {
  const print = usePrintMode();

  if (print) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-bg-dark rounded-2xl border border-border",
          className,
        )}
        style={{ height }}
      >
        <p className="text-muted text-sm">{fallbackText}</p>
      </div>
    );
  }

  return (
    <div
      className={cn("w-full rounded-2xl overflow-hidden", className)}
      style={{ height }}
    >
      <Suspense
        fallback={
          <div
            className="flex items-center justify-center bg-bg-dark"
            style={{ height }}
          >
            <Loader2 className="w-6 h-6 text-muted animate-spin" />
          </div>
        }
      >
        <Spline scene={scene} style={{ width: "100%", height: "100%" }} />
      </Suspense>
    </div>
  );
}
