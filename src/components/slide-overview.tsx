"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Slide } from "@/lib/types";
import { cn } from "@/lib/cn";

interface SlideOverviewProps {
  slides: Slide[];
  current: number;
  isOpen: boolean;
  onSelect: (index: number) => void;
  onClose: () => void;
}

export function SlideOverview({
  slides,
  current,
  isOpen,
  onSelect,
  onClose,
}: SlideOverviewProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md overflow-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="max-w-6xl mx-auto px-8 py-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-medium text-foreground">Slide Overview</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-border/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {slides.map((slide, index) => (
                <motion.button
                  key={slide.id}
                  onClick={() => onSelect(index)}
                  className={cn(
                    "group relative aspect-[16/10] rounded-lg border-2 overflow-hidden text-left transition-colors",
                    index === current
                      ? "border-brand-2 shadow-md shadow-brand-2/10"
                      : "border-border hover:border-brand-3/50"
                  )}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.3 }}
                >
                  <div className="absolute inset-0 bg-surface p-4 scale-[0.35] origin-top-left w-[286%] h-[286%] pointer-events-none overflow-hidden">
                    {slide.content}
                  </div>
                  <div className="absolute inset-0 bg-transparent group-hover:bg-brand-2/5 transition-colors" />
                  <span className="absolute bottom-2 right-3 text-xs font-medium text-muted tabular-nums">
                    {index + 1}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
