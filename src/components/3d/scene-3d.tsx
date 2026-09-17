"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Float,
  useGLTF,
} from "@react-three/drei";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";

interface Scene3DProps {
  /** URL to a .glb/.gltf model */
  modelUrl?: string;
  /** Auto-rotation speed (0 to disable) */
  rotationSpeed?: number;
  /** Allow user interaction */
  interactive?: boolean;
  /** Environment preset for lighting/reflections */
  environment?: "city" | "sunset" | "dawn" | "night" | "studio" | "apartment";
  /** Enable floating animation */
  float?: boolean;
  /** Scale of the model */
  scale?: number;
  /** Height of the container */
  height?: string;
  /** Custom children (R3F elements) to render inside the canvas */
  children?: React.ReactNode;
  className?: string;
}

function Model({
  url,
  scale = 1,
}: {
  url: string;
  scale: number;
}) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={scale} />;
}

export function Scene3D({
  modelUrl,
  rotationSpeed = 1,
  interactive = true,
  environment = "city",
  float: enableFloat = true,
  scale = 1,
  height = "500px",
  children,
  className,
}: Scene3DProps) {
  const print = usePrintMode();

  if (print) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-bg-dark rounded-2xl",
          className,
        )}
        style={{ height }}
      >
        <p className="text-muted text-sm">3D Scene (interactive in browser)</p>
      </div>
    );
  }

  const content = modelUrl ? <Model url={modelUrl} scale={scale} /> : children;

  return (
    <div className={cn("w-full rounded-2xl overflow-hidden", className)} style={{ height }}>
      <Canvas
        camera={{ position: [0, 1, 4], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <Environment preset={environment} />

          {enableFloat ? (
            <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
              {content}
            </Float>
          ) : (
            content
          )}

          <ContactShadows
            position={[0, -1.5, 0]}
            opacity={0.4}
            scale={10}
            blur={2}
          />
        </Suspense>

        {interactive && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={rotationSpeed > 0}
            autoRotateSpeed={rotationSpeed}
            minPolarAngle={Math.PI * 0.25}
            maxPolarAngle={Math.PI * 0.75}
          />
        )}
      </Canvas>
    </div>
  );
}
