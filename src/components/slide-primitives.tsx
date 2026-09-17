"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Shared building blocks for slide-mode presentations.
 * Import from "@/components/slide-primitives".
 *
 * These ensure visual consistency across all slide decks while allowing
 * each presentation to compose its own layouts.
 */

/* ─── Typography ─── */

export function SectionTag({ label, className }: { label: string; className?: string }) {
  return (
    <p
      className={cn(
        "text-xs font-semibold tracking-widest uppercase brand-gradient-text mb-3",
        className,
      )}
    >
      {label}
    </p>
  );
}

export function SlideHeading({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-tight text-balance",
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function SlideSubtitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-lg text-muted mt-3 font-light leading-relaxed max-w-2xl text-pretty", className)}>
      {children}
    </p>
  );
}

/* ─── Lists ─── */

export function Bullet({
  children,
  color = "text-brand-3",
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <li className="flex items-start gap-3 text-lg text-foreground/90 leading-relaxed">
      <span className={cn("mt-1 shrink-0 text-sm", color)}>→</span>
      <span>{children}</span>
    </li>
  );
}

export function BulletList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <ul className={cn("flex flex-col gap-4", className)}>{children}</ul>;
}

/* ─── Stats ─── */

interface StatCardProps {
  value: string;
  label: string;
  icon?: ReactNode;
  highlight?: boolean;
}

export function StatCard({ value, label, icon, highlight }: StatCardProps) {
  return (
    <div
      className={cn(
        "text-center p-6 rounded-xl border flex flex-col items-center gap-3",
        highlight
          ? "border-brand-2/30 bg-accent-light/50"
          : "border-border bg-surface",
      )}
    >
      {icon && <div className="text-muted">{icon}</div>}
      <div
        className={cn(
          "text-4xl md:text-5xl font-bold tracking-tight",
          highlight ? "brand-gradient-text" : "text-foreground",
        )}
      >
        {value}
      </div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  );
}

export function StatGrid({
  children,
  columns = 3,
  className,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const cols = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" };
  return <div className={cn("grid gap-5", cols[columns], className)}>{children}</div>;
}

/* ─── Comparison ─── */

interface ComparisonSide {
  label: string;
  items: string[];
  positive?: boolean;
  icon?: ReactNode;
}

export function ComparisonGrid({
  left,
  right,
  className,
}: {
  left: ComparisonSide;
  right: ComparisonSide;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-6", className)}>
      <ComparisonColumn side={left} />
      <ComparisonColumn side={right} />
    </div>
  );
}

function ComparisonColumn({ side }: { side: ComparisonSide }) {
  const positive = side.positive ?? false;
  return (
    <div
      className={cn(
        "p-6 rounded-xl border flex flex-col gap-4",
        positive
          ? "border-brand-2/30 bg-accent-light/40"
          : "border-border bg-surface",
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "w-2.5 h-2.5 rounded-full",
            positive ? "bg-brand-2" : "bg-muted/40",
          )}
        />
        <span
          className={cn(
            "text-xs font-medium uppercase tracking-wider",
            positive ? "text-brand-2" : "text-muted",
          )}
        >
          {side.label}
        </span>
      </div>
      <ul className="flex flex-col gap-3">
        {side.items.map((item) => (
          <li
            key={item}
            className={cn(
              "flex items-start gap-2 text-sm",
              positive ? "text-foreground/80" : "text-muted",
            )}
          >
            <span
              className={cn("shrink-0 mt-0.5", positive ? "text-brand-2" : "text-muted/40")}
            >
              {positive ? "✓" : "✗"}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Layout helpers ─── */

export function SlideCallout({
  icon,
  children,
  className,
}: {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 p-4 rounded-xl border border-border bg-surface", className)}>
      {icon && <div className="shrink-0 text-brand-3">{icon}</div>}
      <div className="text-sm text-muted leading-relaxed">{children}</div>
    </div>
  );
}

interface TimelineStep {
  icon?: ReactNode;
  color?: string;
  bg?: string;
  border?: string;
  label: string;
  name?: string;
  description: string;
}

export function SlideTimeline({
  steps,
  className,
}: {
  steps: TimelineStep[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {steps.map((step, i) => {
        const color = step.color ?? "text-brand-1";
        const bg = step.bg ?? "bg-brand-1/10";
        const border = step.border ?? "border-brand-1/20";

        return (
          <div key={step.label} className="flex items-start gap-5">
            <div className="flex flex-col items-center shrink-0">
              <div
                className={cn(
                  "w-11 h-11 rounded-xl border flex items-center justify-center",
                  bg,
                  border,
                )}
              >
                {step.icon && <div className={cn("w-5 h-5", color)}>{step.icon}</div>}
              </div>
              {i < steps.length - 1 && <div className="w-px h-6 bg-border/60 mt-2" />}
            </div>
            <div className={cn("flex-1 pb-4 p-5 rounded-xl border", border, `${bg}/30`)}>
              <div className="flex items-center gap-3 mb-1">
                <span className={cn("text-xs font-bold uppercase tracking-wider", color)}>
                  {step.label}
                </span>
                {step.name && (
                  <span className="text-xs text-muted border border-border px-2 py-0.5 rounded-full">
                    {step.name}
                  </span>
                )}
              </div>
              <p className="text-base text-foreground/80 leading-relaxed">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function NumberedSteps({
  steps,
  className,
}: {
  steps: { title: string; description: string; tag?: string }[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {steps.map((step, i) => (
        <div
          key={i}
          className="flex gap-5 p-5 rounded-xl border border-border bg-surface hover:border-brand-2/20 transition-colors"
        >
          <div className="shrink-0 w-9 h-9 rounded-full brand-gradient-bg flex items-center justify-center text-white text-sm font-bold">
            {i + 1}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
              {step.tag && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-brand-2 bg-brand-2/10 border border-brand-2/20">
                  {step.tag}
                </span>
              )}
            </div>
            <p className="text-sm text-muted leading-relaxed">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Code block mock (file preview with window chrome) */
export function CodePreview({
  filename,
  children,
  className,
}: {
  filename: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-code-bg overflow-hidden", className)}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
        </div>
        <span className="text-xs text-white/40 font-mono ml-2">{filename}</span>
      </div>
      <div className="p-5 font-mono text-sm leading-relaxed space-y-1">{children}</div>
    </div>
  );
}
