"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const progress = ((current + 1) / total) * 100;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-border/30">
      <motion.div
        className="h-full spectrum-gradient-bg"
        initial={false}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      />
    </div>
  );
}
