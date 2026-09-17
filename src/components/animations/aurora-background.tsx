"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";

interface AuroraBackgroundProps {
  /** Up to 5 gradient colors. Defaults to the active brand palette */
  colors?: string[];
  /** Animation speed multiplier (0.5 = half speed, 2 = double) */
  speed?: number;
  /** Blend opacity of the aurora over the background (0-1) */
  blend?: number;
  /** Additional CSS classes */
  className?: string;
  children?: React.ReactNode;
}

const VERTEX = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAGMENT = `
  precision highp float;
  uniform float u_time;
  uniform vec2  u_resolution;
  uniform vec3  u_colors[5];
  uniform float u_speed;
  uniform float u_blend;

  // Simplex-ish noise (2D)
  vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                             + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                             dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x_ = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x_) - 0.5;
    vec3 ox = floor(x_ + 0.5);
    vec3 a0 = x_ - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float t = u_time * u_speed;

    float n1 = snoise(uv * 2.0 + vec2(t * 0.15, t * 0.08));
    float n2 = snoise(uv * 3.0 + vec2(-t * 0.12, t * 0.1));
    float n3 = snoise(uv * 1.5 + vec2(t * 0.07, -t * 0.13));

    // Layer mixing
    float mix1 = smoothstep(-0.3, 0.8, n1);
    float mix2 = smoothstep(-0.2, 0.7, n2);
    float mix3 = smoothstep(-0.4, 0.6, n3);

    vec3 col = u_colors[0];
    col = mix(col, u_colors[1], mix1);
    col = mix(col, u_colors[2], mix2 * 0.7);
    col = mix(col, u_colors[3], mix3 * 0.5);
    col = mix(col, u_colors[4], (mix1 * mix2) * 0.4);

    // Vertical fade: stronger at top, transparent at bottom
    float vFade = smoothstep(0.0, 0.7, uv.y);
    float alpha = vFade * u_blend * (0.6 + 0.4 * mix1);

    gl_FragColor = vec4(col, alpha);
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

const DEFAULT_COLORS = ["#7DD3FC", "#818CF8", "#A78BFA", "#E879A8", "#F472B6"];

export function AuroraBackground({
  colors = DEFAULT_COLORS,
  speed = 1,
  blend = 0.6,
  className,
  children,
}: AuroraBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const print = usePrintMode();

  useEffect(() => {
    if (print) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
    });
    if (!gl) return;

    function createShader(
      ctx: WebGLRenderingContext,
      type: number,
      src: string,
    ) {
      const s = ctx.createShader(type);
      if (!s) return null;
      ctx.shaderSource(s, src);
      ctx.compileShader(s);
      if (!ctx.getShaderParameter(s, ctx.COMPILE_STATUS)) {
        ctx.deleteShader(s);
        return null;
      }
      return s;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
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

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_resolution");
    const uSpeed = gl.getUniformLocation(prog, "u_speed");
    const uBlend = gl.getUniformLocation(prog, "u_blend");

    const padded = [...colors];
    while (padded.length < 5) padded.push(padded[padded.length - 1]);
    for (let i = 0; i < 5; i++) {
      const loc = gl.getUniformLocation(prog, `u_colors[${i}]`);
      const [r, g, b] = hexToRgb(padded[i]);
      gl.uniform3f(loc, r, g, b);
    }

    gl.uniform1f(uSpeed, speed);
    gl.uniform1f(uBlend, blend);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

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
        gl!.uniform2f(uRes, w, h);
      }
    }

    function frame() {
      resize();
      gl!.uniform1f(uTime, (performance.now() - start) / 1000);
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [colors, speed, blend, print]);

  if (print) {
    return <div className={cn("relative", className)}>{children}</div>;
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ mixBlendMode: "screen" }}
      />
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}
