import Stagecraft from "@/content/stagecraft";
import { buildPresentationMetadata } from "@/lib/og-metadata";

export const metadata = buildPresentationMetadata({
  slug: "stagecraft",
  title: "Stagecraft — The Deck Is the Stage",
  subtitle: "One canvas · particle morphs · signal · any script · graceful everywhere",
  description:
    "The Openstage Phase 4 showcase: one shared WebGL stage behind the deck, GPU particle morphs between text and shapes in any script, a procedural neural field, and fallbacks for print, reduced motion and weak GPUs.",
  author: "Ali Badereddin",
  type: "scroll",
  customer: "Human Quest",
});

export default function Page() {
  return <Stagecraft />;
}
