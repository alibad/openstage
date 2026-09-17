"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as Phaser from "phaser";
import { Play, Pause } from "lucide-react";

export interface PhaserEmbedProps {
  config: Omit<Phaser.Types.Core.GameConfig, "parent">;
  height?: string;
  className?: string;
  /** Called when the Phaser game instance is ready */
  onReady?: (game: Phaser.Game) => void;
  /**
   * If true, renders a "Start" overlay and defers initialising the game
   * until the user clicks it. Prevents timers from running before the
   * audience has actually focused the widget. Default: false.
   */
  startOnInteract?: boolean;
  /**
   * Copy for the start overlay. Ignored when `startOnInteract` is false.
   */
  startLabel?: string;
  /**
   * Copy shown under the start button. Ignored when `startOnInteract` is false.
   */
  startSubLabel?: string;
  /**
   * If true, pauses the Phaser game loop when the embed leaves the viewport
   * or the browser tab becomes hidden, and resumes when it returns.
   * Default: false.
   */
  autoPauseOffscreen?: boolean;
}

/**
 * Base wrapper that mounts a Phaser 3 canvas into a React component.
 * Dynamic-import this with `{ ssr: false }` in presentation content.
 */
export function PhaserEmbed({
  config,
  height = "500px",
  className,
  onReady,
  startOnInteract = false,
  startLabel = "Start",
  startSubLabel,
  autoPauseOffscreen = false,
}: PhaserEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const [started, setStarted] = useState(!startOnInteract);
  const [paused, setPaused] = useState(false);

  const initGame = useCallback(() => {
    if (!containerRef.current || gameRef.current) return;

    const game = new Phaser.Game({
      ...config,
      parent: containerRef.current,
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: "100%",
        height: "100%",
        ...config.scale,
      },
    });

    gameRef.current = game;
    onReadyRef.current?.(game);
  }, [config]);

  useEffect(() => {
    if (!started) return;
    initGame();
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [initGame, started]);

  useEffect(() => {
    if (!autoPauseOffscreen || !started) return;
    const el = containerRef.current;
    if (!el) return;

    let intersecting = true;
    let docVisible =
      typeof document === "undefined" ? true : !document.hidden;

    const apply = () => {
      const game = gameRef.current;
      if (!game) return;
      const shouldPause = !intersecting || !docVisible;
      if (shouldPause && !game.loop.running) return;
      if (shouldPause) {
        game.loop.sleep();
        game.sound?.pauseAll?.();
        setPaused(true);
      } else {
        game.loop.wake();
        game.sound?.resumeAll?.();
        setPaused(false);
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        intersecting = !!e?.isIntersecting && (e?.intersectionRatio ?? 0) > 0.35;
        apply();
      },
      { threshold: [0, 0.35, 0.6, 1] },
    );
    io.observe(el);

    const onVis = () => {
      docVisible = !document.hidden;
      apply();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [autoPauseOffscreen, started]);

  return (
    <div
      ref={containerRef}
      className={`relative rounded-2xl overflow-hidden ${className || ""}`}
      style={{ height }}
    >
      {!started && startOnInteract && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-[#0a0718] text-white">
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="group flex items-center gap-3 px-6 py-3 rounded-full bg-white text-[#0a0718] text-sm font-semibold uppercase tracking-[0.2em] hover:bg-white/90 transition-colors"
          >
            <Play className="w-4 h-4 fill-current" />
            {startLabel}
          </button>
          {startSubLabel && (
            <div className="text-xs text-white/50 font-mono uppercase tracking-[0.2em]">
              {startSubLabel}
            </div>
          )}
        </div>
      )}
      {paused && started && autoPauseOffscreen && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/70 text-[10px] font-mono uppercase tracking-[0.25em] pointer-events-none">
          <Pause className="w-3 h-3" />
          paused
        </div>
      )}
    </div>
  );
}
