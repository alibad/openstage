import { NextRequest, NextResponse } from "next/server";
import toolDescriptor from "@/lib/mcp-tool-descriptor.json";

export const maxDuration = 120;

/**
 * GET /api/mcp
 *
 * Returns the MCP tool descriptor for `generate_presentation`.
 * Cursor and other MCP clients can discover this tool from this endpoint.
 */
export async function GET() {
  return NextResponse.json({
    tools: [toolDescriptor],
  });
}

/**
 * POST /api/mcp
 *
 * MCP tool invocation endpoint. Accepts MCP-style tool calls and
 * forwards to the internal /api/generate endpoint.
 *
 * Body (MCP format):
 * {
 *   "name": "generate_presentation",
 *   "arguments": { ... GenerateBrief fields ... }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, arguments: args } = body;

    if (name !== "generate_presentation") {
      return NextResponse.json(
        {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}. Available tools: generate_presentation`,
            },
          ],
          isError: true,
        },
        { status: 400 },
      );
    }

    if (!args?.title || !args?.audience || !args?.intent) {
      return NextResponse.json({
        content: [
          {
            type: "text",
            text: "Missing required arguments: title, audience, and intent are required.",
          },
        ],
        isError: true,
      });
    }

    const origin = req.nextUrl.origin;
    const generateRes = await fetch(`${origin}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...args,
        stream: false,
      }),
    });

    if (!generateRes.ok) {
      const err = await generateRes.json();
      return NextResponse.json({
        content: [
          {
            type: "text",
            text: `Generation failed: ${err.error || "Unknown error"}`,
          },
        ],
        isError: true,
      });
    }

    const result = await generateRes.json();

    const summary = [
      `Presentation generated successfully.`,
      ``,
      `**Slug:** ${result.slug}`,
      `**Branch:** ${result.branch}`,
      result.prUrl ? `**PR:** ${result.prUrl}` : null,
      `**Files created:** ${result.files?.length || 0}`,
      result.metadata?.description
        ? `**Description:** ${result.metadata.description}`
        : null,
      ``,
      `The presentation has been committed to the \`${result.branch}\` branch.`,
      result.prUrl
        ? `A pull request is open at ${result.prUrl}. Vercel will auto-deploy a preview.`
        : `Push the branch to trigger a Vercel preview deployment.`,
    ]
      .filter(Boolean)
      .join("\n");

    return NextResponse.json({
      content: [
        {
          type: "text",
          text: summary,
        },
      ],
    });
  } catch (error) {
    console.error("MCP handler error:", error);
    return NextResponse.json({
      content: [
        {
          type: "text",
          text: `Internal error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    });
  }
}
