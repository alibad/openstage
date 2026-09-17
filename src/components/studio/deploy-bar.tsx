"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  Rocket,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  GitPullRequest,
  GitMerge,
  Trash2,
  Globe,
} from "lucide-react";
import { useStudioStore, type DeployInfo } from "@/lib/studio-store";
import { extractCodeFiles } from "./message-bubble";

export function DeployBar() {
  const { messages, deploy, isStreaming, mode, setDeploy, updateDeploy } =
    useStudioStore();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prodPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deployingRef = useRef(false);

  const lastAssistantMessage = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");
  const codeFiles = lastAssistantMessage
    ? extractCodeFiles(lastAssistantMessage.content)
    : [];
  const contentFile = codeFiles.find((f) =>
    f.filePath.startsWith("src/content/")
  );

  const hasCode = !!contentFile;

  const pollPreview = useCallback(
    (prNumber: number) => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/deploy/preview?prNumber=${prNumber}`
          );
          const data = await res.json();
          updateDeploy({
            previewStatus: data.status,
            previewUrl: data.previewUrl || undefined,
          });
          if (data.status === "ready" || data.status === "error") {
            if (pollingRef.current) clearInterval(pollingRef.current);
          }
        } catch {
          // Retry on next interval
        }
      }, 8000);
    },
    [updateDeploy]
  );

  const pollProduction = useCallback(
    (sha: string) => {
      if (prodPollingRef.current) clearInterval(prodPollingRef.current);
      prodPollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/deploy/merge?sha=${sha}`);
          const data = await res.json();
          if (data.status === "ready") {
            updateDeploy({ mergeStatus: "live" });
            if (prodPollingRef.current) clearInterval(prodPollingRef.current);
          } else if (data.status === "error") {
            updateDeploy({ mergeStatus: "error" });
            if (prodPollingRef.current) clearInterval(prodPollingRef.current);
          }
        } catch {
          // Retry on next interval
        }
      }, 10000);
    },
    [updateDeploy]
  );

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (prodPollingRef.current) clearInterval(prodPollingRef.current);
    };
  }, []);

  async function handleDeploy() {
    if (!contentFile || deployingRef.current) return;
    deployingRef.current = true;

    const slugMatch = contentFile.filePath.match(
      /src\/content\/([^.]+)\.tsx/
    );
    const slug = slugMatch?.[1] || "untitled";

    const titleMatch = contentFile.code.match(
      /export default function (\w+)/
    );
    const title = titleMatch
      ? titleMatch[1].replace(/Presentation$/, "").replace(/([A-Z])/g, " $1").trim()
      : slug;

    setDeploy({
      slug,
      branchName: deploy?.branchName || `pres/${slug}`,
      previewStatus: "pending",
      mergeStatus: "idle",
    });

    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title,
          description: `AI-generated presentation: ${title}`,
          contentCode: contentFile.code,
          mode,
          branchName: deploy?.branchName || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        updateDeploy({ previewStatus: "error" });
        return;
      }

      updateDeploy({
        branchName: data.branchName,
        prUrl: data.prUrl || deploy?.prUrl,
        prNumber: data.prNumber || deploy?.prNumber,
        previewStatus: "building",
      });

      const prNum = data.prNumber || deploy?.prNumber;
      if (prNum) {
        pollPreview(prNum);
      }
    } catch {
      updateDeploy({ previewStatus: "error" });
    } finally {
      deployingRef.current = false;
    }
  }

  async function handleMerge() {
    if (!deploy?.prNumber) return;
    updateDeploy({ mergeStatus: "merging" });

    try {
      const res = await fetch("/api/deploy/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prNumber: deploy.prNumber,
          branchName: deploy.branchName,
          feedbackIssueNumbers: deploy.addressedIssues || [],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        updateDeploy({ mergeStatus: "error" });
        return;
      }

      updateDeploy({ mergeStatus: "deploying", mergeSha: data.sha });
      if (data.sha) {
        pollProduction(data.sha);
      }
    } catch {
      updateDeploy({ mergeStatus: "error" });
    }
  }

  async function handleDiscard() {
    if (!deploy?.prNumber) return;
    updateDeploy({ mergeStatus: "merging" });

    try {
      const res = await fetch("/api/deploy/discard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prNumber: deploy.prNumber,
          branchName: deploy.branchName,
        }),
      });

      if (res.ok) {
        updateDeploy({ mergeStatus: "discarded" });
      } else {
        updateDeploy({ mergeStatus: "error" });
      }
    } catch {
      updateDeploy({ mergeStatus: "error" });
    }
  }

  if (isStreaming || !hasCode) return null;

  const mergeStatus = deploy?.mergeStatus || "idle";

  return (
    <div className="border-t border-border bg-bg-light-surface px-4 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Initial deploy button */}
        {!deploy && (
          <button
            onClick={handleDeploy}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-accent hover:bg-accent/90 rounded-lg font-medium transition-all"
          >
            <Rocket className="w-4 h-4" />
            Deploy Preview
          </button>
        )}

        {/* Preview building states */}
        {deploy?.previewStatus === "pending" && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating branch and PR...
          </div>
        )}

        {deploy?.previewStatus === "building" && (
          <>
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Vercel building preview...
            </div>
            {deploy.prUrl && <PRLink deploy={deploy} />}
          </>
        )}

        {deploy?.previewStatus === "error" && mergeStatus === "idle" && (
          <div className="flex items-center gap-2 text-sm text-error">
            <AlertCircle className="w-4 h-4" />
            Deploy failed
            <button onClick={handleDeploy} className="text-accent hover:underline ml-2">
              Retry
            </button>
          </div>
        )}

        {/* Preview ready — show approve/discard */}
        {deploy?.previewStatus === "ready" && mergeStatus === "idle" && (
          <>
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="w-4 h-4" />
              Preview ready
            </div>
            {deploy.previewUrl && (
              <a
                href={deploy.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-success hover:bg-success/90 rounded-lg transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Preview
              </a>
            )}
            <button
              onClick={handleMerge}
              className="flex items-center gap-2 px-4 py-1.5 text-sm text-white bg-accent hover:bg-accent/90 rounded-lg font-medium transition-all"
            >
              <GitMerge className="w-3.5 h-3.5" />
              Approve & Go Live
            </button>
            <button
              onClick={handleDiscard}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-error/80 hover:text-error border border-error/20 hover:border-error/40 rounded-lg transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Discard
            </button>
            {deploy.prUrl && <PRLink deploy={deploy} />}
          </>
        )}

        {/* Merging in progress */}
        {mergeStatus === "merging" && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="w-4 h-4 animate-spin" />
            Merging PR...
          </div>
        )}

        {/* Deploying to production */}
        {mergeStatus === "deploying" && (
          <>
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Deploying to production...
            </div>
            {deploy?.prUrl && <PRLink deploy={deploy} />}
          </>
        )}

        {/* Live! */}
        {mergeStatus === "live" && (
          <>
            <div className="flex items-center gap-2 text-sm text-success font-medium">
              <Globe className="w-4 h-4" />
              Live in production
            </div>
            {deploy?.slug && (
              <a
                href={`/${deploy.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-success hover:bg-success/90 rounded-lg transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Live
              </a>
            )}
          </>
        )}

        {/* Discarded */}
        {mergeStatus === "discarded" && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Trash2 className="w-4 h-4" />
            Changes discarded — PR closed
          </div>
        )}

        {/* Merge/production error */}
        {mergeStatus === "error" && (
          <div className="flex items-center gap-2 text-sm text-error">
            <AlertCircle className="w-4 h-4" />
            Merge failed
            <button onClick={handleMerge} className="text-accent hover:underline ml-2">
              Retry
            </button>
          </div>
        )}

        {/* Push Update — available when preview is ready and not yet merged */}
        {deploy &&
          deploy.previewStatus !== "pending" &&
          mergeStatus === "idle" &&
          deploy.previewStatus !== "error" && (
            <button
              onClick={handleDeploy}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted hover:text-foreground border border-border rounded-lg transition-all ml-auto"
            >
              <Rocket className="w-3.5 h-3.5" />
              Push Update
            </button>
          )}
      </div>
    </div>
  );
}

function PRLink({ deploy }: { deploy: DeployInfo }) {
  if (!deploy.prUrl) return null;
  return (
    <a
      href={deploy.prUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 text-sm text-accent hover:underline"
    >
      <GitPullRequest className="w-3.5 h-3.5" />
      PR #{deploy.prNumber}
    </a>
  );
}
