import { NextRequest, NextResponse } from "next/server";
import {
  uploadFileToRepo,
  createPresentationIssue,
  type PresentationIssuePayload,
} from "@/lib/github";
import { hashPassword } from "@/lib/auth";

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const { title, customer, brief, accentColor, password, files } =
      await req.json();

    if (!title?.trim() || !brief?.trim()) {
      return NextResponse.json(
        { error: "Title and brief are required" },
        { status: 400 }
      );
    }

    const slug = slugify(title);
    const assetDir = `apps/presentations/assets/${slug}`;
    const assetPaths: string[] = [];

    const briefContent = [
      `# ${title}`,
      "",
      customer ? `**Customer:** ${customer}` : "",
      accentColor ? `**Accent Color:** ${accentColor}` : "",
      password ? `**Password Protected:** Yes` : "",
      "",
      "## Brief",
      "",
      brief,
    ]
      .filter(Boolean)
      .join("\n");

    await uploadFileToRepo(
      `${assetDir}/brief.md`,
      Buffer.from(briefContent).toString("base64"),
      `[presentations] Add brief for ${slug}`
    );
    assetPaths.push(`${assetDir}/brief.md`);

    if (files && Array.isArray(files)) {
      for (const file of files) {
        if (!file.name || !file.content) continue;

        const filePath = `${assetDir}/${file.name}`;
        await uploadFileToRepo(
          filePath,
          file.content,
          `[presentations] Upload ${file.name} for ${slug}`
        );
        assetPaths.push(filePath);
      }
    }

    let passwordHashValue: string | undefined;
    if (password) {
      passwordHashValue = await hashPassword(password);
    }

    const payload: PresentationIssuePayload = {
      action: "create",
      slug,
      title,
      customer,
      brief,
      accentColor,
      password: passwordHashValue,
      assetPaths,
    };

    const issue = await createPresentationIssue(payload);

    return NextResponse.json(
      {
        success: true,
        slug,
        issueNumber: issue.number,
        issueUrl: issue.html_url,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create presentation request:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create presentation request",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { slug, title, brief } = await req.json();

    if (!slug?.trim() || !brief?.trim()) {
      return NextResponse.json(
        { error: "Slug and brief are required" },
        { status: 400 }
      );
    }

    const payload: PresentationIssuePayload = {
      action: "update",
      slug,
      title: title || slug,
      brief,
      assetPaths: [],
    };

    const issue = await createPresentationIssue(payload);

    return NextResponse.json({
      success: true,
      issueNumber: issue.number,
      issueUrl: issue.html_url,
    });
  } catch (error) {
    console.error("Failed to create update request:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create update request",
      },
      { status: 500 }
    );
  }
}
