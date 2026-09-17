"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquarePlus } from "lucide-react";
import { FeedbackDialog } from "./feedback-dialog";

export function SelectionFeedback() {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [sectionId, setSectionId] = useState<string | undefined>();
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleSelectionChange = useCallback(() => {
    if (dialogOpen) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setTooltip(null);
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 3) {
      setTooltip(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    const section = range.startContainer.parentElement?.closest("[id]");

    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      text,
    });
    setSectionId(section?.id || undefined);
  }, [dialogOpen]);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, [handleSelectionChange]);

  useEffect(() => {
    if (!tooltip) return;
    const handleScroll = () => setTooltip(null);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [tooltip]);

  const openDialog = useCallback(() => {
    if (tooltip) {
      setSelectedText(tooltip.text);
      setTooltip(null);
    }
    window.getSelection()?.removeAllRanges();
    setDialogOpen(true);
  }, [tooltip]);

  return (
    <>
      <AnimatePresence>
        {tooltip && !dialogOpen && (
          <motion.div
            ref={tooltipRef}
            className="fixed z-[90]"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: "translate(-50%, -100%)",
            }}
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            <button
              onClick={openDialog}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
            >
              <MessageSquarePlus className="w-3 h-3" />
              Feedback
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-gray-900" />
          </motion.div>
        )}
      </AnimatePresence>

      <FeedbackDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        selectedText={selectedText || undefined}
        sectionId={sectionId}
      />
    </>
  );
}
