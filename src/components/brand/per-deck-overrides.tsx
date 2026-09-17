"use client";

import { useEffect, useMemo, useState } from "react";
import { Layers, X, ChevronRight } from "lucide-react";
import {
  BUILTIN_PRESETS,
  loadDeckOverrides,
  saveDeckOverride,
  DECK_OVERRIDES_EVENT,
  type BrandHint,
  type PerDeckOverrides,
} from "@/lib/brand";
import { presentations } from "@/content/registry";
import { toast } from "sonner";

/**
 * Per-deck override management. Lists every presentation grouped by
 * "Has overrides" → "All others" so the active customizations are
 * front-and-center. Each row shows:
 *   • current effective preset (registry default underlined, runtime
 *     override bold)
 *   • dropdown to pick a different preset
 *   • clear button (only when a runtime override exists)
 */

type Source = "global" | "registry" | "runtime";

interface DeckRow {
  slug: string;
  title: string;
  type: "scroll" | "slides";
  registryHint?: BrandHint;
  runtimeHint?: BrandHint;
  effectivePresetId: string | null;
  source: Source;
}

function deriveRows(overrides: PerDeckOverrides): DeckRow[] {
  return presentations
    .filter((p) => p.status !== "draft")
    .map((p) => {
      const registryHint = p.brand;
      const runtimeHint = overrides[p.slug];
      const effective = runtimeHint ?? registryHint;
      const source: Source = runtimeHint
        ? "runtime"
        : registryHint
          ? "registry"
          : "global";
      const effectivePresetId = effective?.presetId ?? null;
      return {
        slug: p.slug,
        title: p.title,
        type: p.type,
        registryHint,
        runtimeHint,
        effectivePresetId,
        source,
      };
    })
    .sort((a, b) => {
      // Has runtime override first, then registry, then global
      const order: Record<Source, number> = { runtime: 0, registry: 1, global: 2 };
      const diff = order[a.source] - order[b.source];
      if (diff !== 0) return diff;
      return a.title.localeCompare(b.title);
    });
}

export function PerDeckOverrides() {
  const [overrides, setOverrides] = useState<PerDeckOverrides>({});

  useEffect(() => {
    const refresh = () => setOverrides(loadDeckOverrides());
    refresh();
    window.addEventListener(DECK_OVERRIDES_EVENT, refresh);
    return () => window.removeEventListener(DECK_OVERRIDES_EVENT, refresh);
  }, []);

  const rows = useMemo(() => deriveRows(overrides), [overrides]);
  const customizedCount = rows.filter((r) => r.source !== "global").length;

  const handleSelect = (slug: string, value: string) => {
    if (value === "__global__") {
      saveDeckOverride(slug, null);
      toast.success(`Cleared override for "${slug}"`);
    } else {
      saveDeckOverride(slug, { presetId: value });
      const presetName = BUILTIN_PRESETS.find((p) => p.id === value)?.name ?? value;
      toast.success(`Set "${slug}" to ${presetName}`);
    }
  };

  const handleClear = (slug: string) => {
    saveDeckOverride(slug, null);
    toast.success(`Cleared override for "${slug}"`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted">
          Override which preset a specific presentation uses, regardless of the
          global theme.{" "}
          {customizedCount > 0 && (
            <span className="text-foreground font-medium">
              {customizedCount} customized
            </span>
          )}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-surface divide-y divide-border max-h-96 overflow-y-auto">
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted">
            No published presentations.
          </div>
        ) : (
          rows.map((row) => <DeckRowItem key={row.slug} row={row} onSelect={handleSelect} onClear={handleClear} />)
        )}
      </div>
      <p className="text-[11px] text-muted mt-3 leading-relaxed">
        <span className="font-semibold text-foreground">Layering:</span> global →
        registry default → runtime override. The runtime override takes
        precedence and is stored in this browser only.
      </p>
    </div>
  );
}

function DeckRowItem({
  row,
  onSelect,
  onClear,
}: {
  row: DeckRow;
  onSelect: (slug: string, value: string) => void;
  onClear: (slug: string) => void;
}) {
  const sourceBadge: Record<Source, { label: string; cls: string }> = {
    runtime: {
      label: "override",
      cls: "bg-accent text-white",
    },
    registry: {
      label: "registry",
      cls: "bg-accent-light text-accent",
    },
    global: {
      label: "global",
      cls: "bg-border/40 text-muted",
    },
  };
  const badge = sourceBadge[row.source];
  const currentValue = row.runtimeHint?.presetId ?? "__global__";

  return (
    <div className="px-3 py-2.5 flex items-center gap-3 hover:bg-accent-light/20">
      <Layers className="w-3.5 h-3.5 text-muted shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {row.title}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-muted/70 font-semibold">
            {row.type}
          </span>
          <span
            className={`text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded ${badge.cls}`}
          >
            {badge.label}
          </span>
        </div>
        <div className="text-[11px] text-muted truncate">
          {row.effectivePresetId
            ? `Currently: ${BUILTIN_PRESETS.find((p) => p.id === row.effectivePresetId)?.name ?? row.effectivePresetId}`
            : "Currently: global theme"}
        </div>
      </div>
      <select
        value={currentValue}
        onChange={(e) => onSelect(row.slug, e.target.value)}
        className="text-xs px-2 py-1 rounded-lg border border-border bg-bg-light text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
      >
        <option value="__global__">Use global</option>
        {BUILTIN_PRESETS.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.name}
          </option>
        ))}
      </select>
      {row.source === "runtime" && (
        <button
          type="button"
          onClick={() => onClear(row.slug)}
          className="p-1.5 rounded-lg text-muted hover:text-error hover:bg-error/10 transition-colors"
          title="Clear runtime override"
          aria-label="Clear runtime override"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      <ChevronRight className="w-3.5 h-3.5 text-muted/40 shrink-0" />
    </div>
  );
}
