export type FeedbackStatus = "new" | "reviewed" | "completed";

export interface Feedback {
  id: string;
  issueNumber: number;
  issueUrl: string;
  type: "selection" | "general";
  content: string;
  selectedText?: string;
  sectionId?: string;
  pageUrl: string;
  wantsFollowUp: boolean;
  contactInfo?: string;
  status: FeedbackStatus;
  adminNote?: string;
  createdAt: string;
}

export interface FeedbackSubmission {
  type: "selection" | "general";
  content: string;
  selectedText?: string;
  sectionId?: string;
  pageUrl: string;
  wantsFollowUp: boolean;
  contactInfo?: string;
}

export interface FeedbackUpdate {
  status?: FeedbackStatus;
  adminNote?: string;
}
