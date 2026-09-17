import { notFound } from "next/navigation";
import { list } from "@vercel/blob";

interface ShareMeta {
  shareId: string;
  slug: string;
  title: string;
  createdAt: string;
  expiresAt: string;
  blobUrl: string;
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let meta: ShareMeta | null = null;

  try {
    const { blobs } = await list({ prefix: `shares/${id}.json`, limit: 1 });
    if (blobs.length > 0) {
      const res = await fetch(blobs[0].url, { next: { revalidate: 0 } });
      if (res.ok) {
        meta = await res.json();
      }
    }
  } catch {
    // Fall through to notFound
  }

  if (!meta) {
    notFound();
  }

  if (new Date(meta.expiresAt) < new Date()) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Share Expired
          </h1>
          <p className="text-muted">
            This preview link expired on{" "}
            {new Date(meta.expiresAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            .
          </p>
        </div>
      </div>
    );
  }

  const htmlBlobUrl = meta.blobUrl.replace(
    `${id}.json`,
    `${id}.html`,
  );

  return (
    <iframe
      src={htmlBlobUrl}
      className="w-full h-screen border-0"
      title={meta.title}
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
