import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import { readFileSync } from "fs";

const OWNER = process.env.GITHUB_REPO_OWNER || "";
const REPO = process.env.GITHUB_REPO_NAME || "";

function resolvePrivateKey(): string {
  const keyPath = process.env.GITHUB_APP_PRIVATE_KEY_PATH;
  if (keyPath) return readFileSync(keyPath, "utf8");

  const raw = process.env.GITHUB_APP_PRIVATE_KEY || "";
  if (raw.startsWith("-----")) return raw;
  return Buffer.from(raw, "base64").toString("utf8");
}

export function getOctokit(): Octokit {
  const appId = process.env.GITHUB_APP_ID;
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID;
  const hasKey =
    process.env.GITHUB_APP_PRIVATE_KEY_PATH ||
    process.env.GITHUB_APP_PRIVATE_KEY;

  if (!appId || !installationId || !hasKey) {
    throw new Error(
      "GitHub App auth not configured. Set GITHUB_APP_ID, GITHUB_APP_INSTALLATION_ID, and either GITHUB_APP_PRIVATE_KEY_PATH or GITHUB_APP_PRIVATE_KEY."
    );
  }

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey: resolvePrivateKey(),
      installationId: Number(installationId),
    },
  });
}

export async function uploadFileToRepo(
  path: string,
  content: string,
  message: string
) {
  const octokit = getOctokit();

  let sha: string | undefined;
  try {
    const existing = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path,
    });
    if (!Array.isArray(existing.data) && "sha" in existing.data) {
      sha = existing.data.sha;
    }
  } catch {
    // File doesn't exist yet
  }

  await octokit.repos.createOrUpdateFileContents({
    owner: OWNER,
    repo: REPO,
    path,
    message,
    content,
    ...(sha ? { sha } : {}),
  });
}

export interface PresentationIssuePayload {
  action: "create" | "update";
  slug: string;
  title: string;
  customer?: string;
  brief: string;
  accentColor?: string;
  password?: string;
  assetPaths: string[];
}

export async function createPresentationIssue(
  payload: PresentationIssuePayload
) {
  const octokit = getOctokit();
  const label =
    payload.action === "create"
      ? "presentation-request"
      : "presentation-update";

  const assetsSection =
    payload.assetPaths.length > 0
      ? `## Attached Assets\n${payload.assetPaths.map((p) => `- \`${p}\``).join("\n")}`
      : "## Attached Assets\nNone";

  const body = `## Presentation ${payload.action === "create" ? "Request" : "Update"}

**Slug:** \`${payload.slug}\`
**Title:** ${payload.title}
**Customer:** ${payload.customer || "Internal"}
**Accent Color:** ${payload.accentColor || "Default (brand gradient)"}
**Password Protected:** ${payload.password ? "Yes" : "No"}

## Brief

${payload.brief}

${assetsSection}

---

<details>
<summary>Machine-readable payload</summary>

\`\`\`json
${JSON.stringify(payload, null, 2)}
\`\`\`

</details>`;

  const { data: issue } = await octokit.issues.create({
    owner: OWNER,
    repo: REPO,
    title: `[Presentation] ${payload.action === "create" ? "New" : "Update"}: ${payload.title}`,
    body,
    labels: [label],
  });

  return issue;
}

export async function getPresentationIssues() {
  const octokit = getOctokit();

  const { data: issues } = await octokit.issues.listForRepo({
    owner: OWNER,
    repo: REPO,
    labels: "presentation-request,presentation-update",
    state: "all",
    per_page: 50,
    sort: "created",
    direction: "desc",
  });

  return issues;
}

export async function getIssueComments(issueNumber: number) {
  const octokit = getOctokit();

  const { data: comments } = await octokit.issues.listComments({
    owner: OWNER,
    repo: REPO,
    issue_number: issueNumber,
    per_page: 50,
  });

  return comments;
}

/* ─── Branch / PR / Tree operations (for AI Studio) ─── */

export async function getFileContent(
  path: string,
  ref?: string
): Promise<string> {
  const octokit = getOctokit();
  const { data } = await octokit.repos.getContent({
    owner: OWNER,
    repo: REPO,
    path,
    ...(ref ? { ref } : {}),
  });
  if (Array.isArray(data) || !("content" in data)) {
    throw new Error(`Path ${path} is a directory, not a file`);
  }
  return Buffer.from(data.content, "base64").toString("utf8");
}

export async function getMainSha(): Promise<string> {
  const octokit = getOctokit();
  const { data: ref } = await octokit.git.getRef({
    owner: OWNER,
    repo: REPO,
    ref: "heads/main",
  });
  return ref.object.sha;
}

export async function branchExists(branch: string): Promise<boolean> {
  const octokit = getOctokit();
  try {
    await octokit.git.getRef({
      owner: OWNER,
      repo: REPO,
      ref: `heads/${branch}`,
    });
    return true;
  } catch {
    return false;
  }
}

export async function createBranch(
  name: string,
  fromSha?: string
): Promise<string> {
  const octokit = getOctokit();
  const sha = fromSha ?? (await getMainSha());
  await octokit.git.createRef({
    owner: OWNER,
    repo: REPO,
    ref: `refs/heads/${name}`,
    sha,
  });
  return sha;
}

export async function commitFilesToBranch(
  branch: string,
  files: { path: string; content: string }[],
  message: string
): Promise<string> {
  const octokit = getOctokit();

  const { data: refData } = await octokit.git.getRef({
    owner: OWNER,
    repo: REPO,
    ref: `heads/${branch}`,
  });
  const parentSha = refData.object.sha;

  const { data: parentCommit } = await octokit.git.getCommit({
    owner: OWNER,
    repo: REPO,
    commit_sha: parentSha,
  });
  const baseTreeSha = parentCommit.tree.sha;

  const blobs = await Promise.all(
    files.map(async (f) => {
      const { data: blob } = await octokit.git.createBlob({
        owner: OWNER,
        repo: REPO,
        content: Buffer.from(f.content).toString("base64"),
        encoding: "base64",
      });
      return { path: f.path, sha: blob.sha };
    })
  );

  const { data: tree } = await octokit.git.createTree({
    owner: OWNER,
    repo: REPO,
    base_tree: baseTreeSha,
    tree: blobs.map((b) => ({
      path: b.path,
      mode: "100644" as const,
      type: "blob" as const,
      sha: b.sha,
    })),
  });

  const { data: commit } = await octokit.git.createCommit({
    owner: OWNER,
    repo: REPO,
    message,
    tree: tree.sha,
    parents: [parentSha],
  });

  await octokit.git.updateRef({
    owner: OWNER,
    repo: REPO,
    ref: `heads/${branch}`,
    sha: commit.sha,
  });

  return commit.sha;
}

export async function createPR(
  title: string,
  body: string,
  head: string,
  base: string = "main"
) {
  const octokit = getOctokit();
  const { data: pr } = await octokit.pulls.create({
    owner: OWNER,
    repo: REPO,
    title,
    body,
    head,
    base,
  });
  return { number: pr.number, url: pr.html_url };
}

export async function getDeploymentStatus(prNumber: number): Promise<{
  previewUrl: string | null;
  status: "pending" | "building" | "ready" | "error";
}> {
  const octokit = getOctokit();

  try {
    const { data: pr } = await octokit.pulls.get({
      owner: OWNER,
      repo: REPO,
      pull_number: prNumber,
    });

    const { data: statuses } = await octokit.repos.listDeployments({
      owner: OWNER,
      repo: REPO,
      sha: pr.head.sha,
      per_page: 5,
    });

    if (statuses.length === 0) {
      return { previewUrl: null, status: "pending" };
    }

    const deployment = statuses[0];
    const { data: deployStatuses } =
      await octokit.repos.listDeploymentStatuses({
        owner: OWNER,
        repo: REPO,
        deployment_id: deployment.id,
        per_page: 1,
      });

    if (deployStatuses.length === 0) {
      return { previewUrl: null, status: "building" };
    }

    const latest = deployStatuses[0];
    if (latest.state === "success") {
      return {
        previewUrl: latest.environment_url || latest.log_url || null,
        status: "ready",
      };
    }
    if (latest.state === "error" || latest.state === "failure") {
      return { previewUrl: null, status: "error" };
    }
    return { previewUrl: null, status: "building" };
  } catch {
    return { previewUrl: null, status: "pending" };
  }
}

export async function mergePR(prNumber: number): Promise<{ sha: string }> {
  const octokit = getOctokit();
  const { data } = await octokit.pulls.merge({
    owner: OWNER,
    repo: REPO,
    pull_number: prNumber,
    merge_method: "squash",
  });
  return { sha: data.sha };
}

export async function closePR(prNumber: number): Promise<void> {
  const octokit = getOctokit();
  await octokit.pulls.update({
    owner: OWNER,
    repo: REPO,
    pull_number: prNumber,
    state: "closed",
  });
}

export async function deleteBranch(branch: string): Promise<void> {
  const octokit = getOctokit();
  try {
    await octokit.git.deleteRef({
      owner: OWNER,
      repo: REPO,
      ref: `heads/${branch}`,
    });
  } catch {
    // Branch may already be deleted
  }
}

export async function addIssueComment(
  issueNumber: number,
  body: string
): Promise<void> {
  const octokit = getOctokit();
  await octokit.issues.createComment({
    owner: OWNER,
    repo: REPO,
    issue_number: issueNumber,
    body,
  });
}

export async function closeIssue(issueNumber: number): Promise<void> {
  const octokit = getOctokit();
  await octokit.issues.update({
    owner: OWNER,
    repo: REPO,
    issue_number: issueNumber,
    state: "closed",
  });
}

export async function getProductionDeploymentStatus(
  sha: string
): Promise<{ status: "pending" | "building" | "ready" | "error"; url: string | null }> {
  const octokit = getOctokit();
  try {
    const { data: deployments } = await octokit.repos.listDeployments({
      owner: OWNER,
      repo: REPO,
      sha,
      environment: "Production",
      per_page: 5,
    });

    if (deployments.length === 0) {
      return { status: "pending", url: null };
    }

    const deployment = deployments[0];
    const { data: statuses } = await octokit.repos.listDeploymentStatuses({
      owner: OWNER,
      repo: REPO,
      deployment_id: deployment.id,
      per_page: 1,
    });

    if (statuses.length === 0) return { status: "building", url: null };
    const latest = statuses[0];
    if (latest.state === "success") {
      return { status: "ready", url: latest.environment_url || null };
    }
    if (latest.state === "error" || latest.state === "failure") {
      return { status: "error", url: null };
    }
    return { status: "building", url: null };
  } catch {
    return { status: "pending", url: null };
  }
}

export { OWNER, REPO };
