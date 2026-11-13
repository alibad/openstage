"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { usePrintMode } from "@/lib/print-mode";

/*
 * Click-first decks: one "Next" moves the talk on.
 *
 * If the block in the middle of the screen still has steps to show (a board's next row, the next tab), Next shows
 * it. Otherwise the page glides to the next stop. Stops are the page's own landmarks: every heading and pull quote
 * inside <main>, plus anything marked data-stop (data-stop="5" rests it 5% down the window instead of 12%).
 * Headings inside a data-nostop block are not stops, and a pull quote that already shows in full on the stop before
 * it is not a stop either. Back does the same in reverse. Scrolling still works; nothing
 * here takes the wheel away.
 *
 *   const { ref, at, setAt } = useStepped(rows.length);   // in a block that shows itself step by step
 *   <DeckNext />                                           // once per deck: the buttons and the keys
 *
 * Keys: → / PageDown / Space = next, ← / PageUp = back. A clicker sends the same keys.
 */

type Stepper = { el: RefObject<HTMLElement | null>; next: () => boolean; prev: () => boolean };
const steppers = new Set<Stepper>();

/** A block shown in `count` steps. `at` is the step on screen (0-based); Next and Back move through it first. */
export function useStepped<E extends HTMLElement = HTMLDivElement>(count: number) {
  const ref = useRef<E>(null);
  const [at, setAt] = useState(0);
  const live = useRef(0);
  useEffect(() => { live.current = at; }, [at]);
  useEffect(() => {
    const s: Stepper = {
      el: ref,
      next: () => { if (live.current >= count - 1) return false; live.current += 1; setAt(live.current); return true; },
      prev: () => { if (live.current <= 0) return false; live.current -= 1; setAt(live.current); return true; },
    };
    steppers.add(s);
    return () => { steppers.delete(s); };
  }, [count]);
  return { ref, at, setAt };
}

const STOPS = "[data-stop], h1, h2, h3, blockquote";
const HEAD = 0.12; // a stop comes to rest this far down the window

function stopPositions() {
  const main = document.querySelector("main");
  if (!main) return [];
  const vh = window.innerHeight, max = document.documentElement.scrollHeight - vh;
  const ys: number[] = [];
  for (const el of main.querySelectorAll<HTMLElement>(STOPS)) {
    const marked = el.dataset.stop !== undefined;
    if (!marked && el.closest("[data-nostop]")) continue;
    const box = el.getBoundingClientRect();
    if (!box.width && !box.height) continue;
    const head = marked && el.dataset.stop !== "" && Number.isFinite(Number(el.dataset.stop)) ? Number(el.dataset.stop) / 100 : HEAD;
    const y = Math.max(0, Math.min(max, Math.round(box.top + window.scrollY - vh * head)));
    // A closing line that already shows in full on the stop before it (clear of the controls) needs no stop.
    if (!marked && el.tagName === "BLOCKQUOTE" && ys.length && box.bottom + window.scrollY < ys[ys.length - 1] + vh * 0.86) continue;
    // Landmarks that share a screen are one stop.
    if (!ys.length || y - ys[ys.length - 1] > vh * 0.28) ys.push(y);
  }
  return ys;
}

let pending: { y: number; at: number } | null = null;

/** Move the talk one step. Returns what happened, for the buttons' labels and for tests. */
export function deckGo(dir: 1 | -1): "step" | "stop" | "end" {
  const vh = window.innerHeight;
  const onScreen = [...steppers].find((s) => {
    const box = s.el.current?.getBoundingClientRect();
    // The block whose top is resting near the top of the window (a short block on a tall phone counts too).
    return box && box.top > -vh * 0.3 && box.top < vh * 0.3 && box.bottom > vh * 0.3;
  });
  if (onScreen && (dir > 0 ? onScreen.next() : onScreen.prev())) return "step";
  // Key presses can arrive faster than the glide: count from where the page is going, not where it is.
  const from = pending && performance.now() - pending.at < 900 ? pending.y : window.scrollY;
  const ys = stopPositions();
  // A stop the page is already resting near is this screen, not the next one.
  const near = vh * 0.18;
  const to = dir > 0 ? ys.find((y) => y > from + near) : [...ys].reverse().find((y) => y < from - near);
  if (to === undefined) return "end";
  pending = { y: to, at: performance.now() };
  window.scrollTo({ top: to, behavior: "smooth" });
  return "stop";
}

/**
 * The Next and Back buttons, and the keys. Render once per deck. Hidden in print mode.
 * `solid` fills Next with the accent (from `hi` at its top, if given) and writes on it in `ink`; the corners are then
 * squarer, like a game button.
 */
export function DeckNext({ accent = "#F2C14E", hi, ink = "#fff", solid = false }: { accent?: string; hi?: string; ink?: string; solid?: boolean }) {
  const print = usePrintMode();
  useEffect(() => {
    if (print) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      // Space on a focused button or link is that control's own click.
      if (e.key === " " && t && /^(BUTTON|A|SUMMARY)$/.test(t.tagName)) return;
      const dir = e.key === "ArrowRight" || e.key === "PageDown" || e.key === " " ? 1 : e.key === "ArrowLeft" || e.key === "PageUp" ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      deckGo(dir as 1 | -1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [print]);
  if (print) return null;
  const base = `grid h-11 place-items-center ${solid ? "rounded-md" : "rounded-full"} bg-black/75 font-semibold text-white backdrop-blur-sm transition hover:bg-black active:scale-95`;
  return (
    <div data-deck-next className="print-hidden fixed bottom-6 left-1/2 z-[90] flex -translate-x-1/2 select-none items-center gap-2">
      <button type="button" aria-label="Back" onClick={() => deckGo(-1)} className={`${base} w-11 text-lg ring-1 ring-white/15`}>‹</button>
      <button type="button" onClick={() => deckGo(1)} className={`${base} grid-flow-col gap-2 whitespace-nowrap px-6 text-[15px]`}
        style={solid ? { color: ink, fontWeight: 700, background: hi ? `linear-gradient(180deg, ${hi}, ${accent})` : accent, boxShadow: `0 6px 22px ${accent}66` } : { color: accent, boxShadow: `0 0 0 1px ${accent}66` }}>
        <span>Next</span><span aria-hidden className="text-lg leading-none">›</span>
      </button>
    </div>
  );
}
