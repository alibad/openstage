"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  dir?: "ltr" | "rtl";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  dir,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />
          <motion.div
            className="fixed inset-0 z-[111] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
              dir={dir}
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start gap-3">
                  {destructive && (
                    <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {title}
                    </h3>
                    <p className="text-sm text-muted mt-1 leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 px-6 pb-5">
                <button
                  onClick={onCancel}
                  className="px-3.5 py-2 text-sm font-medium text-muted rounded-lg border border-border hover:bg-gray-50 transition-colors"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  className={`px-3.5 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                    destructive
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-foreground hover:bg-foreground/90"
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
