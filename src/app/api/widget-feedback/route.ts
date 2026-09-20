import { NextRequest, NextResponse } from "next/server";
import { getOctokit, OWNER, REPO } from "@/lib/github";
import { put } from "@vercel/blob";
import { presentations } from "@/content/registry";
import { normalizeWidgetFeedbackText } from "@/lib/feedback/normalize-widget-feedback";

interface CapturePayload {
  id: string;
  elementInfo?: {
    tagName: string;
    id?: string;
    className?: string;
    textContent?: string;
    selector: string;
  };
  position?: {
    x: number;
    y: number;
    viewportWidth: number;
    viewportHeight: number;
  };
  screenshot?: string; // data URI
}

interface AttachmentPayload {
  name: string;
  type: string;
  dataUri: string;
}

interface FeedbackBody {
  title: string;
  description: string;
  category: string;
  captures: CapturePayload[];
  videoBase64?: string;
  audioBase64?: string;
  attachments?: AttachmentPayload[];
  currentUrl: string;
  presentationSlug?: string | null;
  userAgent: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  Bug: "bug",
  Enhancement: "enhancement",
  "UI/UX": "ui/ux",
  General: "feedback",
};

function decodeDataUri(dataUri: string): { buffer: Buffer; mimeType: string } {
  const splitIdx = dataUri.indexOf(";base64,");
  if (splitIdx === -1) throw new Error("Invalid data URI");
  const mimeType = dataUri.substring(5, splitIdx); // skip "data:"
  const base64 = dataUri.substring(splitIdx + 8);
  return { buffer: Buffer.from(base64, "base64"), mimeType };
}

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "video/webm": "webm",
    "video/mp4": "mp4",
    "audio/webm": "webm",
    "audio/mp4": "m4a",
    "application/pdf": "pdf",
  };
  return map[mime] || "bin";
}

async function uploadToBlob(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const { url } = await put(filename, buffer, {
    access: "public",
    contentType,
  });
  return url;
}

export async function POST(req: NextRequest) {
  try {
    const body: FeedbackBody = await req.json();

    const normalizedText = normalizeWidgetFeedbackText(body);
    if (!normalizedText.ok) {
      return NextResponse.json(
        { error: normalizedText.error },
        { status: 400 }
      );
    }
    const { title, description } = normalizedText.value;

    const timestamp = Date.now();
    const prefix = `feedback/${timestamp}`;
    const mediaLinks: string[] = [];

    // Upload capture screenshots
    const captureMarkdown: string[] = [];
    for (let i = 0; i < body.captures.length; i++) {
      const cap = body.captures[i];
      let screenshotUrl: string | null = null;

      if (cap.screenshot) {
        // Small cropped element screenshots can stay inline, but upload to blob for consistency
        try {
          const { buffer, mimeType } = decodeDataUri(cap.screenshot);
          const ext = extFromMime(mimeType);
          screenshotUrl = await uploadToBlob(
            buffer,
            `${prefix}/capture-${i}.${ext}`,
            mimeType
          );
        } catch {
          // If upload fails, inline small screenshots
          if (cap.screenshot.length < 50000) {
            screenshotUrl = cap.screenshot;
          }
        }
      }

      const parts: string[] = [];
      if (cap.elementInfo) {
        const el = cap.elementInfo;
        parts.push(
          `**Element:** \`<${el.tagName.toLowerCase()}${el.id ? ` id="${el.id}"` : ""}>\` — \`${el.selector}\``
        );
        if (el.textContent) {
          parts.push(
            `**Text:** "${el.textContent.slice(0, 100)}${el.textContent.length > 100 ? "..." : ""}"`
          );
        }
      }
      if (cap.position) {
        parts.push(
          `**Pinpoint:** (${cap.position.x}, ${cap.position.y}) in ${cap.position.viewportWidth}x${cap.position.viewportHeight}`
        );
      }
      if (screenshotUrl) {
        if (screenshotUrl.startsWith("data:")) {
          parts.push(`![capture](${screenshotUrl})`);
        } else {
          parts.push(`![capture](${screenshotUrl})`);
        }
      }

      if (parts.length) {
        captureMarkdown.push(
          `### Capture ${i + 1}\n${parts.join("\n")}`
        );
      }
    }

    // Upload video
    if (body.videoBase64) {
      try {
        const { buffer, mimeType } = decodeDataUri(body.videoBase64);
        const ext = extFromMime(mimeType);
        const url = await uploadToBlob(
          buffer,
          `${prefix}/recording.${ext}`,
          mimeType
        );
        mediaLinks.push(`### Screen Recording\n[Download recording](${url})`);
      } catch (err) {
        console.error("Video upload failed:", err);
      }
    }

    // Upload audio
    if (body.audioBase64) {
      try {
        const { buffer, mimeType } = decodeDataUri(body.audioBase64);
        const ext = extFromMime(mimeType);
        const url = await uploadToBlob(
          buffer,
          `${prefix}/voice-note.${ext}`,
          mimeType
        );
        mediaLinks.push(`### Voice Note\n[Download voice note](${url})`);
      } catch (err) {
        console.error("Audio upload failed:", err);
      }
    }

    // Upload attachments
    const attachmentLinks: string[] = [];
    if (body.attachments?.length) {
      for (const att of body.attachments) {
        try {
          const { buffer, mimeType } = decodeDataUri(att.dataUri);
          const safeName = att.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const url = await uploadToBlob(
            buffer,
            `${prefix}/attachments/${safeName}`,
            mimeType
          );
          if (att.type.startsWith("image/")) {
            attachmentLinks.push(`![${att.name}](${url})`);
          } else {
            attachmentLinks.push(`[${att.name}](${url})`);
          }
        } catch (err) {
          console.error(`Attachment upload failed: ${att.name}`, err);
        }
      }
    }

    // Resolve presentation context
    const presentation = body.presentationSlug
      ? presentations.find((p) => p.slug === body.presentationSlug)
      : null;
    const pageName = presentation
      ? `${presentation.title}${presentation.customer ? ` (${presentation.customer})` : ""}`
      : body.presentationSlug || "Home";

    // Build issue body
    const sections: string[] = [];

    // Presentation context first — most important
    const contextLines = [
      `**App:** Presentations`,
      `**Presentation:** ${pageName}`,
      `**URL:** ${body.currentUrl}`,
      `**Category:** ${body.category}`,
      `**Submitted:** ${new Date(timestamp).toISOString()}`,
    ];
    sections.push(contextLines.join("\n"));

    sections.push(`## Description\n\n${description}`);

    if (captureMarkdown.length) {
      sections.push(`## Captures\n\n${captureMarkdown.join("\n\n")}`);
    }

    if (mediaLinks.length) {
      sections.push(`## Media\n\n${mediaLinks.join("\n\n")}`);
    }

    if (attachmentLinks.length) {
      sections.push(
        `## Attachments\n\n${attachmentLinks.join("\n")}`
      );
    }

    sections.push(
      `<details><summary>Environment</summary>\n\n**User Agent:** ${body.userAgent}\n</details>`
    );

    const issueBody = sections.join("\n\n---\n\n");

    // Create GitHub Issue — include presentation name in title
    const octokit = getOctokit();
    const categoryLabel = CATEGORY_LABELS[body.category] || "feedback";
    const labels = ["feedback-widget", categoryLabel];
    const issueTitle = `[Presentations] [${body.category}] ${title.slice(0, 100)} — ${pageName}`;

    let issue;
    try {
      const { data } = await octokit.issues.create({
        owner: OWNER,
        repo: REPO,
        title: issueTitle,
        body: issueBody,
        labels,
      });
      issue = data;
    } catch (err: unknown) {
      // Retry without labels on 422 (labels might not exist)
      if (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 422) {
        const { data } = await octokit.issues.create({
          owner: OWNER,
          repo: REPO,
          title: issueTitle,
          body: issueBody,
        });
        issue = data;
      } else {
        throw err;
      }
    }

    return NextResponse.json(
      {
        success: true,
        issueUrl: issue.html_url,
        issueNumber: issue.number,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Feedback submission failed:", err);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
