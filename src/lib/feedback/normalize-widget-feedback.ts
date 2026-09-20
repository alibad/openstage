export const MAX_WIDGET_TITLE_LENGTH = 120;
export const MAX_WIDGET_DESCRIPTION_LENGTH = 10_000;

export type WidgetFeedbackTextResult =
  | { ok: true; value: { title: string; description: string } }
  | { ok: false; error: string };

export function normalizeWidgetFeedbackText(input: {
  title?: unknown;
  description?: unknown;
}): WidgetFeedbackTextResult {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const description =
    typeof input.description === "string" ? input.description.trim() : "";

  if (!title && !description) {
    return { ok: false, error: "Add a title or description" };
  }
  if (title.length > MAX_WIDGET_TITLE_LENGTH) {
    return { ok: false, error: "Title is too long" };
  }
  if (description.length > MAX_WIDGET_DESCRIPTION_LENGTH) {
    return { ok: false, error: "Description is too long" };
  }

  const firstLine = description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) ?? "";
  const derivedTitle = (title || firstLine)
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_WIDGET_TITLE_LENGTH);

  return {
    ok: true,
    value: {
      title: derivedTitle || "Feedback",
      description: description || title,
    },
  };
}
