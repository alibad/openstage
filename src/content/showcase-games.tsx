"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Reveal, ScrollProgress, AnimatedGradientText, GradientDivider } from "@/components/animations";
import { usePrintMode } from "@/lib/print-mode";
import { PrintButton } from "@/components/pdf-export";
import { ScrollNarrator, type NarrationSection } from "@/components/scroll-narrator";
import {
  Gamepad2,
  Brain,
  GripVertical,
  FlipVertical,
  Sparkles,
  Zap,
  Target,
  Trophy,
  CircleDot,
  MousePointerClick,
  RotateCw,
  LayoutGrid,
  Timer,
  Shuffle,
  Crown,
  Hash,
  Clock,
  ArrowRightLeft,
  Lightbulb,
  GraduationCap,
  Shield,
  Map,
  GitBranch,
  Swords,
  Eye,
  Compass,
  RotateCcw,
  Workflow,
} from "lucide-react";

const QuizGame = dynamic(
  () => import("@/components/games").then((m) => ({ default: m.QuizGame })),
  { ssr: false, loading: () => <GamePlaceholder label="Loading Quiz..." /> }
);

const DragSortGame = dynamic(
  () => import("@/components/games").then((m) => ({ default: m.DragSortGame })),
  { ssr: false, loading: () => <GamePlaceholder label="Loading Drag & Sort..." /> }
);

const MemoryGame = dynamic(
  () => import("@/components/games").then((m) => ({ default: m.MemoryGame })),
  { ssr: false, loading: () => <GamePlaceholder label="Loading Memory Match..." /> }
);

const SpinWheelGame = dynamic(
  () => import("@/components/games").then((m) => ({ default: m.SpinWheelGame })),
  { ssr: false, loading: () => <GamePlaceholder label="Loading Spin Wheel..." /> }
);

const HotspotGame = dynamic(
  () => import("@/components/games").then((m) => ({ default: m.HotspotGame })),
  { ssr: false, loading: () => <GamePlaceholder label="Loading Hotspot Explorer..." /> }
);

const JeopardyGame = dynamic(
  () => import("@/components/games").then((m) => ({ default: m.JeopardyGame })),
  { ssr: false, loading: () => <GamePlaceholder label="Loading Jeopardy..." /> }
);

const ReactionGame = dynamic(
  () => import("@/components/games").then((m) => ({ default: m.ReactionGame })),
  { ssr: false, loading: () => <GamePlaceholder label="Loading Reaction Test..." /> }
);

const WordScrambleGame = dynamic(
  () => import("@/components/games").then((m) => ({ default: m.WordScrambleGame })),
  { ssr: false, loading: () => <GamePlaceholder label="Loading Word Scramble..." /> }
);

const MillionaireGame = dynamic(
  () => import("@/components/games").then((m) => ({ default: m.MillionaireGame })),
  { ssr: false, loading: () => <GamePlaceholder label="Loading Millionaire..." /> }
);

const CrosswordGame = dynamic(
  () => import("@/components/games").then((m) => ({ default: m.CrosswordGame })),
  { ssr: false, loading: () => <GamePlaceholder label="Loading Crossword..." /> }
);

const TimelineGame = dynamic(
  () => import("@/components/games").then((m) => ({ default: m.TimelineGame })),
  { ssr: false, loading: () => <GamePlaceholder label="Loading Timeline..." /> }
);

const TowerDefenseGame = dynamic(
  () => import("@/components/games").then((m) => ({ default: m.TowerDefenseGame })),
  { ssr: false, loading: () => <GamePlaceholder label="Loading Tower Defense..." /> }
);

const MazeGame = dynamic(
  () => import("@/components/games").then((m) => ({ default: m.MazeGame })),
  { ssr: false, loading: () => <GamePlaceholder label="Loading Maze..." /> }
);

const PipeConnectGame = dynamic(
  () => import("@/components/games").then((m) => ({ default: m.PipeConnectGame })),
  { ssr: false, loading: () => <GamePlaceholder label="Loading Pipe Connect..." /> }
);

function GamePlaceholder({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-[500px] rounded-2xl bg-bg-surface border border-white/10">
      <p className="text-white/40 text-sm animate-pulse">{label}</p>
    </div>
  );
}

function Section({
  children,
  className,
  dark,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`relative ${
        dark ? "slide-dark bg-bg-dark text-white" : "bg-bg-light text-foreground"
      } ${className || ""}`}
    >
      {dark && <div className="noise-overlay absolute inset-0 pointer-events-none" />}
      <div className="relative z-10">{children}</div>
    </section>
  );
}

const CHAPTERS = [
  { id: "hero", label: "Overview" },
  { id: "quiz", label: "Quiz" },
  { id: "drag-sort", label: "Drag & Sort" },
  { id: "memory", label: "Memory" },
  { id: "spin-wheel", label: "Spin Wheel" },
  { id: "hotspot", label: "Hotspot" },
  { id: "jeopardy", label: "Jeopardy" },
  { id: "reaction", label: "Reaction" },
  { id: "word-scramble", label: "Scramble" },
  { id: "millionaire", label: "Millionaire" },
  { id: "crossword", label: "Crossword" },
  { id: "timeline", label: "Timeline" },
  { id: "tower-defense", label: "Tower Def" },
  { id: "maze", label: "Maze" },
  { id: "pipe-connect", label: "Pipe" },
];

function ChapterNav() {
  const [active, setActive] = useState("hero");

  useEffect(() => {
    const visibleSet = new Set<string>();

    const pickTopmost = () => {
      for (const ch of CHAPTERS) {
        if (visibleSet.has(ch.id)) { setActive(ch.id); return; }
      }
    };

    const observers: IntersectionObserver[] = [];
    CHAPTERS.forEach((ch) => {
      const el = document.getElementById(ch.id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) visibleSet.add(ch.id);
          else visibleSet.delete(ch.id);
          pickTopmost();
        },
        { rootMargin: "-20% 0px -20% 0px" }
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <nav className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-2 print-hidden">
      {CHAPTERS.map((ch) => {
        const isActive = active === ch.id;
        return (
          <a
            key={ch.id}
            href={`#${ch.id}`}
            className="group flex items-center gap-3 justify-end"
            title={ch.label}
          >
            <span
              className={`text-[10px] font-medium transition-all duration-500 ${
                isActive
                  ? "text-brand-1 opacity-100 translate-x-0"
                  : "text-white/0 group-hover:text-white/50 translate-x-2 group-hover:translate-x-0"
              }`}
            >
              {ch.label}
            </span>
            <span
              className={`rounded-full transition-all duration-500 ${
                isActive
                  ? "w-2.5 h-2.5 bg-brand-1 shadow-[0_0_10px_rgba(125,211,252,0.5)]"
                  : "w-1.5 h-1.5 bg-white/20 group-hover:bg-white/40"
              }`}
            />
          </a>
        );
      })}
    </nav>
  );
}

function FeatureCard({ icon, title, desc, href, advanced }: { icon: React.ReactNode; title: string; desc: string; href: string; advanced?: boolean }) {
  return (
    <a
      href={`#${href}`}
      className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2.5 hover:bg-white/8 hover:border-white/20 transition-colors group"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-1 group-hover:border-brand-1/30 transition-colors">
          {icon}
        </div>
        {advanced && (
          <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-400/20 rounded">Adv</span>
        )}
      </div>
      <h3 className="text-white font-semibold text-sm">{title}</h3>
      <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
    </a>
  );
}

const QUIZ_QUESTIONS = [
  {
    question: "What is the primary benefit of AI in government services?",
    options: ["Cost reduction only", "Faster citizen response times", "Replacing all employees", "Eliminating oversight"],
    correct: 1,
  },
  {
    question: "Which metric best measures AI model reliability?",
    options: ["Training speed", "Parameter count", "F1 score on production data", "Dataset size"],
    correct: 2,
  },
  {
    question: "What does 'human-in-the-loop' mean in AI systems?",
    options: [
      "AI runs without human input",
      "Humans review and validate AI outputs",
      "AI replaces human decision-making",
      "Humans write all the code manually",
    ],
    correct: 1,
  },
  {
    question: "Which is NOT a pillar of responsible AI?",
    options: ["Transparency", "Fairness", "Maximum automation", "Accountability"],
    correct: 2,
  },
  {
    question: "What is retrieval-augmented generation (RAG)?",
    options: [
      "Training a model from scratch",
      "Combining search results with LLM generation",
      "A type of computer hardware",
      "Compressing models for mobile",
    ],
    correct: 1,
  },
];

const DRAG_ITEMS = [
  { label: "Data Cleaning" },
  { label: "Model Training" },
  { label: "A/B Testing" },
  { label: "Feature Engineering" },
  { label: "Model Deployment" },
  { label: "Monitoring" },
  { label: "Data Collection" },
  { label: "Hyperparameter Tuning" },
  { label: "User Feedback" },
];

const DRAG_ZONES = [
  { label: "Data Prep", accepts: ["Data Collection", "Data Cleaning", "Feature Engineering"], color: "#22d3ee" },
  { label: "Model Dev", accepts: ["Model Training", "Hyperparameter Tuning"], color: "#818CF8" },
  { label: "Production", accepts: ["Model Deployment", "A/B Testing", "Monitoring", "User Feedback"], color: "#A855F7" },
];

const MEMORY_PAIRS = [
  { id: "nlp", label: "NLP" },
  { id: "cv", label: "Computer Vision" },
  { id: "rl", label: "Reinforcement Learning" },
  { id: "gan", label: "GANs" },
  { id: "transformer", label: "Transformers" },
  { id: "cnn", label: "CNNs" },
];

const WHEEL_SEGMENTS = [
  { label: "AI Ethics", color: "#818CF8" },
  { label: "Data Quality", color: "#22d3ee" },
  { label: "MLOps", color: "#A855F7" },
  { label: "Prompt Engineering", color: "#F472B6" },
  { label: "Fine-Tuning", color: "#FBBF24" },
  { label: "RAG Pipelines", color: "#4ADE80" },
  { label: "Model Evaluation", color: "#FB923C" },
  { label: "Edge AI", color: "#38BDF8" },
];

const HOTSPOT_POINTS = [
  { x: 12, y: 25, label: "Data Sources", description: "Ingests from 15+ enterprise connectors: APIs, databases, file shares, and streaming pipelines. Supports real-time and batch modes.", color: "#22d3ee" },
  { x: 35, y: 15, label: "ETL Pipeline", description: "Apache Spark-based transformation layer. Handles cleaning, deduplication, schema validation, and feature extraction at petabyte scale.", color: "#818CF8" },
  { x: 58, y: 30, label: "ML Engine", description: "Distributed training on GPU clusters. Supports PyTorch, JAX, and custom frameworks. Auto-scales based on job queue depth.", color: "#A855F7" },
  { x: 80, y: 20, label: "Model Registry", description: "Version-controlled model store with lineage tracking. Every model links back to its training data, config, and evaluation metrics.", color: "#F472B6" },
  { x: 25, y: 65, label: "Vector Store", description: "High-performance embedding database for RAG. Sub-10ms retrieval across 100M+ vectors with HNSW indexing.", color: "#FBBF24" },
  { x: 55, y: 75, label: "API Gateway", description: "Rate-limited inference endpoint with A/B routing, canary deploys, and automatic fallback. 99.95% uptime SLA.", color: "#4ADE80" },
  { x: 82, y: 65, label: "Monitoring", description: "Real-time dashboards for latency, throughput, drift detection, and cost tracking. Alerts via PagerDuty and Slack.", color: "#FB923C" },
];

const JEOPARDY_CATEGORIES = [
  {
    name: "AI Basics",
    questions: [
      { question: "This type of learning uses labeled data to train models.", answer: "Supervised Learning" },
      { question: "The process of reducing model size while preserving accuracy.", answer: "Model Compression / Quantization" },
      { question: "GPT stands for this.", answer: "Generative Pre-trained Transformer" },
      { question: "The technique of generating text by sampling from probability distributions.", answer: "Autoregressive Decoding" },
    ],
  },
  {
    name: "Data",
    questions: [
      { question: "This database type stores data as key-value pairs, documents, or graphs.", answer: "NoSQL" },
      { question: "The process of converting raw data into a structured format for analysis.", answer: "ETL (Extract, Transform, Load)" },
      { question: "A statistical measure of how two variables move in relation to each other.", answer: "Correlation" },
      { question: "This technique creates synthetic training data from existing samples.", answer: "Data Augmentation" },
    ],
  },
  {
    name: "MLOps",
    questions: [
      { question: "This tool tracks experiments, parameters, and model versions.", answer: "MLflow / Weights & Biases" },
      { question: "Deploying two model versions simultaneously to compare performance.", answer: "A/B Testing / Canary Deployment" },
      { question: "When model performance degrades over time due to changing data.", answer: "Model Drift / Data Drift" },
      { question: "Infrastructure as code tool commonly used for ML pipelines.", answer: "Terraform / Pulumi" },
    ],
  },
  {
    name: "Ethics",
    questions: [
      { question: "When AI systems produce different outcomes for different demographic groups.", answer: "Algorithmic Bias" },
      { question: "The ability to understand why a model made a specific prediction.", answer: "Explainability / Interpretability" },
      { question: "An AI system that fabricates information that sounds plausible.", answer: "Hallucination" },
      { question: "Framework ensuring AI systems are fair, transparent, and accountable.", answer: "Responsible AI" },
    ],
  },
];

const SCRAMBLE_WORDS = [
  { word: "NEURAL", hint: "Type of network inspired by the brain" },
  { word: "TENSOR", hint: "Multi-dimensional array in deep learning" },
  { word: "LATENT", hint: "Hidden representation space" },
  { word: "EPOCHS", hint: "Full passes through training data" },
  { word: "TOKENS", hint: "Basic units of text for LLMs" },
  { word: "AGENTS", hint: "Autonomous AI systems that take actions" },
];

const MILLIONAIRE_QUESTIONS = [
  {
    question: "Which company created the Transformer architecture?",
    options: ["OpenAI", "Google", "Meta", "Microsoft"] as [string, string, string, string],
    correct: 1,
  },
  {
    question: "What does GPT stand for?",
    options: ["General Purpose Technology", "Generative Pre-trained Transformer", "Global Processing Tool", "Guided Pattern Training"] as [string, string, string, string],
    correct: 1,
  },
  {
    question: "Which technique allows LLMs to access external knowledge?",
    options: ["Fine-tuning", "Distillation", "RAG", "Pruning"] as [string, string, string, string],
    correct: 2,
  },
  {
    question: "What is the 'temperature' parameter in LLM generation?",
    options: ["GPU heat threshold", "Controls output randomness", "Training speed", "Token limit"] as [string, string, string, string],
    correct: 1,
  },
  {
    question: "Which loss function is standard for classification tasks?",
    options: ["Mean Squared Error", "Huber Loss", "Cross-Entropy", "Hinge Loss"] as [string, string, string, string],
    correct: 2,
  },
  {
    question: "What is 'attention' in the Transformer architecture?",
    options: ["A regularization method", "A mechanism to weigh input relevance", "A type of activation function", "A data augmentation technique"] as [string, string, string, string],
    correct: 1,
  },
  {
    question: "RLHF stands for what?",
    options: ["Rapid Learning with High Fidelity", "Reinforcement Learning from Human Feedback", "Recursive Layer Hallucination Fix", "Regularized Linear Hidden Features"] as [string, string, string, string],
    correct: 1,
  },
];

const CROSSWORD_CLUES = [
  { answer: "NEURAL", clue: "Type of network inspired by the brain", row: 0, col: 0, direction: "across" as const },
  { answer: "EPOCH", clue: "One full pass through training data", row: 0, col: 0, direction: "down" as const },
  { answer: "TOKEN", clue: "Basic unit of text for an LLM", row: 2, col: 2, direction: "across" as const },
  { answer: "LOSS", clue: "Function minimized during training", row: 0, col: 4, direction: "down" as const },
  { answer: "AGENT", clue: "Autonomous AI that takes actions", row: 4, col: 1, direction: "across" as const },
  { answer: "RAG", clue: "Retrieval-augmented generation (abbr)", row: 2, col: 4, direction: "down" as const },
];

const TIMELINE_EVENTS = [
  { label: "Perceptron invented", year: 1958 },
  { label: "Backpropagation popularized", year: 1986 },
  { label: "Deep Blue beats Kasparov", year: 1997 },
  { label: "ImageNet moment (AlexNet)", year: 2012 },
  { label: "Attention Is All You Need", year: 2017 },
  { label: "GPT-3 released", year: 2020 },
  { label: "ChatGPT launch", year: 2022 },
];

const MAZE_COLLECTIBLES = [
  { label: "GPU", color: "#22d3ee" },
  { label: "Data", color: "#818CF8" },
  { label: "Model", color: "#A855F7" },
  { label: "API", color: "#F472B6" },
  { label: "Eval", color: "#FBBF24" },
  { label: "Deploy", color: "#4ADE80" },
  { label: "Serve", color: "#FB923C" },
  { label: "RLHF", color: "#38BDF8" },
];

const NARRATION_SECTIONS: NarrationSection[] = [
  { sectionId: "hero", label: "Introduction", text: "Interactive Game Templates: Phaser-powered gamification components you can drop into any presentation. Quiz your audience, let them sort concepts, or reinforce key ideas with memory games." },
  { sectionId: "quiz", label: "Quiz Game", text: "The quiz game presents multiple-choice questions with instant feedback, score tracking, and a results summary. Perfect for knowledge checks during training sessions or conference talks." },
  { sectionId: "drag-sort", label: "Drag & Sort", text: "Drag and sort challenges the audience to arrange items in the correct order. The physics-based drag interaction makes it tactile and engaging, and wrong placements snap back with visual feedback." },
  { sectionId: "memory", label: "Memory Match", text: "Memory match is a card-flipping game that reinforces key concepts by pairing related items. Customize the pairs to match your presentation topic: terms and definitions, logos and companies, or problems and solutions." },
  { sectionId: "spin-wheel", label: "Spin Wheel", text: "The spin wheel adds an element of chance to presentations. Use it for random topic selection, audience participation, or prize giveaways. The wheel physics feel satisfying and the result is always dramatic." },
  { sectionId: "hotspot", label: "Hotspot Explorer", text: "Hotspot explorer lets the audience click on specific areas of an image or diagram to reveal hidden information. Great for product tours, architecture explanations, or anatomical diagrams." },
  { sectionId: "jeopardy", label: "Jeopardy", text: "The Jeopardy game template brings the classic quiz show format to presentations. Categories, point values, and the signature answer-in-the-form-of-a-question format make learning competitive and fun." },
  { sectionId: "reaction", label: "Reaction Time", text: "Reaction time tests the audience's speed with a click-based challenge. A fun icebreaker that generates energy and engagement at the start of any session." },
  { sectionId: "word-scramble", label: "Word Scramble", text: "Word scramble presents jumbled letters that the audience must unscramble into key terms from your presentation. It reinforces vocabulary and keeps the audience actively thinking." },
  { sectionId: "millionaire", label: "Who Wants to Be a Millionaire", text: "The Millionaire game template recreates the escalating difficulty format with lifelines, dramatic music cues, and the tension of risking your progress for a harder question." },
  { sectionId: "crossword", label: "Crossword", text: "The crossword puzzle template generates interactive crosswords from your key terms and clue descriptions. Great for review sessions and can be solved collaboratively as a group activity." },
  { sectionId: "timeline", label: "Timeline Challenge", text: "The timeline challenge asks the audience to place historical events or project milestones in chronological order. It tests understanding of sequence and causality in an interactive way." },
  { sectionId: "tower-defense", label: "Tower Defense", text: "Tower defense brings strategic thinking to presentations. Place defense towers to stop waves of enemies representing wrong answers or common misconceptions. Learning through gameplay." },
  { sectionId: "maze", label: "Maze Runner", text: "The maze runner game challenges players to navigate through a knowledge maze, answering questions at each junction to progress. Wrong answers lead to dead ends." },
  { sectionId: "pipe-connect", label: "Pipe Connect", text: "Pipe connect is a puzzle game where players connect pipe segments to create a complete flow. Map it to process flows, data pipelines, or supply chains for domain-specific learning." },
  { sectionId: "cta", label: "Closing", text: "That's the complete game template library. Every game is built with Phaser 3, fully customizable, and ready to drop into any presentation. Gamification transforms passive audiences into active participants." },
];

export default function ShowcaseGames() {
  const print = usePrintMode();

  return (
    <main className={`relative ${print ? "print-mode" : ""}`}>
      {!print && <PrintButton />}
      {!print && <ChapterNav />}
      <ScrollProgress />
      <ScrollNarrator sections={NARRATION_SECTIONS} hidden={print} />

      {/* ─── Hero ─── */}
      <Section dark id="hero">
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <Reveal>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mb-8 mx-auto shadow-lg shadow-purple-500/20">
              <Gamepad2 className="w-8 h-8 text-white" />
            </div>
          </Reveal>
          <Reveal>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              <AnimatedGradientText>Interactive Game Templates</AnimatedGradientText>
            </h1>
          </Reveal>
          <Reveal>
            <p className="text-white/50 text-lg md:text-xl max-w-2xl leading-relaxed mb-12">
              Phaser.io-powered game components you can drop into any presentation.
              Quiz your audience, let them sort concepts, or reinforce key ideas with memory games.
            </p>
          </Reveal>
          <Reveal>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-5xl">
              <FeatureCard icon={<Brain className="w-5 h-5" />} title="Quiz" desc="Timed multiple choice." href="quiz" />
              <FeatureCard icon={<GripVertical className="w-5 h-5" />} title="Drag & Sort" desc="Categorize into zones." href="drag-sort" />
              <FeatureCard icon={<FlipVertical className="w-5 h-5" />} title="Memory Match" desc="Flip cards, find pairs." href="memory" />
              <FeatureCard icon={<CircleDot className="w-5 h-5" />} title="Spin Wheel" desc="Random topic picker." href="spin-wheel" />
              <FeatureCard icon={<MousePointerClick className="w-5 h-5" />} title="Hotspot" desc="Click to explore." href="hotspot" />
              <FeatureCard icon={<LayoutGrid className="w-5 h-5" />} title="Jeopardy" desc="Category board game." href="jeopardy" />
              <FeatureCard icon={<Timer className="w-5 h-5" />} title="Reaction Time" desc="Speed test icebreaker." href="reaction" />
              <FeatureCard icon={<Shuffle className="w-5 h-5" />} title="Word Scramble" desc="Unscramble the letters." href="word-scramble" />
              <FeatureCard icon={<Crown className="w-5 h-5" />} title="Millionaire" desc="Progressive stakes quiz." href="millionaire" />
              <FeatureCard icon={<Hash className="w-5 h-5" />} title="Crossword" desc="Interactive grid puzzle." href="crossword" />
              <FeatureCard icon={<Clock className="w-5 h-5" />} title="Timeline" desc="Drag events in order." href="timeline" />
              <FeatureCard icon={<Shield className="w-5 h-5" />} title="Tower Defense" desc="Place towers, stop waves." href="tower-defense" advanced />
              <FeatureCard icon={<Compass className="w-5 h-5" />} title="Maze Runner" desc="Fog of war, collectibles." href="maze" advanced />
              <FeatureCard icon={<Workflow className="w-5 h-5" />} title="Pipe Connect" desc="Rotate to complete flow." href="pipe-connect" advanced />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ─── Quiz ─── */}
      <Section id="quiz">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <Reveal>
            <p className="text-sm font-medium text-brand-3 uppercase tracking-widest mb-3">
              Template 1
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Quiz Game
            </h2>
            <p className="text-gray-500 max-w-xl mb-4 leading-relaxed">
              Drop a knowledge check into any presentation. Define questions, set a timer,
              and the component handles scoring, feedback, and results. Works in both scroll
              and slide modes.
            </p>
          </Reveal>
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { icon: <Target className="w-4 h-4" />, label: "Timed questions" },
                { icon: <Zap className="w-4 h-4" />, label: "Instant feedback" },
                { icon: <Trophy className="w-4 h-4" />, label: "Score tracking" },
                { icon: <Sparkles className="w-4 h-4" />, label: "Play again" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm">
                  {f.icon}
                  {f.label}
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal>
            <QuizGame
              questions={QUIZ_QUESTIONS}
              timePerQuestion={15}
              height="520px"
              className="border border-gray-200 shadow-xl"
            />
          </Reveal>
          <Reveal>
            <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs font-mono text-gray-400 mb-2">Usage</p>
              <pre className="text-sm text-gray-700 overflow-x-auto"><code>{`<QuizGame
  questions={[
    { question: "What is RAG?",
      options: ["Training", "Search + LLM", "Hardware", "Compression"],
      correct: 1 },
  ]}
  timePerQuestion={15}
  onComplete={({ score, total }) => console.log(score, total)}
/>`}</code></pre>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ─── Drag & Sort ─── */}
      <Section dark id="drag-sort">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <Reveal>
            <p className="text-sm font-medium text-brand-1 uppercase tracking-widest mb-3">
              Template 2
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Drag & Sort
            </h2>
            <p className="text-white/50 max-w-xl mb-4 leading-relaxed">
              Let the audience categorize concepts by dragging items into labeled zones.
              Wrong drops snap back with a red flash. Correct placements lock in place.
              Great for process flows, priority sorting, and team exercises.
            </p>
          </Reveal>
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { icon: <GripVertical className="w-4 h-4" />, label: "Drag & drop" },
                { icon: <Target className="w-4 h-4" />, label: "Zone validation" },
                { icon: <Zap className="w-4 h-4" />, label: "Snap-back on error" },
                { icon: <Sparkles className="w-4 h-4" />, label: "Auto-shuffle" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm">
                  {f.icon}
                  {f.label}
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal>
            <DragSortGame
              items={DRAG_ITEMS}
              zones={DRAG_ZONES}
              title="Sort the ML Pipeline"
              height="580px"
              className="border border-white/10 shadow-xl"
            />
          </Reveal>
          <Reveal>
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs font-mono text-white/30 mb-2">Usage</p>
              <pre className="text-sm text-white/70 overflow-x-auto"><code>{`<DragSortGame
  items={[{ label: "Data Cleaning" }, { label: "Model Training" }]}
  zones={[
    { label: "Data Prep", accepts: ["Data Cleaning"], color: "#22d3ee" },
    { label: "Model Dev", accepts: ["Model Training"], color: "#818CF8" },
  ]}
  title="Sort the Pipeline"
/>`}</code></pre>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ─── Memory Match ─── */}
      <Section id="memory">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <Reveal>
            <p className="text-sm font-medium text-brand-4 uppercase tracking-widest mb-3">
              Template 3
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Memory Match
            </h2>
            <p className="text-gray-500 max-w-xl mb-4 leading-relaxed">
              Classic card-flipping memory game. Define pairs of concepts and the audience
              matches them. Tracks moves and time. Works as an icebreaker, concept
              reinforcement, or attention reset between dense sections.
            </p>
          </Reveal>
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { icon: <FlipVertical className="w-4 h-4" />, label: "Card flip animation" },
                { icon: <Brain className="w-4 h-4" />, label: "Pair matching" },
                { icon: <Target className="w-4 h-4" />, label: "Move counter" },
                { icon: <Trophy className="w-4 h-4" />, label: "Time tracking" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm">
                  {f.icon}
                  {f.label}
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal>
            <MemoryGame
              pairs={MEMORY_PAIRS}
              height="520px"
              className="border border-gray-200 shadow-xl"
            />
          </Reveal>
          <Reveal>
            <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs font-mono text-gray-400 mb-2">Usage</p>
              <pre className="text-sm text-gray-700 overflow-x-auto"><code>{`<MemoryGame
  pairs={[
    { id: "nlp", label: "NLP" },
    { id: "cv", label: "Computer Vision" },
    { id: "rl", label: "Reinforcement Learning" },
  ]}
  onComplete={({ moves, time }) => console.log(moves, time)}
/>`}</code></pre>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ─── Spin Wheel ─── */}
      <Section dark id="spin-wheel">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <Reveal>
            <p className="text-sm font-medium text-yellow-400 uppercase tracking-widest mb-3">
              Template 4
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Spin Wheel
            </h2>
            <p className="text-white/50 max-w-xl mb-4 leading-relaxed">
              Random topic picker with real physics spin. Click the center button
              to spin, watch the easing deceleration, and see the result. Use for
              icebreakers, random Q&A selection, or prize giveaways.
            </p>
          </Reveal>
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { icon: <RotateCw className="w-4 h-4" />, label: "Physics spin" },
                { icon: <Target className="w-4 h-4" />, label: "Pointer indicator" },
                { icon: <Sparkles className="w-4 h-4" />, label: "Result animation" },
                { icon: <CircleDot className="w-4 h-4" />, label: "Unlimited respins" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm">
                  {f.icon}
                  {f.label}
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal>
            <SpinWheelGame
              segments={WHEEL_SEGMENTS}
              title="Pick a Topic"
              height="540px"
              className="border border-white/10 shadow-xl"
            />
          </Reveal>
          <Reveal>
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs font-mono text-white/30 mb-2">Usage</p>
              <pre className="text-sm text-white/70 overflow-x-auto"><code>{`<SpinWheelGame
  segments={[
    { label: "AI Ethics" },
    { label: "Data Quality", color: "#22d3ee" },
    { label: "MLOps" },
  ]}
  title="Pick a Topic"
  onResult={(segment, index) => console.log(segment.label)}
/>`}</code></pre>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ─── Hotspot Explorer ─── */}
      <Section id="hotspot">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <Reveal>
            <p className="text-sm font-medium text-emerald-500 uppercase tracking-widest mb-3">
              Template 5
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Hotspot Explorer
            </h2>
            <p className="text-gray-500 max-w-xl mb-4 leading-relaxed">
              Place pulsing hotspots on a canvas and let the audience click to
              reveal details. Each hotspot shows an info panel with a title and
              description. Tracks exploration progress. Perfect for architecture
              diagrams, product tours, and interactive maps.
            </p>
          </Reveal>
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { icon: <MousePointerClick className="w-4 h-4" />, label: "Click to explore" },
                { icon: <Target className="w-4 h-4" />, label: "Pulsing indicators" },
                { icon: <Sparkles className="w-4 h-4" />, label: "Info panels" },
                { icon: <Trophy className="w-4 h-4" />, label: "Progress tracking" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm">
                  {f.icon}
                  {f.label}
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal>
            <HotspotGame
              hotspots={HOTSPOT_POINTS}
              title="AI Platform Architecture"
              subtitle="Click each component to learn more"
              height="520px"
              className="border border-gray-200 shadow-xl"
            />
          </Reveal>
          <Reveal>
            <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs font-mono text-gray-400 mb-2">Usage</p>
              <pre className="text-sm text-gray-700 overflow-x-auto"><code>{`<HotspotGame
  hotspots={[
    { x: 20, y: 30, label: "Data Lake",
      description: "Central storage for raw and processed data." },
    { x: 50, y: 50, label: "ML Engine",
      description: "Training and inference pipeline.", color: "#818CF8" },
  ]}
  title="System Architecture"
  subtitle="Click each component to learn more"
/>`}</code></pre>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ─── Jeopardy Board ─── */}
      <Section dark id="jeopardy">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <Reveal>
            <p className="text-sm font-medium text-blue-400 uppercase tracking-widest mb-3">
              Template 6
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Jeopardy Board
            </h2>
            <p className="text-white/50 max-w-xl mb-4 leading-relaxed">
              Classic category board game. Pick a category and point value, reveal
              the question, then self-score whether you got it right. Points add or
              subtract from your total. Perfect for team competitions and reviews.
            </p>
          </Reveal>
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { icon: <LayoutGrid className="w-4 h-4" />, label: "Category grid" },
                { icon: <Trophy className="w-4 h-4" />, label: "Point scoring" },
                { icon: <Sparkles className="w-4 h-4" />, label: "Reveal mechanic" },
                { icon: <Target className="w-4 h-4" />, label: "Self-scoring" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm">
                  {f.icon}
                  {f.label}
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal>
            <JeopardyGame
              categories={JEOPARDY_CATEGORIES}
              pointValues={[200, 400, 600, 800]}
              height="540px"
              className="border border-white/10 shadow-xl"
            />
          </Reveal>
          <Reveal>
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs font-mono text-white/30 mb-2">Usage</p>
              <pre className="text-sm text-white/70 overflow-x-auto"><code>{`<JeopardyGame
  categories={[
    { name: "AI Basics", questions: [
      { question: "GPT stands for this.", answer: "Generative Pre-trained Transformer" },
    ]},
  ]}
  pointValues={[200, 400, 600, 800]}
/>`}</code></pre>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ─── Reaction Time ─── */}
      <Section id="reaction">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <Reveal>
            <p className="text-sm font-medium text-red-400 uppercase tracking-widest mb-3">
              Template 7
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Reaction Time
            </h2>
            <p className="text-gray-500 max-w-xl mb-4 leading-relaxed">
              Wait for the screen to turn green, then click as fast as you can.
              Tracks your time across multiple rounds with color-coded results.
              Great as an icebreaker or energy booster between sections.
            </p>
          </Reveal>
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { icon: <Timer className="w-4 h-4" />, label: "Millisecond precision" },
                { icon: <Zap className="w-4 h-4" />, label: "Multi-round" },
                { icon: <Target className="w-4 h-4" />, label: "Best/average stats" },
                { icon: <Sparkles className="w-4 h-4" />, label: "Too-early detection" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm">
                  {f.icon}
                  {f.label}
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal>
            <ReactionGame
              rounds={5}
              height="400px"
              className="border border-gray-200 shadow-xl"
            />
          </Reveal>
          <Reveal>
            <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs font-mono text-gray-400 mb-2">Usage</p>
              <pre className="text-sm text-gray-700 overflow-x-auto"><code>{`<ReactionGame
  rounds={5}
  onComplete={({ average, best }) => console.log(average, best)}
/>`}</code></pre>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ─── Word Scramble ─── */}
      <Section dark id="word-scramble">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <Reveal>
            <p className="text-sm font-medium text-orange-400 uppercase tracking-widest mb-3">
              Template 8
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Word Scramble
            </h2>
            <p className="text-white/50 max-w-xl mb-4 leading-relaxed">
              Unscramble letters to form the correct word. Click letters in order
              to build your answer. Optional hints, skip button, and time tracking.
              Great for reinforcing terminology and key concepts.
            </p>
          </Reveal>
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { icon: <Shuffle className="w-4 h-4" />, label: "Letter tiles" },
                { icon: <Brain className="w-4 h-4" />, label: "Hint system" },
                { icon: <Target className="w-4 h-4" />, label: "Skip option" },
                { icon: <Trophy className="w-4 h-4" />, label: "Score + time" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm">
                  {f.icon}
                  {f.label}
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal>
            <WordScrambleGame
              words={SCRAMBLE_WORDS}
              height="440px"
              className="border border-white/10 shadow-xl"
            />
          </Reveal>
          <Reveal>
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs font-mono text-white/30 mb-2">Usage</p>
              <pre className="text-sm text-white/70 overflow-x-auto"><code>{`<WordScrambleGame
  words={[
    { word: "NEURAL", hint: "Type of network" },
    { word: "TENSOR", hint: "Multi-dimensional array" },
  ]}
  onComplete={({ solved, total, time }) => console.log(solved, total)}
/>`}</code></pre>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ─── Who Wants to Be a Millionaire ─── */}
      <Section id="millionaire">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <Reveal>
            <p className="text-sm font-medium text-yellow-500 uppercase tracking-widest mb-3">
              Template 9
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Who Wants to Be a Millionaire
            </h2>
            <p className="text-gray-500 max-w-xl mb-4 leading-relaxed">
              Progressive-stakes quiz with escalating prizes. Players get two lifelines:
              50:50 (eliminates two wrong answers) and Skip. Wrong answers drop to the
              last safe haven. A prize ladder shows progress. High tension, high engagement.
            </p>
          </Reveal>
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { icon: <Crown className="w-4 h-4" />, label: "Escalating stakes" },
                { icon: <ArrowRightLeft className="w-4 h-4" />, label: "50:50 lifeline" },
                { icon: <GraduationCap className="w-4 h-4" />, label: "Safe havens" },
                { icon: <Sparkles className="w-4 h-4" />, label: "Suspense reveal" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm">
                  {f.icon}
                  {f.label}
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal>
            <MillionaireGame
              questions={MILLIONAIRE_QUESTIONS}
              height="540px"
              className="border border-gray-200 shadow-xl"
            />
          </Reveal>
          <Reveal>
            <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs font-mono text-gray-400 mb-2">Usage</p>
              <pre className="text-sm text-gray-700 overflow-x-auto"><code>{`<MillionaireGame
  questions={[
    { question: "What does GPT stand for?",
      options: ["General Purpose", "Generative Pre-trained Transformer",
                "Global Processing", "Guided Pattern"],
      correct: 1 },
  ]}
  onComplete={({ prize, questionsAnswered }) => console.log(prize)}
/>`}</code></pre>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ─── Crossword ─── */}
      <Section dark id="crossword">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <Reveal>
            <p className="text-sm font-medium text-teal-400 uppercase tracking-widest mb-3">
              Template 10
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Crossword Puzzle
            </h2>
            <p className="text-white/50 max-w-xl mb-4 leading-relaxed">
              Full interactive crossword with across/down clues, keyboard navigation,
              cell highlighting, and auto-advance. Click a clue or cell to start
              typing. Tab between clues. Reveal letters when stuck. Validates each
              word on completion.
            </p>
          </Reveal>
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { icon: <Hash className="w-4 h-4" />, label: "Grid puzzle" },
                { icon: <Lightbulb className="w-4 h-4" />, label: "Reveal hints" },
                { icon: <Target className="w-4 h-4" />, label: "Auto-validate" },
                { icon: <Trophy className="w-4 h-4" />, label: "Time tracking" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm">
                  {f.icon}
                  {f.label}
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal>
            <CrosswordGame
              clues={CROSSWORD_CLUES}
              height="480px"
              className="border border-white/10 shadow-xl"
            />
          </Reveal>
          <Reveal>
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs font-mono text-white/30 mb-2">Usage</p>
              <pre className="text-sm text-white/70 overflow-x-auto"><code>{`<CrosswordGame
  clues={[
    { answer: "NEURAL", clue: "Brain-inspired network",
      row: 0, col: 0, direction: "across" },
    { answer: "EPOCH", clue: "Training pass",
      row: 0, col: 0, direction: "down" },
  ]}
  onComplete={({ time, hintsUsed }) => console.log(time)}
/>`}</code></pre>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ─── Timeline Builder ─── */}
      <Section id="timeline">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <Reveal>
            <p className="text-sm font-medium text-indigo-500 uppercase tracking-widest mb-3">
              Template 11
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Timeline Builder
            </h2>
            <p className="text-gray-500 max-w-xl mb-4 leading-relaxed">
              Drag events onto a timeline in chronological order. Correctly placed
              events lock in with their year revealed. Wrong placements bounce back
              for another try. Tracks attempts and time. Perfect for history, project
              milestones, and process sequencing.
            </p>
          </Reveal>
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { icon: <Clock className="w-4 h-4" />, label: "Chronological order" },
                { icon: <GripVertical className="w-4 h-4" />, label: "Drag to place" },
                { icon: <Target className="w-4 h-4" />, label: "Lock on correct" },
                { icon: <Sparkles className="w-4 h-4" />, label: "Attempt tracking" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm">
                  {f.icon}
                  {f.label}
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal>
            <TimelineGame
              events={TIMELINE_EVENTS}
              title="History of AI"
              height="520px"
              className="border border-gray-200 shadow-xl"
            />
          </Reveal>
          <Reveal>
            <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs font-mono text-gray-400 mb-2">Usage</p>
              <pre className="text-sm text-gray-700 overflow-x-auto"><code>{`<TimelineGame
  events={[
    { label: "Perceptron invented", year: 1958 },
    { label: "Transformer paper", year: 2017 },
    { label: "ChatGPT launch", year: 2022 },
  ]}
  title="History of AI"
  onComplete={({ attempts, time }) => console.log(attempts)}
/>`}</code></pre>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ─── Tower Defense ─── */}
      <Section dark id="tower-defense">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <Reveal>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-medium text-red-400 uppercase tracking-widest">Template 12</span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-400/20 rounded-full">Advanced</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Tower Defense
            </h2>
            <p className="text-white/50 max-w-xl mb-4 leading-relaxed">
              Full real-time strategy game loop. Enemies spawn in waves and follow a
              predefined path. Place towers with different abilities (Blaster, Cannon,
              Frost, Sniper) on the grid to stop them. Manage gold economy, use splash
              damage strategically, and survive all waves. Bosses spawn every 3rd wave.
            </p>
          </Reveal>
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { icon: <Shield className="w-4 h-4" />, label: "4 tower types" },
                { icon: <Swords className="w-4 h-4" />, label: "Wave spawning" },
                { icon: <Target className="w-4 h-4" />, label: "Projectile tracking" },
                { icon: <Trophy className="w-4 h-4" />, label: "Gold economy" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm">
                  {f.icon}
                  {f.label}
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal>
            <TowerDefenseGame
              waves={6}
              startGold={200}
              height="560px"
              className="border border-white/10 shadow-xl"
            />
          </Reveal>
          <Reveal>
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs font-mono text-white/30 mb-2">Usage</p>
              <pre className="text-sm text-white/70 overflow-x-auto"><code>{`<TowerDefenseGame
  towers={[
    { id: "blaster", label: "Blaster", color: "#22d3ee",
      range: 100, damage: 15, fireRate: 800, cost: 50 },
    { id: "cannon", label: "Cannon", color: "#F87171",
      range: 80, damage: 40, fireRate: 1500, cost: 100 },
  ]}
  waves={8}
  startGold={200}
  onComplete={({ wavesCleared, score }) => console.log(score)}
/>`}</code></pre>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ─── Maze Runner ─── */}
      <Section id="maze">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <Reveal>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-medium text-cyan-500 uppercase tracking-widest">Template 13</span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-400/20 rounded-full">Advanced</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Maze Runner
            </h2>
            <p className="text-gray-500 max-w-xl mb-4 leading-relaxed">
              Procedurally generated maze using the recursive backtracker algorithm.
              Navigate with WASD or arrow keys through fog of war. Collect items
              scattered throughout the maze. A minimap in the corner reveals explored
              territory. Every playthrough is unique. Tune difficulty by adjusting grid size.
            </p>
          </Reveal>
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { icon: <Map className="w-4 h-4" />, label: "Procedural generation" },
                { icon: <Eye className="w-4 h-4" />, label: "Fog of war" },
                { icon: <Compass className="w-4 h-4" />, label: "Minimap" },
                { icon: <Sparkles className="w-4 h-4" />, label: "Collectibles" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm">
                  {f.icon}
                  {f.label}
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal>
            <MazeGame
              size={10}
              collectibles={MAZE_COLLECTIBLES}
              fogOfWar={true}
              height="540px"
              className="border border-gray-200 shadow-xl"
            />
          </Reveal>
          <Reveal>
            <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs font-mono text-gray-400 mb-2">Usage</p>
              <pre className="text-sm text-gray-700 overflow-x-auto"><code>{`<MazeGame
  size={12}
  collectibles={[
    { label: "GPU", color: "#22d3ee" },
    { label: "Data", color: "#818CF8" },
    { label: "Model", color: "#A855F7" },
  ]}
  fogOfWar={true}
  onComplete={({ time, collected }) => console.log(time)}
/>`}</code></pre>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ─── Pipe Connect ─── */}
      <Section dark id="pipe-connect">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <Reveal>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-medium text-purple-400 uppercase tracking-widest">Template 14</span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-400/20 rounded-full">Advanced</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Pipe Connect
            </h2>
            <p className="text-white/50 max-w-xl mb-4 leading-relaxed">
              Rotate pipe segments to connect source to sink. The puzzle generates
              a solved network using a random spanning tree, then scrambles all tile
              rotations. Click tiles to rotate 90 degrees. Connected pipes glow cyan.
              Solve by connecting every cell in the network. A visual metaphor for
              data pipelines, system architecture, or process flow.
            </p>
          </Reveal>
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { icon: <Workflow className="w-4 h-4" />, label: "Flow simulation" },
                { icon: <RotateCcw className="w-4 h-4" />, label: "Rotate to solve" },
                { icon: <GitBranch className="w-4 h-4" />, label: "Spanning tree gen" },
                { icon: <Sparkles className="w-4 h-4" />, label: "Connected glow" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm">
                  {f.icon}
                  {f.label}
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal>
            <PipeConnectGame
              gridSize={6}
              difficulty="medium"
              height="540px"
              className="border border-white/10 shadow-xl"
            />
          </Reveal>
          <Reveal>
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs font-mono text-white/30 mb-2">Usage</p>
              <pre className="text-sm text-white/70 overflow-x-auto"><code>{`<PipeConnectGame
  gridSize={6}
  difficulty="medium"
  onComplete={({ time, moves }) => console.log(time, moves)}
/>`}</code></pre>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ─── CTA ─── */}
      <Section dark id="cta">
        <div className="min-h-[50vh] flex flex-col items-center justify-center px-6 text-center py-24 pb-32">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              <AnimatedGradientText>Gamify your next presentation</AnimatedGradientText>
            </h2>
          </Reveal>
          <Reveal>
            <p className="text-white/50 max-w-lg leading-relaxed mb-8">
              Import any template, pass your content as props, and drop it into a
              scroll section or slide. The audience plays; you present.
            </p>
          </Reveal>
          <Reveal>
            <div className="flex gap-4 text-sm">
              <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60">
                14 templates
              </div>
              <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60">
                Phaser 3.90
              </div>
              <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60">
                Dynamic import
              </div>
            </div>
          </Reveal>
        </div>
      </Section>
    </main>
  );
}
