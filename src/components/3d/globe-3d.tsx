"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Html, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";

const EARTH_TEX_URL =
  "https://unpkg.com/three-globe@2.35.0/example/img/earth-blue-marble.jpg";

interface Arc {
  from: [number, number]; // [lat, lng]
  to: [number, number];
  color?: string;
}

interface Marker {
  position: [number, number]; // [lat, lng]
  label?: string;
  color?: string;
  size?: number;
}

interface Globe3DProps {
  arcs?: Arc[];
  markers?: Marker[];
  globeColor?: string;
  wireColor?: string;
  atmosphereColor?: string;
  rotationSpeed?: number;
  interactive?: boolean;
  height?: string;
  className?: string;
}

function latLngToVec3(
  lat: number,
  lng: number,
  radius: number,
): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return [
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

function GlobeGrid({ color }: { color: string }) {
  const lines = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    const r = 1.003;

    for (let lat = -60; lat <= 60; lat += 30) {
      const pts: THREE.Vector3[] = [];
      for (let lng = 0; lng <= 360; lng += 3) {
        pts.push(new THREE.Vector3(...latLngToVec3(lat, lng - 180, r)));
      }
      geos.push(new THREE.BufferGeometry().setFromPoints(pts));
    }

    for (let lng = -180; lng < 180; lng += 30) {
      const pts: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 3) {
        pts.push(new THREE.Vector3(...latLngToVec3(lat, lng, r)));
      }
      geos.push(new THREE.BufferGeometry().setFromPoints(pts));
    }

    return geos;
  }, []);

  const mat = useMemo(
    () => new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.25 }),
    [color],
  );

  return (
    <group>
      {lines.map((geo, i) => (
        <primitive key={i} object={new THREE.Line(geo, mat)} />
      ))}
    </group>
  );
}

function EarthSphere({ rotationSpeed }: { rotationSpeed: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const texture = useTexture(EARTH_TEX_URL);

  useFrame((_, delta) => {
    if (groupRef.current && rotationSpeed > 0) {
      groupRef.current.rotation.y += delta * rotationSpeed * 0.12;
    }
  });

  return (
    <group ref={groupRef}>
      <Sphere args={[1, 64, 64]}>
        <meshStandardMaterial
          map={texture}
          roughness={0.9}
          metalness={0.05}
        />
      </Sphere>
      {/* Subtle atmosphere rim */}
      <Sphere args={[1.02, 48, 48]}>
        <meshBasicMaterial
          color="#60A5FA"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  );
}

function GlobeFallback({ globeColor, wireColor, rotationSpeed }: { globeColor: string; wireColor: string; rotationSpeed: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current && rotationSpeed > 0) {
      groupRef.current.rotation.y += delta * rotationSpeed * 0.12;
    }
  });

  return (
    <group ref={groupRef}>
      <Sphere args={[1, 64, 32]}>
        <meshPhongMaterial color={globeColor} shininess={25} specular={new THREE.Color("#4a5568")} />
      </Sphere>
      <GlobeGrid color={wireColor} />
    </group>
  );
}

function ArcLine({ from, to, color = "#7DD3FC" }: Arc) {
  const tubeRef = useRef<THREE.Mesh>(null);
  const { curve } = useMemo(() => {
    const start = new THREE.Vector3(...latLngToVec3(from[0], from[1], 1.005));
    const end = new THREE.Vector3(...latLngToVec3(to[0], to[1], 1.005));
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const dist = start.distanceTo(end);
    mid.normalize().multiplyScalar(1 + dist * 0.45);
    return { curve: new THREE.QuadraticBezierCurve3(start, mid, end) };
  }, [from, to]);

  return (
    <group>
      <mesh ref={tubeRef}>
        <tubeGeometry args={[curve, 48, 0.004, 6, false]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </mesh>
      {/* Outer glow tube */}
      <mesh>
        <tubeGeometry args={[curve, 48, 0.012, 6, false]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

function MarkerPoint({
  position,
  label,
  color = "#F472B6",
  size = 0.025,
}: Marker) {
  const pulseRef = useRef<THREE.Mesh>(null);
  const pos = useMemo(
    () => latLngToVec3(position[0], position[1], 1.012),
    [position],
  );
  const normal = useMemo(() => new THREE.Vector3(...pos).normalize(), [pos]);

  useFrame(({ clock }) => {
    if (pulseRef.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 2) * 0.3;
      pulseRef.current.scale.set(s, s, s);
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.4 - Math.sin(clock.elapsedTime * 2) * 0.15;
    }
  });

  return (
    <group position={pos}>
      {/* Core dot */}
      <mesh>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Inner glow */}
      <mesh>
        <sphereGeometry args={[size * 1.8, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
      {/* Pulsing outer ring */}
      <mesh ref={pulseRef} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)}>
        <ringGeometry args={[size * 2.5, size * 3.2, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      {label && (
        <Html
          position={[0, size * 5, 0]}
          center
          style={{ pointerEvents: "none" }}
          zIndexRange={[10, 0]}
        >
          <div
            className="whitespace-nowrap font-semibold backdrop-blur-md border shadow-lg"
            style={{
              fontSize: "11px",
              color: "#fff",
              background: "rgba(0,0,0,0.75)",
              borderColor: `${color}50`,
              padding: "3px 10px",
              borderRadius: "6px",
              boxShadow: `0 0 8px ${color}30`,
            }}
          >
            <span style={{ color, marginRight: 4, fontSize: 8 }}>●</span>
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

export function Globe3D({
  arcs = [],
  markers = [],
  globeColor = "#1E3A5F",
  wireColor = "#60A5FA",
  atmosphereColor = "#6366f1",
  rotationSpeed = 1,
  interactive = true,
  height = "500px",
  className,
}: Globe3DProps) {
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
        <p className="text-muted text-sm">3D Globe (interactive in browser)</p>
      </div>
    );
  }

  return (
    <div
      className={cn("w-full overflow-hidden", className)}
      style={{
        height,
        background: "radial-gradient(ellipse at 50% 50%, #0f0d1a 0%, #0A0718 100%)",
      }}
    >
      <Canvas
        camera={{ position: [0, 0.2, 3.5], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={["#0A0718"]} />

        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 3, 5]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-3, -2, -3]} intensity={0.3} color="#818CF8" />

        <Suspense fallback={<GlobeFallback globeColor={globeColor} wireColor={wireColor} rotationSpeed={rotationSpeed} />}>
          <EarthSphere rotationSpeed={rotationSpeed} />
        </Suspense>

        {arcs.map((arc, i) => (
          <ArcLine key={`arc-${i}`} {...arc} />
        ))}

        {markers.map((marker, i) => (
          <MarkerPoint key={`marker-${i}`} {...marker} />
        ))}

        {interactive && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={rotationSpeed > 0}
            autoRotateSpeed={rotationSpeed * 0.4}
            minPolarAngle={Math.PI * 0.25}
            maxPolarAngle={Math.PI * 0.75}
          />
        )}
      </Canvas>
    </div>
  );
}
