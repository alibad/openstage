import { NextResponse } from "next/server";
import { templates, getTemplateById, getTemplatesByTag, getTemplatesByMode } from "@/lib/templates";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const tag = searchParams.get("tag");
  const mode = searchParams.get("mode") as "scroll" | "slides" | null;

  if (id) {
    const template = getTemplateById(id);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    return NextResponse.json(template);
  }

  let result = templates;

  if (tag) {
    result = getTemplatesByTag(tag);
  }

  if (mode && (mode === "scroll" || mode === "slides")) {
    result = result.filter((t) => t.modes.includes(mode));
  }

  return NextResponse.json({
    templates: result.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      posture: t.posture,
      modes: t.modes,
      tags: t.tags,
      sectionCount: t.sections.length,
    })),
  });
}
