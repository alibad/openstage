"use client";

import { useState, useCallback } from "react";
import { Share2, Check, Loader2, Link2 } from "lucide-react";
import { cn } from "@/lib/cn";

interface ShareButtonProps {
  slug: string;
  title?: string;
  className?: string;
  variant?: "icon" | "button";
}

export function ShareButton({
  slug,
  title,
  className,
  variant = "button",
}: ShareButtonProps) {
  const [state, setState] = useState<"idle" | "capturing" | "uploading" | "done" | "error">("idle");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleShare = useCallback(async () => {
    setState("capturing");
    setError(null);

    try {
      const html = document.documentElement.outerHTML;

      setState("uploading");

      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          html,
          title: title || slug,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create share");
      }

      const data = await res.json();
      setShareUrl(data.shareUrl);

      await navigator.clipboard.writeText(data.shareUrl);
      setState("done");

      setTimeout(() => setState("idle"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Share failed");
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  }, [slug, title]);

  if (variant === "icon") {
    return (
      <button
        onClick={handleShare}
        disabled={state === "capturing" || state === "uploading"}
        className={cn(
          "p-2 rounded-lg transition-colors",
          state === "done"
            ? "text-green-400 bg-green-400/10"
            : state === "error"
              ? "text-red-400 bg-red-400/10"
              : "text-muted hover:text-foreground hover:bg-white/5",
          className,
        )}
        title={
          state === "done"
            ? "Link copied!"
            : state === "error"
              ? error || "Failed"
              : "Share preview link"
        }
      >
        {state === "capturing" || state === "uploading" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : state === "done" ? (
          <Check className="w-4 h-4" />
        ) : (
          <Share2 className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      disabled={state === "capturing" || state === "uploading"}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
        state === "done"
          ? "bg-green-500/10 text-green-400 border border-green-500/20"
          : state === "error"
            ? "bg-red-500/10 text-red-400 border border-red-500/20"
            : "bg-white/5 text-muted hover:text-foreground hover:bg-white/10 border border-border",
        className,
      )}
    >
      {state === "capturing" ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Capturing...</span>
        </>
      ) : state === "uploading" ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Uploading...</span>
        </>
      ) : state === "done" ? (
        <>
          <Check className="w-4 h-4" />
          <span>Link copied!</span>
        </>
      ) : state === "error" ? (
        <>
          <Share2 className="w-4 h-4" />
          <span>{error || "Failed"}</span>
        </>
      ) : (
        <>
          <Link2 className="w-4 h-4" />
          <span>Share</span>
        </>
      )}
    </button>
  );
}
