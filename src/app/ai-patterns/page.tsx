import AiPatterns from "@/content/ai-patterns";
import { buildPresentationMetadata } from "@/lib/og-metadata";

export const metadata = buildPresentationMetadata({
  slug: "ai-patterns",
  title: "AI Patterns — Running, Not Described",
  subtitle: "Four patterns, three of them live inside the page.",
  description:
    "The AI Tinkerers Doha Round 3 talk. Four things rebuilt in every app until they turned out to be patterns — Feedback, Openstage, Walkthrough, MCP — with three of the four running inside the presentation itself. Workflow · Skill · Domain · Rinse · Repeat.",
  author: "Ali Badereddin",
  type: "scroll",
  customer: "Human Quest",
});

export default function Page() {
  return <AiPatterns />;
}
