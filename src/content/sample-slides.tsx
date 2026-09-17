"use client";

import { Presentation } from "@/lib/types";
import {
  SectionTag,
  SlideHeading,
  SlideSubtitle,
  Bullet,
  BulletList,
  StatCard,
  StatGrid,
  ComparisonGrid,
  SlideCallout,
  SlideTimeline,
  NumberedSteps,
  CodePreview,
} from "@/components/slide-primitives";
import {
  Presentation as PresentationIcon,
  Scroll,
  Monitor,
  Download,
  Keyboard,
  Maximize,
  MessageSquare,
  Grid,
  Layers,
  Palette,
  Sparkles,
  ArrowRight,
  Zap,
  FileDown,
  Eye,
  PenTool,
  BarChart3,
  Code2,
  Rocket,
} from "lucide-react";

/* ─── Slide 1: The Challenge ─── */

function ChallengeSlide() {
  return (
    <div className="flex flex-col h-full gap-8">
      <div>
        <SectionTag label="The Challenge" />
        <SlideHeading>Presentations should be effortless.</SlideHeading>
        <SlideSubtitle>
          Yet every team wastes hours rebuilding the same patterns, fighting
          inconsistency, and losing stories to formatting.
        </SlideSubtitle>
      </div>

      <StatGrid>
        <StatCard
          value="2"
          label="distinct modes for every use case"
          icon={<Layers className="w-5 h-5" />}
          highlight
        />
        <StatCard
          value="18+"
          label="reusable primitives and components"
          icon={<PenTool className="w-5 h-5" />}
        />
        <StatCard
          value="1-click"
          label="PPTX export with speaker notes"
          icon={<FileDown className="w-5 h-5" />}
        />
      </StatGrid>

      <BulletList>
        <Bullet>
          Scroll presentations can&apos;t be emailed. Slide decks can&apos;t tell rich stories. You need both.
        </Bullet>
        <Bullet>
          Every new deck is built from scratch: layouts, animations, brand
          compliance, responsive behavior.
        </Bullet>
        <Bullet>
          Stakeholders want PPTX files. Engineers want interactive web pages.
          The framework serves both.
        </Bullet>
      </BulletList>
    </div>
  );
}

/* ─── Slide 2: Two Modes ─── */

function TwoModesSlide() {
  return (
    <div className="flex flex-col h-full gap-8">
      <div>
        <SectionTag label="Architecture" />
        <SlideHeading>Two modes, one codebase.</SlideHeading>
        <SlideSubtitle>
          Choose the mode that matches how your audience will experience the content.
        </SlideSubtitle>
      </div>

      <ComparisonGrid
        left={{
          label: "Scroll Mode",
          items: [
            "Free-flowing immersive narrative",
            "Parallax, sticky media, scrollytelling",
            "Chapter navigation with dot nav",
            "PDF and print export",
            "Best for client briefings and data stories",
          ],
        }}
        right={{
          label: "Slide Mode",
          positive: true,
          items: [
            "Traditional deck with arrow-key navigation",
            "Fullscreen, speaker notes, slide overview",
            "Reusable slide primitives for consistency",
            "One-click PPTX export with notes",
            "Best for internal pitches and board decks",
          ],
        }}
      />

      <SlideCallout icon={<Sparkles className="w-5 h-5" />}>
        <strong className="text-foreground">You&apos;re looking at slide mode right now.</strong>{" "}
        Arrow keys to navigate, press F for fullscreen, G for overview, N for speaker notes.
      </SlideCallout>
    </div>
  );
}

/* ─── Slide 3: The Journey ─── */

function JourneySlide() {
  return (
    <div className="flex flex-col h-full gap-8">
      <div>
        <SectionTag label="The Journey" />
        <SlideHeading>From idea to production deck.</SlideHeading>
        <SlideSubtitle>
          Every presentation follows the same path: brief, content strategy,
          component composition, and export.
        </SlideSubtitle>
      </div>

      <SlideTimeline
        steps={[
          {
            icon: <MessageSquare className="w-5 h-5" />,
            color: "text-brand-1",
            bg: "bg-brand-1/10",
            border: "border-brand-1/20",
            label: "Brief",
            name: "Input",
            description:
              "A document, a conversation, a GitHub issue. The framework starts from whatever source material you have.",
          },
          {
            icon: <PenTool className="w-5 h-5" />,
            color: "text-brand-2",
            bg: "bg-brand-2/10",
            border: "border-brand-2/20",
            label: "Content Strategy",
            name: "AI Agent",
            description:
              "Narrative posture, emotional arc, section planning. The CLAUDE.md conventions guide every structural decision.",
          },
          {
            icon: <Code2 className="w-5 h-5" />,
            color: "text-brand-3",
            bg: "bg-brand-3/10",
            border: "border-brand-3/20",
            label: "Build",
            name: "Components",
            description:
              "Compose from slide primitives or scrollytelling components. Each one handles print mode, mobile, and accessibility.",
          },
          {
            icon: <Download className="w-5 h-5" />,
            color: "text-brand-4",
            bg: "bg-brand-4/10",
            border: "border-brand-4/20",
            label: "Export",
            name: "Delivery",
            description:
              "Deploy to Vercel for a live URL. Export to PPTX for email. Print to PDF for offline. All from the same source.",
          },
        ]}
      />
    </div>
  );
}

/* ─── Slide 4: Slide Primitives ─── */

function PrimitivesSlide() {
  const primitives = [
    { name: "SectionTag", desc: "Gradient label", color: "text-brand-1" },
    { name: "SlideHeading", desc: "Title (5 words max)", color: "text-brand-1" },
    { name: "StatCard", desc: "Metric cards", color: "text-brand-2" },
    { name: "ComparisonGrid", desc: "Before/after", color: "text-brand-2" },
    { name: "SlideTimeline", desc: "Step timeline", color: "text-brand-3" },
    { name: "NumberedSteps", desc: "Action items", color: "text-brand-3" },
    { name: "SlideCallout", desc: "Insight box", color: "text-brand-4" },
    { name: "CodePreview", desc: "File preview", color: "text-brand-4" },
  ];

  return (
    <div className="flex flex-col h-full gap-8">
      <div>
        <SectionTag label="Primitives" />
        <SlideHeading>10 building blocks, infinite decks.</SlideHeading>
        <SlideSubtitle>
          Every slide is composed from shared primitives. Consistent typography,
          spacing, and brand compliance built in.
        </SlideSubtitle>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {primitives.map((p) => (
          <div
            key={p.name}
            className="p-4 rounded-xl border border-border bg-surface flex flex-col gap-1.5"
          >
            <code className={`text-xs font-bold ${p.color}`}>{p.name}</code>
            <span className="text-xs text-muted">{p.desc}</span>
          </div>
        ))}
      </div>

      <BulletList>
        <Bullet>
          Each primitive accepts className and child overrides for customization
        </Bullet>
        <Bullet>
          Compose freely: a slide is just a flex column with primitives inside
        </Bullet>
        <Bullet>
          Custom layouts are welcome: primitives enforce typography, not structure
        </Bullet>
      </BulletList>
    </div>
  );
}

/* ─── Slide 5: Keyboard and Controls ─── */

function ControlsSlide() {
  const shortcuts = [
    { key: "→ ↓ Space", action: "Next slide" },
    { key: "← ↑", action: "Previous slide" },
    { key: "F", action: "Fullscreen" },
    { key: "G", action: "Slide overview grid" },
    { key: "N", action: "Speaker notes panel" },
    { key: "Home / End", action: "First / last slide" },
  ];

  return (
    <div className="flex flex-col h-full gap-8">
      <div>
        <SectionTag label="Controls" />
        <SlideHeading>Keyboard-native navigation.</SlideHeading>
        <SlideSubtitle>
          Navigate with arrow keys, present with fullscreen, review with
          the overview grid. Click zones on the left and right edges also work.
        </SlideSubtitle>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {shortcuts.map((s) => (
          <div
            key={s.key}
            className="flex items-center gap-4 p-4 rounded-xl border border-border bg-surface"
          >
            <kbd className="px-3 py-1.5 rounded-lg bg-bg-dark border border-border text-xs font-mono text-brand-1 font-bold shrink-0">
              {s.key}
            </kbd>
            <span className="text-sm text-foreground/80">{s.action}</span>
          </div>
        ))}
      </div>

      <SlideCallout icon={<Eye className="w-5 h-5" />}>
        <strong className="text-foreground">Try it now.</strong>{" "}
        Press G to see the slide overview. Press N to toggle speaker notes.
        Press F for fullscreen. All keyboard shortcuts work immediately.
      </SlideCallout>
    </div>
  );
}

/* ─── Slide 6: PPTX Export ─── */

function ExportSlide() {
  return (
    <div className="flex flex-col h-full gap-8">
      <div>
        <SectionTag label="Export" />
        <SlideHeading>One click to PowerPoint.</SlideHeading>
        <SlideSubtitle>
          The download button in the toolbar captures every slide at high
          resolution and assembles a branded PPTX with speaker notes.
        </SlideSubtitle>
      </div>

      <CodePreview filename="pptx-export.ts">
        <div className="text-white/50">
          {"// For each slide in the deck:"}
        </div>
        <div className="text-brand-1/80">
          1. Set slide as active (no animation)
        </div>
        <div className="text-brand-2/80">
          2. Capture via html2canvas at 2x resolution
        </div>
        <div className="text-brand-3/80">
          3. Embed as full-slide image in PPTX
        </div>
        <div className="text-brand-4/80">
          4. Copy speaker notes to PPTX notes field
        </div>
        <div className="text-white/30">─────────────────────────────────</div>
        <div className="text-brand-2/80 font-semibold mt-2">
          ✓ Perfect visual fidelity
        </div>
        <div className="text-brand-2/80 font-semibold">
          ✓ Speaker notes preserved
        </div>
        <div className="text-brand-2/80 font-semibold">
          ✓ Branded footer on every slide
        </div>
      </CodePreview>

      <ComparisonGrid
        left={{
          label: "Web Version",
          items: [
            "Interactive, animated, responsive",
            "Live URL for sharing",
            "Keyboard navigation + fullscreen",
          ],
        }}
        right={{
          label: "PPTX Version",
          positive: true,
          items: [
            "Pixel-perfect screenshot of each slide",
            "Attach to email, open in PowerPoint",
            "Speaker notes in the notes pane",
          ],
        }}
      />
    </div>
  );
}

/* ─── Slide 7: Scrollytelling Components ─── */

function ScrollComponentsSlide() {
  return (
    <div className="flex flex-col h-full gap-8">
      <div>
        <SectionTag label="Scroll Mode" />
        <SlideHeading>8 scrollytelling components.</SlideHeading>
        <SlideSubtitle>
          When you need more than slides, scroll mode offers an entirely
          different storytelling paradigm.
        </SlideSubtitle>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { name: "StickyMedia", desc: "Pinned visual + scrolling narrative steps", color: "border-brand-1/30" },
          { name: "StickyAnnotations", desc: "Pinned image with accumulating labels and markers", color: "border-brand-1/30" },
          { name: "ScrollRevealText", desc: "Word/char/sentence reveal with scrub and highlight", color: "border-brand-2/30" },
          { name: "ScrollVideo", desc: "Frame-by-frame scroll-driven video playback", color: "border-brand-2/30" },
          { name: "FullBleed", desc: "Full-viewport hero with parallax and gradient overlays", color: "border-brand-3/30" },
          { name: "Spectrum", desc: "Horizontal axis positioning diagram (SVG)", color: "border-brand-3/30" },
          { name: "AnnotatedText", desc: "Color-coded text segments with category legend", color: "border-brand-4/30" },
          { name: "InteractionZone", desc: "Click-to-explore panels with toggle/accordion modes", color: "border-brand-4/30" },
        ].map((c) => (
          <div
            key={c.name}
            className={`p-4 rounded-xl border ${c.color} bg-surface`}
          >
            <code className="text-xs font-bold text-foreground">{c.name}</code>
            <p className="text-xs text-muted mt-1">{c.desc}</p>
          </div>
        ))}
      </div>

      <SlideCallout icon={<Scroll className="w-5 h-5" />}>
        <strong className="text-foreground">See them live:</strong>{" "}
        The scroll showcase demo uses every one of these components to explain itself.
      </SlideCallout>
    </div>
  );
}

/* ─── Slide 8: Getting Started ─── */

function GettingStartedSlide() {
  return (
    <div className="flex flex-col h-full gap-8">
      <div>
        <SectionTag label="Get Started" />
        <SlideHeading>Build your first deck today.</SlideHeading>
        <SlideSubtitle>
          Three steps from idea to deployed presentation.
        </SlideSubtitle>
      </div>

      <NumberedSteps
        steps={[
          {
            title: "Choose your mode",
            description:
              "Scroll for immersive narratives (client briefings, data stories). Slides for structured decks (pitches, board meetings, conference talks).",
            tag: "Decide",
          },
          {
            title: "Compose from primitives",
            description:
              "Import slide primitives or scrollytelling components. Each one handles typography, spacing, print mode, and mobile responsiveness.",
            tag: "Build",
          },
          {
            title: "Deploy and export",
            description:
              "Push to Vercel for a live URL. Click the download button for PPTX. Append ?print for PDF. Share the format your audience prefers.",
            tag: "Ship",
          },
        ]}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-surface">
          <BarChart3 className="w-5 h-5 text-brand-3 shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">Scroll Showcase</div>
            <div className="text-xs text-muted mt-0.5">/showcase-scroll</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl border border-brand-2/20 bg-accent-light/30">
          <PresentationIcon className="w-5 h-5 text-brand-2 shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">Slide Showcase</div>
            <div className="text-xs text-muted mt-0.5">/showcase-slides (this deck)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Slide 9: Closing ─── */

function ClosingSlide() {
  return (
    <div className="flex flex-col h-full justify-center gap-8">
      <div className="text-center">
        <SectionTag label="Thank You" className="text-center" />
        <h2 className="text-5xl md:text-6xl font-semibold tracking-tight text-foreground leading-tight mb-6">
          The presentation <span className="brand-gradient-text">is</span> the product.
        </h2>
        <p className="text-xl text-muted font-light max-w-2xl mx-auto leading-relaxed mb-8">
          Not a screenshot of it. Not a recording. The live, interactive,
          exportable, branded web experience. That&apos;s what this framework delivers.
        </p>
        <div className="flex items-center justify-center gap-6 text-sm text-muted">
          <span className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-brand-1" />
            Live web URL
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-2">
            <FileDown className="w-4 h-4 text-brand-3" />
            PPTX download
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-brand-4" />
            Print to PDF
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Presentation definition ─── */

export const sampleSlides: Presentation = {
  slug: "sample-slides",
  title: "Presentations Framework",
  subtitle: "Slide Mode Deep Dive",
  author: "Presenter",
  date: "April 2026",
  description:
    "A self-referential tour of the slide-mode presentation system: primitives, keyboard navigation, speaker notes, and one-click PPTX export.",
  slides: [
    {
      id: "challenge",
      content: <ChallengeSlide />,
      notes:
        "Open with the core tension: presentations are fundamental to how teams communicate, but the tooling has always forced a choice between rich web experiences and shareable files. This framework eliminates that tradeoff.",
    },
    {
      id: "two-modes",
      content: <TwoModesSlide />,
      notes:
        "Walk through the comparison grid. Scroll mode is for when the audience will experience it in a browser — immersive, rich, interactive. Slide mode is for when someone will present it live or email it as a PPTX. Both share the same design system and brand consistency.",
    },
    {
      id: "journey",
      content: <JourneySlide />,
      notes:
        "This is the end-to-end workflow. Emphasize that the AI agent follows the CLAUDE.md conventions — narrative posture, emotional arc, section planning — before writing any code. The components are the last step, not the first.",
    },
    {
      id: "primitives",
      content: <PrimitivesSlide />,
      notes:
        "These are the building blocks you're looking at right now. Every heading, stat card, bullet list, and callout box on these slides is a shared primitive. Point out that the audience is seeing them in action — this deck eats its own dog food.",
    },
    {
      id: "controls",
      content: <ControlsSlide />,
      notes:
        "Invite the audience to try the shortcuts. Press G to show the overview grid — it renders miniature versions of every slide. Press N to toggle speaker notes. Press F for fullscreen. These all work in any slide-mode presentation.",
    },
    {
      id: "export",
      content: <ExportSlide />,
      notes:
        "This is the bridge to the PPTX world. The export captures each slide as a screenshot at 2x resolution, preserving exact visual fidelity. Speaker notes are copied into the PPTX notes field. The recipient can present directly from PowerPoint or edit further.",
    },
    {
      id: "scroll-components",
      content: <ScrollComponentsSlide />,
      notes:
        "Briefly introduce the scroll-mode components for context. The scroll showcase demo at /showcase-scroll uses every one of these to explain itself. If the audience is interested, switch to that URL for a live walkthrough.",
    },
    {
      id: "getting-started",
      content: <GettingStartedSlide />,
      notes:
        "Close with the three-step path. The key message: you don't need to be a frontend engineer to get a deck built. Describe what you want, choose a mode, and the framework handles brand compliance, responsive layout, print mode, and export.",
    },
    {
      id: "closing",
      content: <ClosingSlide />,
      notes:
        "Let this land. The presentation is the product. Not a mockup, not a prototype — the actual deliverable. Thank the audience and offer to show the scroll showcase or the PPTX export live.",
    },
  ],
};
