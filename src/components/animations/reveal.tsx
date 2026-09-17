"use client";

import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";
import { usePrintMode } from "@/lib/print-mode";
import { ease, duration, stagger, viewportMargin, fadeVariants } from "@/lib/motion";

const variantMap: Record<string, Variants> = {
  "fade-up": fadeVariants.fadeUp,
  "fade-in": fadeVariants.fadeIn,
  "scale-in": fadeVariants.scaleIn,
  "slide-left": fadeVariants.slideLeft,
  "slide-right": fadeVariants.slideRight,
};

interface RevealProps {
  children: ReactNode;
  variant?: keyof typeof variantMap;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

export function Reveal({
  children,
  variant = "fade-up",
  delay = 0,
  duration: dur = duration.reveal,
  className,
  once = true,
}: RevealProps) {
  const print = usePrintMode();
  if (print) return <div className={className}>{children}</div>;

  return (
    <motion.div
      variants={variantMap[variant]}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: viewportMargin.default }}
      transition={{ duration: dur, delay, ease: ease.outQuart }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerChildrenProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

export function StaggerChildren({
  children,
  staggerDelay = stagger.list,
  className,
}: StaggerChildrenProps) {
  const print = usePrintMode();
  if (print) return <div className={className}>{children}</div>;

  return (
    <motion.div
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const print = usePrintMode();
  if (print) return <div className={className}>{children}</div>;

  return (
    <motion.div
      variants={fadeVariants.fadeUp}
      transition={{ duration: 0.6, ease: ease.outQuart }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
