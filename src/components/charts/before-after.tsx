"use client";

import { useRef, useState, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";

interface BeforeAfterProps {
  /** "Before" content (left side) */
  before: React.ReactNode;
  /** "After" content (right side) */
  after: React.ReactNode;
  /** Label for before side */
  beforeLabel?: string;
  /** Label for after side */
  afterLabel?: string;
  /** Initial divider position (0-100) */
  initialPosition?: number;
  /** Divider line color */
  dividerColor?: string;
  /** Height of the component */
  height?: string;
  className?: string;
}

export function BeforeAfter({
  before,
  after,
  beforeLabel = "Before",
  afterLabel = "After",
  initialPosition = 50,
  dividerColor = "#818CF8",
  height = "400px",
  className,
}: BeforeAfterProps) {
  const print = usePrintMode();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [position, setPosition] = useState(initialPosition);
  const dragging = useRef(false);

  const updatePosition = useCallback(
    (clientX: number) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      setPosition(Math.max(5, Math.min(95, x)));
    },
    [],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updatePosition(e.clientX);
    },
    [updatePosition],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      updatePosition(e.clientX);
    },
    [updatePosition],
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const show = print || inView;

  if (print) {
    return (
      <div className={cn("grid grid-cols-2 gap-4", className)}>
        <div>
          <p className="text-xs font-medium text-muted mb-2">{beforeLabel}</p>
          {before}
        </div>
        <div>
          <p className="text-xs font-medium text-muted mb-2">{afterLabel}</p>
          {after}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={cn(
        "relative w-full select-none overflow-hidden rounded-2xl border border-border",
        className,
      )}
      style={{ height }}
      initial={{ opacity: 0, y: 20 }}
      animate={show ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* After (full width, underneath) */}
      <div className="absolute inset-0">{after}</div>

      {/* Before (clipped) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        {before}
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 z-10"
        style={{ left: `${position}%`, backgroundColor: dividerColor }}
      />

      {/* Handle */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-10 h-10 rounded-full border-2 flex items-center justify-center cursor-ew-resize backdrop-blur-sm"
        style={{
          left: `${position}%`,
          borderColor: dividerColor,
          background: "rgba(0,0,0,0.5)",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="text-white"
        >
          <path
            d="M5 3L2 8L5 13M11 3L14 8L11 13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 z-10">
        <span
          className="text-xs font-medium px-2 py-1 rounded-md backdrop-blur-sm"
          style={{
            background: "rgba(0,0,0,0.5)",
            color: "rgba(255,255,255,0.8)",
          }}
        >
          {beforeLabel}
        </span>
      </div>
      <div className="absolute top-3 right-3 z-10">
        <span
          className="text-xs font-medium px-2 py-1 rounded-md backdrop-blur-sm"
          style={{
            background: "rgba(0,0,0,0.5)",
            color: "rgba(255,255,255,0.8)",
          }}
        >
          {afterLabel}
        </span>
      </div>
    </motion.div>
  );
}
