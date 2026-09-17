import { SlideDeck } from "@/components/slide-deck";
import { sampleSlides } from "@/content/sample-slides";
import { buildPresentationMetadata } from "@/lib/og-metadata";

export const metadata = buildPresentationMetadata({
  slug: "sample-slides",
  title: "Slide Mode Sample",
  subtitle: "Primitives, navigation, and PPTX export",
  description:
    "A tour of slide-mode presentations: every primitive, keyboard shortcuts, speaker notes, and one-click PPTX export.",
  author: "Presenter",
  type: "slides",
});

export default function Page() {
  return <SlideDeck presentation={sampleSlides} />;
}
