"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";

/**
 * The route is a walkthrough's user-facing identity (it's what gets pasted
 * into Slack and PRs), so it gets first-class treatment: a live link when the
 * route is static, a non-clickable pill when it's dynamic (never ship a broken
 * link), and always a Copy button.
 */
export function RouteChip({ route, baseUrl }: { route: string; baseUrl?: string }) {
  const [copied, setCopied] = useState(false);
  const isDynamic = /[:[\]]/.test(route);
  const href = !isDynamic && baseUrl ? `${baseUrl.replace(/\/$/, "")}${route}` : null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(route);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  };

  const pill = "inline-flex items-center gap-1.5 font-mono text-sm px-2.5 py-1 rounded-md border border-border bg-surface";

  return (
    <div className="inline-flex items-center gap-2">
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={`${pill} hover:border-foreground/40 transition-colors`}>
          {route} <ExternalLink className="w-3.5 h-3.5 text-muted" />
        </a>
      ) : (
        <span className={pill} title="Dynamic route — visit a concrete instance via the live app.">
          {route}
        </span>
      )}
      <button
        type="button"
        onClick={copy}
        aria-label="Copy route"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground px-2 py-1 rounded-md border border-border bg-surface transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
