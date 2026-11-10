// The Openstage front door in the Human Quest family look ("The Path", 4 Nov 2026).
// Every picture on this page is a real frame captured from a running Openstage deck
// (public/screens, taken with Playwright from this app). The full deck list stays
// below the landing at /#decks.
import {
  HqFamilyFooter,
  HqHero,
  HqPhone,
  HqQuestbar,
  HqScreen,
  HqStones,
  HqSunset,
} from "@/components/hq-path/hq-path";
import PresentationGallery from "@/components/presentation-gallery";
import { presentations } from "@/content/registry";
import "@/components/hq-path/hq-path.css";
import "./openstage-home.css";

/* The kit's own `@import url(...)` for these fonts is dropped by Next (it is not at the top of the
   bundled stylesheet), so the home loads them itself. React hoists this <link> into <head>, home only. */
const HQ_FONTS =
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..800;1,9..144,300..600&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";

const REPO = "https://github.com/alibad/openstage";
const HOW_TO = `${REPO}/blob/main/docs/creating-presentations.md`;
const FLAGSHIP = "/awwwards-flagship";

/** Four real decks, each with a frame captured from the deck itself. */
const FEATURED: { slug: string; shot: string; alt: string }[] = [
  { slug: "ai-patterns", shot: "/screens/deck-ai-patterns.webp", alt: "The AI Patterns deck: 'Catch the signal before the context disappears'" },
  { slug: "stagecraft", shot: "/screens/deck-stagecraft.webp", alt: "Stagecraft: a galaxy of forty thousand particles drawn live in the deck" },
  { slug: "mobile-inference", shot: "/screens/deck-model-in-your-pocket.webp", alt: "The Model in Your Pocket: the first slide of a 13-slide deck" },
  { slug: "showcase-games", shot: "/screens/deck-game-templates.webp", alt: "Interactive Game Templates: fourteen playable mini-games for live decks" },
];

const STEPS = [
  { title: "Write it in React", text: "A deck is ordinary TypeScript and React, built from Openstage layouts, motion and charts." },
  { title: "Pick scroll or slides", text: "A scroll story for the long read, or slides with keyboard control and speaker notes." },
  { title: "Present it anywhere", text: "Share the link, narrate it, print it to PDF, export PPTX or render a video." },
];

export default function OpenstageLanding() {
  const featured = FEATURED.map((f) => ({ ...f, meta: presentations.find((p) => p.slug === f.slug) })).filter(
    (f): f is typeof f & { meta: NonNullable<typeof f.meta> } => Boolean(f.meta),
  );

  return (
    <div className="hqp-page os-home" data-hqp-t="pattern">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={HQ_FONTS} precedence="default" />
      <HqQuestbar
        product="Openstage"
        logo="/icon-192.png"
        territory="pattern"
        links={[
          { label: "Decks", href: "#decks" },
          { label: "How it works", href: "#how" },
          { label: "Source", href: REPO },
        ]}
        cta={{ label: "Watch a deck", href: FLAGSHIP }}
      />

      <main>
        <HqHero
          territory="pattern"
          eyebrow="Openstage · presentations as web apps"
          title={
            <>
              Every talk needs a <em>stage.</em>
            </>
          }
          lede="Openstage builds presentations as web apps, not slide files: scroll stories and slide decks in React, with live demos, narration and PPTX export."
          actions={
            <>
              <a className="hqp-btn hqp-btn-solid" href="#decks">
                See the decks
              </a>
              <a className="hqp-btn hqp-btn-ghost" href={REPO}>
                Read the source
              </a>
            </>
          }
          art={
            <div className="os-hero-art">
              <a className="os-hero-screen" href={FLAGSHIP} aria-label="Open The Grammar of Attention, a scroll deck">
                <HqScreen src="/screens/deck-grammar-of-attention.webp" alt="The Grammar of Attention, a scroll deck: 'A deck about decks.'" />
              </a>
              <a className="os-hero-phone" href="/proof-before-promise" aria-label="Open Proof Before Promise, a slide deck">
                <HqPhone src="/screens/phone-proof-before-promise.webp" alt="Proof Before Promise, a slide deck, on a phone" />
              </a>
              <p className="os-hero-tag" aria-hidden="true">
                <span>Scroll</span> on the screen · <span>Slides</span> on the phone
              </p>
            </div>
          }
        >
          <p className="os-meta">Source on GitHub · React · Next.js</p>
        </HqHero>

        <section id="how" className="hqp-section">
          <div className="hqp-inner">
            <div className="hqp-head">
              <div>
                <p className="hqp-eyebrow">How it works</p>
                <h2 className="hqp-display">
                  A deck that <em>runs.</em>
                </h2>
              </div>
              <p className="hqp-lede">
                Most decks are dead files that go stale the day the product changes. An Openstage deck is a web page, so it can show the real thing.
              </p>
            </div>
            <HqStones steps={STEPS} />
          </div>
        </section>

        <section className="hqp-section hqp-nightband os-stage" aria-labelledby="os-stage-title">
          <div className="hqp-inner">
            <div className="hqp-head">
              <div>
                <p className="hqp-eyebrow">Live decks</p>
                <h2 id="os-stage-title" className="hqp-display">
                  On stage <em>now.</em>
                </h2>
              </div>
              <p className="hqp-lede">Each card opens the real deck. Scroll it, click it, play it.</p>
            </div>
            <div className="os-deck-cards">
              {featured.map(({ slug, shot, alt, meta }) => (
                <a key={slug} className="hqp-card os-deck-card" href={`/${slug}`}>
                  <div className="hqp-shot">
                    <img src={shot} alt={alt} loading="lazy" />
                  </div>
                  <div className="hqp-body">
                    <p className="os-kind">
                      {meta.type === "slides" ? `Slides${meta.slideCount ? ` · ${meta.slideCount}` : ""}` : "Scroll story"}
                    </p>
                    <h3>{meta.title.split(" — ")[0]}</h3>
                    {meta.subtitle && <p>{meta.subtitle}</p>}
                  </div>
                </a>
              ))}
            </div>
            <p className="os-swipe" aria-hidden="true">Swipe for more decks →</p>
          </div>
        </section>

        <PresentationGallery />

        <section className="hqp-section hqp-tint os-last">
          <div className="hqp-inner">
            <p className="hqp-eyebrow">Your turn</p>
            <h2 className="hqp-display">
              Your next talk, <em>live.</em>
            </h2>
            <div className="hqp-ctas">
              <a className="hqp-btn hqp-btn-ember" href={FLAGSHIP}>
                Watch a deck
              </a>
              <a className="hqp-btn hqp-btn-ghost" href={HOW_TO}>
                How to make one
              </a>
            </div>
          </div>
        </section>
      </main>

      <HqSunset />
      <HqFamilyFooter
        current="Openstage"
        territory="pattern"
        extra={[
          { label: "Source on GitHub", href: REPO },
          { label: "Explore AI patterns", href: "https://www.humanquest.net/ai-patterns" },
        ]}
      />
    </div>
  );
}
