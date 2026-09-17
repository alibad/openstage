import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt, type StudioContext } from "@/lib/ai-context";
import { getFileContent } from "@/lib/github";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const maxDuration = 120;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      mode,
      slug,
    }: {
      messages: ChatMessage[];
      mode: "create" | "edit" | "feedback";
      slug?: string;
    } = await req.json();

    if (!messages?.length) {
      return new Response(JSON.stringify({ error: "Messages required" }), {
        status: 400,
      });
    }

    let existingContent: string | undefined;
    if ((mode === "edit" || mode === "feedback") && slug) {
      try {
        existingContent = await getFileContent(
          `apps/presentations/src/content/${slug}.tsx`
        );
      } catch {
        // Content file might use a different name than the slug
      }
    }

    const feedbackIssues: string[] = [];
    if (mode === "feedback" && slug) {
      try {
        const statusRes = await fetch(
          `${req.nextUrl.origin}/api/presentations/status?slug=${slug}`
        );
        const statusData = await statusRes.json();
        for (const issue of statusData.issues || []) {
          if (issue.state === "open") {
            feedbackIssues.push(
              `[#${issue.issueNumber}] ${issue.title}${issue.comments?.length ? ` — Latest: "${issue.comments[0].body}"` : ""}`
            );
          }
        }
      } catch {
        // Non-critical — proceed without feedback context
      }

      try {
        const feedbackRes = await fetch(
          `${req.nextUrl.origin}/api/feedback?slug=${slug}`
        );
        const feedbackData = await feedbackRes.json();
        for (const issue of feedbackData.issues || []) {
          if (issue.state === "open") {
            feedbackIssues.push(
              `[Feedback #${issue.number}] ${issue.title}: ${issue.body?.slice(0, 300) || ""}`
            );
          }
        }
      } catch {
        // Non-critical
      }
    }

    const ctx: StudioContext = {
      mode,
      slug,
      existingContent,
      feedbackIssues: feedbackIssues.length > 0 ? feedbackIssues : undefined,
    };

    const systemPrompt = buildSystemPrompt(ctx);

    const stream = anthropic.messages.stream({
      model: "claude-opus-4-20250514",
      max_tokens: 16000,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const chunk = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`;
              controller.enqueue(encoder.encode(chunk));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Stream error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
          );
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
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500 }
    );
  }
}
