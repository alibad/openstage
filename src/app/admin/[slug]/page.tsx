"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getPresentationBySlug } from "@/content/registry";
import {
  ArrowLeft,
  ExternalLink,
  Lock,
  Building2,
  Palette,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CircleDot,
  Clock,
  Globe,
} from "lucide-react";

interface IssueInfo {
  issueNumber: number;
  issueUrl: string;
  state: string;
  title: string;
  createdAt: string;
  labels: string[];
  comments: {
    body: string;
    createdAt: string;
    author: string;
  }[];
}

export default function PresentationDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const meta = getPresentationBySlug(slug);
  const [updateBrief, setUpdateBrief] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    issueUrl?: string;
    error?: string;
  } | null>(null);
  const [issues, setIssues] = useState<IssueInfo[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);

  useEffect(() => {
    fetch(`/api/presentations/status?slug=${slug}`)
      .then((r) => r.json())
      .then((data) => setIssues(data.issues || []))
      .catch(() => {})
      .finally(() => setLoadingIssues(false));
  }, [slug]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!meta || !updateBrief.trim()) return;

    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/presentations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: meta.slug,
          title: meta.title,
          brief: updateBrief,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, issueUrl: data.issueUrl });
        setUpdateBrief("");
      } else {
        setResult({ success: false, error: data.error });
      }
    } catch {
      setResult({ success: false, error: "Network error" });
    } finally {
      setSubmitting(false);
    }
  }

  if (!meta) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted">Presentation not found.</p>
        <Link
          href="/admin"
          className="text-accent hover:underline text-sm mt-2 inline-block"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/admin"
        className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="p-6 rounded-2xl border border-border bg-surface mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{meta.title}</h1>
            {meta.subtitle && (
              <p className="text-muted text-sm mt-1">{meta.subtitle}</p>
            )}
          </div>
          <Link
            href={`/${meta.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted hover:text-foreground border border-border hover:border-accent/20 rounded-lg transition-all shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Live
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-muted">
          <span className="flex items-center gap-1">
            {meta.protected ? (
              <Lock className="w-3 h-3" />
            ) : (
              <Globe className="w-3 h-3" />
            )}
            {meta.protected ? "Password Protected" : "Public"}
          </span>
          {meta.customer && (
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {meta.customer}
            </span>
          )}
          {meta.accentColor && (
            <span className="flex items-center gap-1">
              <Palette className="w-3 h-3" />
              <span
                className="w-3 h-3 rounded-full border border-border"
                style={{ backgroundColor: meta.accentColor }}
              />
              {meta.accentColor}
            </span>
          )}
          <span>
            <Clock className="w-3 h-3 inline mr-1" />
            {meta.date}
          </span>
          <span className="text-muted/50">/{meta.slug}</span>
        </div>

        <p className="text-sm text-muted mt-4 leading-relaxed">
          {meta.description}
        </p>
      </div>

      {/* Request Update */}
      <div className="p-6 rounded-2xl border border-border bg-surface mb-6">
        <h2 className="text-lg font-semibold mb-1">Request Update</h2>
        <p className="text-xs text-muted mb-4">
          Describe what you want to change. Claude Code will update the
          presentation and redeploy.
        </p>

        <form onSubmit={handleUpdate} className="space-y-4">
          <textarea
            value={updateBrief}
            onChange={(e) => setUpdateBrief(e.target.value)}
            placeholder='e.g. "Move the ROI section above the technical architecture section. Update the TAM number to $4.2B. Add a competitive comparison slide showing us vs. McKinsey approach."'
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-border bg-bg-light text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-y text-sm"
          />

          {result?.success && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-success/30 bg-success/5 text-sm text-success">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Update request submitted.{" "}
              {result.issueUrl && (
                <a
                  href={result.issueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  View issue
                </a>
              )}
            </div>
          )}

          {result?.error && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-error/30 bg-error/5 text-sm text-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {result.error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !updateBrief.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-accent hover:bg-accent/90 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Update Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Issue History */}
      <div className="p-6 rounded-2xl border border-border bg-surface">
        <h2 className="text-lg font-semibold mb-4">Request History</h2>
        {loadingIssues ? (
          <div className="flex items-center gap-2 text-sm text-muted py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading...
          </div>
        ) : issues.length === 0 ? (
          <p className="text-sm text-muted">No requests for this presentation yet.</p>
        ) : (
          <div className="space-y-4">
            {issues.map((issue) => (
              <div
                key={issue.issueNumber}
                className="p-4 rounded-lg border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CircleDot
                      className={`w-4 h-4 ${issue.state === "open" ? "text-success" : "text-muted"}`}
                    />
                    <a
                      href={issue.issueUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-foreground hover:text-accent transition-colors"
                    >
                      {issue.title}
                    </a>
                  </div>
                  <span className="text-xs text-muted">
                    #{issue.issueNumber}
                  </span>
                </div>

                {issue.comments.length > 0 && (
                  <div className="mt-3 space-y-2 pl-6 border-l-2 border-border">
                    {issue.comments.map((c, i) => (
                      <div key={i} className="text-xs">
                        <span className="font-medium text-foreground">
                          {c.author}
                        </span>
                        <span className="text-muted ml-2">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                        <p className="text-muted mt-0.5 line-clamp-3">
                          {c.body}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
