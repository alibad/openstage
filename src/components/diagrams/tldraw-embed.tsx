"use client";

import { lazy, Suspense, useCallback, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";
import { Loader2, Download, Maximize2, Minimize2 } from "lucide-react";

const LazyTldraw = lazy(() =>
  import("tldraw").then((mod) => ({ default: mod.Tldraw })),
);

interface TldrawEmbedProps {
  /** Initial snapshot to load (tldraw JSON) */
  snapshot?: string;
  /** Height of the container */
  height?: string;
  /** Read-only mode (disable editing) */
  readOnly?: boolean;
  /** Show toolbar for editing */
  showToolbar?: boolean;
  /** Callback when content changes */
  onChange?: (snapshot: string) => void;
  /** Fallback text for print mode */
  fallbackText?: string;
  className?: string;
}

export function TldrawEmbed({
  snapshot,
  height = "500px",
  readOnly = false,
  showToolbar = true,
  onChange,
  fallbackText = "Interactive diagram (view in browser)",
  className,
}: TldrawEmbedProps) {
  const print = usePrintMode();
  const editorRef = useRef<unknown>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMount = useCallback(
    (editor: unknown) => {
      editorRef.current = editor;

      if (snapshot) {
        try {
          const parsed = JSON.parse(snapshot);
          // tldraw v4 loadSnapshot API
          if (typeof (editor as Record<string, unknown>).loadSnapshot === "function") {
            (editor as { loadSnapshot: (s: unknown) => void }).loadSnapshot(parsed);
          }
        } catch {
          // Invalid snapshot, start fresh
        }
      }
    },
    [snapshot],
  );

  const handleExportSvg = useCallback(async () => {
    const editor = editorRef.current as Record<string, unknown> | null;
    if (!editor) return;

    try {
      if (typeof editor.getSvgString === "function") {
        const result = await (editor as { getSvgString: () => Promise<{ svg: string } | undefined> }).getSvgString();
        if (result?.svg) {
          const blob = new Blob([result.svg], { type: "image/svg+xml" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "diagram.svg";
          a.click();
          URL.revokeObjectURL(url);
        }
      }
    } catch {
      // Export not available
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

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
      ref={containerRef}
      className={cn("relative w-full rounded-2xl overflow-hidden border border-border", className)}
      style={{ height: isFullscreen ? "100vh" : height }}
    >
      {/* Controls overlay */}
      <div className="absolute top-2 right-2 z-50 flex gap-1">
        <button
          onClick={handleExportSvg}
          className="p-1.5 rounded-lg bg-bg-dark/80 backdrop-blur-sm text-muted hover:text-foreground transition-colors"
          title="Export SVG"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-lg bg-bg-dark/80 backdrop-blur-sm text-muted hover:text-foreground transition-colors"
          title="Toggle fullscreen"
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
      </div>

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
        <TldrawInner
          readOnly={readOnly}
          onMount={handleMount}
        />
      </Suspense>
    </div>
  );
}

function TldrawInner({
  readOnly,
  onMount,
}: {
  readOnly: boolean;
  onMount: (editor: unknown) => void;
}) {
  // tldraw requires its CSS
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="https://unpkg.com/tldraw@4/tldraw.css" />
      <div className="w-full h-full" style={{ colorScheme: "dark" }}>
        <LazyTldraw
          onMount={onMount}
          options={{ maxPages: 1 } as Record<string, unknown>}
        />
      </div>
    </>
  );
}
