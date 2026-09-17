import path from "path";
import { randomUUID } from "crypto";

export const maxDuration = 300;

const renders = new Map<
  string,
  { buffer: Buffer; contentType: string; createdAt: number }
>();

let bundlePromise: Promise<string> | null = null;

function getBundleUrl() {
  if (!bundlePromise) {
    bundlePromise = (async () => {
      const { bundle } = await import("@remotion/bundler");
      return bundle({
        entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
      });
    })().catch((err) => {
      bundlePromise = null;
      throw err;
    });
  }
  return bundlePromise;
}

function cleanExpiredRenders() {
  const now = Date.now();
  for (const [id, render] of renders) {
    if (now - render.createdAt > 5 * 60 * 1000) {
      renders.delete(id);
    }
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    slides,
    audioSegments,
    slideDurations,
    durationPerSlide,
    transitionDuration,
    slug,
  } = body as {
    slides: string[];
    audioSegments?: (string | null)[];
    slideDurations?: number[];
    durationPerSlide: number;
    transitionDuration: number;
    slug?: string;
  };

  if (!slides || slides.length === 0) {
    return Response.json({ error: "No slides provided" }, { status: 400 });
  }

  const jobId = randomUUID();
  cleanExpiredRenders();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: Record<string, unknown>) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          // controller already closed
        }
      };

      try {
        send("progress", {
          stage: "bundling",
          message: "Preparing render environment...",
          progress: 0,
        });

        const serveUrl = await getBundleUrl();

        send("progress", {
          stage: "composing",
          message: "Setting up composition...",
          progress: 0,
        });

        const { selectComposition, renderMedia } = await import(
          "@remotion/renderer"
        );

        const inputProps = {
          slides,
          audioSegments,
          slideDurations,
          durationPerSlide,
          transitionDuration,
        };

        const composition = await selectComposition({
          serveUrl,
          id: "SlideVideo",
          inputProps,
        });

        send("progress", {
          stage: "rendering",
          message: "Rendering video: 0%",
          progress: 0,
        });

        let lastPercent = 0;

        const { buffer, contentType } = await renderMedia({
          composition,
          serveUrl,
          codec: "h264",
          inputProps,
          jpegQuality: 90,
          onProgress: ({ progress }: { progress: number }) => {
            const percent = Math.round(progress * 100);
            if (percent > lastPercent) {
              lastPercent = percent;
              send("progress", {
                stage: "rendering",
                message: `Rendering video: ${percent}%`,
                progress,
              });
            }
          },
        });

        if (buffer) {
          renders.set(jobId, {
            buffer: Buffer.from(buffer),
            contentType: contentType || "video/mp4",
            createdAt: Date.now(),
          });
          send("done", { jobId, slug: slug || "presentation" });
        } else {
          send("error", { message: "Render produced no output" });
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Render failed unexpectedly";
        send("error", { message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const jobId = url.searchParams.get("id");

  if (!jobId) {
    return Response.json({ error: "Missing job ID" }, { status: 400 });
  }

  const render = renders.get(jobId);
  if (!render) {
    return Response.json(
      { error: "Render not found or expired (5 min TTL)" },
      { status: 404 },
    );
  }

  renders.delete(jobId);

  const filename = url.searchParams.get("slug") || "presentation";

  return new Response(new Uint8Array(render.buffer), {
    headers: {
      "Content-Type": render.contentType,
      "Content-Disposition": `attachment; filename="${filename}.mp4"`,
      "Content-Length": render.buffer.length.toString(),
    },
  });
}
