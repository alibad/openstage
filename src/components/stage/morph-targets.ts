"use client";

/**
 * Shapes a ParticleMorph can take. Every generator returns `count` points in
 * a normalised box one unit wide, centred on the origin; ParticleMorph scales
 * them to the view at render time, so a target is sampled once and survives
 * resizes.
 *
 * Text and images are rasterised by the browser, then sampled. That is why
 * any script works — Arabic shaping, ligatures and RTL come from the same
 * font engine that renders the rest of the page.
 */

export type ShapeName =
  | "scatter"
  | "sphere"
  | "globe"
  | "torus"
  | "helix"
  | "galaxy"
  | "wave"
  | "cube"
  | "snowflake"
  | "ring";

interface Placement {
  /** Size relative to the default fit. 1 = fill the view comfortably. */
  scale?: number;
  /** Shift in view halves: [-1, 1] spans the view. [0.5, 0] = right third. */
  offset?: [number, number];
  /** Rotation speed around the vertical axis, rad/s. Shapes spin by default; text holds still. */
  spin?: number;
}

export type MorphTarget =
  | ({ shape: ShapeName } & Placement)
  | ({
      text: string;
      /** CSS font-weight. Heavy weights sample into crisper particles. */
      weight?: number;
      /**
       * CSS font-family. Defaults to the page's body font. `var(--font-arabic)`
       * style tokens are resolved, so a deck can point at its next/font face.
       */
      font?: string;
      rtl?: boolean;
      lineHeight?: number;
    } & Placement)
  | ({
      /** A same-origin image; its opaque (or bright, with `luminance`) pixels become particles. */
      image: string;
      luminance?: boolean;
      threshold?: number;
    } & Placement);

export interface SampledTarget {
  points: Float32Array;
  /** Height ÷ width of the sampled shape — how tall it is at unit width. */
  aspect: number;
  /** Text and images fit to width; shapes fit to the view's short side. */
  fit: "width" | "shape";
  scale: number;
  offset: [number, number];
  spin: number;
}

/* ─── Deterministic randomness ───────────────────────────────────────────── */

export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng: () => number) {
  const u = Math.max(rng(), 1e-6);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

/* ─── Procedural shapes ──────────────────────────────────────────────────── */

type Writer = (i: number, x: number, y: number, z: number) => void;

function writerFor(out: Float32Array): Writer {
  return (i, x, y, z) => {
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  };
}

const GOLDEN = Math.PI * (3 - Math.sqrt(5));

function shapePoints(shape: ShapeName, count: number, rng: () => number): Float32Array {
  const out = new Float32Array(count * 3);
  const put = writerFor(out);

  switch (shape) {
    case "scatter": {
      // A loose cloud wider than the view: the "dissolved" state.
      for (let i = 0; i < count; i++) {
        const r = 1.15 * Math.cbrt(rng());
        const th = rng() * Math.PI * 2;
        const ph = Math.acos(2 * rng() - 1);
        put(i, r * Math.sin(ph) * Math.cos(th) * 1.6, r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph) * 0.8);
      }
      break;
    }
    case "sphere": {
      for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2;
        const rad = Math.sqrt(1 - y * y);
        const th = GOLDEN * i;
        const r = 0.5 + gaussian(rng) * 0.006;
        put(i, Math.cos(th) * rad * r, y * r, Math.sin(th) * rad * r);
      }
      break;
    }
    case "globe": {
      // Meridians and parallels: a wireframe planet that reads at a glance.
      const meridians = 18;
      const parallels = 9;
      for (let i = 0; i < count; i++) {
        const onMeridian = rng() < 0.55;
        let th: number, ph: number;
        if (onMeridian) {
          th = (Math.floor(rng() * meridians) / meridians) * Math.PI * 2;
          ph = rng() * Math.PI;
        } else {
          th = rng() * Math.PI * 2;
          ph = ((Math.floor(rng() * parallels) + 0.5) / parallels) * Math.PI;
        }
        const r = 0.5 + gaussian(rng) * 0.003;
        put(i, r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th));
      }
      break;
    }
    case "torus": {
      // Tipped toward the camera so it reads as a ring, not an edge-on pill.
      const R = 0.34;
      const r = 0.13;
      const tilt = 1.1;
      for (let i = 0; i < count; i++) {
        const u = rng() * Math.PI * 2;
        const v = rng() * Math.PI * 2;
        const rr = r * (0.96 + rng() * 0.04);
        const x = (R + rr * Math.cos(v)) * Math.cos(u);
        const y = rr * Math.sin(v);
        const z = (R + rr * Math.cos(v)) * Math.sin(u);
        put(i, x, y * Math.cos(tilt) - z * Math.sin(tilt), y * Math.sin(tilt) + z * Math.cos(tilt));
      }
      break;
    }
    case "helix": {
      // A double helix with rungs — reads as DNA, or as two things in step.
      const turns = 2.4;
      const radius = 0.2;
      for (let i = 0; i < count; i++) {
        const t = rng();
        const y = (t - 0.5) * 1.0;
        const a = t * turns * Math.PI * 2;
        if (rng() < 0.22) {
          const k = rng();
          put(i, Math.cos(a) * radius * (2 * k - 1), y, Math.sin(a) * radius * (2 * k - 1));
        } else {
          const strand = rng() < 0.5 ? 0 : Math.PI;
          const j = gaussian(rng) * 0.012;
          put(i, Math.cos(a + strand) * (radius + j), y + j, Math.sin(a + strand) * (radius + j));
        }
      }
      break;
    }
    case "galaxy": {
      const arms = 3;
      const tilt = 1.05;
      for (let i = 0; i < count; i++) {
        const r = Math.pow(rng(), 1.6) * 0.5;
        const arm = Math.floor(rng() * arms);
        const a = (arm / arms) * Math.PI * 2 + r * 9 + gaussian(rng) * 0.22 * (1 - r);
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        const y = gaussian(rng) * 0.02 * (1 - r * 1.4);
        put(i, x, y * Math.cos(tilt) - z * Math.sin(tilt), y * Math.sin(tilt) + z * Math.cos(tilt));
      }
      break;
    }
    case "wave": {
      // A particle sea seen from just above the surface.
      const side = Math.ceil(Math.sqrt(count));
      for (let i = 0; i < count; i++) {
        const gx = (i % side) / side - 0.5;
        const gz = Math.floor(i / side) / side - 0.5;
        const x = gx * 1.4 + (rng() - 0.5) * 0.004;
        const z = gz * 1.1;
        const y = -0.18 + Math.sin(x * 9) * 0.03 + Math.cos(z * 11 + x * 3) * 0.025;
        put(i, x, y, z);
      }
      break;
    }
    case "cube": {
      const h = 0.3;
      const tiltX = 0.5;
      const tiltY = 0.62;
      for (let i = 0; i < count; i++) {
        const face = Math.floor(rng() * 6);
        const u = (rng() * 2 - 1) * h;
        const v = (rng() * 2 - 1) * h;
        const s = face % 2 === 0 ? h : -h;
        let x = 0, y = 0, z = 0;
        if (face < 2) [x, y, z] = [s, u, v];
        else if (face < 4) [x, y, z] = [u, s, v];
        else [x, y, z] = [u, v, s];
        // Edges brighter: pull a share of points onto the cube's frame.
        if (rng() < 0.35) {
          if (Math.abs(u) > Math.abs(v)) {
            const e = u > 0 ? h : -h;
            if (face < 2) y = e; else if (face < 4) x = e; else x = e;
          } else {
            const e = v > 0 ? h : -h;
            if (face < 2) z = e; else if (face < 4) z = e; else y = e;
          }
        }
        const y1 = y * Math.cos(tiltX) - z * Math.sin(tiltX);
        const z1 = y * Math.sin(tiltX) + z * Math.cos(tiltX);
        put(i, x * Math.cos(tiltY) + z1 * Math.sin(tiltY), y1, -x * Math.sin(tiltY) + z1 * Math.cos(tiltY));
      }
      break;
    }
    case "snowflake": {
      // Six-fold, with side branches — every arm the same crystal.
      const segs: [number, number, number, number][] = [];
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 + Math.PI / 2;
        const dx = Math.cos(a);
        const dy = Math.sin(a);
        segs.push([0, 0, dx * 0.5, dy * 0.5]);
        for (const [at, len] of [[0.22, 0.12], [0.34, 0.09], [0.43, 0.05]] as const) {
          for (const side of [-1, 1]) {
            const b = a + side * (Math.PI / 3);
            segs.push([dx * at, dy * at, dx * at + Math.cos(b) * len, dy * at + Math.sin(b) * len]);
          }
        }
      }
      const lengths = segs.map(([x0, y0, x1, y1]) => Math.hypot(x1 - x0, y1 - y0));
      const total = lengths.reduce((s, l) => s + l, 0);
      for (let i = 0; i < count; i++) {
        let pick = rng() * total;
        let k = 0;
        while (pick > lengths[k] && k < segs.length - 1) pick -= lengths[k++];
        const [x0, y0, x1, y1] = segs[k];
        const t = rng();
        const w = gaussian(rng) * 0.006;
        put(i, x0 + (x1 - x0) * t + w, y0 + (y1 - y0) * t + gaussian(rng) * 0.006, gaussian(rng) * 0.01);
      }
      break;
    }
    case "ring": {
      for (let i = 0; i < count; i++) {
        const a = rng() * Math.PI * 2;
        const r = 0.45 + gaussian(rng) * 0.012;
        put(i, Math.cos(a) * r, Math.sin(a) * r, gaussian(rng) * 0.02);
      }
      break;
    }
  }
  return out;
}

/* ─── Raster sampling (text, images) ─────────────────────────────────────── */

/** Turn a white-on-transparent canvas into `count` points, cropped tight and unit-wide. */
function sampleCanvas(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  count: number,
  rng: () => number,
  keep: (r: number, g: number, b: number, a: number) => boolean,
): { points: Float32Array; aspect: number } {
  const data = ctx.getImageData(0, 0, w, h).data;
  const step = 2;
  const candidates: number[] = [];
  let minX = w, maxX = 0, minY = h, maxY = 0;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const o = (y * w + x) * 4;
      if (keep(data[o], data[o + 1], data[o + 2], data[o + 3])) {
        candidates.push(x, y);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const points = new Float32Array(count * 3);
  const n = candidates.length / 2;
  if (n === 0) return { points, aspect: 0.3 };

  const bw = Math.max(maxX - minX + step, 1);
  const bh = Math.max(maxY - minY + step, 1);
  for (let i = 0; i < count; i++) {
    const j = Math.floor(rng() * n);
    const x = candidates[j * 2] + rng() * step;
    const y = candidates[j * 2 + 1] + rng() * step;
    points[i * 3] = (x - minX) / bw - 0.5;
    points[i * 3 + 1] = -((y - minY) / bw - (bh / bw) * 0.5);
    points[i * 3 + 2] = gaussian(rng) * 0.008;
  }
  return { points, aspect: bh / bw };
}

/** A canvas can't read CSS variables in `ctx.font`, so resolve `var(--x)` first. */
function resolveFontFamily(font: string | undefined): string {
  const body = getComputedStyle(document.body);
  if (!font) return body.fontFamily;
  return font.replace(/var\((--[^),\s]+)\)/g, (_, name: string) => body.getPropertyValue(name).trim() || "sans-serif");
}

async function sampleText(
  target: Extract<MorphTarget, { text: string }>,
  count: number,
  rng: () => number,
) {
  const size = 180;
  const family = resolveFontFamily(target.font);
  const font = `${target.weight ?? 700} ${size}px ${family}`;
  try {
    await document.fonts.load(font, target.text);
  } catch {
    /* fall back to whatever is loaded */
  }

  const lines = target.text.split("\n");
  const lh = size * (target.lineHeight ?? 1.08);
  const probe = document.createElement("canvas").getContext("2d")!;
  probe.font = font;
  const width = Math.ceil(Math.max(...lines.map((l) => probe.measureText(l).width)) + size * 0.4);
  const height = Math.ceil(lh * lines.length + size * 0.4);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.font = font;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = target.rtl ? "rtl" : "ltr";
  lines.forEach((line, i) => ctx.fillText(line, width / 2, size * 0.2 + lh * (i + 0.5)));
  return sampleCanvas(ctx, width, height, count, rng, (_r, _g, _b, a) => a > 110);
}

async function sampleImage(
  target: Extract<MorphTarget, { image: string }>,
  count: number,
  rng: () => number,
) {
  const img = new Image();
  img.decoding = "async";
  img.src = target.image;
  await img.decode();
  const max = 640;
  const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * k));
  const h = Math.max(1, Math.round(img.naturalHeight * k));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const threshold = target.threshold ?? (target.luminance ? 140 : 110);
  return sampleCanvas(ctx, w, h, count, rng, (r, g, b, a) =>
    target.luminance ? a > 20 && 0.299 * r + 0.587 * g + 0.114 * b > threshold : a > threshold,
  );
}

/** Sample every target. Seeded, so a deck looks the same on every load. */
export async function sampleTargets(targets: MorphTarget[], count: number, seed = 7): Promise<SampledTarget[]> {
  return Promise.all(
    targets.map(async (target, k) => {
      const rng = seeded(seed + k * 101);
      const placement = { scale: target.scale ?? 1, offset: target.offset ?? ([0, 0] as [number, number]) };
      if ("shape" in target) {
        const spin = target.spin ?? (target.shape === "scatter" || target.shape === "wave" ? 0 : 0.22);
        return {
          points: shapePoints(target.shape, count, rng),
          aspect: 1,
          fit: "shape" as const,
          spin,
          ...placement,
        };
      }
      const sampled = "text" in target ? await sampleText(target, count, rng) : await sampleImage(target, count, rng);
      return { ...sampled, fit: "width" as const, spin: target.spin ?? 0, ...placement };
    }),
  );
}

/**
 * World-space scale for a target in a view `viewW` × `viewH` world units wide
 * and tall at the focal plane.
 */
export function fitScale(t: SampledTarget, viewW: number, viewH: number): number {
  const base =
    t.fit === "width"
      ? Math.min(viewW * 0.74, (viewH * 0.6) / Math.max(t.aspect, 0.05))
      : Math.min(viewW, viewH) * 0.7;
  return base * t.scale;
}
