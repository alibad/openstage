"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { presentations, type PresentationMeta } from "@/content/registry";
import {
  ExternalLink,
  Lock,
  CircleDot,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Building2,
  Globe,
  EyeOff,
  ShieldOff,
  Link2,
} from "lucide-react";

interface IssueStatus {
  slug: string;
  issueNumber: number;
  issueUrl: string;
  state: string;
  title: string;
  createdAt: string;
  labels: string[];
}

export default function AdminDashboard() {
  const [issues, setIssues] = useState<IssueStatus[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);

  useEffect(() => {
    fetch("/api/presentations/status")
      .then((r) => r.json())
      .then((data) => setIssues(data.issues || []))
      .catch(() => {})
      .finally(() => setLoadingIssues(false));
  }, []);

  const liveCount = presentations.filter(
    (p) => !p.status || p.status === "live"
  ).length;
  const protectedCount = presentations.filter((p) => p.protected).length;
  const pendingIssues = issues.filter((i) => i.state === "open").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted text-sm mt-1">
          Manage presentations, request new ones, and track generation status.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Live Presentations"
          value={liveCount}
          icon={<CheckCircle2 className="w-5 h-5 text-success" />}
        />
        <StatCard
          label="Password Protected"
          value={protectedCount}
          icon={<Lock className="w-5 h-5 text-accent" />}
        />
        <StatCard
          label="Pending Requests"
          value={pendingIssues}
          icon={<Clock className="w-5 h-5 text-warning" />}
          loading={loadingIssues}
        />
      </div>

      {/* Presentations */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Presentations</h2>
          <Link
            href="/admin/new"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-accent hover:bg-accent/90 rounded-lg transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </Link>
        </div>

        <div className="space-y-3">
          {presentations.map((p) => (
            <PresentationRow key={p.slug} presentation={p} />
          ))}
        </div>
      </section>

      {/* Recent Issues */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Recent Requests</h2>
        {loadingIssues ? (
          <div className="flex items-center gap-2 text-sm text-muted py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading issues from GitHub...
          </div>
        ) : issues.length === 0 ? (
          <p className="text-sm text-muted py-4">
            No presentation requests yet. Create your first one above.
          </p>
        ) : (
          <div className="space-y-2">
            {issues.slice(0, 10).map((issue) => (
              <IssueRow key={issue.issueNumber} issue={issue} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="p-5 rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between mb-3">{icon}</div>
      <div className="text-2xl font-bold text-foreground">
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-muted" />
        ) : (
          value
        )}
      </div>
      <div className="text-xs text-muted mt-1">{label}</div>
    </div>
  );
}

function VisibilityBadge({ meta }: { meta: PresentationMeta }) {
  const vis = meta.visibility || "public";
  const isExpired = meta.expiresAt && new Date(meta.expiresAt) < new Date();

  if (isExpired) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-error/10 text-error border border-error/15">
        <Clock className="w-2.5 h-2.5" />
        Expired
      </span>
    );
  }

  if (meta.status === "draft") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted/10 text-muted border border-border">
        Draft
      </span>
    );
  }

  switch (vis) {
    case "unlisted":
      return (
        <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/15">
          <Link2 className="w-2.5 h-2.5" />
          Unlisted
        </span>
      );
    case "private":
      return (
        <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-error/10 text-error border border-error/15">
          <ShieldOff className="w-2.5 h-2.5" />
          Private
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/15">
          <Globe className="w-2.5 h-2.5" />
          Public
        </span>
      );
  }
}

function PresentationRow({ presentation: p }: { presentation: PresentationMeta }) {
  const statusColor =
    p.status === "generating"
      ? "text-warning"
      : p.status === "failed"
        ? "text-error"
        : "text-success";

  const StatusIcon =
    p.status === "generating"
      ? Loader2
      : p.status === "failed"
        ? AlertTriangle
        : CheckCircle2;

  return (
    <div className="p-4 rounded-xl border border-border bg-surface hover:border-accent/20 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <StatusIcon
            className={`w-4 h-4 shrink-0 ${statusColor} ${p.status === "generating" ? "animate-spin" : ""}`}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/${p.slug}`}
                className="font-medium text-foreground hover:text-accent transition-colors truncate"
              >
                {p.title}
              </Link>
              <VisibilityBadge meta={p} />
              {p.protected && <Lock className="w-3 h-3 text-muted shrink-0" />}
              {p.audience?.length ? (
                <span className="text-[10px] font-medium text-muted bg-accent-light border border-accent/10 px-2 py-0.5 rounded-full">
                  {p.audience.join(", ")}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted mt-0.5">
              {p.customer && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {p.customer}
                </span>
              )}
              <span>{p.date}</span>
              <span className="text-muted/50">/{p.slug}</span>
              {p.expiresAt && (
                <span className="flex items-center gap-1 text-amber-600">
                  <Clock className="w-3 h-3" />
                  Expires {new Date(p.expiresAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/${p.slug}`}
            target="_blank"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-muted hover:text-foreground border border-border hover:border-accent/20 rounded-lg transition-all"
          >
            <ExternalLink className="w-3 h-3" />
            View
          </Link>
          <Link
            href={`/admin/${p.slug}`}
            className="px-2.5 py-1.5 text-xs text-muted hover:text-foreground border border-border hover:border-accent/20 rounded-lg transition-all"
          >
            Manage
          </Link>
        </div>
      </div>
    </div>
  );
}

function IssueRow({ issue }: { issue: IssueStatus }) {
  const isOpen = issue.state === "open";
  return (
    <a
      href={issue.issueUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface hover:border-accent/20 transition-all"
    >
      <div className="flex items-center gap-3 min-w-0">
        <CircleDot
          className={`w-4 h-4 shrink-0 ${isOpen ? "text-success" : "text-muted"}`}
        />
        <div className="min-w-0">
          <span className="text-sm font-medium text-foreground truncate block">
            {issue.title}
          </span>
          <span className="text-xs text-muted">
            #{issue.issueNumber} · {new Date(issue.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {issue.labels.map((label) => (
          <span
            key={label}
            className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent-light text-accent border border-accent/15"
          >
            {label}
          </span>
        ))}
        <ExternalLink className="w-3 h-3 text-muted" />
      </div>
    </a>
  );
}
