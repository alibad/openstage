import assert from "node:assert/strict";
import { normalizeWidgetFeedbackText } from "../src/lib/feedback/normalize-widget-feedback.ts";

assert.deepEqual(normalizeWidgetFeedbackText({ title: "Button is stuck" }), {
  ok: true,
  value: { title: "Button is stuck", description: "Button is stuck" },
});

assert.deepEqual(
  normalizeWidgetFeedbackText({
    description: "The controls disappear in fullscreen.\nMore detail.",
  }),
  {
    ok: true,
    value: {
      title: "The controls disappear in fullscreen.",
      description: "The controls disappear in fullscreen.\nMore detail.",
    },
  }
);

assert.deepEqual(normalizeWidgetFeedbackText({ title: " ", description: "\n" }), {
  ok: false,
  error: "Add a title or description",
});

console.log("widget feedback contract: title-only, description-only, and empty cases pass");
