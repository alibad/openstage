"use client";

import { SelectionFeedback } from "./selection-feedback";
import { FeedbackButton } from "./feedback-button";

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SelectionFeedback />
      <FeedbackButton />
    </>
  );
}
