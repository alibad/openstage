"use client";

import { useEffect, useState, useRef } from "react";
import { useInView } from "framer-motion";
import { viewportMargin } from "@/lib/motion";

interface TypewriterProps {
  lines: { text: string; className?: string }[];
  speed?: number;
  lineDelay?: number;
  className?: string;
  cursorClassName?: string;
  /** When false, typing begins on mount. Default true. */
  startWhenVisible?: boolean;
  /** External start signal (e.g. parent section in view). Overrides internal observer. */
  start?: boolean;
  /** Fraction of the element that must be visible before typing starts (0–1). */
  viewportAmount?: number;
}

export function Typewriter({
  lines,
  speed = 30,
  lineDelay = 400,
  className,
  cursorClassName,
  startWhenVisible = true,
  start,
  viewportAmount = 0.35,
}: TypewriterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const internalInView = useInView(ref, {
    once: true,
    margin: viewportMargin.late,
    amount: viewportAmount,
  });
  const shouldStart =
    start !== undefined
      ? start
      : startWhenVisible
        ? internalInView
        : true;

  const [visibleLines, setVisibleLines] = useState<
    { text: string; className?: string; revealed: string }[]
  >([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!shouldStart) return;

    if (currentLine >= lines.length) {
      setDone(true);
      return;
    }

    const line = lines[currentLine];
    if (currentChar >= line.text.length) {
      setVisibleLines((prev) => {
        const updated = [...prev];
        updated[currentLine] = {
          ...line,
          revealed: line.text,
        };
        return updated;
      });
      const timeout = setTimeout(() => {
        setCurrentLine((l) => l + 1);
        setCurrentChar(0);
      }, lineDelay);
      return () => clearTimeout(timeout);
    }

    if (currentChar === 0) {
      setVisibleLines((prev) => [
        ...prev,
        { ...line, revealed: "" },
      ]);
    }

    const timeout = setTimeout(() => {
      setVisibleLines((prev) => {
        const updated = [...prev];
        updated[currentLine] = {
          ...line,
          revealed: line.text.slice(0, currentChar + 1),
        };
        return updated;
      });
      setCurrentChar((c) => c + 1);
    }, speed);

    return () => clearTimeout(timeout);
  }, [shouldStart, currentLine, currentChar, lines, speed, lineDelay]);

  return (
    <div
      ref={start === undefined && startWhenVisible ? ref : undefined}
      className={className}
      aria-live="polite"
    >
      {!shouldStart &&
        lines.map((line, i) => (
          <div key={`placeholder-${i}`} className={line.className} aria-hidden>
            <span className="invisible">{line.text}</span>
          </div>
        ))}
      {shouldStart &&
        visibleLines.map((line, i) => (
          <div key={i} className={line.className}>
            {line.revealed}
            {i === currentLine && !done && (
              <span
                className={
                  cursorClassName ||
                  "inline-block w-[2px] h-[1.1em] bg-brand-1 ml-0.5 align-text-bottom animate-pulse"
                }
              />
            )}
          </div>
        ))}
    </div>
  );
}
