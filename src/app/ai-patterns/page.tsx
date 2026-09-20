import AiPatterns from "@/content/ai-patterns";
import { buildPresentationMetadata } from "@/lib/og-metadata";

export const metadata = buildPresentationMetadata({
  slug: "ai-patterns",
  title: "AI Patterns — Running, Not Described",
  subtitle: "Three live dives: capture, proof, controlled action.",
  description:
    "The AI Tinkerers Doha Round 3 talk: Feedback with Openstage, Walkthroughs, and Console with MCP — running systems and inspectable evidence.",
  author: "Ali Badereddin",
  type: "scroll",
  customer: "Human Quest",
});

export default function Page() {
  return <AiPatterns />;
}
