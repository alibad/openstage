import ThePowerOfReplit from "@/content/the-power-of-replit";
import { buildPresentationMetadata } from "@/lib/og-metadata";

export const metadata = buildPresentationMetadata({
  slug: "the-power-of-replit",
  title: "The Power of Replit",
  subtitle: "A sentence in. A live app out.",
  description:
    "A field guide to Replit in November 2026: what one browser tab now replaces, ten builds with paste-ready prompts, the ten closest rivals on one map, and Replit against Claude job by job.",
  author: "Ali Badereddin",
  type: "scroll",
  customer: "Human Quest",
});

export default function Page() {
  return <ThePowerOfReplit />;
}
