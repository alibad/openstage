"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  ExternalLink,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface FeedbackIssue {
  number: number;
  title: string;
  body: string;
  state: string;
  html_url: string;
  labels: { name: string }[];
  created_at: string;
}

export function FeedbackPanel({
  slug,
  onAddressIssue,
  onTrackIssue,
}: {
  slug: string;
  onAddressIssue: (text: string) => void;
  onTrackIssue?: (issueNumber: number) => void;
}) {
  const [issues, setIssues] = useState<FeedbackIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    Promise.all([
      fetch(`/api/feedback?slug=${slug}`)
        .then((r) => r.json())
        .then((d) => d.issues || [])
        .catch(() => []),
      fetch(`/api/presentations/status?slug=${slug}`)
        .then((r) => r.json())
        .then((d) =>
          (d.issues || [])
            .filter((i: { state: string }) => i.state === "open")
            .map((i: { issueNumber: number; title: string; issueUrl: string; labels: string[] }) => ({
              number: i.issueNumber,
              title: i.title,
              body: "",
              state: "open",
              html_url: i.issueUrl,
              labels: i.labels.map((l: string) => ({ name: l })),
              created_at: "",
            }))
        )
        .catch(() => []),
    ]).then(([feedback, requests]) => {
      const openFeedback = feedback.filter(
        (i: FeedbackIssue) => i.state === "open"
      );
      setIssues([...openFeedback, ...requests]);
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted px-1 py-2">
        <Loader2 className="w-3 h-3 animate-spin" />
        Loading feedback...
      </div>
    );
  }

  if (issues.length === 0) return null;

  return (
    <div className="mb-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.03] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs"
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-medium text-amber-600">
            {issues.length} open feedback item{issues.length > 1 ? "s" : ""}
          </span>
        </div>
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {issues.map((issue) => (
            <div
              key={issue.number}
              className="flex items-start gap-2 p-2.5 rounded-lg bg-bg-light-surface border border-border text-xs"
            >
              <MessageSquare className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {issue.title}
                </p>
                {issue.body && (
                  <p className="text-muted mt-0.5 line-clamp-2">
                    {issue.body.slice(0, 200)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    onAddressIssue(
                      `Address feedback #${issue.number}: "${issue.title}"${issue.body ? ` — ${issue.body.slice(0, 200)}` : ""}`
                    );
                    onTrackIssue?.(issue.number);
                  }}
                  className="px-2 py-1 text-[10px] font-medium text-accent bg-accent/10 hover:bg-accent/20 rounded transition-colors"
                >
                  Address
                </button>
                {issue.html_url && (
                  <a
                    href={issue.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted hover:text-foreground"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
