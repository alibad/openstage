import { SlideDeck } from "@/components/slide-deck";
import { proofBeforePromise } from "@/content/proof-before-promise";
import { buildPresentationMetadata } from "@/lib/og-metadata";

export const metadata = buildPresentationMetadata({
  slug: "proof-before-promise",
  title: "Proof Before Promise",
  subtitle: "How credible product walkthroughs are made",
  description:
    "A slide-mode demonstration built with OpenStage's presentation skills, showing the evidence chain behind trustworthy product walkthroughs.",
  author: "Human Quest",
  type: "slides",
});

export default function Page() {
  return <SlideDeck presentation={proofBeforePromise} />;
}
