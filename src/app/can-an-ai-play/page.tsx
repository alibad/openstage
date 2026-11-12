import CanAnAiPlay from "@/content/can-an-ai-play";
import { buildPresentationMetadata } from "@/lib/og-metadata";

export const metadata = buildPresentationMetadata({
  slug: "can-an-ai-play",
  title: "Can an AI Play Our Game?",
  subtitle: "What building a game with coding agents taught us, and who really won",
  description:
    "The AI Tinkerers Doha Round 5 talk: a real-time strategy game built with coding agents. What they reported against what was true, the rulers that told us, and what happened when three AI models and a page of rules played the game.",
  author: "Ali Badereddin",
  type: "scroll",
  customer: "Human Quest",
});

export default function Page() {
  return <CanAnAiPlay />;
}
