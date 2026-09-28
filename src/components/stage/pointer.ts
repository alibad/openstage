"use client";

/**
 * One window-level pointer, read inside `useFrame` without React state.
 *
 * drei's `View` only routes pointer events to a view while the cursor is on
 * its tracked element, and the shared stage canvas is `pointer-events: none`
 * so it never steals clicks from the deck. Scenes that react to the cursor
 * read this instead and project it into their own view rectangle.
 */
export const stagePointer = { clientX: -1e4, clientY: -1e4, active: false };

let attached = false;

export function attachStagePointer() {
  if (attached || typeof window === "undefined") return;
  attached = true;
  window.addEventListener(
    "pointermove",
    (e) => {
      stagePointer.clientX = e.clientX;
      stagePointer.clientY = e.clientY;
      stagePointer.active = e.pointerType === "mouse";
    },
    { passive: true },
  );
  document.documentElement.addEventListener("pointerleave", () => {
    stagePointer.active = false;
  });
}

/** The pointer in a view's normalised device coordinates, or null when outside it. */
export function pointerInRect(rect: DOMRect | null): [number, number] | null {
  if (!rect || !stagePointer.active) return null;
  const x = ((stagePointer.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -(((stagePointer.clientY - rect.top) / rect.height) * 2 - 1);
  if (x < -1.2 || x > 1.2 || y < -1.2 || y > 1.2) return null;
  return [x, y];
}
