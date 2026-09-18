"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";
import { Loader2 } from "lucide-react";

/*  Spline ships two ways in: `@splinetool/react-spline`, and the
    `<spline-viewer>` web component from its CDN. This uses the CDN one,
    injected at runtime, because the npm path pulls in `@splinetool/runtime`,
    and that package does NOT publish the assets its own code imports — the
    Draco decoder (`../libs/draco/*`) and `boolean_wasm_bg.wasm` are fetched
    from Spline's CDN on demand at runtime. Turbopack resolves those imports
    eagerly while bundling and fails the build on the missing files.

    Injecting the script means the bundler never sees the runtime, so there is
    nothing for it to fail to resolve, and the WASM loads from the CDN that
    actually carries it. The element is created imperatively rather than as
    JSX so no global `IntrinsicElements` augmentation is needed for a custom
    element used in exactly one place.

    Pinned rather than `@latest`: the viewer has to understand the
    `.splinecode` format a scene was exported with, so bumping it is a
    deliberate act, not something a CDN should decide per page load. */
const VIEWER_VERSION = "1.12.92";
const VIEWER_SRC = `https://unpkg.com/@splinetool/viewer@${VIEWER_VERSION}/build/spline-viewer.js`;

/** Shared across every instance: the script is a singleton, so N embeds on one
 *  deck load it once. Reset on failure so a remount can retry rather than
 *  inheriting a permanently rejected promise. */
let viewerLoad: Promise<void> | null = null;

function loadViewer(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.customElements?.get("spline-viewer")) return Promise.resolve();
  if (viewerLoad) return viewerLoad;

  viewerLoad = new Promise<void>((resolve, reject) => {
    const done = () => resolve();
    const fail = () => {
      viewerLoad = null;
      reject(new Error(`Could not load the Spline viewer from ${VIEWER_SRC}`));
    };

    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-spline-viewer]",
    );
    if (existing) {
      existing.addEventListener("load", done);
      existing.addEventListener("error", fail);
      return;
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src = VIEWER_SRC;
    script.dataset.splineViewer = "";
    script.addEventListener("load", done);
    script.addEventListener("error", fail);
    document.head.appendChild(script);
  });

  return viewerLoad;
}

interface SplineEmbedProps {
  /** Spline scene URL (the `.splinecode` from Spline export → Viewer/React) */
  scene: string;
  /** Height of the container */
  height?: string;
  /** Fallback text for print mode, and if the viewer cannot be reached */
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
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    if (print) return;

    const mount = host.current;
    let cancelled = false;

    loadViewer()
      .then(() => {
        if (cancelled || !mount) return;
        const viewer = document.createElement("spline-viewer");
        viewer.setAttribute("url", scene);
        viewer.style.display = "block";
        viewer.style.width = "100%";
        viewer.style.height = "100%";
        mount.replaceChildren(viewer);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      mount?.replaceChildren();
    };
  }, [print, scene]);

  // Print and the unreachable-viewer case get the same treatment: a deck that
  // exports to PDF or runs offline says what the reader is missing.
  if (print || status === "error") {
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
      className={cn("relative w-full rounded-2xl overflow-hidden", className)}
      style={{ height }}
    >
      <div ref={host} className="h-full w-full" />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-dark">
          <Loader2 className="w-6 h-6 text-muted animate-spin" />
        </div>
      )}
    </div>
  );
}
