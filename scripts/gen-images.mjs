// scripts/gen-images.mjs
// Generates presentation images via OpenAI gpt-image-2.
// Run: npm run gen-images   (or: node scripts/gen-images.mjs)
// Requires OPENAI_API_KEY in .env.local
//
// Skips any slug whose PNG already exists in public/generated/, so re-running
// only generates net-new images. To regenerate one, delete its PNG first.

import OpenAI from "openai";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const env = readFileSync(resolve(root, ".env.local"), "utf-8");
const apiKey = env.match(/^OPENAI_API_KEY=(.+)$/m)?.[1]?.trim();
if (!apiKey) throw new Error("OPENAI_API_KEY not found in .env.local");

const openai = new OpenAI({ apiKey });

const outDir = resolve(root, "public/generated");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

// Universal rules appended to every prompt. Keep images text-free so they
// stay translatable (decks ship in multiple languages — baked-in text breaks i18n).
const BASE_RULES = `Absolutely NO text, labels, numbers, letters, or annotations anywhere in the image. Pure visual metaphor — shapes, anatomy, flow, colour. Dark background compatible (deep navy or near-black). Editorial / cinematic aesthetic — not poster-y, not illustrated-clipart.`;

async function generate(slug, prompt, opts = {}) {
  const outPath = resolve(outDir, `${slug}.png`);
  if (existsSync(outPath)) {
    console.log(`⏭  Skip (exists): ${slug}`);
    return;
  }
  console.log(`\n⏳ Generating: ${slug}`);
  const result = await openai.images.generate({
    model: "gpt-image-2",
    prompt: `${prompt}\n\n${BASE_RULES}`,
    size: opts.size ?? "1536x1024",
    quality: opts.quality ?? "medium",
    n: 1,
  });

  const b64 = result.data?.[0]?.b64_json;
  if (!b64) throw new Error(`No image returned for: ${slug}`);
  writeFileSync(outPath, Buffer.from(b64, "base64"));
  console.log(`✅ Saved: public/generated/${slug}.png`);
}

// ─── Image prompts ─────────────────────────────────────────────────────────
// Add one entry per generated image. The slug becomes the filename:
//   <img src="/generated/<slug>.png" />
// Sizes: "1024x1024" (square), "1536x1024" (landscape, default), "1024x1536" (portrait)
// Quality: "low" (~$0.006), "medium" (~$0.053, default), "high" (~$0.211)

const images = [
  // Example — replace with your own:
  // {
  //   slug: "deck-hero",
  //   prompt: `A cinematic editorial illustration of [concept]. Glowing cyan currents flow through a dark navy field, with warm amber accents at the focal point. Anatomical / scientific aesthetic — not illustrated-clipart.`,
  // },
];

for (const img of images) {
  try {
    await generate(img.slug, img.prompt, { size: img.size, quality: img.quality });
  } catch (err) {
    console.error(`❌ Failed: ${img.slug}\n  ${err.message}`);
  }
}

console.log("\n✨ Done.");
