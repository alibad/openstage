import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  buildGeneratePrompt,
  extractGeneratedFiles,
  type GenerateBrief,
} from "@/lib/generate-context";
import {
  createBranch,
  branchExists,
  commitFilesToBranch,
  createPR,
  getFileContent,
} from "@/lib/github";

export const maxDuration = 120;

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildRegistryEntry(
  existingRegistry: string,
  slug: string,
  title: string,
  description: string,
  mode: "scroll" | "slides",
  slideCount?: number,
) {
  const newEntry = `  {
    slug: "${slug}",
    title: "${title.replace(/"/g, '\\"')}",
    author: "Presenter",
    date: "${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}",
    description: "${description.replace(/"/g, '\\"')}",
    type: "${mode}" as const,${slideCount ? `\n    slideCount: ${slideCount},` : ""}
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

/**
 * POST /api/generate
 *
 * Headless presentation generation. Accepts a brief, generates content
 * via Claude, commits to a branch, and returns a preview PR.
 *
 * Body:
 * {
 *   title: string,
 *   audience: string,
 *   intent: string,
 *   mode: "scroll" | "slides",
 *   templateId?: "scroll" | "slides",   // optional; defaults from mode
 *   posture?: "validation-extension" | "problem-solution"
 *          | "comparison-recommendation" | "education-implication"
 *          | "status-direction",
 *   accentColor?: string,
 *   sourceMaterial?: string,     // raw text, markdown, or document content
 *   additionalInstructions?: string,
 *   stream?: boolean             // default true — SSE stream
 * }
 *
 * Response (stream=true): SSE stream with progress + final result
 * Response (stream=false): JSON with generated content + deploy info
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      audience,
      intent,
      mode = "scroll",
      templateId,
      posture,
      accentColor,
      sourceMaterial,
      additionalInstructions,
      stream: streamMode = true,
    } = body as GenerateBrief & { stream?: boolean };

    if (!title || !audience || !intent) {
      return NextResponse.json(
        { error: "title, audience, and intent are required" },
        { status: 400 },
      );
    }

    // The framework ships exactly two templates (`scroll` and `slides`).
    // Default from mode when the caller doesn't specify one explicitly.
    const resolvedTemplateId = templateId ?? mode;

    const brief: GenerateBrief = {
      title,
      audience,
      intent,
      mode,
      templateId: resolvedTemplateId,
      posture,
      accentColor,
      sourceMaterial,
      additionalInstructions,
    };

    const systemPrompt = buildGeneratePrompt(brief);
    const slug = slugify(title);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    if (streamMode) {
      return streamGenerate(anthropic, systemPrompt, brief, slug);
    }

    return batchGenerate(anthropic, systemPrompt, brief, slug);
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

async function streamGenerate(
  anthropic: Anthropic,
  systemPrompt: string,
  brief: GenerateBrief,
  slug: string,
) {
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      try {
        send("status", { phase: "generating", message: "Generating presentation content..." });

        let fullResponse = "";
        const stream = anthropic.messages.stream({
          model: "claude-opus-4-20250514",
          max_tokens: 16000,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: `Generate the complete presentation for: "${brief.title}"`,
            },
          ],
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            fullResponse += event.delta.text;
            send("chunk", { text: event.delta.text });
          }
        }

        send("status", { phase: "deploying", message: "Deploying to preview..." });

        const result = await deployGenerated(fullResponse, brief, slug);

        send("complete", {
          ...result,
          fullResponse,
        });
      } catch (err) {
        send("error", {
          message: err instanceof Error ? err.message : "Generation failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function batchGenerate(
  anthropic: Anthropic,
  systemPrompt: string,
  brief: GenerateBrief,
  slug: string,
) {
  const response = await anthropic.messages.create({
    model: "claude-opus-4-20250514",
    max_tokens: 16000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Generate the complete presentation for: "${brief.title}"`,
      },
    ],
  });

  const fullResponse =
    response.content[0].type === "text" ? response.content[0].text : "";

  const result = await deployGenerated(fullResponse, brief, slug);

  return NextResponse.json({
    ...result,
    usage: response.usage,
  });
}

async function deployGenerated(
  fullResponse: string,
  brief: GenerateBrief,
  slug: string,
): Promise<{
  slug: string;
  branch: string;
  prUrl?: string;
  prNumber?: number;
  files: string[];
  metadata: Record<string, string>;
}> {
  const { files: generatedFiles, metadata } = extractGeneratedFiles(fullResponse);

  if (Object.keys(generatedFiles).length === 0) {
    throw new Error(
      "Generation completed but no valid code blocks were found in the response. " +
        "This usually means the AI response was truncated or malformed.",
    );
  }

  const branch = `pres/${slug}`;
  const isNew = !(await branchExists(branch));

  if (isNew) {
    await createBranch(branch);
  }

  const commitFiles: { path: string; content: string }[] = Object.entries(
    generatedFiles,
  ).map(([path, content]) => ({
    path: path.startsWith("apps/") ? path : `apps/presentations/${path}`,
    content,
  }));

  // Add registry entry for new presentations
  if (isNew) {
    try {
      const registry = await getFileContent(
        "apps/presentations/src/content/registry.ts",
      );
      if (!registry.includes(`slug: "${slug}"`)) {
        const updatedRegistry = buildRegistryEntry(
          registry,
          slug,
          brief.title,
          metadata.description || brief.intent,
          brief.mode,
          metadata.sectionCount ? parseInt(metadata.sectionCount) : undefined,
        );
        commitFiles.push({
          path: "apps/presentations/src/content/registry.ts",
          content: updatedRegistry,
        });
      }
    } catch {
      // Registry update is non-critical
    }
  }

  await commitFilesToBranch(
    branch,
    commitFiles,
    `[presentations] ${isNew ? "Add" : "Update"} ${brief.title}`,
  );

  let prUrl: string | undefined;
  let prNumber: number | undefined;

  if (isNew) {
    const pr = await createPR(
      `[Presentation] ${brief.title}`,
      `AI-generated ${brief.mode} presentation.\n\n**Audience:** ${brief.audience}\n**Intent:** ${brief.intent}${brief.templateId ? `\n**Template:** ${brief.templateId}` : ""}`,
      branch,
    );
    prUrl = pr.url;
    prNumber = pr.number;
  }

  return {
    slug,
    branch,
    prUrl,
    prNumber,
    files: commitFiles.map((f) => f.path),
    metadata,
  };
}
