"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor, PerspectiveCamera, View } from "@react-three/drei";
import { cn } from "@/lib/cn";
import { useStageQuality, type StageQuality } from "./quality";
import { attachStagePointer } from "./pointer";

/**
 * The Stage — one WebGL canvas behind the whole deck.
 *
 * Before this, every 3D section opened its own <Canvas>, so each cost a WebGL
 * context (browsers cap them at ~16), kept rendering after it scrolled away,
 * and printed as a grey box. With a Stage at the deck root, sections open
 * `<StageView>` windows instead: all of them draw into the one canvas, a view
 * that is off screen costs nothing, and a deck can hold as many 3D moments as
 * the story needs.
 *
 * Layering: the Stage paints the deck background, then the canvas (z-0),
 * then the deck content (z-1). A view therefore draws *behind* its section's
 * text and overlays: give a section that hosts a StageView a transparent
 * background, and any vignette gradient in that section lands on top of the
 * 3D. Sections without a view can stay opaque.
 *
 * @example
 * export default function Deck() {
 *   return (
 *     <Stage className="bg-bg-dark">
 *       <main>…sections, some with <StageView>…</main>
 *     </Stage>
 *   );
 * }
 */

interface StageContextValue {
  quality: StageQuality & { pending: boolean };
  live: boolean;
}

const StageContext = createContext<StageContextValue | null>(null);

const FALLBACK_QUALITY: StageQuality & { pending: boolean } = {
  tier: "high",
  pending: false,
  reducedMotion: false,
  dpr: [1, 2],
  particles: 24000,
};

/** Stage quality from the nearest <Stage>, or a sane default for standalone canvases. */
export function useStage(): StageContextValue {
  return useContext(StageContext) ?? { quality: FALLBACK_QUALITY, live: true };
}

export function Stage({
  children,
  className,
}: {
  children: ReactNode;
  /** The deck background. Painted under the canvas — put it here, not on <main>. */
  className?: string;
}) {
  const quality = useStageQuality();
  const [declined, setDeclined] = useState(false);
  const live = quality.tier !== "off";

  useEffect(() => {
    if (live) attachStagePointer();
  }, [live]);

  return (
    <StageContext.Provider value={{ quality, live }}>
      <div className={className}>
        {live && (
          <div
            aria-hidden
            data-stage-canvas
            className="pointer-events-none fixed inset-0 z-0"
          >
            <Canvas
              dpr={declined ? quality.dpr[0] : quality.dpr[1]}
              gl={{
                antialias: true,
                alpha: true,
                powerPreference: "high-performance",
              }}
              onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
            >
              {/* Drop to the floor pixel ratio if the device can't hold frame rate. */}
              <PerformanceMonitor
                onDecline={() => setDeclined(true)}
                onIncline={() => setDeclined(false)}
              />
              <View.Port />
            </Canvas>
          </div>
        )}
        <div className="relative z-[1]">{children}</div>
      </div>
    </StageContext.Provider>
  );
}

/* ─── Views ──────────────────────────────────────────────────────────────── */

/**
 * Live, mutable facts about one view, readable from inside `useFrame`
 * without re-rendering: whether it is near the screen, and its element.
 */
export interface StageViewState {
  visible: boolean;
  el: HTMLElement | null;
}

const ALWAYS_VISIBLE: StageViewState = { visible: true, el: null };
const StageViewContext = createContext<StageViewState>(ALWAYS_VISIBLE);

/** For scene components: gate per-frame work on `visible`, map the pointer via `el`. */
export function useStageView(): StageViewState {
  return useContext(StageViewContext);
}

interface StageViewProps {
  children: ReactNode;
  /**
   * What prints, and what a device with no WebGL sees. A still image of the
   * scene, or the text a ParticleMorph spells out. Without one, the view
   * prints as empty space — never a grey placeholder box.
   */
  poster?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Draw order when views overlap. Higher draws later. */
  index?: number;
}

/**
 * A window into the shared stage. Size and place it like any div — the 3D
 * children draw exactly inside its rectangle, behind the section's content.
 * Children are R3F elements; include a camera (see `StageCamera`).
 */
export function StageView({
  children,
  poster,
  className,
  style,
  index = 1,
}: StageViewProps) {
  const { live, quality } = useStage();
  const el = useRef<HTMLElement>(null);
  const viewState = useRef<StageViewState>({ visible: false, el: null });

  useEffect(() => {
    const node = el.current;
    const state = viewState.current;
    if (!node) return;
    state.el = node;
    // A generous margin so a scene is warm before it scrolls in.
    const observer = new IntersectionObserver(
      ([entry]) => {
        state.visible = entry.isIntersecting;
      },
      { rootMargin: "25% 0px 25% 0px" },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      state.visible = false;
      state.el = null;
    };
  }, [live]);

  if (!live) {
    return (
      <div className={className} style={style}>
        {quality.pending ? null : poster}
      </div>
    );
  }

  return (
    <View
      ref={el as never}
      className={cn("pointer-events-none", className)}
      style={style}
      index={index}
    >
      {/* A stable mutable object, never replaced — a channel from the DOM
          observer into the render loop, not render state. */}
      {/* eslint-disable-next-line react-hooks/refs */}
      <StageViewContext.Provider value={viewState.current}>
        {children}
      </StageViewContext.Provider>
    </View>
  );
}

/** The camera for one view. Every StageView needs exactly one. */
export function StageCamera({
  position = [0, 0, 10],
  fov = 38,
}: {
  position?: [number, number, number];
  fov?: number;
}) {
  return (
    <PerspectiveCamera
      makeDefault
      position={position}
      fov={fov}
      near={0.1}
      far={100}
    />
  );
}
