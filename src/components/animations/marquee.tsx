"use client";

import { Children, ReactNode, useMemo } from "react";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";

interface MarqueeProps {
  /** Content to scroll. Each child is a separate item. */
  children: ReactNode;
  /** Direction of scroll */
  direction?: "left" | "right" | "up" | "down";
  /** Duration of one full loop in seconds (lower = faster) */
  speed?: number;
  /** Pause on hover */
  pauseOnHover?: boolean;
  /** Gap between items (CSS units) */
  gap?: string;
  /** Fade edges with a gradient mask */
  fade?: boolean;
  /** Width of the fade edge */
  fadeWidth?: string;
  /** Additional class on the outer container */
  className?: string;
  /** Additional class on each item */
  itemClassName?: string;
}

/**
 * Marquee — GPU-accelerated infinite ticker.
 *
 * Horizontal or vertical, pausable on hover, gradient edge fade.
 * Ideal for logo strips, quote rivers, category ribbons, press walls.
 *
 * @example
 * <Marquee speed={30} fade pauseOnHover>
 *   <img src="/logos/a.svg" className="h-8" />
 *   <img src="/logos/b.svg" className="h-8" />
 * </Marquee>
 */
export function Marquee({
  children,
  direction = "left",
  speed = 40,
  pauseOnHover = true,
  gap = "3rem",
  fade = true,
  fadeWidth = "10%",
  className,
  itemClassName,
}: MarqueeProps) {
  const print = usePrintMode();
  const isVertical = direction === "up" || direction === "down";
  const reverse = direction === "right" || direction === "down";

  const items = useMemo(() => Children.toArray(children), [children]);

  if (print) {
    return (
      <div className={cn("flex flex-wrap gap-8 items-center", className)}>
        {items.map((child, i) => (
          <div key={i} className={itemClassName}>
            {child}
          </div>
        ))}
      </div>
    );
  }

  const maskImage = fade
    ? isVertical
      ? `linear-gradient(to bottom, transparent, black ${fadeWidth}, black calc(100% - ${fadeWidth}), transparent)`
      : `linear-gradient(to right, transparent, black ${fadeWidth}, black calc(100% - ${fadeWidth}), transparent)`
    : undefined;

  const setClass = isVertical
    ? "flex shrink-0 flex-col items-center"
    : "flex shrink-0 flex-row items-center";

  // Each "set" has internal gap + trailing gap so the next set butts against
  // it with exactly `gap` spacing. Translating by -50% loops seamlessly.
  const setStyle: React.CSSProperties = isVertical
    ? { gap, paddingBottom: gap }
    : { gap, paddingRight: gap };

  return (
    <div
      className={cn(
        "group relative overflow-hidden",
        isVertical ? "h-full" : "w-full",
        className,
      )}
      style={
        maskImage
          ? ({
              WebkitMaskImage: maskImage,
              maskImage,
            } as React.CSSProperties)
          : undefined
      }
    >
      <div
        className={cn(
          "flex shrink-0",
          isVertical ? "flex-col" : "flex-row",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
        )}
        style={{
          animation: `${isVertical ? "presentation-marquee-y" : "presentation-marquee-x"} ${speed}s linear infinite`,
          animationDirection: reverse ? "reverse" : "normal",
          willChange: "transform",
        }}
      >
        <div className={setClass} style={setStyle}>
          {items.map((child, i) => (
            <div key={`a-${i}`} className={cn("shrink-0", itemClassName)}>
              {child}
            </div>
          ))}
        </div>
        <div className={setClass} style={setStyle} aria-hidden="true">
          {items.map((child, i) => (
            <div key={`b-${i}`} className={cn("shrink-0", itemClassName)}>
              {child}
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes presentation-marquee-x {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes presentation-marquee-y {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }
      `}</style>
    </div>
  );
}
