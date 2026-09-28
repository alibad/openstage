"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { useScroll, useMotionValueEvent, useReducedMotion } from "framer-motion";
import { easing } from "maath";
import { Vector3, type Group, type PerspectiveCamera } from "three";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";

export interface CameraKeyframe {
  /** Scroll progress through the section, 0-1 */
  scroll: number;
  /** Camera position [x, y, z] */
  position: [number, number, number];
  /** What the camera looks at [x, y, z] */
  lookAt: [number, number, number];
  /** Field of view (degrees) — optional, defaults to 45 */
  fov?: number;
}

interface ScrollCamera3DProps {
  /** Keyframes that define the camera path as the user scrolls */
  keyframes: CameraKeyframe[];
  /** Children — R3F elements (meshes, groups, lights) */
  children: ReactNode;
  /** Scroll runway — how tall the container is (e.g. "400vh") */
  runway?: string;
  /** Environment preset for lighting */
  environment?: "city" | "sunset" | "dawn" | "night" | "studio" | "apartment";
  /** Background color of the canvas */
  backgroundColor?: string;
  /** Optional overlay content that scrolls with the section */
  overlay?: ReactNode;
  /**
   * What prints in place of the live scene — a still of it. Without one the
   * section prints only its overlay, never a grey placeholder box.
   */
  poster?: ReactNode;
  className?: string;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function lerp3(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function interpolateKeyframes(
  kfs: CameraKeyframe[],
  progress: number,
): { position: [number, number, number]; lookAt: [number, number, number]; fov: number } {
  if (kfs.length === 0) {
    return { position: [0, 0, 5], lookAt: [0, 0, 0], fov: 45 };
  }
  if (kfs.length === 1 || progress <= kfs[0].scroll) {
    const k = kfs[0];
    return { position: k.position, lookAt: k.lookAt, fov: k.fov ?? 45 };
  }
  const last = kfs[kfs.length - 1];
  if (progress >= last.scroll) {
    return {
      position: last.position,
      lookAt: last.lookAt,
      fov: last.fov ?? 45,
    };
  }
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i];
    const b = kfs[i + 1];
    if (progress >= a.scroll && progress <= b.scroll) {
      const t = smoothstep(a.scroll, b.scroll, progress);
      return {
        position: lerp3(a.position, b.position, t),
        lookAt: lerp3(a.lookAt, b.lookAt, t),
        fov: lerp(a.fov ?? 45, b.fov ?? 45, t),
      };
    }
  }
  return { position: last.position, lookAt: last.lookAt, fov: last.fov ?? 45 };
}

function CameraRig({
  progressRef,
  keyframes,
  reduced,
}: {
  progressRef: React.MutableRefObject<number>;
  keyframes: CameraKeyframe[];
  reduced: boolean;
}) {
  const scratch = useRef({ position: new Vector3(), lookAt: new Vector3(), look: new Vector3(), fov: { value: 45 } });
  useFrame(({ camera }, delta) => {
    const target = scratch.current;
    const { position, lookAt, fov } = interpolateKeyframes(keyframes, progressRef.current);
    const cam = camera as PerspectiveCamera;
    const dt = Math.min(delta, 0.05);
    target.position.set(...position);
    target.lookAt.set(...lookAt);
    // Damped by elapsed time, not per frame: the same speed on 60 Hz and
    // 120 Hz displays. (The old per-frame lerp ran twice as fast on ProMotion.)
    const smooth = reduced ? 0.0001 : 0.35;
    easing.damp3(cam.position, target.position, smooth, dt);
    easing.damp3(target.look, target.lookAt, smooth, dt);
    cam.lookAt(target.look);
    if (Math.abs(cam.fov - fov) > 0.01) {
      target.fov.value = cam.fov;
      easing.damp(target.fov, "value", fov, smooth, dt);
      cam.fov = target.fov.value;
      cam.updateProjectionMatrix();
    }
  });
  return null;
}

function SceneRoot({ children }: { children: ReactNode }) {
  const ref = useRef<Group>(null);
  return <group ref={ref}>{children}</group>;
}

/**
 * ScrollCamera3D — scroll-linked R3F camera rig.
 *
 * Define a series of keyframes (scroll progress → camera position/lookAt)
 * and the camera smoothly interpolates between them as the user scrolls
 * through the section. The canvas is pinned while the scroll runs.
 *
 * @example
 * <ScrollCamera3D
 *   runway="400vh"
 *   keyframes={[
 *     { scroll: 0,   position: [0, 0, 8], lookAt: [0, 0, 0] },
 *     { scroll: 0.5, position: [4, 2, 4], lookAt: [0, 0, 0] },
 *     { scroll: 1,   position: [0, 4, 2], lookAt: [0, 0, 0], fov: 60 },
 *   ]}
 * >
 *   <ambientLight intensity={0.5} />
 *   <mesh><boxGeometry /><meshStandardMaterial color="#7DD3FC" /></mesh>
 * </ScrollCamera3D>
 */
export function ScrollCamera3D({
  keyframes,
  children,
  runway = "400vh",
  environment = "city",
  backgroundColor = "transparent",
  overlay,
  poster,
  className,
}: ScrollCamera3DProps) {
  const print = usePrintMode();
  const reduced = useReducedMotion() ?? false;
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  // Stop rendering entirely while the section is off screen.
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = containerRef.current;
    if (!node || print) return;
    const observer = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "20% 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [print]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    progressRef.current = v;
  });

  const initial = useMemo(
    () => interpolateKeyframes(keyframes, 0),
    [keyframes],
  );

  if (print) {
    return (
      <div className={cn("relative w-full", className)}>
        {poster}
        {overlay && <div className="relative">{overlay}</div>}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
      style={{ height: runway }}
    >
      <div className="sticky top-0 w-full h-screen overflow-hidden">
        <Canvas
          frameloop={inView ? "always" : "never"}
          camera={{
            position: initial.position,
            fov: initial.fov,
          }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: backgroundColor }}
        >
          <Environment preset={environment} />
          <CameraRig progressRef={progressRef} keyframes={keyframes} reduced={reduced} />
          <SceneRoot>{children}</SceneRoot>
        </Canvas>
        {overlay && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="pointer-events-auto">{overlay}</div>
          </div>
        )}
      </div>
    </div>
  );
}
