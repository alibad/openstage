import { NextRequest, NextResponse } from "next/server";
import { getFileContent } from "@/lib/github";
import { extractSections } from "@/lib/ai-context";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  try {
    const content = await getFileContent(
      `apps/presentations/src/content/${slug}.tsx`
    );
    const sections = extractSections(content);
    return NextResponse.json({ slug, sections });
  } catch {
    return NextResponse.json(
      { error: "Could not read presentation content" },
      { status: 404 }
    );
  }
}
