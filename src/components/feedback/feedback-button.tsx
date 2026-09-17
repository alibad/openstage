"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { FeedbackDialog } from "./feedback-dialog";
import { usePrintMode } from "@/lib/print-mode";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const print = usePrintMode();

  if (print) return null;

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-[95] w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-border shadow-lg flex items-center justify-center text-muted hover:text-brand-2 hover:border-brand-2/30 hover:shadow-xl transition-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Share feedback"
      >
        <MessageCircle className="w-4 h-4" />
      </motion.button>

      <FeedbackDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
