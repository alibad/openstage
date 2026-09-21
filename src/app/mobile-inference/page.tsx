import { SlideDeck } from "@/components/slide-deck";
import { mobileInference } from "@/content/mobile-inference";
import { buildPresentationMetadata } from "@/lib/og-metadata";

export const metadata = buildPresentationMetadata({
  slug: "mobile-inference",
  title: "The Model in Your Pocket",
  subtitle: "How to deploy AI inference on the mobile GPU",
  description:
    "A practical field guide to exporting, compressing, accelerating, profiling, and shipping AI models on iOS and Android.",
  author: "Ali Badereddin",
  type: "slides",
});

export default function Page() {
  return <SlideDeck presentation={mobileInference} />;
}
