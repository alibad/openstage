import { NextRequest, NextResponse } from "next/server";
import { put, list, del } from "@vercel/blob";
import { randomUUID } from "crypto";

export const maxDuration = 30;

/**
 * POST /api/share
 *
 * Creates a shareable snapshot of a presentation. Stores HTML content
 * in Vercel Blob with a 7-day TTL. Returns a share URL.
 *
 * Body:
 * {
 *   slug: string,
 *   html: string,           // self-contained HTML content
 *   title?: string,
 *   expiresInDays?: number, // default 7
 * }
 *
 * Returns:
 * { shareId, shareUrl, expiresAt }
 */
export async function POST(req: NextRequest) {
  try {
    const { slug, html, title, expiresInDays = 7 } = await req.json();

    if (!slug || !html) {
      return NextResponse.json(
        { error: "slug and html are required" },
        { status: 400 },
      );
    }

    const shareId = `${slug}-${randomUUID().slice(0, 8)}`;
    const expiresAt = new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
    );

    const wrappedHtml = wrapSnapshot(html, title || slug, shareId, expiresAt);

    const blob = await put(`shares/${shareId}.html`, wrappedHtml, {
      access: "public",
      contentType: "text/html",
      addRandomSuffix: false,
    });

    // Store metadata for listing
    const meta = {
      shareId,
      slug,
      title: title || slug,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      blobUrl: blob.url,
    };

    await put(`shares/${shareId}.json`, JSON.stringify(meta), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    });

    const origin = req.nextUrl.origin;
    const shareUrl = `${origin}/share/${shareId}`;

    return NextResponse.json({
      shareId,
      shareUrl,
      blobUrl: blob.url,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Share API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create share" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/share?id=xxx
 *
 * Returns share metadata.
 */
export async function GET(req: NextRequest) {
  const shareId = req.nextUrl.searchParams.get("id");

  if (!shareId) {
    // List recent shares
    try {
      const { blobs } = await list({ prefix: "shares/", limit: 50 });
      const metaBlobs = blobs.filter((b) => b.pathname.endsWith(".json"));

      const shares = await Promise.all(
        metaBlobs.map(async (b) => {
          try {
            const res = await fetch(b.url);
            return await res.json();
          } catch {
            return null;
          }
        }),
      );

      return NextResponse.json({
        shares: shares
          .filter(Boolean)
          .filter((s) => new Date(s.expiresAt) > new Date()),
      });
    } catch {
      return NextResponse.json({ shares: [] });
    }
  }

  try {
    const metaRes = await fetch(
      `https://${process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "public"}.vercel-storage.com/shares/${shareId}.json`,
    );

    if (!metaRes.ok) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 });
    }

    const meta = await metaRes.json();

    if (new Date(meta.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Share has expired" }, { status: 410 });
    }

    return NextResponse.json(meta);
  } catch {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }
}

/**
 * DELETE /api/share?id=xxx
 *
 * Deletes a share.
 */
export async function DELETE(req: NextRequest) {
  const shareId = req.nextUrl.searchParams.get("id");

  if (!shareId) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    await del([`shares/${shareId}.html`, `shares/${shareId}.json`]);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Share delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete share" },
      { status: 500 },
    );
  }
}

function wrapSnapshot(
  html: string,
  title: string,
  shareId: string,
  expiresAt: Date,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} — Preview</title>
  <meta name="robots" content="noindex, nofollow" />
  <style>
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #0A0718; color: white; }
    .share-banner {
      position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
      background: linear-gradient(90deg, #22d3ee, #6366f1, #a855f7, #ec4899);
      color: white; text-align: center; padding: 6px 16px;
      font-size: 13px; font-weight: 500;
    }
    .share-banner a { color: white; text-decoration: underline; }
    .share-content { padding-top: 32px; }
  </style>
</head>
<body>
  <div class="share-banner">
    Preview share &mdash; expires ${expiresAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
    &nbsp;&middot;&nbsp; ID: ${escapeHtml(shareId)}
  </div>
  <div class="share-content">
    ${html}
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
