import { NextRequest, NextResponse } from "next/server";
import {
  mergePR,
  deleteBranch,
  getProductionDeploymentStatus,
  addIssueComment,
  closeIssue,
} from "@/lib/github";

export async function POST(req: NextRequest) {
  try {
    const { prNumber, branchName, feedbackIssueNumbers } = await req.json();

    if (!prNumber) {
      return NextResponse.json(
        { error: "prNumber is required" },
        { status: 400 }
      );
    }

    const { sha } = await mergePR(prNumber);

    if (branchName) {
      await deleteBranch(branchName).catch(() => {});
    }

    // Auto-close addressed feedback issues
    if (Array.isArray(feedbackIssueNumbers) && feedbackIssueNumbers.length > 0) {
      await Promise.allSettled(
        feedbackIssueNumbers.map(async (issueNum: number) => {
          await addIssueComment(
            issueNum,
            `Addressed in PR #${prNumber} — now merged to main.`
          );
          await closeIssue(issueNum);
        })
      );
    }

    return NextResponse.json({
      success: true,
      sha,
      message: "PR merged successfully",
      closedIssues: feedbackIssueNumbers?.length || 0,
    });
  } catch (error) {
    console.error("Merge error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to merge PR",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const sha = req.nextUrl.searchParams.get("sha");
  if (!sha) {
    return NextResponse.json({ error: "sha is required" }, { status: 400 });
  }

  const result = await getProductionDeploymentStatus(sha);
  return NextResponse.json(result);
}
