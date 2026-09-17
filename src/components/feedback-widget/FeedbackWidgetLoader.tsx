"use client";

import dynamic from "next/dynamic";

const FeedbackWidget = dynamic(
  () =>
    import("./FeedbackWidget").then((mod) => ({ default: mod.FeedbackWidget })),
  { ssr: false }
);

export function FeedbackWidgetLoader() {
  return <FeedbackWidget />;
}
