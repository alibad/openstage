import { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { HeroStat } from "./animations/hero-stat";
import { EditorialGrid, EditorialCell } from "./animations/editorial-grid";

interface TitleSlideProps {
  title: string;
  subtitle?: string;
  author?: string;
  date?: string;
  tag?: string;
}

export function TitleSlide({ title, subtitle, author, date, tag }: TitleSlideProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center h-full gap-6">
      {tag && (
        <span className="text-xs font-medium tracking-widest uppercase text-brand-3 bg-accent-light px-3 py-1.5 rounded-full">
          {tag}
        </span>
      )}
      <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground leading-[1.1] max-w-4xl text-balance">
        {title}
      </h1>
      {subtitle && (
        <p className="text-xl md:text-2xl text-muted font-light max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
      {(author || date) && (
        <div className="flex items-center gap-3 mt-4 text-sm text-muted">
          {author && <span className="font-medium text-foreground/70">{author}</span>}
          {author && date && <span className="text-border">·</span>}
          {date && <span>{date}</span>}
        </div>
      )}
      <div className="w-48 brand-gradient-bar rounded-full mt-2" />
    </div>
  );
}

interface SectionSlideProps {
  number?: string;
  title: string;
  subtitle?: string;
}

export function SectionSlide({ number, title, subtitle }: SectionSlideProps) {
  return (
    <div className="flex flex-col justify-center h-full gap-4">
      {number && (
        <span className="text-sm font-semibold brand-gradient-text tracking-wide">
          {number}
        </span>
      )}
      <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.15]">
        {title}
      </h2>
      {subtitle && (
        <p className="text-lg text-muted font-light max-w-2xl leading-relaxed mt-2">
          {subtitle}
        </p>
      )}
      <div className="w-20 brand-gradient-bar rounded-full mt-4" />
    </div>
  );
}

interface ContentSlideProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function ContentSlide({ title, subtitle, children }: ContentSlideProps) {
  return (
    <div className="flex flex-col h-full gap-8">
      <div>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-lg text-muted mt-2 font-light">{subtitle}</p>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-center">{children}</div>
    </div>
  );
}

interface SplitSlideProps {
  title: string;
  left: ReactNode;
  right: ReactNode;
}

export function SplitSlide({ title, left, right }: SplitSlideProps) {
  return (
    <div className="flex flex-col h-full gap-8">
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground leading-tight">
        {title}
      </h2>
      <div className="flex-1 grid grid-cols-2 gap-12 items-center">
        <div>{left}</div>
        <div>{right}</div>
      </div>
    </div>
  );
}

interface QuoteSlideProps {
  quote: string;
  author?: string;
  role?: string;
}

export function QuoteSlide({ quote, author, role }: QuoteSlideProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-6 max-w-3xl mx-auto">
      <div className="brand-gradient-text text-7xl font-serif leading-none">&ldquo;</div>
      <blockquote className="text-2xl md:text-3xl font-light text-foreground leading-relaxed italic">
        {quote}
      </blockquote>
      {(author || role) && (
        <div className="flex flex-col items-center gap-1 mt-4">
          {author && (
            <span className="text-sm font-medium text-foreground">{author}</span>
          )}
          {role && <span className="text-sm text-muted">{role}</span>}
        </div>
      )}
    </div>
  );
}

export function Bullet({ children, icon }: { children: ReactNode; icon?: string }) {
  return (
    <li className="flex items-start gap-3 text-lg text-foreground/90 leading-relaxed">
      <span className={cn(
        "mt-0.5 shrink-0 text-base font-medium",
        icon === "✓" ? "text-brand-2" : icon === "✗" ? "text-error" : "text-brand-3"
      )}>
        {icon || "→"}
      </span>
      <span>{children}</span>
    </li>
  );
}

export function BulletList({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col gap-4">{children}</ul>;
}

export function CodeBlock({ children, language }: { children: string; language?: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-border/50 shadow-sm">
      {language && (
        <div className="px-4 py-2 bg-code-bg border-b border-white/5">
          <span className="text-xs font-mono brand-gradient-text">{language}</span>
        </div>
      )}
      <pre className="p-6 bg-code-bg text-code-fg text-sm leading-relaxed overflow-x-auto">
        <code className="font-mono">{children}</code>
      </pre>
    </div>
  );
}

interface StatProps {
  value: string;
  label: string;
  highlight?: boolean;
}

export function Stat({ value, label, highlight }: StatProps) {
  return (
    <div className={cn(
      "text-center p-6 rounded-xl border",
      highlight ? "border-brand-2/30 bg-accent-light/50" : "border-border bg-surface"
    )}>
      <div className={cn(
        "text-4xl md:text-5xl font-bold tracking-tight",
        highlight ? "brand-gradient-text" : "text-foreground"
      )}>
        {value}
      </div>
      <div className="text-sm text-muted mt-2 font-medium">{label}</div>
    </div>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-6">{children}</div>
  );
}

interface StepProps {
  number: number;
  title: string;
  description: string;
  active?: boolean;
}

export function Step({ number, title, description, active }: StepProps) {
  return (
    <div className={cn(
      "flex gap-4 p-4 rounded-xl border transition-colors",
      active ? "border-brand-2/30 bg-accent-light/30" : "border-border bg-surface"
    )}>
      <div className={cn(
        "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
        active ? "brand-gradient-bg text-white" : "bg-border/50 text-muted"
      )}>
        {number}
      </div>
      <div>
        <div className="font-medium text-foreground">{title}</div>
        <div className="text-sm text-muted mt-0.5 leading-relaxed">{description}</div>
      </div>
    </div>
  );
}

interface DiagramBoxProps {
  children: ReactNode;
  accent?: boolean;
  className?: string;
}

export function DiagramBox({ children, accent, className }: DiagramBoxProps) {
  return (
    <div className={cn(
      "px-5 py-3 rounded-lg border text-sm font-medium text-center relative",
      accent
        ? "border-brand-2/30 bg-accent-light/50 text-brand-2"
        : "border-border bg-surface text-foreground",
      className
    )}>
      {children}
    </div>
  );
}

export function DiagramArrow() {
  return (
    <div className="flex items-center justify-center py-1">
      <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
        <defs>
          <linearGradient id="arrowGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
        <path d="M10 0 L10 18 M4 14 L10 20 L16 14" stroke="url(#arrowGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Awwwards-tier slide layouts (Phase 3)
   ═══════════════════════════════════════════════════════════════════════ */

interface HeroStatSlideProps {
  value: number | string;
  label: ReactNode;
  kicker?: ReactNode;
  caption?: ReactNode;
  prefix?: string;
  suffix?: string;
  compact?: boolean;
  flip?: boolean;
  accent?: string;
  size?: "md" | "lg" | "xl" | "monster";
}

/**
 * HeroStatSlide — "one number owns the slide".
 * Dominant figure centered, small label beneath. For the stat that IS the point.
 */
export function HeroStatSlide({
  value,
  label,
  kicker,
  caption,
  prefix,
  suffix,
  compact,
  flip = true,
  accent,
  size = "xl",
}: HeroStatSlideProps) {
  return (
    <div className="flex flex-col h-full justify-center items-center">
      <HeroStat
        value={value}
        label={label}
        kicker={kicker}
        caption={caption}
        prefix={prefix}
        suffix={suffix}
        compact={compact}
        flip={flip}
        accent={accent}
        size={size}
        align="center"
      />
    </div>
  );
}

interface EditorialSlideProps {
  kicker?: ReactNode;
  title: ReactNode;
  body: ReactNode;
  aside?: ReactNode;
  figure?: ReactNode;
  /** Flip so figure is on the left */
  figureLeft?: boolean;
}

/**
 * EditorialSlide — asymmetric 12-col magazine layout for long-form moments.
 * Oversize kicker, lede headline, body paragraph, optional sidebar and figure.
 */
export function EditorialSlide({
  kicker,
  title,
  body,
  aside,
  figure,
  figureLeft = false,
}: EditorialSlideProps) {
  return (
    <div className="flex flex-col h-full justify-center">
      <EditorialGrid rowGap="1.5rem" colGap="2.5rem">
        {kicker && (
          <EditorialCell span="kicker">
            <div className="text-xs font-semibold tracking-[0.24em] uppercase brand-gradient-text">
              {kicker}
            </div>
          </EditorialCell>
        )}
        <EditorialCell span={figure ? "lede" : "wide"}>
          <h2 className="display-md font-semibold tracking-tight text-foreground leading-[1.02] text-balance">
            {title}
          </h2>
        </EditorialCell>
        {figure && (
          <EditorialCell span={figureLeft ? "figureLeft" : "figureHalf"}>
            <div className="w-full h-full rounded-2xl overflow-hidden border border-border/40">
              {figure}
            </div>
          </EditorialCell>
        )}
        <EditorialCell span={figure ? "body" : "half"}>
          <div className="prose-presentation text-foreground/90">{body}</div>
        </EditorialCell>
        {aside && !figure && (
          <EditorialCell span="halfRight">
            <div className="border-l border-border pl-6 text-sm text-muted leading-relaxed">
              {aside}
            </div>
          </EditorialCell>
        )}
      </EditorialGrid>
    </div>
  );
}

interface FullBleedQuoteSlideProps {
  quote: ReactNode;
  author?: ReactNode;
  role?: ReactNode;
  /** CSS gradient / image for the full-bleed background */
  background?: string;
}

/**
 * FullBleedQuoteSlide — oversized editorial serif quote on a full-bleed gradient.
 * Use when a single quote or line IS the slide.
 */
export function FullBleedQuoteSlide({
  quote,
  author,
  role,
  background = "radial-gradient(ellipse at 30% 20%, rgba(125,211,252,0.18), transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(244,114,182,0.18), transparent 60%), #0A0718",
}: FullBleedQuoteSlideProps) {
  return (
    <div
      className="flex flex-col h-full justify-center items-center -m-[var(--slide-padding,4rem)] p-[var(--slide-padding,4rem)]"
      style={{ background }}
    >
      <div className="max-w-5xl w-full flex flex-col items-start gap-10">
        <div className="editorial-serif text-brand-1/80 text-[8rem] leading-[0.5] opacity-60 -ml-2">
          &ldquo;
        </div>
        <blockquote className="editorial-serif text-4xl md:text-6xl leading-[1.1] text-white text-balance text-pretty">
          {quote}
        </blockquote>
        {(author || role) && (
          <div className="flex flex-col gap-0.5 mt-4">
            {author && (
              <div className="text-sm font-medium text-white/80 uppercase tracking-[0.2em]">
                {author}
              </div>
            )}
            {role && <div className="text-sm text-white/50">{role}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

interface ChapterBreakSlideProps {
  number?: string;
  title: ReactNode;
  subtitle?: ReactNode;
}

/**
 * ChapterBreakSlide — typography-only pause beat between sections.
 * No chrome, no bullets. The title IS the slide.
 */
export function ChapterBreakSlide({
  number,
  title,
  subtitle,
}: ChapterBreakSlideProps) {
  return (
    <div className="flex flex-col h-full justify-center items-start gap-8 max-w-6xl">
      {number && (
        <div className="text-sm font-semibold tracking-[0.3em] uppercase brand-gradient-text">
          {number}
        </div>
      )}
      <h2 className="display-lg font-semibold tracking-tight leading-[0.98] text-foreground text-balance">
        {title}
      </h2>
      {subtitle && (
        <p className="editorial-italic text-2xl md:text-3xl text-muted max-w-3xl leading-snug text-pretty">
          {subtitle}
        </p>
      )}
      <div className="w-32 h-[2px] mt-4 brand-gradient-bar rounded-full" />
    </div>
  );
}

export interface BentoCell {
  /** Grid column span 1-6 */
  col?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Grid row span 1-3 */
  row?: 1 | 2 | 3;
  /** Background mood */
  tone?: "default" | "accent" | "gradient" | "glass";
  /** Cell contents */
  children: ReactNode;
  className?: string;
}

interface BentoSlideProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  cells: BentoCell[];
  /** Number of columns (defaults to 6) */
  columns?: 4 | 6;
}

/**
 * BentoSlide — varied-size card grid in the style of Apple / Vercel marketing.
 * Each cell can span 1-6 cols and 1-3 rows. Useful for feature summaries.
 */
export function BentoSlide({
  title,
  subtitle,
  cells,
  columns = 6,
}: BentoSlideProps) {
  return (
    <div className="flex flex-col h-full gap-8">
      {(title || subtitle) && (
        <div className="flex flex-col gap-2">
          {title && (
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground leading-tight text-balance">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-lg text-muted font-light max-w-3xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div
        className="flex-1 grid gap-4 auto-rows-[minmax(0,1fr)]"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {cells.map((cell, i) => {
          const toneClass =
            cell.tone === "accent"
              ? "bg-accent-light/60 border-brand-2/30"
              : cell.tone === "gradient"
                ? "border-white/10"
                : cell.tone === "glass"
                  ? "bg-white/5 border-white/10 backdrop-blur-md"
                  : "bg-surface border-border";
          const gradientBg =
            cell.tone === "gradient"
              ? {
                  background:
                    "linear-gradient(135deg, rgba(125,211,252,0.12), rgba(167,139,250,0.12) 50%, rgba(244,114,182,0.12))",
                }
              : undefined;
          return (
            <div
              key={i}
              className={cn(
                "rounded-2xl p-6 border flex flex-col",
                toneClass,
                cell.className,
              )}
              style={{
                gridColumn: `span ${cell.col ?? 2} / span ${cell.col ?? 2}`,
                gridRow: `span ${cell.row ?? 1} / span ${cell.row ?? 1}`,
                ...gradientBg,
              }}
            >
              {cell.children}
            </div>
          );
        })}
      </div>
    </div>
  );
}
