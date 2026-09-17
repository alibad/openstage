import SampleScroll from "@/content/sample-scroll";
import { buildPresentationMetadata } from "@/lib/og-metadata";

export const metadata = buildPresentationMetadata({
  slug: "sample-scroll",
  title: "Visual Effects Sample",
  subtitle: "35+ components for stunning presentations",
  description:
    "A living demo of shader gradients, particle fields, 3D globes, animated charts, flow diagrams, score matrices, data tables, and more.",
  author: "Presenter",
  type: "scroll",
});

export default function Page() {
  return <SampleScroll />;
}
