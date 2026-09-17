"use client";

import { presentations } from "@/content/registry";
import { ChevronDown, Presentation } from "lucide-react";

interface PresentationSelectorProps {
  value: string | null;
  onChange: (slug: string) => void;
}

export function PresentationSelector({
  value,
  onChange,
}: PresentationSelectorProps) {
  const selected = presentations.find((p) => p.slug === value);

  return (
    <div className="relative">
      <div className="relative">
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none px-4 py-3 pr-10 rounded-xl border border-border bg-bg-light-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all cursor-pointer"
        >
          <option value="" disabled>
            Select a presentation...
          </option>
          {presentations.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.title}
              {p.customer ? ` (${p.customer})` : ""}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
      </div>

      {selected && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted">
          <Presentation className="w-3.5 h-3.5" />
          <span>/{selected.slug}</span>
          <span className="text-muted/50">·</span>
          <span>{selected.type}</span>
          {selected.customer && (
            <>
              <span className="text-muted/50">·</span>
              <span>{selected.customer}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
