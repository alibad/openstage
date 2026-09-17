"use client";

import { Children, ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";

/**
 * Snap-to-panel behavior configuration. When provided, scroll feels weighted
 * (momentum) and each panel locks to centre after a threshold.
 */
interface HorizontalPinSnap {
  /** Snap animation duration in seconds. Default 0.45 */
  duration?: number;
  /** Delay before snap engages after scroll stops. Default 0.08 */
  delay?: number;
  /** Easing curve for the snap. Default "power3.inOut" */
  ease?: string;
  /** Scrub lag — higher values give more momentum/weight. Default 0.8 */
  scrub?: number;
}

interface HorizontalPinProps {
  /** Each child becomes a horizontal panel */
  children: ReactNode;
  /** Optional title rendered above the track (stays visible on intro) */
  title?: ReactNode;
  /** Gap between panels (CSS units) */
  gap?: string;
  /** Width of each panel — defaults to 100vw so each fills the screen */
  panelWidth?: string;
  /** Additional scroll distance beyond the track length (1 = matches track) */
  scrollMultiplier?: number;
  /** Show a progress indicator at the bottom */
  showProgress?: boolean;
  /**
   * Snap each panel to centre with momentum. Pass `true` for defaults or an
   * object to tune duration / ease / scrub feel.
   */
  snap?: boolean | HorizontalPinSnap;
  className?: string;
}

/**
 * HorizontalPin — GSAP ScrollTrigger pinned horizontal scroll section.
 *
 * While the section is in view, vertical scrolling is translated into
 * horizontal movement across a row of panels (Apple product pages style).
 * Perfect for "five moments that changed X" or product-tour sections.
 *
 * @example
 * <HorizontalPin title="Five moments that changed AI">
 *   <Panel>2012: AlexNet</Panel>
 *   <Panel>2017: Transformers</Panel>
 *   <Panel>2020: GPT-3</Panel>
 *   <Panel>2022: ChatGPT</Panel>
 *   <Panel>2026: You</Panel>
 * </HorizontalPin>
 */
export function HorizontalPin({
  children,
  title,
  gap = "4rem",
  panelWidth = "100vw",
  scrollMultiplier = 1,
  showProgress = true,
  snap,
  className,
}: HorizontalPinProps) {
  const print = usePrintMode();
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const panels = Children.toArray(children);
  const panelCount = panels.length;

  useEffect(() => {
    if (print) return;
    const section = sectionRef.current;
    const pin = pinRef.current;
    const track = trackRef.current;
    if (!section || !pin || !track) return;

    const rafId = 0;
    let cleanup: (() => void) | null = null;

    let isMounted = true;
    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (!isMounted) return;
      gsap.registerPlugin(ScrollTrigger);

      const trackWidth = track.scrollWidth;
      const distance = trackWidth - window.innerWidth;
      if (distance <= 0) return;

      // Add a small tail so pin holds slightly past the end of the
      // horizontal animation — prevents the panel briefly re-appearing
      // in natural flow at the unpin boundary.
      const tail = window.innerHeight * 0.25;

      // Snap config — when enabled, scroll feels weighted and each panel
      // locks to centre. Compute evenly-spaced snap points from panel count.
      const snapEnabled = !!snap;
      const snapOpts: HorizontalPinSnap =
        typeof snap === "object" && snap !== null ? snap : {};
      const snapPoints =
        snapEnabled && panelCount > 1
          ? Array.from({ length: panelCount }, (_, i) => i / (panelCount - 1))
          : null;

      const tween = gsap.to(track, {
        x: -distance,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${distance * scrollMultiplier + tail}`,
          // Number scrub = lag/momentum; true = 1:1 (default behavior)
          scrub: snapEnabled ? (snapOpts.scrub ?? 0.8) : true,
          ...(snapPoints
            ? {
                snap: {
                  snapTo: snapPoints,
                  duration: snapOpts.duration ?? 0.45,
                  delay: snapOpts.delay ?? 0.08,
                  ease: snapOpts.ease ?? "power3.inOut",
                  inertia: false,
                },
              }
            : {}),
          pin: pin,
          // "fixed" is the correct pinType for document/window scroll.
          pinType: "fixed",
          pinSpacing: true,
          anticipatePin: 0,
          invalidateOnRefresh: true,
          fastScrollEnd: false,
          onUpdate: (self) => {
            if (progressRef.current) {
              // Clamp progress to the animation portion (ignore the tail)
              const animEnd =
                (distance * scrollMultiplier) /
                (distance * scrollMultiplier + tail);
              const p = Math.min(self.progress / animEnd, 1);
              progressRef.current.style.transform = `scaleX(${p})`;
            }
          },
        },
      });

      // CRITICAL: the page contains async-loading content above the pinned
      // section (videos, fonts, lazy images). When those assets load AFTER
      // ScrollTrigger initializes, upstream sections grow, pushing the
      // gallery's absolute doc position down by hundreds of px. GSAP does
      // NOT auto-refresh for arbitrary layout shifts, so it keeps using the
      // stale pin-start scroll position — causing the pinned content to
      // visibly jump ~500px when it unpins. We watch the document's scroll
      // height and re-invalidate/refresh whenever it changes.
      let lastHeight = document.documentElement.scrollHeight;
      const refreshIfLayoutShifted = () => {
        const h = document.documentElement.scrollHeight;
        if (h !== lastHeight) {
          lastHeight = h;
          ScrollTrigger.refresh();
        }
      };
      // Refresh once everything async has settled.
      const loadHandler = () => ScrollTrigger.refresh();
      window.addEventListener("load", loadHandler);
      const ro = new ResizeObserver(refreshIfLayoutShifted);
      ro.observe(document.documentElement);
      // Belt-and-suspenders: a couple of timed refreshes catch late layout
      // from fonts/videos that don't fire a resize observation.
      const t1 = window.setTimeout(() => ScrollTrigger.refresh(), 500);
      const t2 = window.setTimeout(() => ScrollTrigger.refresh(), 1500);

      cleanup = () => {
        window.removeEventListener("load", loadHandler);
        ro.disconnect();
        window.clearTimeout(t1);
        window.clearTimeout(t2);
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    })();

    return () => {
      isMounted = false;
      cancelAnimationFrame(rafId);
      cleanup?.();
    };
  }, [scrollMultiplier, print, snap, panelCount]);

  if (print) {
    return (
      <section className={cn("py-16", className)}>
        {title && <div className="mb-10">{title}</div>}
        <div
          className="flex flex-wrap"
          style={{ gap }}
        >
          {panels.map((panel, i) => (
            <div
              key={i}
              className="shrink-0"
              style={{ width: panelWidth === "100vw" ? "100%" : panelWidth }}
            >
              {panel}
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className={cn("relative isolate", className)}
      style={{ backgroundColor: "var(--horizontal-pin-bg, #0A0718)" }}
    >
      <div
        ref={pinRef}
        className="relative h-screen w-full overflow-hidden flex flex-col"
        style={{ backgroundColor: "var(--horizontal-pin-bg, #0A0718)" }}
      >
        {title && (
          <div className="shrink-0 px-8 pt-10 pb-6 max-w-7xl mx-auto w-full">
            {title}
          </div>
        )}
        <div className="flex-1 flex items-center min-h-0">
          <div
            ref={trackRef}
            className="flex items-center will-change-transform"
            style={{ gap }}
          >
            {panels.map((panel, i) => (
              <div
                key={i}
                className="shrink-0 h-full flex items-center"
                style={{ width: panelWidth }}
              >
                {panel}
              </div>
            ))}
          </div>
        </div>
        {showProgress && (
          <div className="shrink-0 relative h-[2px] bg-white/10 mb-10 mx-auto max-w-7xl w-[calc(100%-4rem)]">
            <div
              ref={progressRef}
              className="absolute inset-y-0 left-0 w-full origin-left"
              style={{
                transform: "scaleX(0)",
                background:
                  "var(--brand-gradient, linear-gradient(90deg, var(--color-brand-1), var(--color-brand-2), var(--color-brand-3), var(--color-brand-5)))",
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
