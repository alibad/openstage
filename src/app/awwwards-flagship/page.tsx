import AwwwardsFlagship from "@/content/awwwards-flagship";
import { buildPresentationMetadata } from "@/lib/og-metadata";

export const metadata = buildPresentationMetadata({
  slug: "awwwards-flagship",
  title: "The Grammar of Attention",
  subtitle: "A flagship deck about craft, told with every primitive.",
  description:
    "An Awwwards-tier showcase of the presentations framework — IntroSequence, WebGL hero, editorial grid, scroll-drawn curves, pinned horizontal forces, scroll-linked 3D, marquee typography, flip counters, and a custom cursor — sequenced as a single continuous argument about presentation craft.",
  author: "Presenter",
  type: "scroll",
  customer: "Template",
});

export default function Page() {
  return <AwwwardsFlagship />;
}
