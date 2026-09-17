"use client";

import { lazy, Suspense } from "react";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";
import { Loader2 } from "lucide-react";

const LazyRive = lazy(() =>
  import("@rive-app/react-canvas").then((mod) => ({
    default: mod.default,
  })),
);

interface RiveEmbedProps {
  /** URL or path to the .riv file */
  src: string;
  /** State machine name(s) to play */
  stateMachines?: string | string[];
  /** Animation name(s) to play (if not using state machine) */
  animations?: string | string[];
  /** Artboard to render */
  artboard?: string;
  /** Height of the container */
  height?: string;
  /** Fallback text for print mode */
  fallbackText?: string;
  className?: string;
}

export function RiveEmbed({
  src,
  stateMachines,
  animations,
  artboard,
  height = "400px",
  fallbackText = "Interactive animation (view in browser)",
  className,
}: RiveEmbedProps) {
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
        <LazyRive
          src={src}
          artboard={artboard}
          stateMachines={stateMachines}
          animations={animations}
          style={{ width: "100%", height: "100%" }}
        />
      </Suspense>
    </div>
  );
}
