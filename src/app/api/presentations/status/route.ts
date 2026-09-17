import { NextRequest, NextResponse } from "next/server";
import { getOctokit, OWNER, REPO } from "@/lib/github";

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug");
    const octokit = getOctokit();

    const labels = ["presentation-request", "presentation-update"];
    const allIssues: Array<{
      slug: string;
      issueNumber: number;
      issueUrl: string;
      state: string;
      title: string;
      createdAt: string;
      labels: string[];
      comments: Array<{
        body: string;
        createdAt: string;
        author: string;
      }>;
    }> = [];

    for (const label of labels) {
      const { data: issues } = await octokit.issues.listForRepo({
        owner: OWNER,
        repo: REPO,
        labels: label,
        state: "all",
        per_page: 50,
        sort: "created",
        direction: "desc",
      });

      for (const issue of issues) {
        const bodySlugMatch = issue.body?.match(/\*\*Slug:\*\*\s*`([^`]+)`/);
        const issueSlug = bodySlugMatch?.[1] || "";

        if (slug && issueSlug !== slug) continue;

        let comments: Array<{
          body: string;
          createdAt: string;
          author: string;
        }> = [];

        if (slug) {
          const { data: rawComments } = await octokit.issues.listComments({
            owner: OWNER,
            repo: REPO,
            issue_number: issue.number,
            per_page: 20,
          });

          comments = rawComments.map((c) => ({
            body: c.body || "",
            createdAt: c.created_at,
            author: c.user?.login || "unknown",
          }));
        }

        allIssues.push({
          slug: issueSlug,
          issueNumber: issue.number,
          issueUrl: issue.html_url,
          state: issue.state,
          title: issue.title,
          createdAt: issue.created_at,
          labels: (issue.labels || [])
            .map((l) => (typeof l === "string" ? l : l.name || ""))
            .filter(Boolean),
          comments,
        });
      }
    }

    return NextResponse.json({ issues: allIssues });
  } catch (error) {
    console.error("Failed to fetch presentation status:", error);
    return NextResponse.json(
      {
        issues: [],
        error:
          error instanceof Error ? error.message : "Failed to fetch status",
      },
      { status: 200 }
    );
  }
}
