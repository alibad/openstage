"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, useGLTF } from "@react-three/drei";
import { Box3, Vector3 } from "three";
import { usePrintMode } from "@/lib/print-mode";

/**
 * UnitModel: one 3D model on a turntable. It turns slowly by itself; drag to turn it by hand.
 *
 * Built for a talk: nothing is fetched from another site (the light is made in the scene, and Draco is off, so
 * no decoder is downloaded), the model is fitted to the stage whatever its size, the scene only draws while it
 * is on screen, and the poster shows until the model has loaded, in print mode, and if WebGL is missing.
 *
 * @example
 * <UnitModel src="/talks/x/models/tank.glb" poster="/talks/x/models/tank.jpg" label="Battle tank" className="aspect-[4/3]" />
 */
export interface UnitModelProps {
  /** A .glb file on this site (not Draco-compressed). */
  src: string;
  /** Picture shown until the model has loaded, in print mode, and where WebGL is missing. */
  poster?: string;
  /** What the model is, for screen readers. */
  label: string;
  /** Degrees per second of the slow turn; 0 stops it. */
  turn?: number;
  /** Let the visitor turn it by dragging. Off on touch screens by default, so a swipe still scrolls the page. */
  interactive?: boolean;
  className?: string;
}

function Model({ src, onReady }: { src: string; onReady: () => void }) {
  const { scene } = useGLTF(src, false);
  // The loader hands every viewer the same object, and an object can stand in only one scene: each viewer takes
  // its own copy (the copies share their geometry and textures). Then fit it to a box around the origin.
  const fit = useMemo(() => {
    const object = scene.clone(true);
    const box = new Box3().setFromObject(object);
    const size = box.getSize(new Vector3()), centre = box.getCenter(new Vector3());
    const scale = 2.3 / Math.max(size.x, size.y, size.z, 0.001);
    return { object, scale, position: [-centre.x * scale, -centre.y * scale, -centre.z * scale] as [number, number, number] };
  }, [scene]);
  useEffect(() => { onReady(); }, [scene, onReady]);
  return <group scale={fit.scale} position={fit.position}><primitive object={fit.object} /></group>;
}

const webgl = () => {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
};

export function UnitModel({ src, poster, label, turn = 14, interactive, className = "" }: UnitModelProps) {
  const print = usePrintMode();
  const host = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const [ready, setReady] = useState<string | null>(null);
  const [can, setCan] = useState(true);
  const [fine, setFine] = useState(false);
  useEffect(() => {
    // After mount, so the first render matches the server's: can this browser draw 3D, and is there a mouse?
    const id = window.setTimeout(() => { setCan(webgl()); setFine(window.matchMedia("(pointer: fine)").matches); }, 0);
    const el = host.current;
    if (!el) return () => window.clearTimeout(id);
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { rootMargin: "200px" });
    io.observe(el);
    return () => { window.clearTimeout(id); io.disconnect(); };
  }, []);
  const drag = interactive ?? fine;
  const still = print || !can;
  const loaded = ready === src;
  return (
    <div ref={host} role="img" aria-label={label} data-unit-model={loaded ? "ready" : "loading"} className={`relative overflow-hidden ${className}`}>
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" aria-hidden className="absolute inset-0 h-full w-full object-contain transition-opacity duration-500" style={{ opacity: still || !loaded ? 1 : 0 }} />
      )}
      {!still && (
        <Canvas frameloop={seen ? "always" : "never"} dpr={[1, 2]} camera={{ position: [2.2, 1.25, 2.45], fov: 36 }} gl={{ antialias: true, alpha: true }}
          className="absolute inset-0" style={{ background: "transparent", cursor: drag ? "grab" : "default", pointerEvents: drag ? "auto" : "none", touchAction: "pan-y", opacity: loaded ? 1 : 0, transition: "opacity .5s" }}>
          <ambientLight intensity={0.55} />
          <directionalLight position={[4, 6, 3]} intensity={2.2} />
          <directionalLight position={[-5, 2, -4]} intensity={0.7} />
          <Suspense fallback={null}>
            <Environment resolution={128}>
              <Lightformer intensity={2.4} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} />
              <Lightformer intensity={1.4} position={[6, 2, 4]} rotation-y={-Math.PI / 3} scale={[8, 6, 1]} />
              <Lightformer intensity={0.9} position={[-6, 1, -3]} rotation-y={Math.PI / 2.5} scale={[8, 6, 1]} />
            </Environment>
            <Model key={src} src={src} onReady={() => setReady(src)} />
          </Suspense>
          <OrbitControls makeDefault enableZoom={false} enablePan={false} enableRotate={drag} autoRotate={turn > 0} autoRotateSpeed={turn / 6}
            target={[0, 0, 0]} minPolarAngle={Math.PI * 0.2} maxPolarAngle={Math.PI * 0.52} />
        </Canvas>
      )}
    </div>
  );
}
