import { NextRequest, NextResponse } from "next/server";
import {
  createBranch,
  branchExists,
  commitFilesToBranch,
  createPR,
  getFileContent,
} from "@/lib/github";

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildRoutePage(slug: string, title: string, description: string) {
  const componentName =
    slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join("") + "Presentation";

  return `import ${componentName} from "@/content/${slug}";

export const metadata = {
  title: "${title.replace(/"/g, '\\"')} — Presenter",
  description: "${description.replace(/"/g, '\\"')}",
};

export default function Page() {
  return <${componentName} />;
}
`;
}

function buildRegistryEntry(
  existingRegistry: string,
  slug: string,
  title: string,
  description: string
) {
  const newEntry = `  {
    slug: "${slug}",
    title: "${title.replace(/"/g, '\\"')}",
    author: "Presenter",
    date: "${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}",
    description: "${description.replace(/"/g, '\\"')}",
    type: "scroll" as const,
    status: "live" as const,
  },`;

  const insertPoint = existingRegistry.lastIndexOf("];");
  if (insertPoint === -1) return existingRegistry;

  return (
    existingRegistry.slice(0, insertPoint) +
    newEntry +
    "\n" +
    existingRegistry.slice(insertPoint)
  );
}

export async function POST(req: NextRequest) {
  try {
    const { slug: rawSlug, title, description, contentCode, mode, branchName } =
      await req.json();

    const slug = slugify(rawSlug || title || "untitled");
    const branch = branchName || `pres/${slug}`;

    if (!contentCode?.trim()) {
      return NextResponse.json(
        { error: "Content code is required" },
        { status: 400 }
      );
    }

    const files: { path: string; content: string }[] = [
      {
        path: `apps/presentations/src/content/${slug}.tsx`,
        content: contentCode,
      },
    ];

    const isNewBranch = !(await branchExists(branch));

    if (isNewBranch) {
      await createBranch(branch);

      files.push({
        path: `apps/presentations/src/app/${slug}/page.tsx`,
        content: buildRoutePage(slug, title || slug, description || ""),
      });

      try {
        const registry = await getFileContent(
          "apps/presentations/src/content/registry.ts"
        );
        const alreadyRegistered = registry.includes(`slug: "${slug}"`);
        if (!alreadyRegistered) {
          files.push({
            path: "apps/presentations/src/content/registry.ts",
            content: buildRegistryEntry(
              registry,
              slug,
              title || slug,
              description || ""
            ),
          });
        }
      } catch {
        // Registry update is non-critical
      }
    }

    const commitMsg =
      mode === "create"
        ? `[presentations] Add ${title || slug}`
        : `[presentations] Update ${title || slug}`;

    await commitFilesToBranch(branch, files, commitMsg);

    let prUrl: string | undefined;
    let prNumber: number | undefined;

    if (isNewBranch) {
      const pr = await createPR(
        `[Presentation] ${title || slug}`,
        `AI-generated presentation: **${title || slug}**\n\n${description || ""}`,
        branch
      );
      prUrl = pr.url;
      prNumber = pr.number;
    }

    return NextResponse.json({
      success: true,
      slug,
      branchName: branch,
      prUrl,
      prNumber,
      isNewBranch,
    });
  } catch (error) {
    console.error("Deploy error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to deploy",
      },
      { status: 500 }
    );
  }
}
