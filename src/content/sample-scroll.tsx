"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Reveal,
  StaggerChildren,
  StaggerItem,
  AnimatedCounter,
  Typewriter,
  GradientText,
  AnimatedGradientText,
  FloatingParticles,
  MouseSpotlight,
  MagneticCard,
  TextRevealByWord,
  GradientDivider,
  AuroraBackground,
  MeshGradient,
  ParticleField,
  TextSplit,
  MaskReveal,
  ParallaxLayer,
  MagneticElement,
  SmoothCounter,
  ScrollRevealText,
  Spectrum,
  AnnotatedText,
  InteractionZone,
  ScrollProgress,
  StickyMedia,
} from "@/components/animations";
import {
  AnimatedBarChart,
  AnimatedLineChart,
  AnimatedPieChart,
  AnimatedTimeline,
  AnimatedMetric,
  FlowDiagram,
  ScoreMatrix,
  DataTable,
  BeforeAfter,
} from "@/components/charts";
import { usePrintMode, useM } from "@/lib/print-mode";
import { PrintButton } from "@/components/pdf-export";
import {
  Database,
  BarChart3,
  Sparkles,
  Layers,
  TrendingUp,
  Zap,
  Shield,
  Target,
  Rocket,
  Brain,
  Code,
  Users,
  Activity,
  Lock,
  Eye,
  Languages,
  ChevronDown,
} from "lucide-react";

const Globe3D = dynamic(
  () => import("@/components/3d").then((m) => ({ default: m.Globe3D })),
  { ssr: false },
);

const CHAPTERS = [
  { id: "hero", label: "Cover", dark: true },
  { id: "metrics", label: "Metrics", dark: false },
  { id: "text-effects", label: "Text", dark: true },
  { id: "charts", label: "Charts", dark: true },
  { id: "flow", label: "Flow", dark: false },
  { id: "sticky-demo", label: "Sticky", dark: true },
  { id: "scrollytelling", label: "Scroll", dark: true },
  { id: "decorative", label: "Effects", dark: false },
  { id: "interactive", label: "Interact", dark: true },
  { id: "timeline", label: "Timeline", dark: true },
  { id: "globe", label: "Globe", dark: true },
  { id: "data-table", label: "Table", dark: true },
  { id: "visual-effects", label: "Entrance", dark: false },
  { id: "cta", label: "Close", dark: true },
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
        { rootMargin: "-20% 0px -20% 0px" },
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const onDark = CHAPTERS.find((c) => c.id === active)?.dark ?? true;

  return (
    <nav className="fixed top-1/2 -translate-y-1/2 right-6 z-50 hidden lg:flex flex-col gap-2.5 print-hidden transition-colors duration-500">
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
                  ? onDark
                    ? "text-brand-1 opacity-100 translate-x-0"
                    : "text-brand-3 opacity-100 translate-x-0"
                  : onDark
                    ? "text-white/0 group-hover:text-white/50 translate-x-2 group-hover:translate-x-0"
                    : "text-black/0 group-hover:text-black/50 translate-x-2 group-hover:translate-x-0"
              }`}
            >
              {ch.label}
            </span>
            <span
              className={`rounded-full transition-all duration-500 ${
                isActive
                  ? onDark
                    ? "w-2.5 h-2.5 bg-brand-1 shadow-[0_0_10px_rgba(125,211,252,0.5)]"
                    : "w-2.5 h-2.5 bg-brand-3 shadow-[0_0_10px_rgba(167,139,250,0.4)]"
                  : onDark
                    ? "w-1.5 h-1.5 bg-white/25 group-hover:bg-white/50"
                    : "w-1.5 h-1.5 bg-black/20 group-hover:bg-black/40"
              }`}
            />
          </a>
        );
      })}
    </nav>
  );
}

type Lang = "en" | "ar";

const t = {
  en: {
    dir: "ltr" as const,
    heroTitle: "Visual Effects Showcase",
    heroSub: "35+ components for immersive, data-driven presentations. Every visual you see on this page is a reusable component.",
    heroBtn: "Scroll to explore",
    metricKicker: "AnimatedMetric",
    metricTitle: "Numbers that tell a story",
    metricSub: "Each metric animates on scroll with count-up effects, trend indicators, and inline sparklines.",
    metricLabels: ["Annual Revenue", "Uptime SLA", "Active Models", "Response Time"],
    textKicker: "Text Animations",
    textTitle: "Words that move",
    textSub: "Typewriter, gradient, counter, and parallax text effects for emphasis and storytelling.",
    typewriterLabel: "Typewriter",
    typewriterLines: ["Your company builds the future of presentations.", "From scroll narratives to slide decks to video exports."],
    gradientLabel: "GradientText",
    gradientText: "Static gradient fills using brand colors",
    animGradientLabel: "AnimatedGradientText",
    animGradientText: "Shifting animated gradient that cycles colors",
    counterLabel: "AnimatedCounter",
    counterLabels: ["Total projects", "Accuracy rate", "Cost saved"],
    revealLabel: "TextRevealByWord",
    revealText: "Every word reveals as you scroll through this sentence, creating a dramatic reading experience that keeps the audience focused.",
    chartKicker: "Chart Components",
    chartTitle: "Data drives the narrative",
    barTitle: "Revenue by Quarter",
    lineTitle: "Revenue Trend",
    pieTitle: "Revenue Mix",
    scoreTitle: "Score Matrix",
    flowKicker: "FlowDiagram",
    flowTitle: "Architecture at a glance",
    flowSub: "Animated node-and-edge diagrams replace static SVGs. Nodes stagger in on scroll with dashed connectors.",
    flowNodes: ["Data Sources", "Ingestion", "AI Processing", "Quality Check", "Insights"],
    flowDescs: ["APIs, files, streams", "Validate & normalize", "LLM + ML pipeline", "Human-in-the-loop", "Reports & actions"],
    stickyKicker: "StickyMedia + Inline SVG",
    stickyTitle: "Pinned visuals, scrolling narrative",
    stickySub: "The pipeline SVG stays pinned while text steps scroll beside it. Toggle the language button (top-left) to see the dashboard in Arabic with full RTL support.",
    stickyStep1: "Step 1", stickyStep1Title: "Ingest at scale.", stickyStep1Desc: "Thousands of regulatory documents, court rulings, and compliance reports flow into the pipeline every day. OCR, translation, and entity extraction happen automatically.",
    stickyStep2: "Step 2", stickyStep2Title: "Analyze with precision.", stickyStep2Desc: "Domain-specific models classify, cross-reference, and surface contradictions across documents. Every claim is traceable to its source paragraph.",
    stickyStep3: "Step 3", stickyStep3Title: "Deliver with confidence.", stickyStep3Desc: "Decision-makers receive structured briefs with risk scores, recommendations, and full audit trails. No black boxes.",
    dashKicker: "StickyMedia + i18n Dashboard",
    dashSub: "Click العربية (top-left) to flip this mockup to Arabic with full RTL layout.",
    dashNav: "Navigation", dashNavTitle: "Navigation and context.", dashNavDesc: "A persistent sidebar organizes cases by status, priority, and assigned analyst. The header shows the active case at a glance.",
    dashAI: "AI Analysis", dashAITitle: "AI-generated analysis.", dashAIDesc: "The central panel presents compliance scores, flagged discrepancies, and recommended actions. Every finding links to source.",
    dashEv: "Evidence", dashEvTitle: "Evidence and citations.", dashEvDesc: "A collapsible evidence drawer surfaces the exact paragraphs, exhibits, and legal references supporting each AI finding.",
    scrollKicker: "Scrollytelling Components",
    scrollTitle: "Scroll-driven storytelling",
    scrollSub: "Components that respond to scroll position for immersive, narrative-driven presentations.",
    scrollRevealLabel: "ScrollRevealText",
    scrollRevealText: "Words highlight as you scroll, drawing attention to each phrase in sequence. This creates a powerful reading cadence that keeps the audience locked in.",
    spectrumLabel: "Spectrum",
    spectrumSub: "Qualitative positioning on a labeled axis",
    spectrumLeft: "Manual Process", spectrumRight: "Full Automation",
    spectrumItems: ["Legacy Systems", "Spreadsheets", "RPA Tools", "Current State", "With AI"],
    annotatedLabel: "AnnotatedText",
    annotatedSub: "Color-coded text segments with category legend",
    annotatedSegments: [
      { text: "The AI platform ", cat: "Product" },
      { text: "processed 2.4 million documents ", cat: "Metric" },
      { text: "across three government agencies ", cat: "Scope" },
      { text: "in under 72 hours, ", cat: "Metric" },
      { text: "replacing a manual workflow ", cat: "Impact" },
      { text: "that previously took 6 weeks ", cat: "Metric" },
      { text: "and required 40 full-time staff.", cat: "Impact" },
    ],
    decoKicker: "Decorative Effects",
    decoTitle: "Ambient atmosphere",
    decoSub: "Background effects, magnetic interactions, and layout helpers that add depth and polish.",
    staggerLabel: "StaggerChildren + StaggerItem",
    staggerItems: ["AI Models", "Data Pipeline", "Security", "Monitoring", "Team Ops", "Compliance", "API Layer", "Observability"],
    magnetLabel: "MagneticCard",
    magnetSub: "Hover over these cards to see the magnetic tilt effect",
    magnetCards: [{ t: "Speed", v: "47ms", d: "Avg response time" }, { t: "Accuracy", v: "99.7%", d: "Production SLA" }, { t: "Volume", v: "2.4M", d: "Daily requests" }],
    parallaxLabel: "ParallaxLayer",
    parallaxSub: "Elements move at different speeds as you scroll, creating depth",
    particleLabel: "FloatingParticles + MouseSpotlight",
    particleSub: "Move your cursor over the box below",
    particleText: "Ambient background effects",
    interKicker: "Interactive Components",
    interTitle: "Pause and explore",
    interSub: "Components that pause the scroll narrative and invite interaction.",
    zoneLabel: "InteractionZone",
    zoneTech: "Technical Deep Dive",
    zoneTechDesc: "The AI pipeline processes data through 4 stages: ingestion, normalization, inference, and quality assurance. Each stage runs in parallel across distributed workers.",
    zoneBiz: "Business Impact",
    zoneBizDesc: "Deploying the AI platform reduced operational costs by 62% and processing time from 6 weeks to 72 hours. Customer satisfaction scores improved by 28 points.",
    zoneSec: "Security & Compliance",
    zoneSecDesc: "SOC 2 Type II certified, HIPAA compliant, and FedRAMP authorized. Data never leaves the customer's VPC. Zero-trust architecture with end-to-end encryption.",
    zoneMetrics: ["Cost reduction", "Faster", "NPS lift"],
    beforeLabel: "BeforeAfter",
    beforeSub: "Drag the slider to compare two states",
    beforeTitle: "Before", beforeTime: "6 weeks", beforeDesc: "Manual document processing",
    afterTitle: "After", afterTime: "72 hours", afterDesc: "AI-powered pipeline",
    beforeMetrics: ["FTEs required", "Error rate"], afterMetrics: ["FTEs required", "Error rate"],
    timelineKicker: "AnimatedTimeline",
    timelineTitle: "Journey to production",
    timelineNodes: [
      { date: "Week 1-2", title: "Discovery & Audit", desc: "Stakeholder interviews, data quality assessment, infrastructure review." },
      { date: "Week 3-4", title: "Prototype", desc: "Working MVP with 3 core workflows and initial model training." },
      { date: "Week 5-8", title: "Integration", desc: "API integration, security hardening, load testing, documentation." },
      { date: "Week 9-10", title: "Pilot", desc: "Live deployment with 50 users, feedback loops, performance tuning." },
      { date: "Week 11-12", title: "Rollout", desc: "Full rollout, monitoring dashboards, team training, handover." },
    ],
    globeKicker: "Globe3D",
    globeTitle: "Global presence",
    globeSub: "Interactive 3D globe with connection arcs and location markers. Built with React Three Fiber, dynamically imported.",
    tableKicker: "DataTable + ParticleField",
    tableTitle: "Sortable, animated tables",
    tableCols: ["Model", "Accuracy", "Latency (ms)", "Cost/1K", "Status"],
    entranceKicker: "MaskReveal + TextSplit",
    entranceTitle: "Entrance animations",
    entranceSub: "Scroll down slowly to watch each element animate into view. Six mask shapes and seven text animation styles.",
    entranceTSLabel: "TextSplit animation styles",
    ctaTitle: "Build something stunning",
    ctaSub: "Every component on this page is available for your next presentation. Just import and compose.",
    ctaComponents: "components", ctaTemplates: "templates", ctaApis: "APIs",
  },
  ar: {
    dir: "rtl" as const,
    heroTitle: "معرض المؤثرات البصرية",
    heroSub: "أكثر من 35 مكوّنًا لعروض تقديمية غامرة ومبنية على البيانات. كل عنصر بصري في هذه الصفحة قابل لإعادة الاستخدام.",
    heroBtn: "مرّر للاستكشاف",
    metricKicker: "مقاييس متحركة",
    metricTitle: "أرقام تروي قصة",
    metricSub: "كل مقياس يتحرك عند التمرير مع تأثيرات العدّ التصاعدي ومؤشرات الاتجاه.",
    metricLabels: ["الإيرادات السنوية", "اتفاقية وقت التشغيل", "النماذج النشطة", "زمن الاستجابة"],
    textKicker: "تأثيرات نصية",
    textTitle: "كلمات تتحرك",
    textSub: "تأثيرات الآلة الكاتبة والتدرج اللوني والعدّاد والنص المتوازي للتأكيد وسرد القصص.",
    typewriterLabel: "الآلة الكاتبة",
    typewriterLines: ["سكيل AI تبني البنية التحتية للذكاء الاصطناعي المؤسسي.", "من تصنيف البيانات إلى تقييم النماذج إلى النشر في الإنتاج."],
    gradientLabel: "نص متدرج",
    gradientText: "تعبئة تدرج ثابتة بألوان علامة سكيل التجارية",
    animGradientLabel: "نص متدرج متحرك",
    animGradientText: "تدرج متحرك يتنقل بين الألوان",
    counterLabel: "عدّاد متحرك",
    counterLabels: ["إجمالي المشاريع", "معدل الدقة", "التكلفة الموفرة"],
    revealLabel: "كشف النص كلمة بكلمة",
    revealText: "كل كلمة تظهر أثناء التمرير عبر هذه الجملة، مما يخلق تجربة قراءة درامية تبقي الجمهور مركزًا.",
    chartKicker: "مكوّنات الرسوم البيانية",
    chartTitle: "البيانات تقود السرد",
    barTitle: "الإيرادات حسب الربع",
    lineTitle: "اتجاه الإيرادات",
    pieTitle: "مزيج الإيرادات",
    scoreTitle: "مصفوفة التقييم",
    flowKicker: "مخطط التدفق",
    flowTitle: "الهندسة المعمارية بنظرة واحدة",
    flowSub: "مخططات متحركة بالعقد والحواف تحل محل رسومات SVG الثابتة.",
    flowNodes: ["مصادر البيانات", "الاستيعاب", "معالجة الذكاء الاصطناعي", "فحص الجودة", "الرؤى"],
    flowDescs: ["واجهات وملفات وتدفقات", "التحقق والتطبيع", "خط أنابيب LLM + ML", "إنسان في الحلقة", "التقارير والإجراءات"],
    stickyKicker: "وسائط مثبتة + رسم SVG",
    stickyTitle: "مرئيات مثبتة، سرد متمرر",
    stickySub: "يبقى رسم خط الأنابيب مثبتًا بينما تتمرر خطوات النص بجانبه. بدّل زر اللغة (أعلى اليسار) لرؤية لوحة التحكم بالعربية.",
    stickyStep1: "الخطوة 1", stickyStep1Title: "استيعاب على نطاق واسع.", stickyStep1Desc: "آلاف المستندات التنظيمية والأحكام القضائية وتقارير الامتثال تتدفق إلى النظام يوميًا. يتم التعرف الضوئي والترجمة واستخراج الكيانات تلقائيًا.",
    stickyStep2: "الخطوة 2", stickyStep2Title: "تحليل بدقة عالية.", stickyStep2Desc: "نماذج متخصصة تصنف وتقارن وتكشف التناقضات عبر المستندات. كل ادعاء قابل للتتبع إلى فقرته المصدرية.",
    stickyStep3: "الخطوة 3", stickyStep3Title: "تقديم النتائج بثقة.", stickyStep3Desc: "يتلقى صانعو القرار ملخصات منظمة مع درجات المخاطر والتوصيات ومسار التدقيق الكامل.",
    dashKicker: "وسائط مثبتة + لوحة تحكم متعددة اللغات",
    dashSub: "انقر على English (أعلى اليسار) لقلب هذا النموذج إلى الإنجليزية.",
    dashNav: "التنقل", dashNavTitle: "التنقل والسياق.", dashNavDesc: "شريط جانبي ثابت ينظم القضايا حسب الحالة والأولوية والمحلل المعين.",
    dashAI: "تحليل الذكاء الاصطناعي", dashAITitle: "التحليل المولّد بالذكاء الاصطناعي.", dashAIDesc: "اللوحة المركزية تعرض تقييم الذكاء الاصطناعي: درجات الامتثال والتناقضات المكتشفة والإجراءات الموصى بها.",
    dashEv: "الأدلة", dashEvTitle: "الأدلة والاستشهادات.", dashEvDesc: "درج أدلة قابل للطي يعرض الفقرات والمستندات والمراجع القانونية الداعمة لكل نتيجة.",
    scrollKicker: "مكوّنات السرد التمريري",
    scrollTitle: "سرد القصص بالتمرير",
    scrollSub: "مكوّنات تستجيب لموضع التمرير لعروض تقديمية غامرة وسردية.",
    scrollRevealLabel: "كشف النص بالتمرير",
    scrollRevealText: "الكلمات تُبرز أثناء التمرير، مما يلفت الانتباه إلى كل عبارة بالتسلسل. هذا يخلق إيقاع قراءة قوي يبقي الجمهور منتبهًا.",
    spectrumLabel: "الطيف",
    spectrumSub: "تحديد المواقع النوعي على محور مُعنوَن",
    spectrumLeft: "عملية يدوية", spectrumRight: "أتمتة كاملة",
    spectrumItems: ["أنظمة قديمة", "جداول بيانات", "أدوات RPA", "الوضع الحالي", "مع سكيل AI"],
    annotatedLabel: "نص مشروح",
    annotatedSub: "شرائح نصية مرمزة بالألوان مع مفتاح التصنيف",
    annotatedSegments: [
      { text: "منصة الذكاء الاصطناعي ", cat: "المنتج" },
      { text: "عالجت 2.4 مليون مستند ", cat: "المقياس" },
      { text: "عبر ثلاث جهات حكومية ", cat: "النطاق" },
      { text: "في أقل من 72 ساعة، ", cat: "المقياس" },
      { text: "لتحل محل سير عمل يدوي ", cat: "الأثر" },
      { text: "كان يستغرق 6 أسابيع سابقًا ", cat: "المقياس" },
      { text: "ويتطلب 40 موظفًا بدوام كامل.", cat: "الأثر" },
    ],
    decoKicker: "تأثيرات زخرفية",
    decoTitle: "أجواء محيطة",
    decoSub: "تأثيرات الخلفية والتفاعلات المغناطيسية ومساعدات التخطيط التي تضيف عمقًا.",
    staggerLabel: "ظهور متتابع",
    staggerItems: ["نماذج AI", "خط بيانات", "الأمان", "المراقبة", "عمليات الفريق", "الامتثال", "طبقة API", "المراقبة"],
    magnetLabel: "بطاقة مغناطيسية",
    magnetSub: "مرر المؤشر فوق هذه البطاقات لرؤية تأثير الميل المغناطيسي",
    magnetCards: [{ t: "السرعة", v: "47ms", d: "متوسط زمن الاستجابة" }, { t: "الدقة", v: "99.7%", d: "اتفاقية مستوى الإنتاج" }, { t: "النطاق", v: "2.4M", d: "الطلبات اليومية" }],
    parallaxLabel: "طبقة المنظور",
    parallaxSub: "تتحرك العناصر بسرعات مختلفة أثناء التمرير مما يخلق عمقًا",
    particleLabel: "جسيمات عائمة + بقعة ضوء الفأرة",
    particleSub: "حرّك المؤشر فوق المربع أدناه",
    particleText: "تأثيرات خلفية محيطة",
    interKicker: "مكوّنات تفاعلية",
    interTitle: "توقف واستكشف",
    interSub: "مكوّنات توقف سرد التمرير وتدعو للتفاعل.",
    zoneLabel: "منطقة التفاعل",
    zoneTech: "الغوص التقني",
    zoneTechDesc: "يعالج خط أنابيب الذكاء الاصطناعي البيانات عبر 4 مراحل: الاستيعاب والتطبيع والاستدلال وضمان الجودة.",
    zoneBiz: "الأثر التجاري",
    zoneBizDesc: "أدى نشر منصة الذكاء الاصطناعي إلى تقليل التكاليف التشغيلية بنسبة 62% ووقت المعالجة من 6 أسابيع إلى 72 ساعة.",
    zoneSec: "الأمان والامتثال",
    zoneSecDesc: "حاصل على شهادة SOC 2 Type II ومتوافق مع HIPAA ومعتمد من FedRAMP. البيانات لا تغادر VPC العميل.",
    zoneMetrics: ["تخفيض التكلفة", "أسرع", "رفع NPS"],
    beforeLabel: "قبل وبعد",
    beforeSub: "اسحب شريط التمرير للمقارنة بين حالتين",
    beforeTitle: "قبل سكيل AI", beforeTime: "6 أسابيع", beforeDesc: "معالجة مستندات يدوية",
    afterTitle: "بعد سكيل AI", afterTime: "72 ساعة", afterDesc: "خط أنابيب مدعوم بالذكاء الاصطناعي",
    beforeMetrics: ["موظفون بدوام كامل", "معدل الخطأ"], afterMetrics: ["موظفون بدوام كامل", "معدل الخطأ"],
    timelineKicker: "جدول زمني متحرك",
    timelineTitle: "الرحلة إلى الإنتاج",
    timelineNodes: [
      { date: "الأسبوع 1-2", title: "الاكتشاف والتدقيق", desc: "مقابلات أصحاب المصلحة وتقييم جودة البيانات ومراجعة البنية التحتية." },
      { date: "الأسبوع 3-4", title: "النموذج الأولي", desc: "نموذج أولي يعمل مع 3 سير عمل أساسية وتدريب نموذج أولي." },
      { date: "الأسبوع 5-8", title: "التكامل", desc: "تكامل API وتعزيز الأمان واختبار الحمل والتوثيق." },
      { date: "الأسبوع 9-10", title: "التجريب", desc: "نشر حي مع 50 مستخدمًا وحلقات تغذية راجعة وضبط الأداء." },
      { date: "الأسبوع 11-12", title: "التوسع", desc: "إطلاق كامل ولوحات مراقبة وتدريب الفريق والتسليم." },
    ],
    globeKicker: "كرة ثلاثية الأبعاد",
    globeTitle: "حضور عالمي",
    globeSub: "كرة أرضية ثلاثية الأبعاد تفاعلية مع أقواس الاتصال وعلامات المواقع. مبنية بـ React Three Fiber.",
    tableKicker: "جدول بيانات + حقل جسيمات",
    tableTitle: "جداول قابلة للفرز ومتحركة",
    tableCols: ["النموذج", "الدقة", "زمن الاستجابة (مللي ثانية)", "التكلفة/1000", "الحالة"],
    entranceKicker: "كشف القناع + تقسيم النص",
    entranceTitle: "تأثيرات الدخول",
    entranceSub: "مرّر ببطء لمشاهدة كل عنصر يتحرك للظهور. ستة أشكال أقنعة وسبعة أنماط لتحريك النص.",
    entranceTSLabel: "أنماط تحريك تقسيم النص",
    ctaTitle: "ابنِ شيئًا مذهلاً",
    ctaSub: "كل مكوّن في هذه الصفحة متاح لعرضك التقديمي التالي. فقط استورد وركّب.",
    ctaComponents: "مكوّن", ctaTemplates: "قوالب", ctaApis: "واجهات",
  },
};

const dashLabels = {
  en: {
    dir: "ltr" as const,
    title: "Case Review", caseId: "KB/2024/1847", status: "Active",
    score: "Compliance Score", findings: "Findings",
    f1: "License renewal overdue", f2: "Insurance documentation valid", f3: "CSA self-assessment incomplete",
    action: "Recommended Action",
    actionText: "Renew trade license and complete CSA self-assessment before proceeding to approval.",
    evidence: "Evidence & Citations", e1: "Trade License — §4.2", e2: "Decision 44 — Art. 12", e3: "CSA Checklist v3.1",
  },
  ar: {
    dir: "rtl" as const,
    title: "مراجعة القضية", caseId: "KB/2024/1847", status: "نشطة",
    score: "درجة الامتثال", findings: "النتائج",
    f1: "تجديد الرخصة التجارية متأخر", f2: "وثائق التأمين صالحة", f3: "التقييم الذاتي للامتثال ناقص",
    action: "الإجراء الموصى به",
    actionText: "تجديد الرخصة التجارية وإكمال التقييم الذاتي قبل المتابعة للموافقة.",
    evidence: "الأدلة والاستشهادات", e1: "الرخصة التجارية — §4.2", e2: "القرار 44 — المادة 12", e3: "قائمة التقييم الذاتي v3.1",
  },
};

function DashboardMockup({ lang = "en" }: { lang?: Lang }) {
  const d = dashLabels[lang];
  const findings = [
    { label: d.f1, color: "#F87171", icon: "!" },
    { label: d.f2, color: "#4ADE80", icon: "✓" },
    { label: d.f3, color: "#F59E0B", icon: "?" },
  ];
  const evidence = [d.e1, d.e2, d.e3];

  return (
    <div className="w-full h-full flex items-center justify-center p-3" dir={d.dir}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-[#2a2a3a] bg-[#0f0f18] shadow-2xl text-sm">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a24] border-b border-[#2a2a3a]">
          <div className="flex gap-1.5" dir="ltr">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
          </div>
          <span className="flex-1 text-center text-xs text-[#e4e4ef]/40 font-medium">{d.title} — {d.caseId}</span>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[#e4e4ef] font-bold text-base">{d.caseId}</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold text-green-400 bg-green-400/10 border border-green-400/20">{d.status}</span>
          </div>
          <div className="rounded-xl border border-purple-400/20 bg-purple-400/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-400/70 text-xs font-semibold">{d.score}</span>
              <span className="text-purple-400 text-2xl font-extrabold tabular-nums">78<span className="text-base font-normal text-purple-400/50"> / 100</span></span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#1a1a2e]"><div className="h-full rounded-full bg-purple-400/60" style={{ width: "78%" }} /></div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#e4e4ef]/40 mb-2">{d.findings}</p>
            <div className="space-y-2">
              {findings.map((f, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg bg-[#1a1a2e] px-3 py-2">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: `${f.color}20`, color: f.color }}>{f.icon}</span>
                  <span className="text-[#e4e4ef] text-sm">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3">
            <p className="text-cyan-400 text-xs font-bold mb-1">{d.action}</p>
            <p className="text-[#e4e4ef]/60 text-xs leading-relaxed">{d.actionText}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#e4e4ef]/40 mb-2">{d.evidence}</p>
            <div className="space-y-1.5">
              {evidence.map((label, i) => (
                <div key={i} className="rounded-md bg-[#1a1a2e] px-3 py-1.5"><span className="text-cyan-400 text-xs">{label}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PipelineSVG() {
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <svg viewBox="0 0 440 680" className="w-full h-auto" style={{ maxHeight: "90vh" }}>
        <defs>
          <linearGradient id="pipe-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7DD3FC" /><stop offset="100%" stopColor="#A78BFA" /></linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <marker id="ah-cyan" viewBox="0 0 12 12" refX="12" refY="6" markerWidth="10" markerHeight="10" orient="auto"><path d="M0,1 L12,6 L0,11Z" fill="#7DD3FC" opacity="0.85" /></marker>
          <marker id="ah-purple" viewBox="0 0 12 12" refX="12" refY="6" markerWidth="10" markerHeight="10" orient="auto"><path d="M0,1 L12,6 L0,11Z" fill="#A78BFA" opacity="0.85" /></marker>
          <marker id="ah-green" viewBox="0 0 12 12" refX="12" refY="6" markerWidth="10" markerHeight="10" orient="auto"><path d="M0,1 L12,6 L0,11Z" fill="#4ADE80" opacity="0.85" /></marker>
        </defs>
        <rect x="10" y="16" width="130" height="60" rx="14" fill="#0f0f18" stroke="#7DD3FC" strokeWidth="2" />
        <text x="75" y="42" textAnchor="middle" fill="#7DD3FC" fontSize="14" fontWeight="700">Court Rulings</text>
        <text x="75" y="62" textAnchor="middle" fill="#7DD3FC" fontSize="11" opacity="0.55">PDF · 12,400/day</text>
        <rect x="155" y="16" width="130" height="60" rx="14" fill="#0f0f18" stroke="#A78BFA" strokeWidth="2" />
        <text x="220" y="42" textAnchor="middle" fill="#A78BFA" fontSize="14" fontWeight="700">Regulations</text>
        <text x="220" y="62" textAnchor="middle" fill="#A78BFA" fontSize="11" opacity="0.55">DOCX · 3,200/day</text>
        <rect x="300" y="16" width="130" height="60" rx="14" fill="#0f0f18" stroke="#4ADE80" strokeWidth="2" />
        <text x="365" y="42" textAnchor="middle" fill="#4ADE80" fontSize="14" fontWeight="700">Compliance</text>
        <text x="365" y="62" textAnchor="middle" fill="#4ADE80" fontSize="11" opacity="0.55">Excel · 890/day</text>
        <line x1="75" y1="76" x2="155" y2="128" stroke="#7DD3FC" strokeWidth="2.5" opacity="0.7" markerEnd="url(#ah-cyan)" />
        <line x1="220" y1="76" x2="220" y2="128" stroke="#A78BFA" strokeWidth="2.5" opacity="0.7" markerEnd="url(#ah-purple)" />
        <line x1="365" y1="76" x2="285" y2="128" stroke="#4ADE80" strokeWidth="2.5" opacity="0.7" markerEnd="url(#ah-green)" />
        <rect x="60" y="136" width="320" height="72" rx="18" fill="url(#pipe-grad)" fillOpacity="0.1" stroke="url(#pipe-grad)" strokeWidth="2" />
        <text x="220" y="166" textAnchor="middle" fill="#e4e4ef" fontSize="15" fontWeight="700">Document Processing Pipeline</text>
        <text x="220" y="192" textAnchor="middle" fill="#e4e4ef" fontSize="12" opacity="0.45">OCR → Translation → Entity Extraction → Classify</text>
        <line x1="220" y1="208" x2="220" y2="266" stroke="#A78BFA" strokeWidth="3" opacity="0.7" markerEnd="url(#ah-purple)" />
        <rect x="30" y="274" width="380" height="130" rx="18" fill="#0f0f18" stroke="#A78BFA" strokeWidth="2" filter="url(#glow)" />
        <text x="220" y="304" textAnchor="middle" fill="#A78BFA" fontSize="16" fontWeight="800">AI Analysis Engine</text>
        <rect x="52" y="318" width="110" height="62" rx="10" fill="#A78BFA" fillOpacity="0.1" stroke="#A78BFA" strokeWidth="1.5" strokeOpacity="0.4" />
        <text x="107" y="344" textAnchor="middle" fill="#e4e4ef" fontSize="12" fontWeight="600">Cross-reference</text>
        <text x="107" y="364" textAnchor="middle" fill="#e4e4ef" fontSize="11" opacity="0.45">3.2M links</text>
        <rect x="175" y="318" width="90" height="62" rx="10" fill="#7DD3FC" fillOpacity="0.1" stroke="#7DD3FC" strokeWidth="1.5" strokeOpacity="0.4" />
        <text x="220" y="344" textAnchor="middle" fill="#e4e4ef" fontSize="12" fontWeight="600">Risk Scoring</text>
        <text x="220" y="364" textAnchor="middle" fill="#e4e4ef" fontSize="11" opacity="0.45">97.3% acc.</text>
        <rect x="278" y="318" width="110" height="62" rx="10" fill="#4ADE80" fillOpacity="0.1" stroke="#4ADE80" strokeWidth="1.5" strokeOpacity="0.4" />
        <text x="333" y="344" textAnchor="middle" fill="#e4e4ef" fontSize="12" fontWeight="600">Compliance</text>
        <text x="333" y="364" textAnchor="middle" fill="#e4e4ef" fontSize="11" opacity="0.45">44 regulations</text>
        <line x1="220" y1="404" x2="220" y2="458" stroke="#A78BFA" strokeWidth="3" opacity="0.7" markerEnd="url(#ah-purple)" />
        <rect x="20" y="466" width="185" height="72" rx="14" fill="#0f0f18" stroke="#7DD3FC" strokeWidth="2" />
        <text x="112" y="496" textAnchor="middle" fill="#7DD3FC" fontSize="14" fontWeight="700">Structured Briefs</text>
        <text x="112" y="518" textAnchor="middle" fill="#e4e4ef" fontSize="11" opacity="0.45">Scores · Recommendations · Audit trail</text>
        <rect x="235" y="466" width="185" height="72" rx="14" fill="#0f0f18" stroke="#4ADE80" strokeWidth="2" />
        <text x="327" y="496" textAnchor="middle" fill="#4ADE80" fontSize="14" fontWeight="700">Decision Dashboard</text>
        <text x="327" y="518" textAnchor="middle" fill="#e4e4ef" fontSize="11" opacity="0.45">Interactive explorer for leadership</text>
        <line x1="112" y1="538" x2="112" y2="582" stroke="#7DD3FC" strokeWidth="2.5" opacity="0.6" markerEnd="url(#ah-cyan)" />
        <line x1="327" y1="538" x2="327" y2="582" stroke="#4ADE80" strokeWidth="2.5" opacity="0.6" markerEnd="url(#ah-green)" />
        <rect x="20" y="590" width="185" height="50" rx="12" fill="#7DD3FC" fillOpacity="0.06" stroke="#7DD3FC" strokeWidth="1.5" strokeOpacity="0.25" />
        <text x="112" y="614" textAnchor="middle" fill="#7DD3FC" fontSize="13" fontWeight="600">Judges &amp; Analysts</text>
        <rect x="235" y="590" width="185" height="50" rx="12" fill="#4ADE80" fillOpacity="0.06" stroke="#4ADE80" strokeWidth="1.5" strokeOpacity="0.25" />
        <text x="327" y="614" textAnchor="middle" fill="#4ADE80" fontSize="13" fontWeight="600">Department Heads</text>
        <rect x="145" y="652" width="150" height="24" rx="12" fill="#A78BFA" fillOpacity="0.08" stroke="#A78BFA" strokeWidth="1" strokeOpacity="0.25" />
        <text x="220" y="669" textAnchor="middle" fill="#A78BFA" fontSize="11" fontWeight="600">Powered by AI</text>
      </svg>
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
        dark ? "bg-bg-dark text-white" : "bg-bg-light text-foreground"
      } ${className || ""}`}
    >
      {dark && (
        <div className="noise-overlay absolute inset-0 pointer-events-none" />
      )}
      <div className="relative z-10">{children}</div>
    </section>
  );
}

export default function ShowcaseVisuals() {
  const print = usePrintMode();
  const m = useM();
  const [lang, setLang] = useState<Lang>("en");
  const s = t[lang];
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll(
    print ? undefined : { target: heroRef, offset: ["start start", "end start"] },
  );
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.7], [1, 0.92]);
  const heroY = useTransform(scrollYProgress, [0, 0.7], [0, 120]);

  return (
    <main className={`relative ${print ? "print-mode" : ""}`} dir={s.dir}>
      {!print && <PrintButton />}
      <ScrollProgress />
      {!print && <ChapterNav />}
      <button
        onClick={() => setLang(lang === "ar" ? "en" : "ar")}
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-bg-surface/80 backdrop-blur-sm border border-border text-sm text-white hover:bg-bg-elevated transition-colors print-hidden"
      >
        <Languages className="w-4 h-4" />
        {lang === "ar" ? "English" : "العربية"}
      </button>
      {/* ─── HERO: Parallax + Aurora ─── */}
      <section
        ref={heroRef}
        id="hero"
        className="relative min-h-screen flex items-center justify-center bg-bg-dark text-white overflow-hidden"
      >
        <AuroraBackground
          colors={["#0A0718", "#22d3ee", "#6366f1", "#a855f7", "#ec4899"]}
          speed={0.25}
          blend={0.6}
          className="!absolute inset-0"
        />
        {!print && <FloatingParticles count={40} />}
        {!print && <MouseSpotlight radius={500} opacity={0.06} />}
        <m.div
          style={print ? {} : { opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative z-10 flex flex-col items-center justify-center px-6 text-center"
        >
          <div className="brand-gradient-bar w-16 h-[3px] mb-8 rounded-full" />
          <TextSplit
            mode="word"
            animation="blur-in"
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            {s.heroTitle}
          </TextSplit>
          <Reveal variant="fade-up" delay={0.5}>
            <p className="text-xl md:text-2xl text-white/60 max-w-2xl leading-relaxed">
              {s.heroSub}
            </p>
          </Reveal>
          <Reveal variant="fade-up" delay={0.8}>
            <div className="flex gap-4 mt-10">
              <MagneticElement strength={0.2} range={20}>
                <div className="px-6 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-sm font-medium">
                  {s.heroBtn}
                </div>
              </MagneticElement>
            </div>
          </Reveal>
        </m.div>
        {!print && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
              <ChevronDown className="w-6 h-6 text-white/20 mx-auto" />
            </motion.div>
          </div>
        )}
      </section>

      {/* ─── SECTION: Animated Metrics ─── */}
      <Section id="metrics">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <Reveal>
            <p className="text-sm font-medium text-brand-1 uppercase tracking-widest mb-3">
              {s.metricKicker}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {s.metricTitle}
            </h2>
            <p className="text-muted max-w-xl mb-12 leading-relaxed">
              {s.metricSub}
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnimatedMetric
              value={2400000}
              label={s.metricLabels[0]}
              prefix="$"
              compact
              delta={12.5}
              deltaSuffix="%"
              trend="up"
              sparkline={[
                { value: 80 }, { value: 92 }, { value: 88 },
                { value: 105 }, { value: 110 }, { value: 120 },
              ]}
              color="#22d3ee"
            />
            <AnimatedMetric
              value={99.7}
              label={s.metricLabels[1]}
              suffix="%"
              decimals={1}
              delta={0.3}
              deltaSuffix="pp"
              trend="up"
              color="#818CF8"
            />
            <AnimatedMetric
              value={340}
              label={s.metricLabels[2]}
              delta={-5}
              trend="down"
              sparkline={[
                { value: 360 }, { value: 355 }, { value: 350 },
                { value: 348 }, { value: 345 }, { value: 340 },
              ]}
              color="#F472B6"
            />
            <AnimatedMetric
              value={47}
              label={s.metricLabels[3]}
              suffix="ms"
              delta={0}
              trend="neutral"
              color="#4ADE80"
            />
          </div>
        </div>
      </Section>

      {/* ─── SECTION: Text Effects ─── */}
      <Section dark id="text-effects">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <Reveal>
            <p className="text-sm font-medium text-brand-1 uppercase tracking-widest mb-3">
              {s.textKicker}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {s.textTitle}
            </h2>
            <p className="text-white/50 max-w-xl mb-16 leading-relaxed">
              {s.textSub}
            </p>
          </Reveal>

          <div className="space-y-16">
            <div>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">{s.typewriterLabel}</p>
              <Typewriter
                lines={[
                  { text: s.typewriterLines[0], className: "text-2xl md:text-3xl font-bold text-white" },
                  { text: s.typewriterLines[1], className: "text-xl md:text-2xl text-white/60" },
                ]}
                speed={30}
                className="space-y-2"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">{s.gradientLabel}</p>
              <GradientText className="text-3xl md:text-5xl font-bold">
                {s.gradientText}
              </GradientText>
            </div>

            <div>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">{s.animGradientLabel}</p>
              <AnimatedGradientText className="text-3xl md:text-5xl font-bold">
                {s.animGradientText}
              </AnimatedGradientText>
            </div>

            <div>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">{s.counterLabel}</p>
              <div className="flex items-baseline gap-8">
                <div>
                  <AnimatedCounter target={1847} className="text-5xl md:text-6xl font-bold text-brand-1 tabular-nums" />
                  <p className="text-white/40 text-sm mt-1">{s.counterLabels[0]}</p>
                </div>
                <div>
                  <AnimatedCounter target={99.97} decimals={2} suffix="%" className="text-5xl md:text-6xl font-bold text-brand-3 tabular-nums" />
                  <p className="text-white/40 text-sm mt-1">{s.counterLabels[1]}</p>
                </div>
                <div>
                  <AnimatedCounter target={4200} prefix="$" suffix="K" className="text-5xl md:text-6xl font-bold text-brand-4 tabular-nums" />
                  <p className="text-white/40 text-sm mt-1">{s.counterLabels[2]}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">{s.revealLabel}</p>
              <TextRevealByWord
                text={s.revealText}
                className="text-2xl md:text-3xl font-bold text-white/90 max-w-3xl leading-snug"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* ─── SECTION: Charts (dark) ─── */}
      <Section dark id="charts">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <Reveal>
            <p className="text-sm font-medium text-brand-3 uppercase tracking-widest mb-3">
              {s.chartKicker}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12">
              {s.chartTitle}
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Reveal variant="fade-up">
              <div className="rounded-2xl border border-border/30 bg-bg-surface p-6">
                <AnimatedBarChart
                  data={[
                    { label: "Q1", value: 120 },
                    { label: "Q2", value: 185 },
                    { label: "Q3", value: 250, highlight: true },
                    { label: "Q4", value: 210 },
                  ]}
                  title={s.barTitle}
                  suffix="M"
                  color="#818CF8"
                  highlightColor="#22d3ee"
                  height={280}
                />
              </div>
            </Reveal>

            <Reveal variant="fade-up" delay={0.1}>
              <div className="rounded-2xl border border-border/30 bg-bg-surface p-6">
                <AnimatedLineChart
                  data={[
                    { month: "Jan", ai: 40, cloud: 65, services: 30 },
                    { month: "Feb", ai: 55, cloud: 62, services: 35 },
                    { month: "Mar", ai: 70, cloud: 58, services: 40 },
                    { month: "Apr", ai: 95, cloud: 55, services: 42 },
                    { month: "May", ai: 120, cloud: 52, services: 45 },
                    { month: "Jun", ai: 150, cloud: 50, services: 48 },
                  ]}
                  xKey="month"
                  series={[
                    { key: "ai", label: "AI Revenue", color: "#22d3ee" },
                    { key: "cloud", label: "Cloud", color: "#818CF8" },
                    { key: "services", label: "Services", color: "#F472B6" },
                  ]}
                  title={s.lineTitle}
                  suffix="M"
                  area
                  smooth
                  height={280}
                />
              </div>
            </Reveal>

            <Reveal variant="fade-up" delay={0.2}>
              <div className="rounded-2xl border border-border/30 bg-bg-surface p-6">
                <AnimatedPieChart
                  data={[
                    { label: "AI Platform", value: 45, color: "#22d3ee" },
                    { label: "Data Engine", value: 25, color: "#818CF8" },
                    { label: "Government", value: 18, color: "#a855f7" },
                    { label: "Enterprise", value: 12, color: "#F472B6" },
                  ]}
                  title={s.pieTitle}
                  donut={0.55}
                  suffix="%"
                  height={280}
                />
              </div>
            </Reveal>

            <Reveal variant="fade-up" delay={0.3}>
              <div className="rounded-2xl border border-border/30 bg-bg-surface p-6">
                <h3 className="text-sm font-medium text-muted mb-4">{s.scoreTitle}</h3>
                <ScoreMatrix
                  criteria={["Speed", "Quality", "Cost", "Reach"]}
                  entries={[
                    {
                      option: "Acme Corp",
                      scores: { Speed: 92, Quality: 95, Cost: 75, Reach: 98 },
                      highlight: true,
                    },
                    {
                      option: "Competitor A",
                      scores: { Speed: 78, Quality: 82, Cost: 85, Reach: 60 },
                    },
                    {
                      option: "In-House",
                      scores: { Speed: 45, Quality: 70, Cost: 40, Reach: 35 },
                    },
                  ]}
                  thresholds={[50, 80]}
                  thresholdColors={["#F87171", "#FBBF24", "#4ADE80"]}
                />
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ─── SECTION: Flow Diagram ─── */}
      <Section id="flow">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <Reveal>
            <p className="text-sm font-medium text-brand-1 uppercase tracking-widest mb-3">
              {s.flowKicker}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {s.flowTitle}
            </h2>
            <p className="text-muted max-w-xl mb-12 leading-relaxed">
              {s.flowSub}
            </p>
          </Reveal>

          <FlowDiagram
            nodes={[
              { id: "source", label: s.flowNodes[0], description: s.flowDescs[0], icon: <Database className="w-5 h-5" /> },
              { id: "ingest", label: s.flowNodes[1], description: s.flowDescs[1], icon: <Layers className="w-5 h-5" />, color: "#22d3ee" },
              { id: "ai", label: s.flowNodes[2], description: s.flowDescs[2], icon: <Brain className="w-5 h-5" />, color: "#818CF8" },
              { id: "quality", label: s.flowNodes[3], description: s.flowDescs[3], icon: <Shield className="w-5 h-5" />, color: "#a855f7" },
              { id: "output", label: s.flowNodes[4], description: s.flowDescs[4], icon: <BarChart3 className="w-5 h-5" />, color: "#4ADE80" },
            ]}
            edges={[
              { from: "source", to: "ingest", label: "stream" },
              { from: "ingest", to: "ai" },
              { from: "ai", to: "quality", label: "review" },
              { from: "quality", to: "output" },
            ]}
            direction="horizontal"
            stagger={0.15}
          />
        </div>
      </Section>

      {/* ─── SECTION: StickyMedia (from showcase-scroll) ─── */}
      <Section dark id="sticky-demo">
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-8">
          <Reveal>
            <p className="text-sm font-medium text-brand-1 uppercase tracking-widest mb-3">
              {s.stickyKicker}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {s.stickyTitle}
            </h2>
            <p className="text-white/50 max-w-xl mb-8 leading-relaxed">
              {s.stickySub}
            </p>
          </Reveal>
        </div>

        <StickyMedia media={<PipelineSVG />} mediaPosition="left">
          <div className="bg-bg-surface/80 backdrop-blur-sm rounded-2xl border border-border p-8">
            <p className="text-xs font-semibold tracking-widest uppercase text-brand-1 mb-2">{s.stickyStep1}</p>
            <h3 className="text-2xl font-bold tracking-tight text-white mb-3">{s.stickyStep1Title}</h3>
            <p className="text-muted leading-relaxed">
              {s.stickyStep1Desc}
            </p>
          </div>
          <div className="bg-bg-surface/80 backdrop-blur-sm rounded-2xl border border-border p-8">
            <p className="text-xs font-semibold tracking-widest uppercase text-brand-3 mb-2">{s.stickyStep2}</p>
            <h3 className="text-2xl font-bold tracking-tight text-white mb-3">{s.stickyStep2Title}</h3>
            <p className="text-muted leading-relaxed">
              {s.stickyStep2Desc}
            </p>
          </div>
          <div className="bg-bg-surface/80 backdrop-blur-sm rounded-2xl border border-border p-8">
            <p className="text-xs font-semibold tracking-widest uppercase text-green-400 mb-2">{s.stickyStep3}</p>
            <h3 className="text-2xl font-bold tracking-tight text-white mb-3">{s.stickyStep3Title}</h3>
            <p className="text-muted leading-relaxed">
              {s.stickyStep3Desc}
            </p>
          </div>
        </StickyMedia>

        <GradientDivider className="my-8" />

        <div className="max-w-6xl mx-auto px-6 pb-8">
          <Reveal>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2">
              {s.dashKicker}
            </p>
            <p className="text-white/40 text-sm mb-8">
              {s.dashSub}
            </p>
          </Reveal>
        </div>

        <StickyMedia media={<DashboardMockup lang={lang} />} mediaPosition="right">
          <div className="bg-bg-surface/80 backdrop-blur-sm rounded-2xl border border-border p-8">
            <p className="text-xs font-semibold tracking-widest uppercase text-brand-1 mb-2">{s.dashNav}</p>
            <h3 className="text-2xl font-bold tracking-tight text-white mb-3">
              {s.dashNavTitle}
            </h3>
            <p className="text-muted leading-relaxed">
              {s.dashNavDesc}
            </p>
          </div>
          <div className="bg-bg-surface/80 backdrop-blur-sm rounded-2xl border border-border p-8">
            <p className="text-xs font-semibold tracking-widest uppercase text-brand-3 mb-2">{s.dashAI}</p>
            <h3 className="text-2xl font-bold tracking-tight text-white mb-3">
              {s.dashAITitle}
            </h3>
            <p className="text-muted leading-relaxed">
              {s.dashAIDesc}
            </p>
          </div>
          <div className="bg-bg-surface/80 backdrop-blur-sm rounded-2xl border border-border p-8">
            <p className="text-xs font-semibold tracking-widest uppercase text-green-400 mb-2">{s.dashEv}</p>
            <h3 className="text-2xl font-bold tracking-tight text-white mb-3">
              {s.dashEvTitle}
            </h3>
            <p className="text-muted leading-relaxed">
              {s.dashEvDesc}
            </p>
          </div>
        </StickyMedia>
      </Section>
      <GradientDivider />

      {/* ─── SECTION: Scrollytelling ─── */}
      <Section dark id="scrollytelling">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <Reveal>
            <p className="text-sm font-medium text-brand-4 uppercase tracking-widest mb-3">
              {s.scrollKicker}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {s.scrollTitle}
            </h2>
            <p className="text-white/50 max-w-xl mb-16 leading-relaxed">
              {s.scrollSub}
            </p>
          </Reveal>

          <div className="mb-20">
            <Reveal>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-6">{s.scrollRevealLabel}</p>
            </Reveal>
            <ScrollRevealText
              scrub
              highlight
              highlightColor="var(--brand-1)"
              className="text-2xl md:text-3xl font-bold leading-relaxed max-w-3xl"
            >
              {s.scrollRevealText}
            </ScrollRevealText>
          </div>

          <GradientDivider className="mb-20" />

          <div className="mb-20">
            <Reveal>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-6">{s.spectrumLabel}</p>
              <p className="text-white/40 text-sm mb-10">{s.spectrumSub}</p>
            </Reveal>
            <Spectrum
              axis={{ left: s.spectrumLeft, right: s.spectrumRight }}
              items={[
                { label: s.spectrumItems[0], position: 10 },
                { label: s.spectrumItems[1], position: 25 },
                { label: s.spectrumItems[2], position: 45 },
                { label: s.spectrumItems[3], position: 60, highlight: true },
                { label: s.spectrumItems[4], position: 88, color: "var(--brand-1)" },
              ]}
              scrub
              showConnectors
            />
          </div>

          <GradientDivider className="mb-20" />

          <div>
            <Reveal>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-6">{s.annotatedLabel}</p>
              <p className="text-white/40 text-sm mb-10">{s.annotatedSub}</p>
            </Reveal>
            <AnnotatedText
              segments={[
                { text: s.annotatedSegments[0].text, category: s.annotatedSegments[0].cat, color: "#22d3ee" },
                { text: s.annotatedSegments[1].text, category: s.annotatedSegments[1].cat, color: "#4ADE80" },
                { text: s.annotatedSegments[2].text, category: s.annotatedSegments[2].cat, color: "#818CF8" },
                { text: s.annotatedSegments[3].text, category: s.annotatedSegments[3].cat, color: "#4ADE80" },
                { text: s.annotatedSegments[4].text, category: s.annotatedSegments[4].cat, color: "#F472B6" },
                { text: s.annotatedSegments[5].text, category: s.annotatedSegments[5].cat, color: "#4ADE80" },
                { text: s.annotatedSegments[6].text, category: s.annotatedSegments[6].cat, color: "#F472B6" },
              ]}
              scrub
              showLegend
            />
          </div>
        </div>
      </Section>

      {/* ─── SECTION: Decorative Effects ─── */}
      <Section id="decorative">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <Reveal>
            <p className="text-sm font-medium text-brand-2 uppercase tracking-widest mb-3">
              {s.decoKicker}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {s.decoTitle}
            </h2>
            <p className="text-muted max-w-xl mb-16 leading-relaxed">
              {s.decoSub}
            </p>
          </Reveal>

          <div className="mb-16">
            <Reveal>
              <p className="text-xs font-semibold text-foreground/30 uppercase tracking-widest mb-6">{s.staggerLabel}</p>
            </Reveal>
            <StaggerChildren className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: <Brain className="w-6 h-6" />, label: s.staggerItems[0], color: "#22d3ee" },
                { icon: <Database className="w-6 h-6" />, label: s.staggerItems[1], color: "#818CF8" },
                { icon: <Shield className="w-6 h-6" />, label: s.staggerItems[2], color: "#a855f7" },
                { icon: <Activity className="w-6 h-6" />, label: s.staggerItems[3], color: "#F472B6" },
                { icon: <Users className="w-6 h-6" />, label: s.staggerItems[4], color: "#4ADE80" },
                { icon: <Lock className="w-6 h-6" />, label: s.staggerItems[5], color: "#FBBF24" },
                { icon: <Code className="w-6 h-6" />, label: s.staggerItems[6], color: "#22d3ee" },
                { icon: <Eye className="w-6 h-6" />, label: s.staggerItems[7], color: "#818CF8" },
              ].map((item, i) => (
                <StaggerItem key={i}>
                  <div className="rounded-xl border border-border/30 bg-white/50 dark:bg-bg-surface/50 p-5 flex flex-col items-center gap-3 text-center">
                    <span style={{ color: item.color }}>{item.icon}</span>
                    <span className="text-sm font-semibold text-foreground">{item.label}</span>
                  </div>
                </StaggerItem>
              ))}
            </StaggerChildren>
          </div>

          <GradientDivider className="mb-16" />

          <div className="mb-16">
            <Reveal>
              <p className="text-xs font-semibold text-foreground/30 uppercase tracking-widest mb-6">{s.magnetLabel}</p>
              <p className="text-muted text-sm mb-8">{s.magnetSub}</p>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: s.magnetCards[0].t, value: s.magnetCards[0].v, desc: s.magnetCards[0].d, color: "#22d3ee" },
                { title: s.magnetCards[1].t, value: s.magnetCards[1].v, desc: s.magnetCards[1].d, color: "#818CF8" },
                { title: s.magnetCards[2].t, value: s.magnetCards[2].v, desc: s.magnetCards[2].d, color: "#a855f7" },
              ].map((card, i) => (
                <MagneticCard key={i} className="rounded-2xl border border-border/30 bg-gradient-to-br from-white to-gray-50 dark:from-bg-surface dark:to-bg-dark p-8">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: card.color }}>{card.title}</p>
                  <p className="text-4xl font-bold text-foreground mb-1">{card.value}</p>
                  <p className="text-sm text-muted">{card.desc}</p>
                </MagneticCard>
              ))}
            </div>
          </div>

          <GradientDivider className="mb-16" />

          <div className="mb-16">
            <Reveal>
              <p className="text-xs font-semibold text-foreground/30 uppercase tracking-widest mb-6">{s.parallaxLabel}</p>
              <p className="text-muted text-sm mb-8">{s.parallaxSub}</p>
            </Reveal>
            <div className="relative h-[300px] rounded-2xl border border-border/30 overflow-hidden bg-gradient-to-b from-sky-100 to-blue-50 dark:from-bg-dark dark:to-bg-surface">
              <ParallaxLayer speed={0.2} className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-purple-300/40 to-pink-300/40 blur-xl" />
              </ParallaxLayer>
              <ParallaxLayer speed={0.5} className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-400/60 to-blue-500/60 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </ParallaxLayer>
              <ParallaxLayer speed={0.8} className="absolute inset-0 flex items-end justify-center pb-8">
                <p className="text-sm font-semibold text-foreground/60">Fast layer (0.8x)</p>
              </ParallaxLayer>
              <ParallaxLayer speed={0.2} className="absolute inset-0 flex items-start justify-center pt-8">
                <p className="text-sm font-semibold text-foreground/40">Slow layer (0.2x)</p>
              </ParallaxLayer>
            </div>
          </div>

          <GradientDivider className="mb-16" />

          <div>
            <Reveal>
              <p className="text-xs font-semibold text-foreground/30 uppercase tracking-widest mb-6">{s.particleLabel}</p>
              <p className="text-muted text-sm mb-8">{s.particleSub}</p>
            </Reveal>
            <div className="relative h-[300px] rounded-2xl border border-border/30 overflow-hidden bg-bg-dark">
              <FloatingParticles count={25} />
              <MouseSpotlight radius={300} opacity={0.08} />
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <p className="text-white/60 text-lg font-semibold">{s.particleText}</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── SECTION: InteractionZone + BeforeAfter ─── */}
      <Section dark id="interactive">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <Reveal>
            <p className="text-sm font-medium text-brand-3 uppercase tracking-widest mb-3">
              {s.interKicker}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {s.interTitle}
            </h2>
            <p className="text-white/50 max-w-xl mb-16 leading-relaxed">
              {s.interSub}
            </p>
          </Reveal>

          <div className="mb-20">
            <Reveal>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-8">{s.zoneLabel}</p>
            </Reveal>
            <InteractionZone
              zones={[
                {
                  label: s.zoneTech,
                  icon: <Code className="w-5 h-5" />,
                  content: (
                    <div className="space-y-3">
                      <p className="text-foreground/80">{s.zoneTechDesc}</p>
                      <div className="flex gap-3 text-sm">
                        <span className="px-2 py-1 rounded bg-brand-1/10 text-brand-1">Python 3.12</span>
                        <span className="px-2 py-1 rounded bg-brand-3/10 text-brand-3">CUDA 12.4</span>
                        <span className="px-2 py-1 rounded bg-brand-4/10 text-brand-4">gRPC</span>
                      </div>
                    </div>
                  ),
                  color: "#22d3ee",
                },
                {
                  label: s.zoneBiz,
                  icon: <TrendingUp className="w-5 h-5" />,
                  content: (
                    <div className="space-y-3">
                      <p className="text-foreground/80">{s.zoneBizDesc}</p>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div><p className="text-2xl font-bold text-brand-1">62%</p><p className="text-xs text-muted">{s.zoneMetrics[0]}</p></div>
                        <div><p className="text-2xl font-bold text-brand-3">58x</p><p className="text-xs text-muted">{s.zoneMetrics[1]}</p></div>
                        <div><p className="text-2xl font-bold text-brand-4">+28</p><p className="text-xs text-muted">{s.zoneMetrics[2]}</p></div>
                      </div>
                    </div>
                  ),
                  color: "#818CF8",
                },
                {
                  label: s.zoneSec,
                  icon: <Shield className="w-5 h-5" />,
                  content: (
                    <div className="space-y-3">
                      <p className="text-foreground/80">{s.zoneSecDesc}</p>
                    </div>
                  ),
                  color: "#a855f7",
                },
              ]}
              mode="toggle"
              layout="row"
            />
          </div>

          <GradientDivider className="mb-20" />

          <div>
            <Reveal>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-6">{s.beforeLabel}</p>
              <p className="text-white/40 text-sm mb-10">{s.beforeSub}</p>
            </Reveal>
            <BeforeAfter
              before={
                <div className="w-full h-[350px] bg-gradient-to-br from-red-950 to-orange-950 flex flex-col items-center justify-center p-8 text-center">
                  <p className="text-red-400 text-xs font-semibold uppercase tracking-widest mb-4">{s.beforeTitle}</p>
                  <p className="text-3xl font-bold text-white/90 mb-2">{s.beforeTime}</p>
                  <p className="text-white/40">{s.beforeDesc}</p>
                  <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-xl font-bold text-red-400">40</p><p className="text-white/30">{s.beforeMetrics[0]}</p></div>
                    <div><p className="text-xl font-bold text-red-400">23%</p><p className="text-white/30">{s.beforeMetrics[1]}</p></div>
                  </div>
                </div>
              }
              after={
                <div className="w-full h-[350px] bg-gradient-to-br from-emerald-950 to-teal-950 flex flex-col items-center justify-center p-8 text-center">
                  <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-4">{s.afterTitle}</p>
                  <p className="text-3xl font-bold text-white/90 mb-2">{s.afterTime}</p>
                  <p className="text-white/40">{s.afterDesc}</p>
                  <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-xl font-bold text-emerald-400">3</p><p className="text-white/30">{s.afterMetrics[0]}</p></div>
                    <div><p className="text-xl font-bold text-emerald-400">0.3%</p><p className="text-white/30">{s.afterMetrics[1]}</p></div>
                  </div>
                </div>
              }
              height="350px"
              className="rounded-2xl overflow-hidden border border-border/30"
            />
          </div>
        </div>
      </Section>

      {/* ─── SECTION: Mesh Gradient + Timeline ─── */}
      <Section dark id="timeline" className="overflow-hidden">
        <MeshGradient
          colors={["#22d3ee", "#6366f1", "#a855f7", "#ec4899"]}
          speed="slow"
        >
          <div className="max-w-4xl mx-auto px-6 py-24">
            <Reveal>
              <p className="text-sm font-medium text-brand-4 uppercase tracking-widest mb-3">
                {s.timelineKicker}
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12">
                {s.timelineTitle}
              </h2>
            </Reveal>

            <AnimatedTimeline
              nodes={[
                {
                  date: s.timelineNodes[0].date,
                  title: s.timelineNodes[0].title,
                  description: s.timelineNodes[0].desc,
                  icon: <Target className="w-4 h-4" />,
                },
                {
                  date: s.timelineNodes[1].date,
                  title: s.timelineNodes[1].title,
                  description: s.timelineNodes[1].desc,
                  icon: <Zap className="w-4 h-4" />,
                  color: "#22d3ee",
                },
                {
                  date: s.timelineNodes[2].date,
                  title: s.timelineNodes[2].title,
                  description: s.timelineNodes[2].desc,
                  icon: <Layers className="w-4 h-4" />,
                  color: "#818CF8",
                },
                {
                  date: s.timelineNodes[3].date,
                  title: s.timelineNodes[3].title,
                  description: s.timelineNodes[3].desc,
                  icon: <Rocket className="w-4 h-4" />,
                  color: "#a855f7",
                },
                {
                  date: s.timelineNodes[4].date,
                  title: s.timelineNodes[4].title,
                  description: s.timelineNodes[4].desc,
                  icon: <TrendingUp className="w-4 h-4" />,
                  color: "#4ADE80",
                },
              ]}
              direction="vertical"
              animateConnector
              color="#818CF8"
            />
          </div>
        </MeshGradient>
      </Section>

      {/* ─── SECTION: 3D Globe ─── */}
      <Section dark id="globe">
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-4">
          <Reveal>
            <p className="text-sm font-medium text-brand-2 uppercase tracking-widest mb-3">
              {s.globeKicker}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {s.globeTitle}
            </h2>
            <p className="text-white/50 max-w-xl mb-4 leading-relaxed">
              {s.globeSub}
            </p>
          </Reveal>
        </div>

        <Reveal variant="scale-in">
          <Globe3D
            markers={[
              { position: [37.77, -122.42], label: "San Francisco", color: "#22d3ee" },
              { position: [24.45, 54.65], label: "Abu Dhabi", color: "#818CF8" },
              { position: [51.51, -0.13], label: "London", color: "#F472B6" },
              { position: [1.35, 103.82], label: "Singapore", color: "#4ADE80" },
              { position: [35.68, 139.69], label: "Tokyo", color: "#a855f7" },
            ]}
            arcs={[
              { from: [37.77, -122.42], to: [51.51, -0.13], color: "#22d3ee" },
              { from: [51.51, -0.13], to: [24.45, 54.65], color: "#818CF8" },
              { from: [24.45, 54.65], to: [1.35, 103.82], color: "#F472B6" },
              { from: [1.35, 103.82], to: [35.68, 139.69], color: "#a855f7" },
              { from: [35.68, 139.69], to: [37.77, -122.42], color: "#4ADE80" },
            ]}
            height="650px"
            rotationSpeed={0.5}
          />
        </Reveal>
      </Section>

      {/* ─── SECTION: Particles + Data Table ─── */}
      <Section dark id="data-table" className="overflow-hidden">
        <div className="relative">
          <ParticleField
            preset="constellation"
            color="#22d3ee"
            colorSecondary="#818CF8"
            count={60}
            opacity={0.3}
            className="absolute inset-0"
          />
          <div className="relative z-10 max-w-5xl mx-auto px-6 py-24">
            <Reveal>
              <p className="text-sm font-medium text-brand-1 uppercase tracking-widest mb-3">
                {s.tableKicker}
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">
                {s.tableTitle}
              </h2>
            </Reveal>

            <Reveal variant="fade-up">
              <div className="rounded-2xl border border-border/30 bg-bg-surface/80 backdrop-blur-sm p-6">
                <DataTable
                  columns={[
                    { key: "model", label: s.tableCols[0], sortable: true },
                    { key: "accuracy", label: s.tableCols[1], align: "right" as const, sortable: true },
                    { key: "latency", label: s.tableCols[2], align: "right" as const, sortable: true },
                    { key: "cost", label: s.tableCols[3], align: "right" as const, sortable: true },
                    { key: "status", label: s.tableCols[4], align: "center" as const },
                  ]}
                  data={[
                    { model: "GPT-5.2", accuracy: 97.3, latency: 120, cost: "$0.15", status: "Production" },
                    { model: "Claude Sonnet 4", accuracy: 96.8, latency: 95, cost: "$0.12", status: "Production" },
                    { model: "Gemini Ultra", accuracy: 95.2, latency: 180, cost: "$0.18", status: "Testing" },
                    { model: "Custom Model", accuracy: 98.1, latency: 45, cost: "$0.08", status: "Production" },
                    { model: "Llama 4 70B", accuracy: 93.5, latency: 65, cost: "$0.03", status: "Staging" },
                  ]}
                  highlightRow={(row) => row.model === "Custom Model"}
                  striped
                  highlightColor="#22d3ee"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ─── SECTION: Mask Reveal + Parallax ─── */}
      <Section id="visual-effects">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <Reveal>
            <p className="text-sm font-medium text-brand-3 uppercase tracking-widest mb-3">
              {s.entranceKicker}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {s.entranceTitle}
            </h2>
            <p className="text-muted max-w-xl mb-16">
              {s.entranceSub}
            </p>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-20">
            {([
              { shape: "circle" as const, label: "Circle", gradient: "from-cyan-500 to-blue-600" },
              { shape: "diamond" as const, label: "Diamond", gradient: "from-purple-500 to-pink-600" },
              { shape: "diagonal-left" as const, label: "Diagonal Left", gradient: "from-amber-500 to-orange-600" },
              { shape: "diagonal-right" as const, label: "Diagonal Right", gradient: "from-emerald-500 to-teal-600" },
              { shape: "horizontal" as const, label: "Horizontal", gradient: "from-rose-500 to-red-600" },
              { shape: "vertical" as const, label: "Vertical", gradient: "from-indigo-500 to-violet-600" },
            ]).map(({ shape, label, gradient }) => (
              <MaskReveal key={shape} shape={shape} duration={1} once={false}>
                <div className={`bg-gradient-to-br ${gradient} rounded-2xl aspect-[4/3] flex items-end p-5`}>
                  <span className="text-white font-bold text-sm tracking-wide uppercase drop-shadow-md">
                    {label}
                  </span>
                </div>
              </MaskReveal>
            ))}
          </div>

          <Reveal>
            <p className="text-xs font-semibold text-foreground/40 uppercase tracking-widest mb-10">
              {s.entranceTSLabel}
            </p>
          </Reveal>
          <div className="space-y-12">
            {([
              { label: "fade-up", mode: "word" as const, anim: "fade-up" as const, color: "text-brand-1", border: "border-l-brand-1", text: "Words rise into place" },
              { label: "blur-in", mode: "word" as const, anim: "blur-in" as const, color: "text-brand-3", border: "border-l-brand-3", text: "Focus sharpens gradually", stagger: 0.1 },
              { label: "scale", mode: "char" as const, anim: "scale" as const, color: "text-brand-4", border: "border-l-brand-4", text: "Pop in letter by letter", stagger: 0.02 },
              { label: "slide-up", mode: "word" as const, anim: "slide-up" as const, color: "text-amber-400", border: "border-l-amber-400", text: "Slide from below the line", stagger: 0.06 },
              { label: "rotate", mode: "word" as const, anim: "rotate" as const, color: "text-emerald-400", border: "border-l-emerald-400", text: "Flip into view with depth", stagger: 0.06 },
            ]).map((item) => (
              <div key={item.label} className={`border-l-2 ${item.border} pl-6 py-1`}>
                <span className={`text-[11px] uppercase tracking-widest font-semibold ${item.color} block mb-3`}>
                  {item.label} / {item.mode}
                </span>
                <TextSplit
                  mode={item.mode}
                  animation={item.anim}
                  className="text-3xl md:text-4xl font-bold text-foreground leading-tight"
                  stagger={item.stagger}
                  once={false}
                >
                  {item.text}
                </TextSplit>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ─── CTA ─── */}
      <Section dark id="cta" className="overflow-hidden">
        <div className="relative">
          <ParticleField
            preset="fireflies"
            color="#22d3ee"
            colorSecondary="#a855f7"
            count={30}
            opacity={0.5}
            className="absolute inset-0"
          />
          <div className="relative z-10 min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
            <Reveal>
              <div className="brand-gradient-bar w-12 h-[3px] mx-auto mb-8 rounded-full" />
            </Reveal>
            <TextSplit
              mode="word"
              animation="fade-up"
              className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
            >
              {s.ctaTitle}
            </TextSplit>
            <Reveal variant="fade-up" delay={0.4}>
              <p className="text-lg text-white/50 max-w-lg leading-relaxed mb-8">
                {s.ctaSub}
              </p>
            </Reveal>
            <Reveal variant="fade-up" delay={0.6}>
              <div className="flex items-center gap-3 text-sm text-white/40">
                <SmoothCounter target={35} suffix="+" duration={1.5} className="text-2xl font-bold text-brand-1" />
                <span>{s.ctaComponents}</span>
                <span className="text-white/20">|</span>
                <SmoothCounter target={4} duration={1} className="text-2xl font-bold text-brand-3" />
                <span>{s.ctaTemplates}</span>
                <span className="text-white/20">|</span>
                <SmoothCounter target={3} duration={1} className="text-2xl font-bold text-brand-4" />
                <span>{s.ctaApis}</span>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>
    </main>
  );
}
