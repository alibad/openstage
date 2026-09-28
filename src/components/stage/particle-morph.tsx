"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTransform, type MotionValue } from "framer-motion";
import { easing } from "maath";
import * as THREE from "three";
import { useStage, useStageView } from "./stage";
import { pointerInRect } from "./pointer";
import { fitScale, sampleTargets, seeded, type MorphTarget, type SampledTarget } from "./morph-targets";
import { ADDITIVE_ON_TRANSPARENT, SIMPLEX_3D } from "./glsl";

/**
 * ParticleMorph — a cloud of GPU particles that flows between shapes.
 *
 * Give it an ordered list of targets (text, images, procedural shapes) and a
 * progress. Each particle leaves on its own schedule and rides a noise field
 * in transit, so a morph reads as a swarm re-forming rather than a crossfade;
 * at rest the shape is crisp and breathes slightly. The cursor parts the
 * cloud where it passes.
 *
 * Put it inside a <StageView> with a <StageCamera>. It runs entirely on the
 * GPU: the CPU only copies two target buffers when the morph crosses into a
 * new pair of shapes.
 *
 * @example — scroll-driven
 * const { scrollYProgress } = useScroll({ target: ref });
 * const progress = useHeldProgress(scrollYProgress, TARGETS.length);
 * <StageView className="h-screen" poster={<h1>Round 4</h1>}>
 *   <StageCamera />
 *   <ParticleMorph targets={TARGETS} progress={progress} />
 * </StageView>
 *
 * @example — step-driven (slides, buttons)
 * <ParticleMorph targets={TARGETS} progress={slideIndex} />
 */

interface ParticleMorphProps {
  targets: MorphTarget[];
  /**
   * Which target to show, by index. A number animates there over
   * `transition` seconds — use it for slides and buttons. A MotionValue is
   * followed continuously — use it for scroll; 1.5 is halfway from the
   * second target to the third.
   */
  progress: number | MotionValue<number>;
  /** One to three CSS colours, swept left to right across the cloud. */
  colors?: string[];
  /** Particle count. Defaults to the device's stage budget. */
  count?: number;
  /** Particle size multiplier. */
  size?: number;
  /** How much the swarm swirls mid-morph. 0 = straight lines. */
  turbulence?: number;
  /** Let the cursor part the cloud. */
  interactive?: boolean;
  /** Seconds a numeric `progress` change takes to land. */
  transition?: number;
  opacity?: number;
  seed?: number;
}

const VERTEX = /* glsl */ `
uniform float uMix, uTime, uSize, uPixelRatio, uTurb, uIdle, uAngleFrom, uAngleTo;
uniform float uPointerStrength, uViewWidth, uOpacity;
uniform vec2 uOffsetFrom, uOffsetTo;
uniform vec3 uPointer, uColorA, uColorB, uColorC;
attribute vec3 aTo;
attribute float aSeed;
attribute vec3 aRand;
varying vec3 vColor;
varying float vAlpha;

${SIMPLEX_3D}

vec3 rotY(vec3 p, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}

void main() {
  vec3 from = rotY(position, uAngleFrom) + vec3(uOffsetFrom, 0.0);
  vec3 to = rotY(aTo, uAngleTo) + vec3(uOffsetTo, 0.0);

  // Staggered departure: each particle leaves on its own schedule.
  float t = clamp((uMix - aSeed * 0.4) / 0.6, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);
  vec3 p = mix(from, to, t);
  float transit = sin(3.14159265 * t);

  // Ride a slow flow field — hard in transit, a breath at rest.
  vec3 f = flow(p / max(uViewWidth, 0.001) * 3.2 + vec3(0.0, 0.0, uTime * 0.11 + aSeed * 3.0));
  p += f * uViewWidth * 0.075 * (uTurb * transit * 1.5 + uIdle * 0.045);

  // The cursor parts the cloud.
  vec2 d = p.xy - uPointer.xy;
  float radius = uViewWidth * 0.085;
  float push = uPointerStrength * smoothstep(radius, 0.0, length(d));
  p.xy += normalize(d + 1e-5) * push * radius * 0.55;
  p.z += push * radius * 0.5;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.55 + aRand.x * 0.9) * (1.0 + transit * 0.6) * uPixelRatio * (10.0 / -mv.z);

  float g = clamp(0.5 + p.x / uViewWidth + (aRand.y - 0.5) * 0.35, 0.0, 1.0);
  vColor = g < 0.5 ? mix(uColorA, uColorB, g * 2.0) : mix(uColorB, uColorC, (g - 0.5) * 2.0);
  float twinkle = 0.74 + 0.26 * sin(uTime * (1.1 + aRand.z * 2.2) + aSeed * 40.0);
  vAlpha = uOpacity * twinkle * (1.0 - transit * 0.2);
}
`;

const FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  float glow = pow(smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)), 1.7);
  if (glow < 0.01) discard;
  gl_FragColor = vec4(vColor, glow * vAlpha);
}
`;

const DEFAULT_COLORS = ["#7dd3fc", "#a78bfa", "#f0abfc"];

/** Accepts hex, rgb(), named colours and `var(--token)`. */
function resolveColor(value: string): THREE.Color {
  const match = value.match(/^var\((--[^),\s]+)/);
  const raw = match ? getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim() : value;
  try {
    return new THREE.Color(raw || "#ffffff");
  } catch {
    return new THREE.Color("#ffffff");
  }
}

export function ParticleMorph({
  targets,
  progress,
  colors = DEFAULT_COLORS,
  count,
  size = 2.5,
  turbulence = 1,
  interactive = true,
  transition = 1.4,
  opacity = 0.9,
  seed = 7,
}: ParticleMorphProps) {
  const { quality } = useStage();
  const view = useStageView();
  const { viewport, camera } = useThree();
  const particles = count ?? quality.particles;
  const reduced = quality.reducedMotion;

  // Re-sample only when the targets' *content* changes, not their identity.
  const targetKey = JSON.stringify(targets);
  const [sampled, setSampled] = useState<SampledTarget[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    sampleTargets(JSON.parse(targetKey) as MorphTarget[], particles, seed).then((s) => {
      if (!cancelled) setSampled(s);
    });
    return () => {
      cancelled = true;
    };
  }, [targetKey, particles, seed]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const rng = seeded(seed * 13 + 1);
    const seeds = new Float32Array(particles);
    const rand = new Float32Array(particles * 3);
    for (let i = 0; i < particles; i++) {
      seeds[i] = rng();
      rand[i * 3] = rng();
      rand[i * 3 + 1] = rng();
      rand[i * 3 + 2] = rng();
    }
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(particles * 3), 3));
    g.setAttribute("aTo", new THREE.BufferAttribute(new Float32Array(particles * 3), 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    g.setAttribute("aRand", new THREE.BufferAttribute(rand, 3));
    return g;
  }, [particles, seed]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const colorKey = colors.join("|");
  const material = useMemo(() => {
    const [a, b = a, c = b] = colorKey.split("|");
    return new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      ...ADDITIVE_ON_TRANSPARENT,
      uniforms: {
        uMix: { value: 0 },
        uTime: { value: 0 },
        uSize: { value: size },
        uPixelRatio: { value: 1 },
        uTurb: { value: turbulence },
        uIdle: { value: 1 },
        uAngleFrom: { value: 0 },
        uAngleTo: { value: 0 },
        uOffsetFrom: { value: new THREE.Vector2() },
        uOffsetTo: { value: new THREE.Vector2() },
        uPointer: { value: new THREE.Vector3(1e4, 1e4, 0) },
        uPointerStrength: { value: 0 },
        uViewWidth: { value: 1 },
        uOpacity: { value: opacity },
        uColorA: { value: resolveColor(a) },
        uColorB: { value: resolveColor(b) },
        uColorC: { value: resolveColor(c) },
      },
    });
  }, [colorKey, size, turbulence, opacity]);
  useEffect(() => () => material.dispose(), [material]);

  // World-space copies of each target, rebuilt when the view is resized.
  const view3d = viewport.getCurrentViewport(camera, [0, 0, 0]);
  const scaled = useMemo(() => {
    if (!sampled) return null;
    return sampled.map((t) => {
      const s = fitScale(t, view3d.width, view3d.height);
      const out = new Float32Array(t.points.length);
      for (let i = 0; i < out.length; i++) out[i] = t.points[i] * s;
      return {
        points: out,
        offset: [(t.offset[0] * view3d.width) / 2, (t.offset[1] * view3d.height) / 2] as [number, number],
        spin: reduced ? 0 : t.spin,
      };
    });
  }, [sampled, view3d.width, view3d.height, reduced]);

  const points = useRef<THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>>(null);
  const live = useRef({ value: 0, segment: -1, built: null as unknown, pointer: new THREE.Vector3(1e4, 1e4, 0) });
  const angles = useRef<number[]>([]);

  useFrame((state, delta) => {
    const obj = points.current;
    if (!scaled || !view.visible || !obj) return;
    const dt = Math.min(delta, 0.05);
    const u = obj.material.uniforms;
    const attrs = obj.geometry.attributes;
    const n = scaled.length;

    // Where the morph should be.
    const goal = Math.min(Math.max(typeof progress === "number" ? progress : progress.get(), 0), n - 1);
    if (reduced) live.current.value = typeof progress === "number" ? Math.round(goal) : goal;
    else easing.damp(live.current, "value", goal, typeof progress === "number" ? transition * 0.42 : 0.12, dt);
    const p = live.current.value;

    const i = n === 1 ? 0 : Math.min(Math.floor(p), n - 2);
    const j = n === 1 ? 0 : i + 1;

    if (i !== live.current.segment || live.current.built !== scaled) {
      (attrs.position.array as Float32Array).set(scaled[i].points);
      (attrs.aTo.array as Float32Array).set(scaled[j].points);
      attrs.position.needsUpdate = true;
      attrs.aTo.needsUpdate = true;
      live.current.segment = i;
      live.current.built = scaled;
    }

    if (angles.current.length !== n) angles.current = new Array(n).fill(0);
    for (let k = 0; k < n; k++) angles.current[k] += scaled[k].spin * dt;

    u.uMix.value = n === 1 ? 0 : p - i;
    u.uTime.value = state.clock.elapsedTime;
    u.uPixelRatio.value = state.gl.getPixelRatio();
    u.uViewWidth.value = view3d.width;
    u.uIdle.value = reduced ? 0 : 1;
    u.uTurb.value = reduced ? 0 : turbulence;
    u.uAngleFrom.value = angles.current[i];
    u.uAngleTo.value = angles.current[j];
    (u.uOffsetFrom.value as THREE.Vector2).set(...scaled[i].offset);
    (u.uOffsetTo.value as THREE.Vector2).set(...scaled[j].offset);

    const ndc = interactive && !reduced ? pointerInRect(view.el?.getBoundingClientRect() ?? null) : null;
    if (ndc) {
      live.current.pointer.set((ndc[0] * view3d.width) / 2, (ndc[1] * view3d.height) / 2, 0);
      easing.damp3(u.uPointer.value as THREE.Vector3, live.current.pointer, 0.08, dt);
    }
    easing.damp(u.uPointerStrength, "value", ndc ? 1 : 0, 0.25, dt);
  });

  if (!scaled) return null;
  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />;
}

/**
 * Map a 0–1 scroll progress onto target indices with a hold at each target,
 * so every shape sits still long enough to read before the next morph.
 * `hold` is the share of each segment spent resting at either end.
 */
export function useHeldProgress(source: MotionValue<number>, targets: number, hold = 0.22) {
  return useTransform(source, (s) => {
    const span = targets - 1;
    if (span <= 0) return 0;
    const x = Math.min(Math.max(s, 0), 1) * span;
    const i = Math.min(Math.floor(x), span - 1);
    const t = Math.min(Math.max((x - i - hold) / (1 - 2 * hold), 0), 1);
    return i + t;
  });
}
