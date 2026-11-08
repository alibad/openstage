import CanAnAiPlay from "@/content/can-an-ai-play";
import { buildPresentationMetadata } from "@/lib/og-metadata";

export const metadata = buildPresentationMetadata({
  slug: "can-an-ai-play",
  title: "Can an AI Play Our Game?",
  subtitle: "Four brains, the same 16 games, and who really won",
  description:
    "The AI Tinkerers Doha Round 5 talk: three AI models and a page of rules play the same real-time strategy games. Why the rules won, how they got good one switch at a time, where models do help, and who wrote the rules.",
  author: "Ali Badereddin",
  type: "scroll",
  customer: "Human Quest",
});

export default function Page() {
  return <CanAnAiPlay />;
}
