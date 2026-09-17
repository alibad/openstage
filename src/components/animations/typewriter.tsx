"use client";

import { useEffect, useState, useRef } from "react";
import { useInView } from "framer-motion";

interface TypewriterProps {
  lines: { text: string; className?: string }[];
  speed?: number;
  lineDelay?: number;
  className?: string;
  cursorClassName?: string;
}

export function Typewriter({
  lines,
  speed = 30,
  lineDelay = 400,
  className,
  cursorClassName,
}: TypewriterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [visibleLines, setVisibleLines] = useState<
    { text: string; className?: string; revealed: string }[]
  >([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isInView) return;

    if (currentLine >= lines.length) {
      setDone(true);
      return;
    }

    if (currentChar === 0 && currentLine > 0) {
      const timeout = setTimeout(() => {
        setCurrentChar(0);
      }, lineDelay);
      return () => clearTimeout(timeout);
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
      setTimeout(() => {
        setCurrentLine((l) => l + 1);
        setCurrentChar(0);
      }, lineDelay);
      return;
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
  }, [isInView, currentLine, currentChar, lines, speed, lineDelay]);

  return (
    <div ref={ref} className={className}>
      {visibleLines.map((line, i) => (
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
