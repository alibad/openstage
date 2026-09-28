"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { MotionValue } from "framer-motion";
import { easing } from "maath";
import * as THREE from "three";
import { useStage, useStageView } from "./stage";
import { pointerInRect } from "./pointer";
import { seeded } from "./morph-targets";
import { ADDITIVE_ON_TRANSPARENT } from "./glsl";

/**
 * NeuralField — a procedural neural network with signals firing through it.
 *
 * Layers of nodes, sparse connections between neighbours, and a pulse on
 * every connection. `activity` sets how much of the network is firing;
 * `wave` sets whether pulses fire at random (thinking) or roll forward layer
 * by layer (a forward pass). Drive either from scroll to make a section's
 * argument visible: "the network wakes up", "the signal propagates".
 *
 * No model files — the geometry is generated from a seed, so it ships as
 * code and looks identical on every load. Everything moves on the GPU.
 *
 * @example
 * <StageView className="h-[80vh]">
 *   <StageCamera position={[0, 0, 7]} />
 *   <NeuralField activity={activity} wave={0.8} />
 * </StageView>
 */

interface NeuralFieldProps {
  /** Share of connections firing, 0–1. */
  activity?: number | MotionValue<number>;
  /** 0 = pulses fire at random; 1 = they roll forward layer by layer. */
  wave?: number | MotionValue<number>;
  /** Input → output colour sweep. */
  colors?: [string, string];
  layers?: number;
  nodesPerLayer?: number;
  /** Connections from each node to the next layer. */
  fanOut?: number;
  /** Where the network sits in its view — shift it clear of overlaid text. */
  position?: [number, number, number];
  scale?: number;
  seed?: number;
}

const PULSE_VERTEX = /* glsl */ `
uniform float uTime, uActivity, uWave, uPixelRatio, uLayers;
uniform vec3 uColorA, uColorB;
attribute vec3 aEnd;
attribute vec3 aRand;
attribute float aLayer;
varying vec3 vColor;
varying float vAlpha;
void main() {
  float speed = mix(0.35 + aRand.y * 0.5, 0.42, uWave);
  float phase = mix(aRand.x, -aLayer / uLayers * 1.35, uWave);
  float s = fract(uTime * speed + phase);
  vec3 p = mix(position, aEnd, s);
  float on = step(aRand.z, uActivity);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float env = sin(3.14159265 * s);
  gl_PointSize = (5.0 + 7.0 * env) * uPixelRatio * (6.0 / -mv.z) * on;
  vColor = mix(uColorA, uColorB, (aLayer + s) / uLayers);
  vAlpha = env * on;
}
`;

const NODE_VERTEX = /* glsl */ `
uniform float uTime, uActivity, uPixelRatio, uLayers;
uniform vec3 uColorA, uColorB;
attribute vec2 aNode;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float flicker = 0.5 + 0.5 * sin(uTime * (1.4 + aNode.y * 2.6) + aNode.y * 60.0);
  float lit = 0.35 + 0.65 * uActivity * flicker;
  gl_PointSize = (6.0 + 9.0 * lit) * uPixelRatio * (6.0 / -mv.z);
  vColor = mix(uColorA, uColorB, aNode.x / uLayers);
  vAlpha = 0.35 + 0.65 * lit;
}
`;

const GLOW_FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  float glow = pow(smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)), 1.6);
  if (glow * vAlpha < 0.01) discard;
  gl_FragColor = vec4(vColor, glow * vAlpha);
}
`;

function read(v: number | MotionValue<number>) {
  return typeof v === "number" ? v : v.get();
}

export function NeuralField({
  activity = 0.6,
  wave = 0,
  colors = ["#38bdf8", "#c084fc"],
  layers = 6,
  nodesPerLayer = 30,
  fanOut = 3,
  position = [0, 0, 0],
  scale = 1,
  seed = 3,
}: NeuralFieldProps) {
  const { quality } = useStage();
  const view = useStageView();
  const group = useRef<THREE.Group>(null);
  const live = useRef({ activity: 0, wave: 0, tiltX: 0, tiltY: 0 });
  // Key memos on the colour *values* — a literal array is a new object every render.
  const [colorIn, colorOut] = colors;

  const { edges, nodes, pulses } = useMemo(() => {
    const rng = seeded(seed);
    const perLayer = Math.max(
      4,
      Math.round(nodesPerLayer * (quality.tier === "low" ? 0.6 : 1)),
    );

    // Nodes: layers spread along x, each a jittered disc that bulges mid-network.
    const positions: THREE.Vector3[][] = [];
    for (let l = 0; l < layers; l++) {
      const x = -1.8 + (3.6 * l) / Math.max(layers - 1, 1);
      const radius =
        0.55 + 0.55 * Math.sin((Math.PI * l) / Math.max(layers - 1, 1));
      const count =
        l === 0 || l === layers - 1 ? Math.round(perLayer * 0.6) : perLayer;
      const layer: THREE.Vector3[] = [];
      for (let i = 0; i < count; i++) {
        const r = radius * Math.sqrt((i + 0.5) / count);
        const a = i * 2.399963 + rng() * 0.35;
        layer.push(
          new THREE.Vector3(
            x + (rng() - 0.5) * 0.18,
            Math.cos(a) * r,
            Math.sin(a) * r * 0.85,
          ),
        );
      }
      positions.push(layer);
    }

    const nodeCount = positions.reduce((s, l) => s + l.length, 0);
    const nodePos = new Float32Array(nodeCount * 3);
    const nodeAttr = new Float32Array(nodeCount * 2);
    let k = 0;
    positions.forEach((layer, l) =>
      layer.forEach((p) => {
        nodePos.set([p.x, p.y, p.z], k * 3);
        nodeAttr.set([l, rng()], k * 2);
        k++;
      }),
    );

    // Connections: each node reaches `fanOut` of the nearest nodes in the next layer.
    const lineStart: number[] = [];
    const lineColor: number[] = [];
    const pulseStart: number[] = [];
    const pulseEnd: number[] = [];
    const pulseRand: number[] = [];
    const pulseLayer: number[] = [];
    const ca = new THREE.Color(colorIn);
    const cb = new THREE.Color(colorOut);
    for (let l = 0; l < layers - 1; l++) {
      const next = positions[l + 1];
      for (const a of positions[l]) {
        const nearest = next
          .map((b, idx) => ({ idx, d: a.distanceToSquared(b) + rng() * 0.25 }))
          .sort((m, n) => m.d - n.d)
          .slice(0, fanOut);
        for (const { idx } of nearest) {
          const b = next[idx];
          lineStart.push(a.x, a.y, a.z, b.x, b.y, b.z);
          const c0 = ca.clone().lerp(cb, l / (layers - 1));
          const c1 = ca.clone().lerp(cb, (l + 1) / (layers - 1));
          lineColor.push(c0.r, c0.g, c0.b, c1.r, c1.g, c1.b);
          pulseStart.push(a.x, a.y, a.z);
          pulseEnd.push(b.x, b.y, b.z);
          pulseRand.push(rng(), rng(), rng());
          pulseLayer.push(l);
        }
      }
    }

    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(lineStart, 3),
    );
    edgeGeo.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(lineColor, 3),
    );

    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePos, 3));
    nodeGeo.setAttribute("aNode", new THREE.BufferAttribute(nodeAttr, 2));

    const pulseGeo = new THREE.BufferGeometry();
    pulseGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(pulseStart, 3),
    );
    pulseGeo.setAttribute(
      "aEnd",
      new THREE.Float32BufferAttribute(pulseEnd, 3),
    );
    pulseGeo.setAttribute(
      "aRand",
      new THREE.Float32BufferAttribute(pulseRand, 3),
    );
    pulseGeo.setAttribute(
      "aLayer",
      new THREE.Float32BufferAttribute(pulseLayer, 1),
    );

    return { edges: edgeGeo, nodes: nodeGeo, pulses: pulseGeo };
  }, [layers, nodesPerLayer, fanOut, seed, colorIn, colorOut, quality.tier]);

  useEffect(
    () => () => {
      edges.dispose();
      nodes.dispose();
      pulses.dispose();
    },
    [edges, nodes, pulses],
  );

  const materials = useMemo(() => {
    const shared = {
      uTime: { value: 0 },
      uActivity: { value: 0 },
      uWave: { value: 0 },
      uPixelRatio: { value: 1 },
      uLayers: { value: Math.max(layers - 1, 1) },
      uColorA: { value: new THREE.Color(colorIn) },
      uColorB: { value: new THREE.Color(colorOut) },
    };
    const glow = ADDITIVE_ON_TRANSPARENT;
    return {
      shared,
      line: new THREE.LineBasicMaterial({
        ...ADDITIVE_ON_TRANSPARENT,
        vertexColors: true,
        opacity: 0.24,
      }),
      pulse: new THREE.ShaderMaterial({
        ...glow,
        uniforms: shared,
        vertexShader: PULSE_VERTEX,
        fragmentShader: GLOW_FRAGMENT,
      }),
      node: new THREE.ShaderMaterial({
        ...glow,
        uniforms: shared,
        vertexShader: NODE_VERTEX,
        fragmentShader: GLOW_FRAGMENT,
      }),
    };
  }, [colorIn, colorOut, layers]);

  useEffect(
    () => () => {
      materials.line.dispose();
      materials.pulse.dispose();
      materials.node.dispose();
    },
    [materials],
  );

  useFrame((state, delta) => {
    if (!view.visible || !group.current) return;
    const dt = Math.min(delta, 0.05);
    const reduced = quality.reducedMotion;
    const u = materials.shared;

    easing.damp(live.current, "activity", read(activity), 0.35, dt);
    easing.damp(live.current, "wave", read(wave), 0.5, dt);
    u.uActivity.value = live.current.activity;
    u.uWave.value = live.current.wave;
    u.uPixelRatio.value = state.gl.getPixelRatio();
    // Reduced motion: the network is drawn lit, but nothing travels.
    if (!reduced) u.uTime.value = state.clock.elapsedTime;

    const ndc = reduced
      ? null
      : pointerInRect(view.el?.getBoundingClientRect() ?? null);
    easing.damp(live.current, "tiltY", ndc ? ndc[0] * 0.35 : 0, 0.6, dt);
    easing.damp(live.current, "tiltX", ndc ? -ndc[1] * 0.2 : 0, 0.6, dt);
    group.current.rotation.y =
      (reduced ? 0 : state.clock.elapsedTime * 0.06) +
      live.current.tiltY -
      0.35;
    group.current.rotation.x = live.current.tiltX + 0.12;
  });

  return (
    <group position={position} scale={scale}>
      <group ref={group}>
        <lineSegments
          geometry={edges}
          material={materials.line}
          frustumCulled={false}
        />
        <points
          geometry={pulses}
          material={materials.pulse}
          frustumCulled={false}
        />
        <points
          geometry={nodes}
          material={materials.node}
          frustumCulled={false}
        />
      </group>
    </group>
  );
}
