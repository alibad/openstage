"use client";

import { useEffect, useState } from "react";
import { PenLine, Edit3, MessageSquareWarning, Layers } from "lucide-react";
import { useStudioStore } from "@/lib/studio-store";
import { ChatPanel } from "@/components/studio/chat-panel";
import { PresentationSelector } from "@/components/studio/presentation-selector";

const modes = [
  {
    id: "create" as const,
    label: "Create",
    icon: PenLine,
    desc: "Generate a new presentation from scratch",
  },
  {
    id: "edit" as const,
    label: "Edit",
    icon: Edit3,
    desc: "Modify an existing presentation",
  },
  {
    id: "feedback" as const,
    label: "Feedback",
    icon: MessageSquareWarning,
    desc: "Address open feedback on a presentation",
  },
];

export default function StudioPage() {
  const { mode, selectedSlug, setMode, setSelectedSlug } = useStudioStore();
  const needsSlug = mode === "edit" || mode === "feedback";
  const [sections, setSections] = useState<string[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);

  useEffect(() => {
    if (!selectedSlug || mode === "create") {
      setSections([]);
      return;
    }
    setLoadingSections(true);
    fetch(`/api/presentations/sections?slug=${selectedSlug}`)
      .then((r) => r.json())
      .then((data) => setSections(data.sections || []))
      .catch(() => setSections([]))
      .finally(() => setLoadingSections(false));
  }, [selectedSlug, mode]);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Mode tabs + selector */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-light-surface border border-border">
          {modes.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-all ${
                  active
                    ? "bg-accent text-white font-medium"
                    : "text-muted hover:text-foreground hover:bg-accent-light"
                }`}
                title={m.desc}
              >
                <Icon className="w-3.5 h-3.5" />
                {m.label}
              </button>
            );
          })}
        </div>

        {needsSlug && (
          <div className="flex-1 min-w-[240px] max-w-md">
            <PresentationSelector
              value={selectedSlug}
              onChange={setSelectedSlug}
            />
          </div>
        )}
      </div>

      {/* Section pills — shown when editing/feedback on a selected presentation */}
      {needsSlug && selectedSlug && sections.length > 0 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Layers className="w-3.5 h-3.5 text-muted shrink-0" />
          <span className="text-xs text-muted mr-1">Sections:</span>
          {sections.map((s) => (
            <span
              key={s}
              className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-light border border-accent/10 text-accent"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Chat */}
      {needsSlug && !selectedSlug ? (
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <p className="text-lg font-semibold text-foreground mb-1">
              Select a presentation
            </p>
            <p className="text-sm text-muted">
              Choose which presentation to{" "}
              {mode === "edit" ? "edit" : "review feedback for"}.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <ChatPanel />
        </div>
      )}
    </div>
  );
}
