"use client";

import type { Presentation } from "@/lib/types";
import {
  CodePreview,
  ComparisonGrid,
  NumberedSteps,
  SectionTag,
  SlideCallout,
  SlideHeading,
  SlideSubtitle,
  StatCard,
  StatGrid,
} from "@/components/slide-primitives";
import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  FileCode2,
  Film,
  MonitorSmartphone,
  ShieldCheck,
  Sparkles,
  Terminal,
  UserRound,
} from "lucide-react";

const terminalLine =
  "Use the plan-presentation and slide-mode skills to build `proof-before-promise` from the brief, then run npm run build.";

function OpeningSlide() {
  return (
    <div className="flex h-full flex-col justify-center gap-7">
      <SectionTag label="OpenStage field guide" />
      <div className="max-w-4xl">
        <h1 className="display-lg font-semibold leading-[0.95] tracking-tight text-foreground">
          Proof before promise.
        </h1>
        <p className="mt-6 max-w-2xl text-xl leading-relaxed text-muted">
          A walkthrough is not a gallery of screens. It is an inspectable claim
          about what a person can actually accomplish.
        </p>
      </div>
      <div className="flex items-center gap-3 text-sm text-muted">
        <span className="h-px w-16 bg-brand-2" />
        <span>Persona · action · response · payoff · evidence</span>
      </div>
    </div>
  );
}

function EvidenceSlide() {
  const nodes = [
    { icon: <UserRound className="h-5 w-5" />, label: "Person", sub: "A real goal" },
    { icon: <CircleDot className="h-5 w-5" />, label: "Action", sub: "A real interaction" },
    { icon: <CheckCircle2 className="h-5 w-5" />, label: "Result", sub: "A visible outcome" },
    { icon: <ShieldCheck className="h-5 w-5" />, label: "Proof", sub: "A reproducible artifact" },
  ];

  return (
    <div className="flex h-full flex-col justify-center gap-7">
      <div>
        <SectionTag label="The evidence chain" />
        <SlideHeading>Every claim needs a trail.</SlideHeading>
        <SlideSubtitle>
          The story only earns trust when each transition was driven and each outcome was captured.
        </SlideSubtitle>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-3">
        {nodes.flatMap((node, index) => [
          <div
            key={node.label}
            className="rounded-2xl border border-border bg-surface p-5 text-center"
          >
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-2/10 text-brand-2">
              {node.icon}
            </div>
            <p className="font-semibold text-foreground">{node.label}</p>
            <p className="mt-1 text-xs text-muted">{node.sub}</p>
          </div>,
          ...(index < nodes.length - 1
            ? [<ArrowRight key={`${node.label}-arrow`} className="h-5 w-5 text-brand-3" />]
            : []),
        ])}
      </div>
      <SlideCallout icon={<Sparkles className="h-5 w-5" />}>
        <strong className="text-foreground">The surprising part:</strong> better prose cannot rescue a missing outcome.
      </SlideCallout>
    </div>
  );
}

function CoverageSlide() {
  return (
    <div className="flex h-full flex-col justify-center gap-7">
      <div>
        <SectionTag label="Coverage" />
        <SlideHeading>Three layers, one story.</SlideHeading>
        <SlideSubtitle>
          Features explain the product. Personas explain the stakes. Video preserves the interaction.
        </SlideSubtitle>
      </div>
      <StatGrid>
        <StatCard value="01" label="Feature: what the interface does" icon={<FileCode2 className="h-5 w-5" />} />
        <StatCard value="02" label="Persona: why anyone cares" icon={<UserRound className="h-5 w-5" />} highlight />
        <StatCard value="03" label="Video: how the moment unfolds" icon={<Film className="h-5 w-5" />} />
      </StatGrid>
      <SlideCallout icon={<ShieldCheck className="h-5 w-5" />}>
        <strong className="text-foreground">Completeness is scoped:</strong> blocked auth, native hardware, and unwalked surfaces stay visible.
      </SlideCallout>
    </div>
  );
}

function SurfaceSlide() {
  return (
    <div className="flex h-full flex-col justify-center gap-7">
      <div>
        <SectionTag label="Surface truth" />
        <SlideHeading>Mobile means the actual app.</SlideHeading>
        <SlideSubtitle>
          A narrow browser proves responsive web. It says nothing about a native binary, device permissions, or platform navigation.
        </SlideSubtitle>
      </div>
      <ComparisonGrid
        left={{
          label: "Responsive web",
          items: [
            "Desktop browser user agent",
            "No native permission prompts",
            "Browser navigation and storage",
            "Evidence only for the web product",
          ],
        }}
        right={{
          label: "Native mobile",
          positive: true,
          items: [
            "Simulator or physical device",
            "Real iOS or Android lifecycle",
            "Touch, keyboard, and permissions",
            "Evidence for the shipped mobile app",
          ],
        }}
      />
    </div>
  );
}

function TerminalSlide() {
  return (
    <div className="flex h-full flex-col justify-center gap-6">
      <div>
        <SectionTag label="Agent workflow" />
        <SlideHeading>One brief, either agent.</SlideHeading>
        <SlideSubtitle>
          The skills are plain repository instructions. Claude and Codex read the same files and produce the same source contract.
        </SlideSubtitle>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <CodePreview filename="Claude Code">
          <span className="text-brand-2">$</span> claude{`\n`}
          <span className="text-white/80">› {terminalLine}</span>
        </CodePreview>
        <CodePreview filename="Codex">
          <span className="text-brand-2">$</span> codex{`\n`}
          <span className="text-white/80">› {terminalLine}</span>
        </CodePreview>
      </div>
      <SlideCallout icon={<Terminal className="h-5 w-5" />}>
        <strong className="text-foreground">Cross-platform:</strong> the implementation and verifier are Node scripts, so the workflow is identical on macOS and Windows.
      </SlideCallout>
    </div>
  );
}

function BuildSlide() {
  return (
    <div className="flex h-full flex-col justify-center gap-6">
      <div>
        <SectionTag label="Build contract" />
        <SlideHeading>From prompt to live route.</SlideHeading>
        <SlideSubtitle>
          The generated deck is ordinary application code: reviewable, testable, shareable, and owned by the repository.
        </SlideSubtitle>
      </div>
      <NumberedSteps
        steps={[
          { title: "Plan the narrative", description: "Choose audience, posture, emotional arc, and one idea per slide.", tag: "skill" },
          { title: "Compose the source", description: "Use shared primitives, fixed-height budgets, and speaker notes.", tag: "code" },
          { title: "Register the route", description: "Add metadata so the presentation appears in the OpenStage gallery.", tag: "index" },
          { title: "Verify in browser", description: "Build, navigate every slide, inspect mobile, then capture the evidence.", tag: "proof" },
        ]}
      />
    </div>
  );
}

function ClosingSlide() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-7 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-2/10 text-brand-2">
        <MonitorSmartphone className="h-8 w-8" />
      </div>
      <div className="max-w-3xl">
        <SectionTag label="The standard" className="text-center" />
        <SlideHeading className="text-center">Show the work working.</SlideHeading>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          A strong walkthrough leaves the reader with the product outcome, the person who needed it, and the evidence that it happened.
        </p>
      </div>
      <div className="rounded-full border border-brand-2/30 bg-brand-2/10 px-5 py-2 text-sm font-medium text-brand-2">
        OpenStage · Human Quest · 2026
      </div>
    </div>
  );
}

export const proofBeforePromise: Presentation = {
  slug: "proof-before-promise",
  title: "Proof Before Promise",
  subtitle: "How credible product walkthroughs are made",
  author: "Human Quest",
  date: "September 2026",
  description:
    "A slide-mode demonstration built with OpenStage's presentation skills, showing how persona, surface, action, result, and evidence form a trustworthy walkthrough.",
  accentColor: "#7DD3FC",
  slides: [
    { id: "opening", content: <OpeningSlide />, notes: "A walkthrough is a product claim. This deck shows the evidence chain behind one we can trust.", layout: "title", transition: "mask", mood: "night" },
    { id: "evidence", content: <EvidenceSlide />, notes: "Follow the chain from a person's goal through the action to an independently inspectable result.", transition: "slide", mood: "cool" },
    { id: "coverage", content: <CoverageSlide />, notes: "Feature coverage, persona journeys, and interaction video answer different questions and reinforce each other.", transition: "blur", mood: "dawn" },
    { id: "surfaces", content: <SurfaceSlide />, notes: "Responsive mobile web is useful evidence for the web product. It is not evidence of a native mobile app.", transition: "slide", mood: "mono" },
    { id: "terminal", content: <TerminalSlide />, notes: "The same repository skills can guide Claude or Codex. The captured artifacts stay independent of either host.", layout: "code", transition: "zoom", mood: "night" },
    { id: "build", content: <BuildSlide />, notes: "The generated presentation remains normal code with a route, registry entry, build gate, and browser verification.", transition: "slide", mood: "cool" },
    { id: "closing", content: <ClosingSlide />, notes: "The standard is simple: show the work working, then let people inspect the proof.", layout: "center", transition: "fade", mood: "dawn" },
  ],
};
