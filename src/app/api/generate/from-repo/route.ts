import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

export const maxDuration = 120;

interface RepoFile {
  path: string;
  content: string;
}

/**
 * POST /api/generate/from-repo
 *
 * Accepts a GitHub repo URL, extracts key files (README, package.json,
 * main source files), and forwards to /api/generate with the extracted
 * content as source material.
 *
 * Body:
 * {
 *   repoUrl: string,            // e.g. "https://github.com/owner/repo"
 *   branch?: string,            // defaults to default branch
 *   title?: string,             // override title (otherwise derived from repo name)
 *   audience?: string,          // required
 *   intent?: string,            // required
 *   mode?: "scroll" | "slides",
 *   templateId?: "scroll" | "slides",  // defaults from mode
 *   posture?: "validation-extension" | "problem-solution"
 *          | "comparison-recommendation" | "education-implication"
 *          | "status-direction",
 *   focusPaths?: string[],      // specific files/dirs to include
 *   additionalInstructions?: string,
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      repoUrl,
      branch,
      title: customTitle,
      audience,
      intent,
      mode = "scroll",
      templateId,
      posture,
      focusPaths,
      additionalInstructions,
    } = body;

    if (!repoUrl) {
      return NextResponse.json({ error: "repoUrl is required" }, { status: 400 });
    }
    if (!audience || !intent) {
      return NextResponse.json(
        { error: "audience and intent are required" },
        { status: 400 },
      );
    }

    const { owner, repo } = parseGitHubUrl(repoUrl);
    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Invalid GitHub URL. Expected format: https://github.com/owner/repo" },
        { status: 400 },
      );
    }

    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN || undefined,
    });

    const repoData = await octokit.repos.get({ owner, repo });
    const defaultBranch = branch || repoData.data.default_branch;
    const repoName = repoData.data.name;
    const repoDescription = repoData.data.description || "";

    const keyFiles = await extractKeyFiles(
      octokit,
      owner,
      repo,
      defaultBranch,
      focusPaths,
    );

    const sourceMaterial = formatSourceMaterial(
      repoName,
      repoDescription,
      repoData.data.html_url,
      repoData.data.stargazers_count,
      repoData.data.language,
      keyFiles,
    );

    const title = customTitle || humanizeRepoName(repoName);

    const generatePayload = {
      title,
      audience,
      intent,
      mode,
      templateId,
      posture,
      sourceMaterial,
      additionalInstructions: [
        additionalInstructions,
        `This presentation is about the GitHub repository ${owner}/${repo}.`,
        `Primary language: ${repoData.data.language || "unknown"}.`,
        repoData.data.topics?.length
          ? `Topics: ${repoData.data.topics.join(", ")}.`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
      stream: false,
    };

    const origin = req.nextUrl.origin;
    const generateRes = await fetch(`${origin}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(generatePayload),
    });

    if (!generateRes.ok) {
      const err = await generateRes.json();
      return NextResponse.json(
        { error: err.error || "Generation failed" },
        { status: generateRes.status },
      );
    }

    const result = await generateRes.json();
    return NextResponse.json({
      ...result,
      sourceRepo: { owner, repo, branch: defaultBranch, filesExtracted: keyFiles.length },
    });
  } catch (error) {
    console.error("Generate from-repo error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

function parseGitHubUrl(url: string): { owner: string; repo: string } {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    return {
      owner: parts[0] || "",
      repo: (parts[1] || "").replace(/\.git$/, ""),
    };
  } catch {
    return { owner: "", repo: "" };
  }
}

function humanizeRepoName(name: string): string {
  return name
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const PRIORITY_FILES = [
  "README.md",
  "readme.md",
  "README.rst",
  "package.json",
  "Cargo.toml",
  "pyproject.toml",
  "setup.py",
  "go.mod",
  "CHANGELOG.md",
  "ARCHITECTURE.md",
  "CONTRIBUTING.md",
  "docs/README.md",
];

const SKIP_PATTERNS = [
  /node_modules/,
  /\.git\//,
  /dist\//,
  /build\//,
  /\.lock$/,
  /\.min\./,
  /\.map$/,
  /\.png$/,
  /\.jpg$/,
  /\.svg$/,
  /\.ico$/,
  /\.woff/,
];

async function extractKeyFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
  focusPaths?: string[],
): Promise<RepoFile[]> {
  const files: RepoFile[] = [];
  const MAX_TOTAL_CHARS = 60000;
  let totalChars = 0;

  // Priority files first
  for (const path of PRIORITY_FILES) {
    if (totalChars > MAX_TOTAL_CHARS) break;
    try {
      const content = await fetchFileContent(octokit, owner, repo, path, branch);
      if (content) {
        const trimmed = content.slice(0, 8000);
        files.push({ path, content: trimmed });
        totalChars += trimmed.length;
      }
    } catch {
      // File doesn't exist, skip
    }
  }

  // Focus paths if specified
  if (focusPaths?.length) {
    for (const fp of focusPaths) {
      if (totalChars > MAX_TOTAL_CHARS) break;
      try {
        const content = await fetchFileContent(octokit, owner, repo, fp, branch);
        if (content && !files.find((f) => f.path === fp)) {
          const trimmed = content.slice(0, 6000);
          files.push({ path: fp, content: trimmed });
          totalChars += trimmed.length;
        }
      } catch {
        // Try as directory
        try {
          const { data: tree } = await octokit.repos.getContent({
            owner,
            repo,
            path: fp,
            ref: branch,
          });
          if (Array.isArray(tree)) {
            for (const item of tree.slice(0, 10)) {
              if (totalChars > MAX_TOTAL_CHARS) break;
              if (item.type !== "file") continue;
              if (SKIP_PATTERNS.some((p) => p.test(item.path))) continue;
              try {
                const content = await fetchFileContent(
                  octokit,
                  owner,
                  repo,
                  item.path,
                  branch,
                );
                if (content && !files.find((f) => f.path === item.path)) {
                  const trimmed = content.slice(0, 4000);
                  files.push({ path: item.path, content: trimmed });
                  totalChars += trimmed.length;
                }
              } catch {
                // Skip unreadable files
              }
            }
          }
        } catch {
          // Not a directory either
        }
      }
    }
  }

  // Auto-discover source files from the root tree
  if (totalChars < MAX_TOTAL_CHARS) {
    try {
      const { data: rootTree } = await octokit.git.getTree({
        owner,
        repo,
        tree_sha: branch,
        recursive: "true",
      });

      const sourceFiles = rootTree.tree
        .filter(
          (item) =>
            item.type === "blob" &&
            item.path &&
            !SKIP_PATTERNS.some((p) => p.test(item.path!)) &&
            !files.find((f) => f.path === item.path) &&
            /\.(ts|tsx|js|jsx|py|rs|go|java|md)$/.test(item.path!),
        )
        .sort((a, b) => {
          // Prefer shorter paths (top-level files) and smaller files
          const depthA = (a.path || "").split("/").length;
          const depthB = (b.path || "").split("/").length;
          return depthA - depthB;
        })
        .slice(0, 15);

      for (const item of sourceFiles) {
        if (totalChars > MAX_TOTAL_CHARS || !item.path) break;
        try {
          const content = await fetchFileContent(
            octokit,
            owner,
            repo,
            item.path,
            branch,
          );
          if (content) {
            const trimmed = content.slice(0, 3000);
            files.push({ path: item.path, content: trimmed });
            totalChars += trimmed.length;
          }
        } catch {
          // Skip unreadable files
        }
      }
    } catch {
      // Tree fetch failed, that's okay
    }
  }

  return files;
}

async function fetchFileContent(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  ref: string,
): Promise<string | null> {
  const { data } = await octokit.repos.getContent({ owner, repo, path, ref });
  if (Array.isArray(data) || !("content" in data)) return null;
  return Buffer.from(data.content, "base64").toString("utf8");
}

function formatSourceMaterial(
  name: string,
  description: string,
  url: string,
  stars: number,
  language: string | null,
  files: RepoFile[],
): string {
  const parts = [
    `# Repository: ${name}`,
    `**URL:** ${url}`,
    `**Description:** ${description}`,
    `**Stars:** ${stars.toLocaleString()}`,
    `**Primary Language:** ${language || "Unknown"}`,
    "",
    "## Key Files",
    "",
  ];

  for (const file of files) {
    parts.push(`### ${file.path}\n\`\`\`\n${file.content}\n\`\`\``);
  }

  return parts.join("\n");
}
