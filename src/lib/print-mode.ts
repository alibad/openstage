"use client";

import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { createElement, forwardRef, type ReactNode } from "react";

/**
 * Returns true when ?print is present in the URL.
 * In print mode all animation wrappers render as plain HTML elements
 * so Cmd+P / Save-as-PDF captures every slide correctly.
 */
export function usePrintMode(): boolean {
  const params = useSearchParams();
  return params.has("print");
}

const ANIMATION_PROPS = new Set([
  "initial",
  "animate",
  "exit",
  "whileHover",
  "whileTap",
  "whileFocus",
  "whileDrag",
  "whileInView",
  "transition",
  "variants",
  "viewport",
  "onAnimationStart",
  "onAnimationComplete",
  "onHoverStart",
  "onHoverEnd",
  "onTapStart",
  "onTap",
  "onTapCancel",
  "layout",
  "layoutId",
  "layoutDependency",
  "layoutScroll",
  "drag",
  "dragConstraints",
  "dragElastic",
  "dragMomentum",
  "dragTransition",
  "onDragStart",
  "onDragEnd",
  "onDrag",
  "custom",
]);

function makeStaticTag(tag: string) {
  const Comp = forwardRef(function StaticMotion(props: Record<string, unknown>, ref) {
    const clean: Record<string, unknown> = { ref };
    for (const [k, v] of Object.entries(props)) {
      if (!ANIMATION_PROPS.has(k)) clean[k] = v;
    }
    return createElement(tag, clean);
  });
  Comp.displayName = `static(${tag})`;
  return Comp;
}

const cache = new Map<string, ReturnType<typeof makeStaticTag>>();

/**
 * A drop-in replacement for framer-motion's `motion` that renders
 * plain HTML elements with all animation props stripped.
 */
export const staticMotion = new Proxy({} as typeof motion, {
  get(_, tag: string) {
    if (!cache.has(tag)) cache.set(tag, makeStaticTag(tag));
    return cache.get(tag)!;
  },
});

/**
 * Returns `motion` normally, or `staticMotion` when ?print is active.
 * Use as: `const m = useM();` then `<m.div ...>`.
 */
export function useM() {
  const print = usePrintMode();
  return print ? staticMotion : motion;
}
