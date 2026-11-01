import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export function buildPresentationMetadata(p: {
  title: string;
  subtitle?: string;
  description: string;
  author?: string;
  type?: "scroll" | "slides";
  customer?: string;
  slug: string;
}): Metadata {
  const ogParams = new URLSearchParams({
    title: p.title,
    ...(p.subtitle && { subtitle: p.subtitle }),
    ...(p.type && { type: p.type }),
    ...(p.author && { author: p.author }),
    ...(p.customer && { customer: p.customer }),
  });

  const ogImageUrl = `/api/og?${ogParams.toString()}`;

  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: `${SITE_URL}/${p.slug}` },
    openGraph: {
      url: `${SITE_URL}/${p.slug}`,
      title: p.title,
      description: p.description,
      type: "article",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: p.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: p.title,
      description: p.description,
      images: [ogImageUrl],
    },
  };
}
