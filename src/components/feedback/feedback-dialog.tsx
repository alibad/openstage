"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, CheckCircle2, MessageSquare } from "lucide-react";
import type { FeedbackSubmission } from "@/lib/feedback";

interface FeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  selectedText?: string;
  sectionId?: string;
}

type Stage = "form" | "submitting" | "success";

export function FeedbackDialog({
  open,
  onClose,
  selectedText,
  sectionId,
}: FeedbackDialogProps) {
  const [content, setContent] = useState("");
  const [wantsFollowUp, setWantsFollowUp] = useState(false);
  const [contactInfo, setContactInfo] = useState("");
  const [stage, setStage] = useState<Stage>("form");

  const reset = useCallback(() => {
    setContent("");
    setWantsFollowUp(false);
    setContactInfo("");
    setStage("form");
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(reset, 200);
  }, [onClose, reset]);

  const handleSubmit = useCallback(async () => {
    if (!content.trim()) return;
    setStage("submitting");

    const submission: FeedbackSubmission = {
      type: selectedText ? "selection" : "general",
      content: content.trim(),
      selectedText: selectedText || undefined,
      sectionId: sectionId || undefined,
      pageUrl: window.location.pathname,
      wantsFollowUp,
      contactInfo: wantsFollowUp ? contactInfo.trim() || undefined : undefined,
    };

    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
      });
      setStage("success");
      setTimeout(handleClose, 1500);
    } catch {
      setStage("form");
    }
  }, [content, selectedText, sectionId, wantsFollowUp, contactInfo, handleClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {stage === "success" ? (
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12 }}
                  >
                    <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
                  </motion.div>
                  <p className="text-lg font-semibold text-foreground">
                    Thank you!
                  </p>
                  <p className="text-sm text-muted mt-1">
                    Your feedback has been submitted.
                  </p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-brand-2" />
                      <h3 className="text-sm font-semibold text-foreground">
                        {selectedText ? "Feedback on selection" : "Share feedback"}
                      </h3>
                    </div>
                    <button
                      onClick={handleClose}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <X className="w-4 h-4 text-muted" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Selected text preview */}
                    {selectedText && (
                      <div className="p-3 rounded-xl bg-accent-light border border-brand-2/10">
                        <p className="text-xs font-medium text-brand-2 mb-1">
                          Selected text
                        </p>
                        <p className="text-sm text-foreground leading-relaxed line-clamp-3">
                          &ldquo;{selectedText}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Feedback content */}
                    <div>
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={
                          selectedText
                            ? "What's your feedback on this?"
                            : "What are your thoughts on this presentation?"
                        }
                        className="w-full h-28 px-4 py-3 text-sm text-foreground bg-bg-light border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-2/20 focus:border-brand-2/40 placeholder:text-muted/50 transition-all"
                        autoFocus
                      />
                    </div>

                    {/* Follow-up toggle */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={wantsFollowUp}
                            onChange={(e) => setWantsFollowUp(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 rounded-full bg-gray-200 peer-checked:bg-brand-2 transition-colors" />
                          <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm peer-checked:translate-x-4 transition-transform" />
                        </div>
                        <span className="text-sm text-muted group-hover:text-foreground transition-colors">
                          I&apos;d like a follow-up
                        </span>
                      </label>

                      <AnimatePresence>
                        {wantsFollowUp && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <input
                              type="text"
                              value={contactInfo}
                              onChange={(e) => setContactInfo(e.target.value)}
                              placeholder="Email, Slack handle, or other way to reach you"
                              className="w-full px-4 py-2.5 text-sm text-foreground bg-bg-light border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-2/20 focus:border-brand-2/40 placeholder:text-muted/50 transition-all"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 pb-6">
                    <button
                      onClick={handleSubmit}
                      disabled={!content.trim() || stage === "submitting"}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-xl brand-gradient-bg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                    >
                      {stage === "submitting" ? (
                        <motion.div
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                        />
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          Submit feedback
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
