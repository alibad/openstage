"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/* ─────────────────────────────────────────────────────────────────────────
   Frame — device / app chrome around a screenshot, mock-up or live embed.

   The point of chrome is context: it tells the audience "this is software,
   and here is where it runs" without a sentence of copy. A screenshot
   floating on a section reads as an image; the same screenshot inside a
   browser frame with a URL reads as a product.

   Three variants, one API:

     browser  — traffic lights + a URL pill. Use `url` to make the address
                bar do real narrative work (the host is often the point).
     terminal — traffic lights + a title, on the dark code surface. For
                logs, CLI output, ops dashboards.
     phone    — rounded bezel + speaker notch. For mobile product shots.

   Colour comes from theme tokens, so a frame inverts with the deck. The one
   exception is the traffic lights: red/amber/green are a semantic window-control
   palette, not brand colour, so they stay fixed.

   `title` is the label shown in the chrome. `actions` renders at the right of
   the bar for tabs or controls (the terminal variant's usual need).
   ───────────────────────────────────────────────────────────────────────── */

type FrameVariant = "browser" | "terminal" | "phone";

const TRAFFIC_LIGHTS = [
  "bg-red-400/60",
  "bg-yellow-400/60",
  "bg-green-400/60",
] as const;

function TrafficLights({ size = "sm" }: { size?: "sm" | "md" }) {
  return (
    <>
      {TRAFFIC_LIGHTS.map((tone) => (
        <span
          key={tone}
          className={cn(
            "rounded-full shrink-0",
            size === "md" ? "w-3 h-3" : "w-2.5 h-2.5",
            tone,
          )}
        />
      ))}
    </>
  );
}

export function Frame({
  variant = "browser",
  url,
  title,
  actions,
  children,
  className,
  bodyClassName,
}: {
  variant?: FrameVariant;
  /** Browser variant: the address shown in the URL pill. */
  url?: string;
  /** Label in the chrome bar. The terminal variant's window title. */
  title?: string;
  /** Right-aligned controls in the chrome bar (tabs, buttons). */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  if (variant === "phone") {
    return (
      <div
        className={cn(
          // The bezel is a real border, so the screen corners nest inside it
          // rather than the content bleeding to the edge.
          "relative mx-auto w-full max-w-[320px] rounded-[2.5rem] border-[10px] border-bg-elevated bg-bg-elevated shadow-2xl",
          className,
        )}
      >
        {/* Speaker notch — reads as a phone at a glance, costs one div. */}
        <div className="absolute left-1/2 top-2 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-white/20" />
        <div
          className={cn(
            "overflow-hidden rounded-[1.75rem] bg-surface",
            bodyClassName,
          )}
        >
          {children}
        </div>
      </div>
    );
  }

  if (variant === "terminal") {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-border bg-code-bg font-mono shadow-xl",
          className,
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-bg-elevated px-4 py-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <TrafficLights size="md" />
            {title && (
              <span className="ml-3 truncate text-[11px] text-white/35">
                {title}
              </span>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-1 shrink-0">{actions}</div>
          )}
        </div>
        <div className={cn("text-white/80", bodyClassName)}>{children}</div>
      </div>
    );
  }

  // browser
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-border bg-surface/50",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border bg-muted/20 px-4 py-2.5">
        <TrafficLights />
        {(url || title) && (
          <div className="mx-3 flex h-5 flex-1 items-center truncate rounded-md bg-muted/30 px-2 font-mono text-[11px] text-muted/60">
            {url ?? title}
          </div>
        )}
        {actions && (
          <div className="flex items-center gap-1 shrink-0">{actions}</div>
        )}
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
