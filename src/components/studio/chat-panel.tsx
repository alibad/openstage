"use client";

import { useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Sparkles, RotateCcw } from "lucide-react";
import { useStudioStore } from "@/lib/studio-store";
import { MessageBubble } from "./message-bubble";
import { DeployBar } from "./deploy-bar";
import { FeedbackPanel } from "./feedback-panel";

export function ChatPanel() {
  const {
    messages,
    isStreaming,
    mode,
    selectedSlug,
    addMessage,
    appendToMessage,
    setStreaming,
    reset,
  } = useStudioStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      addMessage({ role: "user", content: content.trim() });

      const allMessages = [
        ...useStudioStore.getState().messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ];

      const assistantId = addMessage({ role: "assistant", content: "" });
      setStreaming(true);

      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: allMessages,
            mode,
            slug: selectedSlug || undefined,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Request failed" }));
          appendToMessage(assistantId, `Error: ${err.error || "Something went wrong"}`);
          setStreaming(false);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          appendToMessage(assistantId, "Error: No response stream");
          setStreaming(false);
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6);
            if (payload === "[DONE]") break;
            try {
              const data = JSON.parse(payload);
              if (data.text) {
                appendToMessage(assistantId, data.text);
              }
              if (data.error) {
                appendToMessage(assistantId, `\n\nError: ${data.error}`);
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          appendToMessage(assistantId, "\n\n*(Cancelled)*");
        } else {
          appendToMessage(
            assistantId,
            `\n\nError: ${err instanceof Error ? err.message : "Connection failed"}`
          );
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming, mode, selectedSlug, addMessage, appendToMessage, setStreaming]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const value = inputRef.current?.value || "";
      if (value.trim()) {
        sendMessage(value);
        if (inputRef.current) inputRef.current.value = "";
      }
    }
  }

  function handleSubmit() {
    const value = inputRef.current?.value || "";
    if (value.trim()) {
      sendMessage(value);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const placeholder =
    mode === "create"
      ? "Describe the presentation you want to create..."
      : mode === "edit"
        ? "Describe what you want to change..."
        : "Describe how to address the feedback...";

  function handleAddressIssue(text: string) {
    if (inputRef.current) {
      inputRef.current.value = text;
      inputRef.current.focus();
    }
  }

  return (
    <div className="flex flex-col h-full bg-bg-light rounded-2xl border border-border overflow-hidden">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Feedback panel — shown in edit/feedback mode */}
        {selectedSlug && (mode === "edit" || mode === "feedback") && (
          <FeedbackPanel
            slug={selectedSlug}
            onAddressIssue={handleAddressIssue}
            onTrackIssue={(num) => {
              const { deploy, updateDeploy } = useStudioStore.getState();
              const existing = deploy?.addressedIssues || [];
              if (!existing.includes(num)) {
                updateDeploy({ addressedIssues: [...existing, num] });
              }
            }}
          />
        )}

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {mode === "create" && "Create a Presentation"}
              {mode === "edit" && "Edit a Presentation"}
              {mode === "feedback" && "Address Feedback"}
            </h3>
            <p className="text-sm text-muted max-w-sm leading-relaxed">
              {mode === "create" &&
                "Describe your presentation — audience, key messages, data points. Claude will generate the full content."}
              {mode === "edit" &&
                "Tell Claude what to change. It has the current content loaded and will output an updated version."}
              {mode === "feedback" &&
                "Open feedback issues are loaded as context. Ask Claude to address them all or cherry-pick specific ones."}
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isStreaming && (
          <div className="flex items-center gap-2 text-sm text-muted px-3 py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </div>
        )}
      </div>

      <DeployBar />

      {/* Input area */}
      <div className="border-t border-border bg-bg-light-surface p-4">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={2}
            disabled={isStreaming}
            className="flex-1 px-4 py-3 rounded-xl border border-border bg-bg-light text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-none text-sm disabled:opacity-50"
          />
          <div className="flex flex-col gap-1.5">
            <button
              onClick={handleSubmit}
              disabled={isStreaming}
              className="p-3 rounded-xl bg-accent text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Send"
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
            {messages.length > 0 && !isStreaming && (
              <button
                onClick={reset}
                className="p-3 rounded-xl border border-border text-muted hover:text-foreground hover:bg-accent-light transition-all"
                title="Reset conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
