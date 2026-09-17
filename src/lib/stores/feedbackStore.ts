"use client";

import { create } from "zustand";

export interface ElementInfo {
  tagName: string;
  id?: string;
  className?: string;
  textContent?: string;
  selector: string;
  rect: { x: number; y: number; width: number; height: number };
}

export interface CapturePosition {
  x: number;
  y: number;
  viewportWidth: number;
  viewportHeight: number;
}

export interface FeedbackCapture {
  id: string;
  elementInfo?: ElementInfo;
  position?: CapturePosition;
  screenshot?: string; // data URL or object URL
}

export interface FeedbackAttachment {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string; // object URL for images
}

type FeedbackCategory = "Bug" | "Enhancement" | "UI/UX" | "General";

interface FeedbackState {
  // Dialog state
  isOpen: boolean;
  isMinimized: boolean;
  hideTrigger: boolean;

  // Form fields
  title: string;
  description: string;
  category: FeedbackCategory;

  // Captures (unified model)
  captures: FeedbackCapture[];

  // Media
  videoBlob: Blob | null;
  videoUrl: string | null;
  audioBlob: Blob | null;
  audioUrl: string | null;

  // Recording state
  isRecording: boolean;
  isAudioRecording: boolean;
  recordingSeconds: number;

  // Attachments
  attachments: FeedbackAttachment[];

  // Submission
  isSubmitting: boolean;

  // Modes
  isSelectingElement: boolean;
  isPinpointMode: boolean;
  annotatingImg: string | null;
  annotatingCaptureId: string | null;

  // Actions - Dialog
  open: () => void;
  close: () => void;
  minimize: () => void;
  restore: () => void;
  setHideTrigger: (val: boolean) => void;

  // Actions - Form
  setTitle: (title: string) => void;
  setDescription: (desc: string) => void;
  setCategory: (cat: FeedbackCategory) => void;

  // Actions - Captures
  addCapture: (capture: Omit<FeedbackCapture, "id">) => string;
  addScreenshotToCapture: (id: string, screenshot: string) => void;
  addScreenshot: (screenshot: string) => string;
  removeCapture: (id: string) => void;
  removeCaptureScreenshot: (id: string) => void;
  removeCaptureElement: (id: string) => void;

  // Actions - Media
  setVideoBlob: (blob: Blob | null) => void;
  setVideoUrl: (url: string | null) => void;
  setAudioBlob: (blob: Blob | null) => void;
  setAudioUrl: (url: string | null) => void;
  setIsRecording: (val: boolean) => void;
  setIsAudioRecording: (val: boolean) => void;
  setRecordingSeconds: (val: number) => void;
  removeVideo: () => void;
  removeAudio: () => void;

  // Actions - Attachments
  addAttachment: (att: FeedbackAttachment) => void;
  removeAttachment: (id: string) => void;

  // Actions - Modes
  setIsSelectingElement: (val: boolean) => void;
  setIsPinpointMode: (val: boolean) => void;
  setAnnotatingImg: (img: string | null, captureId?: string | null) => void;
  setIsSubmitting: (val: boolean) => void;

  // Actions - Reset
  reset: () => void;
}

let nextId = 0;
function genId() {
  return `cap_${Date.now()}_${nextId++}`;
}

function revokeUrl(url: string | null | undefined) {
  if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
}

const initialFormState = {
  title: "",
  description: "",
  category: "General" as FeedbackCategory,
  captures: [] as FeedbackCapture[],
  videoBlob: null as Blob | null,
  videoUrl: null as string | null,
  audioBlob: null as Blob | null,
  audioUrl: null as string | null,
  isRecording: false,
  isAudioRecording: false,
  recordingSeconds: 0,
  attachments: [] as FeedbackAttachment[],
  isSubmitting: false,
  isSelectingElement: false,
  isPinpointMode: false,
  annotatingImg: null as string | null,
  annotatingCaptureId: null as string | null,
};

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  isOpen: false,
  isMinimized: false,
  hideTrigger: false,
  ...initialFormState,

  open: () => set({ isOpen: true, isMinimized: false }),
  close: () => {
    const s = get();
    revokeUrl(s.videoUrl);
    revokeUrl(s.audioUrl);
    s.captures.forEach((c) => revokeUrl(c.screenshot));
    s.attachments.forEach((a) => revokeUrl(a.preview));
    set({ isOpen: false, isMinimized: false, ...initialFormState });
  },
  minimize: () => set({ isMinimized: true }),
  restore: () => set({ isMinimized: false, isOpen: true }),
  setHideTrigger: (val) => set({ hideTrigger: val }),

  setTitle: (title) => set({ title }),
  setDescription: (description) => set({ description }),
  setCategory: (category) => set({ category }),

  addCapture: (capture) => {
    const id = genId();
    set((s) => ({ captures: [...s.captures, { ...capture, id }] }));
    return id;
  },
  addScreenshotToCapture: (id, screenshot) => {
    set((s) => ({
      captures: s.captures.map((c) =>
        c.id === id ? { ...c, screenshot } : c
      ),
    }));
  },
  addScreenshot: (screenshot) => {
    const id = genId();
    set((s) => ({
      captures: [...s.captures, { id, screenshot }],
    }));
    return id;
  },
  removeCapture: (id) => {
    const s = get();
    const cap = s.captures.find((c) => c.id === id);
    if (cap) revokeUrl(cap.screenshot);
    set({ captures: s.captures.filter((c) => c.id !== id) });
  },
  removeCaptureScreenshot: (id) => {
    const s = get();
    const cap = s.captures.find((c) => c.id === id);
    if (cap) {
      revokeUrl(cap.screenshot);
      if (!cap.elementInfo && !cap.position) {
        // Nothing left, remove the capture entirely
        set({ captures: s.captures.filter((c) => c.id !== id) });
      } else {
        set({
          captures: s.captures.map((c) =>
            c.id === id ? { ...c, screenshot: undefined } : c
          ),
        });
      }
    }
  },
  removeCaptureElement: (id) => {
    const s = get();
    const cap = s.captures.find((c) => c.id === id);
    if (cap) {
      if (!cap.screenshot) {
        set({ captures: s.captures.filter((c) => c.id !== id) });
      } else {
        set({
          captures: s.captures.map((c) =>
            c.id === id
              ? { ...c, elementInfo: undefined, position: undefined }
              : c
          ),
        });
      }
    }
  },

  setVideoBlob: (blob) => set({ videoBlob: blob }),
  setVideoUrl: (url) => set({ videoUrl: url }),
  setAudioBlob: (blob) => set({ audioBlob: blob }),
  setAudioUrl: (url) => set({ audioUrl: url }),
  setIsRecording: (val) => set({ isRecording: val }),
  setIsAudioRecording: (val) => set({ isAudioRecording: val }),
  setRecordingSeconds: (val) => set({ recordingSeconds: val }),
  removeVideo: () => {
    revokeUrl(get().videoUrl);
    set({ videoBlob: null, videoUrl: null });
  },
  removeAudio: () => {
    revokeUrl(get().audioUrl);
    set({ audioBlob: null, audioUrl: null });
  },

  addAttachment: (att) =>
    set((s) => ({ attachments: [...s.attachments, att] })),
  removeAttachment: (id) => {
    const s = get();
    const att = s.attachments.find((a) => a.id === id);
    if (att) revokeUrl(att.preview);
    set({ attachments: s.attachments.filter((a) => a.id !== id) });
  },

  setIsSelectingElement: (val) => set({ isSelectingElement: val }),
  setIsPinpointMode: (val) => set({ isPinpointMode: val }),
  setAnnotatingImg: (img, captureId) =>
    set({
      annotatingImg: img,
      annotatingCaptureId: captureId ?? null,
    }),
  setIsSubmitting: (val) => set({ isSubmitting: val }),

  reset: () => {
    const s = get();
    revokeUrl(s.videoUrl);
    revokeUrl(s.audioUrl);
    s.captures.forEach((c) => revokeUrl(c.screenshot));
    s.attachments.forEach((a) => revokeUrl(a.preview));
    set(initialFormState);
  },
}));
