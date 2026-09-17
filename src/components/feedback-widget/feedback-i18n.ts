export type FeedbackLang = "en" | "ar";

interface Translations {
  dir: "ltr" | "rtl";
  sendFeedback: string;
  continueFeedback: string;
  title: string;
  descriptionPlaceholder: string;
  descriptionPlaceholderMobile: string;
  select: string;
  pinpoint: string;
  screenshot: string;
  record: string;
  voice: string;
  dropZone: string;
  selectElement: string;
  addScreenshot: string;
  voiceNoteMobile: string;
  clickToCapture: string;
  clickToPinpoint: string;
  escToCancel: string;
  submitFeedback: string;
  submitting: string;
  titleRequired: string;
  feedbackSubmitted: string;
  viewIssue: string;
  failedToSubmit: string;
  screenshotCancelled: string;
  recordingCancelled: string;
  micDenied: string;
  screenRecording: string;
  voiceNoteLabel: string;
  deleteVoiceTitle: string;
  deleteVoiceDesc: string;
  deleteRecordingTitle: string;
  deleteRecordingDesc: string;
  delete: string;
  cancel: string;
  minimize: string;
  close: string;
  feedback: string;
  exceedsLimit: (name: string) => string;
  stop: string;
  categories: Record<string, string>;
}

const en: Translations = {
  dir: "ltr",
  sendFeedback: "Send Feedback",
  continueFeedback: "Continue feedback",
  title: "Title",
  descriptionPlaceholder: "Describe the issue...",
  descriptionPlaceholderMobile: "Describe the issue... (paste screenshots here)",
  select: "Select",
  pinpoint: "Pinpoint",
  screenshot: "Screenshot",
  record: "Record",
  voice: "Voice",
  dropZone: "Drop files here or click to attach (10MB max)",
  selectElement: "Select Element",
  addScreenshot: "Add Screenshot or Photo",
  voiceNoteMobile: "Voice Note (10m)",
  clickToCapture: "Click an element to capture",
  clickToPinpoint: "Click to pinpoint",
  escToCancel: "Esc to cancel",
  submitFeedback: "Submit Feedback",
  submitting: "Submitting...",
  titleRequired: "Title is required",
  feedbackSubmitted: "Feedback submitted!",
  viewIssue: "View issue",
  failedToSubmit: "Failed to submit feedback",
  screenshotCancelled: "Screenshot cancelled",
  recordingCancelled: "Recording cancelled or not supported",
  micDenied: "Microphone access denied",
  screenRecording: "Screen Recording",
  voiceNoteLabel: "Voice Note",
  deleteVoiceTitle: "Delete Voice Note?",
  deleteVoiceDesc:
    "This voice note will be permanently removed. You can re-record a new one.",
  deleteRecordingTitle: "Delete Recording?",
  deleteRecordingDesc:
    "This screen recording will be permanently removed. You can record a new one.",
  delete: "Delete",
  cancel: "Cancel",
  minimize: "Minimize",
  close: "Close",
  feedback: "Feedback",
  exceedsLimit: (name: string) => `${name} exceeds 10MB limit`,
  stop: "Stop",
  categories: {
    Bug: "Bug",
    Enhancement: "Enhancement",
    "UI/UX": "UI/UX",
    General: "General",
  },
};

const ar: Translations = {
  dir: "rtl",
  sendFeedback: "إرسال ملاحظات",
  continueFeedback: "متابعة الملاحظات",
  title: "العنوان",
  descriptionPlaceholder: "وصف المشكلة...",
  descriptionPlaceholderMobile: "وصف المشكلة... (الصق لقطات الشاشة هنا)",
  select: "تحديد",
  pinpoint: "تحديد دقيق",
  screenshot: "لقطة شاشة",
  record: "تسجيل",
  voice: "صوت",
  dropZone: "اسحب الملفات هنا أو انقر للإرفاق (١٠ ميجابايت كحد أقصى)",
  selectElement: "تحديد عنصر",
  addScreenshot: "إضافة لقطة شاشة أو صورة",
  voiceNoteMobile: "ملاحظة صوتية (١٠ د)",
  clickToCapture: "انقر على عنصر لالتقاطه",
  clickToPinpoint: "انقر للتحديد الدقيق",
  escToCancel: "Esc للإلغاء",
  submitFeedback: "إرسال الملاحظات",
  submitting: "جارٍ الإرسال...",
  titleRequired: "العنوان مطلوب",
  feedbackSubmitted: "تم إرسال الملاحظات بنجاح!",
  viewIssue: "عرض المشكلة",
  failedToSubmit: "فشل إرسال الملاحظات",
  screenshotCancelled: "تم إلغاء لقطة الشاشة",
  recordingCancelled: "تم إلغاء التسجيل أو غير مدعوم",
  micDenied: "تم رفض الوصول للميكروفون",
  screenRecording: "تسجيل الشاشة",
  voiceNoteLabel: "ملاحظة صوتية",
  deleteVoiceTitle: "حذف الملاحظة الصوتية؟",
  deleteVoiceDesc:
    "سيتم حذف هذه الملاحظة الصوتية نهائياً. يمكنك إعادة تسجيل واحدة جديدة.",
  deleteRecordingTitle: "حذف التسجيل؟",
  deleteRecordingDesc:
    "سيتم حذف تسجيل الشاشة هذا نهائياً. يمكنك تسجيل واحد جديد.",
  delete: "حذف",
  cancel: "إلغاء",
  minimize: "تصغير",
  close: "إغلاق",
  feedback: "ملاحظات",
  exceedsLimit: (name: string) => `${name} يتجاوز حد ١٠ ميجابايت`,
  stop: "إيقاف",
  categories: {
    Bug: "خطأ",
    Enhancement: "تحسين",
    "UI/UX": "واجهة",
    General: "عام",
  },
};

export const feedbackT = { en, ar } as const;
