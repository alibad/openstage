"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { animate } from "framer-motion";
import { usePrintMode } from "@/lib/print-mode";

interface AnimatedCounterProps {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
}

export function AnimatedCounter({
  target,
  prefix = "",
  suffix = "",
  duration = 2,
  decimals,
  className,
}: AnimatedCounterProps) {
  const print = usePrintMode();
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);
  const autoDecimals = decimals ?? (target % 1 !== 0 ? 1 : 0);
  const [display, setDisplay] = useState(print ? target : 0);

  const startAnimation = useCallback(() => {
    if (hasAnimated.current || print) return;
    hasAnimated.current = true;
    const controls = animate(0, target, {
      duration,
      ease: [0.25, 0.46, 0.45, 0.94],
      onUpdate: (v) => setDisplay(parseFloat(v.toFixed(autoDecimals))),
    });
    return controls.stop;
  }, [target, duration, autoDecimals, print]);

  useEffect(() => {
    if (print) { setDisplay(target); return; }
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;
        const style = window.getComputedStyle(el);
        const opacity = parseFloat(style.opacity);
        if (opacity < 0.3) return;
        startAnimation();
        observer.disconnect();
      },
      { threshold: 0.1 },
    );

    observer.observe(el);

    const fallback = setTimeout(() => {
      if (!hasAnimated.current) startAnimation();
    }, 3000);

    return () => { observer.disconnect(); clearTimeout(fallback); };
  }, [print, target, startAnimation]);

  return (
    <span ref={ref} className={className}>
      {prefix}{display}{suffix}
    </span>
  );
}
