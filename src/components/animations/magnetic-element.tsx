"use client";

import { useRef, useState, useCallback } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";
import { springConfig } from "@/lib/motion";

interface MagneticElementProps {
  children: React.ReactNode;
  /** How strongly the element follows the cursor (0-1) */
  strength?: number;
  /** Max displacement in pixels */
  range?: number;
  /** Spring stiffness (higher = snappier) */
  stiffness?: number;
  /** Spring damping */
  damping?: number;
  /** Scale up on hover */
  hoverScale?: number;
  className?: string;
}

export function MagneticElement({
  children,
  strength = 0.3,
  range = 40,
  stiffness = springConfig.ui.stiffness,
  damping = springConfig.ui.damping,
  hoverScale = 1.05,
  className,
}: MagneticElementProps) {
  const print = usePrintMode();
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness, damping });
  const springY = useSpring(y, { stiffness, damping });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = (e.clientX - centerX) * strength;
      const dy = (e.clientY - centerY) * strength;

      x.set(Math.max(-range, Math.min(range, dx)));
      y.set(Math.max(-range, Math.min(range, dy)));
    },
    [strength, range, x, y],
  );

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
    setHovered(false);
  }, [x, y]);

  if (print) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={cn("inline-block", className)}
      style={{ x: springX, y: springY }}
      animate={{ scale: hovered ? hoverScale : 1 }}
      transition={{ scale: { duration: 0.2 } }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
}
