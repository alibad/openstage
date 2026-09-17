import { create } from "zustand";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface DeployInfo {
  slug: string;
  branchName: string;
  prUrl?: string;
  prNumber?: number;
  previewUrl?: string;
  previewStatus: "idle" | "pending" | "building" | "ready" | "error";
  mergeStatus?: "idle" | "merging" | "deploying" | "live" | "error" | "discarded";
  mergeSha?: string;
  /** Feedback issue numbers addressed in this session — auto-closed on merge */
  addressedIssues?: number[];
}

interface StudioState {
  mode: "create" | "edit" | "feedback";
  selectedSlug: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  deploy: DeployInfo | null;

  setMode: (mode: "create" | "edit" | "feedback") => void;
  setSelectedSlug: (slug: string | null) => void;
  addMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => string;
  updateMessage: (id: string, content: string) => void;
  appendToMessage: (id: string, text: string) => void;
  setStreaming: (v: boolean) => void;
  setDeploy: (d: DeployInfo | null) => void;
  updateDeploy: (partial: Partial<DeployInfo>) => void;
  reset: () => void;
}

export const useStudioStore = create<StudioState>((set, get) => ({
  mode: "create",
  selectedSlug: null,
  messages: [],
  isStreaming: false,
  deploy: null,

  setMode: (mode) => set({ mode, messages: [], deploy: null, selectedSlug: null }),
  setSelectedSlug: (slug) => set({ selectedSlug: slug, messages: [], deploy: null }),

  addMessage: (msg) => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({
      messages: [...s.messages, { ...msg, id, timestamp: Date.now() }],
    }));
    return id;
  },

  updateMessage: (id, content) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, content } : m)),
    })),

  appendToMessage: (id, text) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + text } : m
      ),
    })),

  setStreaming: (v) => set({ isStreaming: v }),

  setDeploy: (d) => set({ deploy: d }),

  updateDeploy: (partial) =>
    set((s) => ({
      deploy: s.deploy ? { ...s.deploy, ...partial } : null,
    })),

  reset: () =>
    set({
      messages: [],
      deploy: null,
      isStreaming: false,
    }),
}));
