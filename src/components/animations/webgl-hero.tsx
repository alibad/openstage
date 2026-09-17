"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";

interface WebGLHeroProps {
  /** Up to 4 gradient colors that paint the flow-field. */
  colors?: [string, string, string, string];
  /** Base speed of the flow simulation */
  speed?: number;
  /** How much the pointer distorts the field (0 = none, 1 = strong) */
  pointerInfluence?: number;
  /** Grain / film noise amount (0-1) */
  grain?: number;
  /** Fade to transparent at the bottom */
  fadeBottom?: boolean;
  /** Extra classes on container */
  className?: string;
  children?: React.ReactNode;
}

const VERTEX = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

// A swirling, iridescent flow-field shader that reacts to a pointer.
// Different from AuroraBackground: denser, pointer-reactive, more cinematic
// for full-bleed covers where it IS the composition, not ambient background.
const FRAGMENT = `
precision highp float;
uniform float u_time;
uniform vec2  u_resolution;
uniform vec2  u_pointer;
uniform float u_pointerStrength;
uniform vec3  u_c0;
uniform vec3  u_c1;
uniform vec3  u_c2;
uniform vec3  u_c3;
uniform float u_speed;
uniform float u_grain;

// Hash + 2D noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Fractal Brownian motion for texture
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 p = uv - 0.5;
  p.x *= u_resolution.x / u_resolution.y;

  float t = u_time * u_speed * 0.35;

  // Pointer distortion — pull the field toward the cursor
  vec2 pointer = u_pointer - vec2(0.5, 0.5);
  pointer.x *= u_resolution.x / u_resolution.y;
  vec2 toCursor = pointer - p;
  float d = length(toCursor);
  vec2 distortion = normalize(toCursor) * (u_pointerStrength * 0.15 * exp(-d * 2.5));
  p += distortion;

  // Flow-field: two advected noise layers
  vec2 q = vec2(fbm(p + vec2(t, 0.0)), fbm(p + vec2(5.2 + t, 1.3)));
  vec2 r = vec2(
    fbm(p + 4.0 * q + vec2(1.7 + t * 0.6, 9.2)),
    fbm(p + 4.0 * q + vec2(8.3 - t * 0.4, 2.8))
  );
  float f = fbm(p + 4.0 * r);
  f = clamp(f, 0.0, 1.0);

  // Palette mixing
  vec3 col = mix(u_c0, u_c1, smoothstep(0.0, 0.5, f));
  col = mix(col, u_c2, smoothstep(0.3, 0.8, r.x));
  col = mix(col, u_c3, smoothstep(0.4, 1.0, q.y));

  // Soft vignette
  float vig = smoothstep(1.3, 0.25, length(uv - 0.5));
  col *= 0.55 + 0.55 * vig;

  // Grain
  float g = hash(gl_FragCoord.xy + u_time) * u_grain;
  col += (g - u_grain * 0.5);

  gl_FragColor = vec4(col, 1.0);
}
`;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

const DEFAULT_COLORS: [string, string, string, string] = [
  "#0A0718",
  "#6D28D9",
  "#EC4899",
  "#FBBF24",
];

/**
 * WebGLHero — cinematic full-bleed flow-field shader.
 *
 * Designed for hero / cover sections where the background IS the image.
 * Pointer-reactive, grainy, with a palette that blends through 4 colors.
 * Gracefully falls back to a CSS gradient when WebGL is unavailable or
 * during print export.
 *
 * @example
 * <WebGLHero colors={["#0A0718", "#6D28D9", "#EC4899", "#FBBF24"]}>
 *   <h1 className="display-xl">Headline</h1>
 * </WebGLHero>
 */
export function WebGLHero({
  colors = DEFAULT_COLORS,
  speed = 1,
  pointerInfluence = 1,
  grain = 0.08,
  fadeBottom = false,
  className,
  children,
}: WebGLHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const print = usePrintMode();

  useEffect(() => {
    if (print) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      powerPreference: "high-performance",
    });
    if (!gl) return;

    function compile(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
        gl!.deleteShader(s);
        return null;
      }
      return s;
    }

    const vs = compile(gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vs || !fs) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const pos = gl.getAttribLocation(prog, "position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const u = {
      time: gl.getUniformLocation(prog, "u_time"),
      res: gl.getUniformLocation(prog, "u_resolution"),
      ptr: gl.getUniformLocation(prog, "u_pointer"),
      ptrStr: gl.getUniformLocation(prog, "u_pointerStrength"),
      c0: gl.getUniformLocation(prog, "u_c0"),
      c1: gl.getUniformLocation(prog, "u_c1"),
      c2: gl.getUniformLocation(prog, "u_c2"),
      c3: gl.getUniformLocation(prog, "u_c3"),
      speed: gl.getUniformLocation(prog, "u_speed"),
      grain: gl.getUniformLocation(prog, "u_grain"),
    };

    gl.uniform3f(u.c0, ...hexToRgb(colors[0]));
    gl.uniform3f(u.c1, ...hexToRgb(colors[1]));
    gl.uniform3f(u.c2, ...hexToRgb(colors[2]));
    gl.uniform3f(u.c3, ...hexToRgb(colors[3]));
    gl.uniform1f(u.speed, speed);
    gl.uniform1f(u.grain, grain);
    gl.uniform1f(u.ptrStr, pointerInfluence);
    gl.uniform2f(u.ptr, 0.5, 0.5);

    let targetPointer = [0.5, 0.5];
    const currentPointer = [0.5, 0.5];

    const onMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      targetPointer = [
        (e.clientX - rect.left) / rect.width,
        1 - (e.clientY - rect.top) / rect.height,
      ];
    };
    const onLeave = () => {
      targetPointer = [0.5, 0.5];
    };

    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerleave", onLeave);

    let raf = 0;
    const start = performance.now();

    function resize() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio, 2);
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl!.viewport(0, 0, w, h);
        gl!.uniform2f(u.res, w, h);
      }
    }

    function frame() {
      resize();
      currentPointer[0] += (targetPointer[0] - currentPointer[0]) * 0.06;
      currentPointer[1] += (targetPointer[1] - currentPointer[1]) * 0.06;
      gl!.uniform1f(u.time, (performance.now() - start) / 1000);
      gl!.uniform2f(u.ptr, currentPointer[0], currentPointer[1]);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [colors, speed, pointerInfluence, grain, print]);

  const cssFallback = `linear-gradient(135deg, ${colors[0]}, ${colors[1]} 35%, ${colors[2]} 70%, ${colors[3]})`;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      style={{ background: cssFallback }}
    >
      {!print && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      )}
      {fadeBottom && (
        <div
          className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, transparent, var(--color-bg-dark) 90%)",
          }}
        />
      )}
      {children && <div className="relative z-10 h-full">{children}</div>}
    </div>
  );
}
