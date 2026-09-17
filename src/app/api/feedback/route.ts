import { NextRequest, NextResponse } from "next/server";
import { getOctokit, OWNER, REPO } from "@/lib/github";
import type { Feedback, FeedbackSubmission, FeedbackStatus } from "@/lib/feedback";

const LABEL = "walkthrough-feedback";

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: "status:new",
  reviewed: "status:reviewed",
  completed: "status:completed",
};

function statusFromLabels(labels: { name?: string }[]): FeedbackStatus {
  const names = labels.map((l) => l.name);
  if (names.includes("status:completed")) return "completed";
  if (names.includes("status:reviewed")) return "reviewed";
  return "new";
}

function parseIssueBody(body: string) {
  const meta: Record<string, string> = {};
  const lines = body.split("\n");

  for (const line of lines) {
    const match = line.match(/^\*\*(.+?):\*\*\s*(.+)$/);
    if (match) meta[match[1].trim()] = match[2].trim();
  }

  const quotedMatch = body.match(/> (.+)/);
  const selectedText = quotedMatch ? quotedMatch[1] : undefined;

  return {
    type: (meta["Type"] as "selection" | "general") || "general",
    selectedText,
    sectionId: meta["Section"] || undefined,
    pageUrl: meta["Page"] || "/",
    wantsFollowUp: meta["Follow-up"] === "Yes",
    contactInfo: meta["Contact"] || undefined,
  };
}

function issueToFeedback(
  issue: {
    number: number;
    html_url: string;
    title: string;
    body?: string | null;
    labels: ({ name?: string } | string)[];
    created_at: string;
  },
  adminNote?: string
): Feedback {
  const labels = issue.labels.map((l) =>
    typeof l === "string" ? { name: l } : l
  );
  const parsed = parseIssueBody(issue.body || "");
  const title = issue.title.replace(/^\[Feedback\]\s*/, "");

  return {
    id: String(issue.number),
    issueNumber: issue.number,
    issueUrl: issue.html_url,
    type: parsed.type,
    content: title,
    selectedText: parsed.selectedText,
    sectionId: parsed.sectionId,
    pageUrl: parsed.pageUrl,
    wantsFollowUp: parsed.wantsFollowUp,
    contactInfo: parsed.contactInfo,
    status: statusFromLabels(labels),
    adminNote,
    createdAt: issue.created_at,
  };
}

export async function GET() {
  try {
    const octokit = getOctokit();

    const { data: issues } = await octokit.issues.listForRepo({
      owner: OWNER,
      repo: REPO,
      labels: LABEL,
      state: "all",
      per_page: 100,
      sort: "created",
      direction: "desc",
    });

    const feedbackIssues = issues.filter(
      (i) => i.title.startsWith("[Feedback]") && !i.labels.some((l) => (typeof l === "string" ? l : l.name) === "deleted")
    );

    const feedback: Feedback[] = feedbackIssues.map((issue) =>
      issueToFeedback(issue)
    );

    return NextResponse.json(feedback);
  } catch (err) {
    console.error("Failed to fetch feedback:", err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const body: FeedbackSubmission = await req.json();

  if (!body.content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const octokit = getOctokit();

  const selectedQuote = body.selectedText
    ? `\n> ${body.selectedText.slice(0, 200)}\n`
    : "";

  const issueBody = `${selectedQuote}
**Type:** ${body.type || "general"}
**Page:** ${body.pageUrl || "/"}${body.sectionId ? `\n**Section:** ${body.sectionId}` : ""}
**Follow-up:** ${body.wantsFollowUp ? "Yes" : "No"}${body.contactInfo ? `\n**Contact:** ${body.contactInfo}` : ""}
`;

  const labels = [LABEL, STATUS_LABELS.new];

  const { data: issue } = await octokit.issues.create({
    owner: OWNER,
    repo: REPO,
    title: `[Feedback] ${body.content.trim().slice(0, 120)}`,
    body: issueBody,
    labels,
  });

  return NextResponse.json(
    { success: true, id: String(issue.number), issueUrl: issue.html_url },
    { status: 201 }
  );
}

export async function PATCH(req: NextRequest) {
  const {
    id,
    status,
    adminNote,
  }: { id: string; status?: FeedbackStatus; adminNote?: string } =
    await req.json();

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const issueNumber = Number(id);
  const octokit = getOctokit();

  if (status) {
    const { data: issue } = await octokit.issues.get({
      owner: OWNER,
      repo: REPO,
      issue_number: issueNumber,
    });

    const currentLabels = issue.labels
      .map((l) => (typeof l === "string" ? l : l.name || ""))
      .filter((name) => !name.startsWith("status:"));

    currentLabels.push(STATUS_LABELS[status]);

    const issueState = status === "completed" ? "closed" : "open";

    await octokit.issues.update({
      owner: OWNER,
      repo: REPO,
      issue_number: issueNumber,
      labels: currentLabels,
      state: issueState,
    });
  }

  if (adminNote !== undefined) {
    const { data: comments } = await octokit.issues.listComments({
      owner: OWNER,
      repo: REPO,
      issue_number: issueNumber,
      per_page: 50,
    });

    const existing = comments.find((c) =>
      c.body?.startsWith("**Admin Note:**")
    );

    if (adminNote) {
      const noteBody = `**Admin Note:** ${adminNote}`;
      if (existing) {
        await octokit.issues.updateComment({
          owner: OWNER,
          repo: REPO,
          comment_id: existing.id,
          body: noteBody,
        });
      } else {
        await octokit.issues.createComment({
          owner: OWNER,
          repo: REPO,
          issue_number: issueNumber,
          body: noteBody,
        });
      }
    } else if (existing) {
      await octokit.issues.deleteComment({
        owner: OWNER,
        repo: REPO,
        comment_id: existing.id,
      });
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const octokit = getOctokit();

  await octokit.issues.update({
    owner: OWNER,
    repo: REPO,
    issue_number: Number(id),
    state: "closed",
    labels: [LABEL, "status:completed", "deleted"],
  });

  return NextResponse.json({ success: true });
}
