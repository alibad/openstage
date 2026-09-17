import ShowcaseGames from "@/content/showcase-games";
import { buildPresentationMetadata } from "@/lib/og-metadata";

export const metadata = buildPresentationMetadata({
  slug: "showcase-games",
  title: "Interactive Game Templates",
  subtitle: "Phaser.io-powered gamification for presentations",
  description:
    "Quiz, Drag & Sort, and Memory Match game templates built with Phaser 3. Drop interactive games into any presentation with a single component.",
  author: "Presenter",
  type: "scroll",
});

export default function Page() {
  return <ShowcaseGames />;
}
