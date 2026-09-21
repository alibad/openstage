"use client";

import type { ReactNode } from "react";
import type { Presentation } from "@/lib/types";
import {
  CodePreview,
  NumberedSteps,
  SectionTag,
  SlideCallout,
  SlideHeading,
  SlideSubtitle,
} from "@/components/slide-primitives";
import {
  ArrowRight,
  BatteryCharging,
  BrainCircuit,
  Check,
  ChevronRight,
  CloudOff,
  Cpu,
  Download,
  Gauge,
  Gpu,
  GitBranch,
  HardDrive,
  Layers3,
  MemoryStick,
  Network,
  PackageCheck,
  ShieldCheck,
  ThermometerSun,
  TimerReset,
  TriangleAlert,
  Workflow,
  Zap,
} from "lucide-react";

const accent = "#67E8F9";

function Tile({
  icon,
  title,
  children,
  tone = "default",
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  tone?: "default" | "accent";
}) {
  return (
    <div
      className={`flex h-full flex-col rounded-2xl border p-5 ${
        tone === "accent"
          ? "border-brand-2/30 bg-brand-2/10"
          : "border-border bg-surface"
      }`}
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-2/10 text-brand-2">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <div className="mt-2 text-sm leading-relaxed text-muted">{children}</div>
    </div>
  );
}

function OpeningSlide() {
  return (
    <div className="relative flex h-full flex-col justify-center overflow-hidden">
      <div className="absolute -right-16 top-1/2 h-[430px] w-[430px] -translate-y-1/2 rounded-[5rem] border border-brand-2/20 bg-brand-2/5 rotate-12" />
      <div className="absolute right-12 top-1/2 h-[330px] w-[170px] -translate-y-1/2 rounded-[2.5rem] border-2 border-brand-2/40 bg-code-bg shadow-[0_0_80px_rgba(103,232,249,0.12)]">
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-white/15" />
        <div className="mx-auto mt-20 flex h-20 w-20 items-center justify-center rounded-3xl border border-brand-2/30 bg-brand-2/10 text-brand-2">
          <BrainCircuit className="h-10 w-10" />
        </div>
        <div className="mx-auto mt-8 h-1.5 w-24 rounded-full bg-brand-2/50" />
        <div className="mx-auto mt-3 h-1.5 w-16 rounded-full bg-white/10" />
      </div>

      <div className="relative z-10 max-w-[70%]">
        <SectionTag label="Mobile inference field guide" />
        <h1 className="display-lg font-semibold leading-[0.92] tracking-tight text-foreground">
          The model<br />in your pocket.
        </h1>
        <p className="mt-6 max-w-2xl text-xl leading-relaxed text-muted">
          How to turn a trained model into a fast, private mobile feature—then prove the GPU is actually doing the work.
        </p>
        <div className="mt-8 flex items-center gap-3 text-sm text-muted">
          <span className="h-px w-14 bg-brand-2" />
          <span>Export · compress · delegate · profile</span>
        </div>
      </div>
    </div>
  );
}

function WhyDeviceSlide() {
  return (
    <div className="flex h-full flex-col justify-center gap-6">
      <div>
        <SectionTag label="01 · The case" />
        <SlideHeading>Why move inference onto the phone?</SlideHeading>
        <SlideSubtitle>
          Not because edge is fashionable. Because some product promises are stronger without a round trip.
        </SlideSubtitle>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <Tile icon={<Gauge className="h-5 w-5" />} title="Interaction speed">
          Camera, audio, and touch loops can respond without network latency.
        </Tile>
        <Tile icon={<ShieldCheck className="h-5 w-5" />} title="Private by default" tone="accent">
          Raw personal inputs can stay on the user&apos;s device.
        </Tile>
        <Tile icon={<CloudOff className="h-5 w-5" />} title="Works offline">
          The feature survives tunnels, travel, and bad connectivity.
        </Tile>
        <Tile icon={<BatteryCharging className="h-5 w-5" />} title="Known unit cost">
          Compute ships with the device instead of metering every inference.
        </Tile>
      </div>
      <SlideCallout icon={<TriangleAlert className="h-5 w-5" />}>
        <strong className="text-foreground">The trade:</strong> cloud variability becomes device fragmentation, memory pressure, and thermal limits.
      </SlideCallout>
    </div>
  );
}

const pipeline = [
  { n: "01", title: "Shape", copy: "Freeze the graph, inputs, outputs, and supported operators." },
  { n: "02", title: "Shrink", copy: "Use FP16 or quantization; validate quality after every change." },
  { n: "03", title: "Lower", copy: "Compile supported subgraphs for Core ML, Vulkan, GPU, or NPU." },
  { n: "04", title: "Ship", copy: "Package, warm up, profile on real devices, and retain a fallback." },
];

function PipelineSlide() {
  return (
    <div className="flex h-full flex-col justify-center gap-7">
      <div>
        <SectionTag label="02 · The pipeline" />
        <SlideHeading>A model file is not a mobile feature.</SlideHeading>
        <SlideSubtitle>
          Deployment is a compiler pipeline. Each stage changes what the next stage can accelerate.
        </SlideSubtitle>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-stretch gap-3">
        {pipeline.flatMap((item, index) => [
          <div key={item.n} className="rounded-2xl border border-border bg-surface p-5">
            <div className="text-xs font-bold tracking-[0.2em] text-brand-2">{item.n}</div>
            <h3 className="mt-4 text-xl font-semibold text-foreground">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.copy}</p>
          </div>,
          ...(index < pipeline.length - 1
            ? [<ArrowRight key={`${item.n}-arrow`} className="self-center text-brand-3" />]
            : []),
        ])}
      </div>
      <SlideCallout icon={<Workflow className="h-5 w-5" />}>
        The GPU only sees the subgraph the converter can lower. Unsupported operators silently turn one fast graph into several slow islands.
      </SlideCallout>
    </div>
  );
}

function HardwareSlide() {
  const rows = [
    {
      icon: <Cpu className="h-5 w-5" />,
      unit: "CPU",
      fit: "Control flow, small tensors, unsupported ops",
      note: "Universal fallback",
      color: "bg-slate-400",
    },
    {
      icon: <Gpu className="h-5 w-5" />,
      unit: "GPU",
      fit: "Parallel FP16 math, vision, dense tensor workloads",
      note: "Fast when transfers stay low",
      color: "bg-cyan-400",
    },
    {
      icon: <BrainCircuit className="h-5 w-5" />,
      unit: "NPU / ANE",
      fit: "Supported neural graphs at high efficiency",
      note: "Often the better mobile target",
      color: "bg-violet-400",
    },
  ];

  return (
    <div className="flex h-full flex-col justify-center gap-6">
      <div>
        <SectionTag label="03 · The hardware" />
        <SlideHeading>“Use the GPU” is the wrong requirement.</SlideHeading>
        <SlideSubtitle>
          Ask for the best latency, energy, and quality on the target device. Let the runtime earn the accelerator.
        </SlideSubtitle>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {rows.map((row, index) => (
          <div
            key={row.unit}
            className={`grid grid-cols-[1.1fr_2fr_1.4fr] items-center gap-6 p-5 ${index ? "border-t border-border" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-2/10 text-brand-2">
                {row.icon}
              </div>
              <div>
                <p className="font-semibold text-foreground">{row.unit}</p>
                <div className={`mt-1 h-1 w-14 rounded-full ${row.color}`} />
              </div>
            </div>
            <p className="text-sm leading-relaxed text-foreground/80">{row.fit}</p>
            <p className="text-sm text-muted">{row.note}</p>
          </div>
        ))}
      </div>
      <SlideCallout icon={<Zap className="h-5 w-5" />}>
        Apple Core ML can schedule across CPU, GPU, and Neural Engine. Android runtimes expose GPU, Vulkan, and vendor NPU delegates—with CPU fallback.
      </SlideCallout>
    </div>
  );
}

function RuntimeSlide() {
  const routes = [
    {
      label: "Apple first",
      title: "Core ML",
      path: "PyTorch → coremltools → .mlpackage",
      detail: "Best Xcode integration and automatic Apple silicon scheduling.",
    },
    {
      label: "Android first",
      title: "LiteRT",
      path: "TensorFlow / PyTorch → .tflite",
      detail: "GPU delegate, Play services runtime, and a broad device surface.",
    },
    {
      label: "PyTorch across both",
      title: "ExecuTorch",
      path: "torch.export → .pte → backend",
      detail: "Core ML or MPS on Apple; Vulkan or vendor backends on Android.",
    },
  ];

  return (
    <div className="flex h-full flex-col justify-center gap-6">
      <div>
        <SectionTag label="04 · Pick a runtime" />
        <SlideHeading>Choose the path you can debug.</SlideHeading>
        <SlideSubtitle>
          The best runtime is the one that supports your operators, target devices, and team—not the one with the longest backend list.
        </SlideSubtitle>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {routes.map((route, index) => (
          <div key={route.title} className={`flex flex-col rounded-2xl border p-5 ${index === 2 ? "border-brand-2/30 bg-brand-2/10" : "border-border bg-surface"}`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-3">{route.label}</p>
            <h3 className="mt-3 text-2xl font-semibold text-foreground">{route.title}</h3>
            <div className="mt-4 rounded-lg bg-code-bg px-3 py-2 font-mono text-xs text-cyan-200">{route.path}</div>
            <p className="mt-4 text-sm leading-relaxed text-muted">{route.detail}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 text-sm text-muted">
        <Network className="h-4 w-4 text-brand-2" />
        ONNX Runtime is the pragmatic fourth route when ONNX is already your source of truth.
      </div>
    </div>
  );
}

function FitSlide() {
  const tasks = [
    { name: "Classification / detection", fit: "Start here", bar: "w-[92%]", note: "Static shapes and compact graphs make an ideal first spike." },
    { name: "Speech / embeddings", fit: "Strong fit", bar: "w-[78%]", note: "Stream carefully; keep preprocessing and state in the profile." },
    { name: "Image generation", fit: "Device-specific", bar: "w-[56%]", note: "Memory, model staging, and sustained heat dominate." },
    { name: "Small language model", fit: "Quantize first", bar: "w-[42%]", note: "Weights are only part of the budget; KV cache grows with context." },
  ];

  return (
    <div className="flex h-full flex-col justify-center gap-6">
      <div>
        <SectionTag label="05 · What fits" />
        <SlideHeading>Memory is the first model requirement.</SlideHeading>
        <SlideSubtitle>
          Count weights, activations, runtime buffers, preprocessing, and app UI. Peak memory—not file size—decides whether the feature survives.
        </SlideSubtitle>
      </div>
      <div className="space-y-3 rounded-2xl border border-border bg-surface p-5">
        {tasks.map((task) => (
          <div key={task.name} className="grid grid-cols-[1.25fr_1fr_2fr] items-center gap-5">
            <p className="text-sm font-medium text-foreground">{task.name}</p>
            <div>
              <div className="h-2 overflow-hidden rounded-full bg-foreground/5">
                <div className={`h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 ${task.bar}`} />
              </div>
              <p className="mt-1.5 text-xs font-medium text-brand-2">{task.fit}</p>
            </div>
            <p className="text-xs leading-relaxed text-muted">{task.note}</p>
          </div>
        ))}
      </div>
      <SlideCallout icon={<MemoryStick className="h-5 w-5" />}>
        Quantization is not just compression. It changes operator support, accelerator placement, memory bandwidth, and sometimes output quality.
      </SlideCallout>
    </div>
  );
}

function AppleSlide() {
  return (
    <div className="grid h-full grid-cols-[0.9fr_1.1fr] items-center gap-8">
      <div>
        <SectionTag label="06 · Apple path" />
        <SlideHeading>Core ML: ask the OS, then inspect the plan.</SlideHeading>
        <SlideSubtitle>
          Convert the model, load it with the allowed compute units, and use Xcode&apos;s performance report on a connected device.
        </SlideSubtitle>
        <div className="mt-6 space-y-3">
          {[
            "Prefer .all before forcing the GPU",
            "Use FP16 when operator support allows it",
            "Check which operations miss GPU or Neural Engine",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm text-foreground/80">
              <Check className="h-4 w-4 shrink-0 text-brand-2" />
              {item}
            </div>
          ))}
        </div>
      </div>
      <CodePreview filename="ModelRunner.swift">
        <span className="text-violet-300">let</span> config = MLModelConfiguration(){`\n`}
        config.computeUnits = <span className="text-cyan-300">.all</span>{`\n\n`}
        <span className="text-violet-300">let</span> model = <span className="text-cyan-300">try</span> MobileModel({`\n`}
        <span className="pl-5">configuration: config</span>{`\n`}
        ){`\n\n`}
        <span className="text-violet-300">let</span> output = <span className="text-cyan-300">try await</span>{`\n`}
        <span className="pl-5">model.prediction(input: input)</span>{`\n\n`}
        <span className="text-white/35">{"// Profile .all vs .cpuAndGPU."}</span>{`\n`}
        <span className="text-white/35">{"// Keep the faster stable choice."}</span>
      </CodePreview>
    </div>
  );
}

function AndroidSlide() {
  return (
    <div className="grid h-full grid-cols-[0.9fr_1.1fr] items-center gap-8">
      <div>
        <SectionTag label="07 · Android path" />
        <SlideHeading>LiteRT: delegate when compatible, fall back when not.</SlideHeading>
        <SlideSubtitle>
          The GPU delegate must be created and invoked on the same thread. Compatibility is a runtime decision, not a build-time assumption.
        </SlideSubtitle>
        <div className="mt-6 rounded-xl border border-brand-2/20 bg-brand-2/10 p-4 text-sm leading-relaxed text-muted">
          Google recommends the Play services LiteRT runtime for Android devices that include Google Play services.
        </div>
      </div>
      <CodePreview filename="ModelRunner.kt">
        <span className="text-violet-300">val</span> compatible = CompatibilityList(){`\n`}
        <span className="text-violet-300">val</span> options = Interpreter.Options(){`\n\n`}
        <span className="text-violet-300">if</span> (compatible.isDelegateSupportedOnThisDevice) {`{`}{`\n`}
        <span className="pl-5">options.addDelegate(</span>{`\n`}
        <span className="pl-10 text-cyan-300">GpuDelegate</span>(compatible.bestOptionsForThisDevice){`\n`}
        <span className="pl-5">)</span>{`\n`}
        {`}`} <span className="text-violet-300">else</span> {`{`}{`\n`}
        <span className="pl-5">options.setNumThreads(4)</span>{`\n`}
        {`}`}{`\n\n`}
        <span className="text-violet-300">val</span> runner = Interpreter(model, options){`\n`}
        runner.run(input, output)
      </CodePreview>
    </div>
  );
}

function PartitionSlide() {
  const nodes = [
    { label: "Conv", gpu: true },
    { label: "Norm", gpu: true },
    { label: "Custom op", gpu: false },
    { label: "Attention", gpu: true },
    { label: "Output", gpu: true },
  ];

  return (
    <div className="flex h-full flex-col justify-center gap-6">
      <div>
        <SectionTag label="08 · The silent failure" />
        <SlideHeading>One unsupported op can split the graph.</SlideHeading>
        <SlideSubtitle>
          Every split adds synchronization and tensor transfers. A GPU badge does not mean the whole inference stayed on the GPU.
        </SlideSubtitle>
      </div>
      <div className="rounded-2xl border border-border bg-code-bg p-7">
        <div className="flex items-center justify-center gap-3">
          {nodes.map((node, index) => (
            <div key={node.label} className="contents">
              <div className={`rounded-xl border px-5 py-4 text-center ${node.gpu ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-100" : "border-amber-400/50 bg-amber-400/10 text-amber-100"}`}>
                <p className="text-xs font-semibold uppercase tracking-wider">{node.gpu ? "GPU" : "CPU"}</p>
                <p className="mt-2 text-sm font-medium">{node.label}</p>
              </div>
              {index < nodes.length - 1 && <ChevronRight className={`h-5 w-5 ${index === 1 || index === 2 ? "text-amber-300" : "text-white/25"}`} />}
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-center gap-10 text-xs text-white/45">
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-400" /> Accelerated island</span>
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-400" /> Fallback + transfer</span>
        </div>
      </div>
      <SlideCallout icon={<GitBranch className="h-5 w-5" />}>
        Fix the graph before tuning threads: replace the op, make shapes static, change precision, or accept an intentional CPU path.
      </SlideCallout>
    </div>
  );
}

function BenchmarkSlide() {
  const measures = [
    { icon: <TimerReset className="h-5 w-5" />, title: "Latency", copy: "Cold load, warm-up, steady-state p50 and p95." },
    { icon: <MemoryStick className="h-5 w-5" />, title: "Memory", copy: "Peak resident memory and largest intermediate tensor." },
    { icon: <ThermometerSun className="h-5 w-5" />, title: "Sustained load", copy: "Repeated inference after the device warms up." },
    { icon: <BatteryCharging className="h-5 w-5" />, title: "Energy + quality", copy: "Battery impact and task accuracy after compression." },
  ];

  return (
    <div className="flex h-full flex-col justify-center gap-6">
      <div>
        <SectionTag label="09 · The benchmark" />
        <SlideHeading>Benchmark the feature, not the kernel.</SlideHeading>
        <SlideSubtitle>
          Include decode, resize, tokenization, tensor copies, post-processing, and UI handoff. Users wait for the whole pipeline.
        </SlideSubtitle>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {measures.map((item) => (
          <Tile key={item.title} icon={item.icon} title={item.title}>{item.copy}</Tile>
        ))}
      </div>
      <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-5 py-4 text-sm">
        <span className="font-medium text-foreground">Minimum device matrix</span>
        <span className="text-muted">oldest supported · median target · current flagship · low-battery mode</span>
      </div>
    </div>
  );
}

function ProductionSlide() {
  return (
    <div className="flex h-full flex-col justify-center gap-6">
      <div>
        <SectionTag label="10 · Production" />
        <SlideHeading>The model needs a release system.</SlideHeading>
        <SlideSubtitle>
          Treat weights like executable product assets: versioned, verified, observable, and reversible.
        </SlideSubtitle>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-4">
        <Tile icon={<Download className="h-5 w-5" />} title="Deliver">
          Bundle the first model or download it from a versioned manifest.
        </Tile>
        <ArrowRight className="text-brand-3" />
        <Tile icon={<PackageCheck className="h-5 w-5" />} title="Verify" tone="accent">
          Check signature, checksum, format, free storage, and device eligibility.
        </Tile>
        <ArrowRight className="text-brand-3" />
        <Tile icon={<Layers3 className="h-5 w-5" />} title="Activate">
          Warm up, observe runtime choice, and retain the previous known-good model.
        </Tile>
      </div>
      <SlideCallout icon={<HardDrive className="h-5 w-5" />}>
        A remote kill switch and CPU/server fallback turn hardware fragmentation from an outage into a routing decision.
      </SlideCallout>
    </div>
  );
}

function SpikeSlide() {
  return (
    <div className="flex h-full flex-col justify-center gap-6">
      <div>
        <SectionTag label="11 · Start Monday" />
        <SlideHeading>A two-day proof that answers the real question.</SlideHeading>
        <SlideSubtitle>
          Do not begin with your largest model. Begin with the smallest end-to-end slice that uses the same operators and input path.
        </SlideSubtitle>
      </div>
      <NumberedSteps
        steps={[
          { title: "Lock the product budget", description: "Target devices, max model download, latency class, memory ceiling, and acceptable quality loss.", tag: "2 hours" },
          { title: "Export one representative graph", description: "Use fixed shapes where possible; record every unsupported or partitioned operator.", tag: "half day" },
          { title: "Integrate both paths", description: "Accelerator plus CPU fallback, with runtime selection and errors visible in logs.", tag: "half day" },
          { title: "Profile three devices", description: "Cold, warm, sustained, memory, and quality. Keep the raw report beside the model artifact.", tag: "day 2" },
        ]}
      />
    </div>
  );
}

const references = [
  { label: "Apple · Core ML compute units", href: "https://developer.apple.com/documentation/coreml/mlcomputeunits" },
  { label: "Apple · Deploy models on-device", href: "https://developer.apple.com/videos/play/wwdc2024/10161/" },
  { label: "Google · LiteRT GPU delegate", href: "https://developers.google.com/edge/litert/android/gpu" },
  { label: "PyTorch · ExecuTorch quick start", href: "https://docs.pytorch.org/executorch/stable/pathway-quickstart.html" },
];

function ClosingSlide() {
  return (
    <div className="flex h-full flex-col justify-center gap-8">
      <div className="max-w-4xl">
        <SectionTag label="The rule" />
        <h2 className="display-lg font-semibold leading-[0.96] tracking-tight text-foreground">
          Ship the profiler,<br />not the promise.
        </h2>
        <p className="mt-6 max-w-2xl text-xl leading-relaxed text-muted">
          The goal is not a GPU icon. It is a private, responsive feature with a measured hardware path and a safe fallback.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {references.map((reference) => (
          <a
            key={reference.href}
            href={reference.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted transition hover:-translate-y-0.5 hover:border-brand-2/40 hover:text-foreground"
          >
            <span>{reference.label}</span>
            <ArrowRight className="h-4 w-4 text-brand-2 transition-transform group-hover:translate-x-1" />
          </a>
        ))}
      </div>
    </div>
  );
}

export const mobileInference: Presentation = {
  slug: "mobile-inference",
  title: "The Model in Your Pocket",
  subtitle: "How to deploy AI inference on the mobile GPU",
  author: "Ali Badereddin",
  date: "September 2026",
  description:
    "A practical field guide to exporting, compressing, accelerating, profiling, and shipping AI models on iOS and Android.",
  accentColor: accent,
  slides: [
    { id: "opening", content: <OpeningSlide />, notes: "Open with the distinction between training and deployment. We already have a model; the question is how to turn it into a reliable mobile feature.", layout: "title", transition: "mask", mood: "night" },
    { id: "why-device", content: <WhyDeviceSlide />, notes: "On-device inference can improve interaction latency, privacy, offline behavior, and marginal cost. It trades cloud variability for device constraints.", transition: "slide", mood: "cool" },
    { id: "pipeline", content: <PipelineSlide />, notes: "Walk through the deployment compiler pipeline: shape the graph, compress it, lower supported work to an accelerator, then ship and profile the integrated feature.", transition: "blur", mood: "night" },
    { id: "hardware", content: <HardwareSlide />, notes: "Do not hard-code GPU as the product requirement. CPU, GPU, and neural accelerators each win on different graphs and device states.", transition: "slide", mood: "mono" },
    { id: "runtime", content: <RuntimeSlide />, notes: "Choose Core ML for Apple-first work, LiteRT for Android-first work, or ExecuTorch when PyTorch portability is the central constraint. ONNX Runtime remains useful when ONNX is already the canonical artifact.", transition: "zoom", mood: "cool" },
    { id: "fit", content: <FitSlide />, notes: "Model file size is not the memory requirement. Profile weights, activations, caches, runtime buffers, preprocessing, and the rest of the app together.", transition: "slide", mood: "dawn" },
    { id: "apple", content: <AppleSlide />, notes: "On Apple platforms, start with Core ML computeUnits set to all, then compare against CPU and GPU restrictions using device performance reports. Let evidence choose the policy.", layout: "code", transition: "slide", mood: "night" },
    { id: "android", content: <AndroidSlide />, notes: "On Android, detect GPU compatibility at runtime and preserve CPU fallback. The GPU delegate must be initialized and invoked on the same thread.", layout: "code", transition: "slide", mood: "night" },
    { id: "partition", content: <PartitionSlide />, notes: "Unsupported operators can split a graph and introduce expensive transfers. Inspect placement and fix the graph before tuning threads or declaring acceleration complete.", transition: "blur", mood: "night" },
    { id: "benchmark", content: <BenchmarkSlide />, notes: "Measure the full feature on real devices: cold and warm latency, memory, sustained thermals, energy, and quality after compression.", transition: "slide", mood: "cool" },
    { id: "production", content: <ProductionSlide />, notes: "Treat models as release artifacts. Deliver them through a versioned manifest, verify them before activation, and keep a known-good rollback plus a safe fallback path.", transition: "zoom", mood: "mono" },
    { id: "spike", content: <SpikeSlide />, notes: "End with an executable two-day spike. A representative graph on three real devices will answer more than another week of framework comparison.", transition: "slide", mood: "dawn" },
    { id: "closing", content: <ClosingSlide />, notes: "The product goal is a measured, private, responsive feature—not a GPU badge. The official platform references are linked on screen.", layout: "center", transition: "fade", mood: "night" },
  ],
};
