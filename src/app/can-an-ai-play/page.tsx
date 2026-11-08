import { SlideDeck } from "@/components/slide-deck";
import { PresentationTimer } from "@/components/presentation-timer";
import { canAnAiPlay } from "@/content/can-an-ai-play";
import { buildPresentationMetadata } from "@/lib/og-metadata";

export const metadata = buildPresentationMetadata({
  slug: "can-an-ai-play",
  title: "Can an AI Play Our Game?",
  subtitle: "Four brains, the same 16 games, and who really won",
  description:
    "The AI Tinkerers Doha Round 5 talk: three AI models and a page of rules play the same real-time strategy games. Why the rules won, how they got good one switch at a time, where models do help, and who wrote the rules.",
  author: "Ali Badereddin",
  type: "slides",
});

// The talk has a 15-minute slot (AI Tinkerers Doha, Round 5); the timer pill counts against it. The timer is fixed to
// the bottom-left corner, where the slide controls sit; the transformed layer moves it to the top-left corner, above
// the slide area, so it never covers a slide or a control. (It sits outside the deck, so it hides when the deck's own
// fullscreen (F) is on; the browser's fullscreen (F11) keeps it.)
export default function Page() {
  return (
    <>
      <SlideDeck presentation={canAnAiPlay} />
      <div className="pointer-events-none fixed inset-0 z-[90] [&_*]:pointer-events-auto" style={{ transform: "translate(-48px, calc(-100vh + 76px))" }}>
        <PresentationTimer targetMinutes={15} />
      </div>
    </>
  );
}
