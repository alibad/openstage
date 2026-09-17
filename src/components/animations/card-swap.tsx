"use client";

import React, {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import gsap from "gsap";

export interface CardSwapHandle {
  next: () => void;
  prev: () => void;
}

export interface CardSwapProps {
  width?: number | string;
  height?: number | string;
  cardDistance?: number;
  verticalDistance?: number;
  easing?: "linear" | "elastic";
  /** Auto-advance to the next card on an interval. Defaults to true. */
  autoCycle?: boolean;
  /** Milliseconds between auto-advances. Defaults to 4000. */
  cycleInterval?: number;
  /** Pause auto-cycling while the pointer is over the stack. Defaults to true. */
  pauseOnHover?: boolean;
  children: ReactNode;
}

export interface SwapCardProps extends React.HTMLAttributes<HTMLDivElement> {
  customClass?: string;
}

export const SwapCard = forwardRef<HTMLDivElement, SwapCardProps>(
  ({ customClass, style, ...rest }, ref) => (
    <div
      ref={ref}
      className={`swap-card ${customClass ?? ""}`}
      style={{ position: "absolute", top: 0, left: 0, ...style }}
      {...rest}
    />
  )
);
SwapCard.displayName = "SwapCard";

type CardRef = React.RefObject<HTMLDivElement | null>;

interface Slot {
  x: number;
  y: number;
  z: number;
  zIndex: number;
}

const makeSlot = (
  i: number,
  distX: number,
  distY: number,
  total: number
): Slot => ({
  x: i * distX,
  y: (total - 1 - i) * distY,
  z: -i * distX * 1.5,
  zIndex: total - i,
});

const placeNow = (el: HTMLElement, slot: Slot) =>
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: 0,
    yPercent: 0,
    opacity: 1,
    scale: 1,
    transformOrigin: "center center",
    zIndex: slot.zIndex,
    force3D: true,
  });

export const CardSwap = forwardRef<CardSwapHandle, CardSwapProps>(
  function CardSwap(
    {
      width = 500,
      height = 400,
      cardDistance = 60,
      verticalDistance = 70,
      easing = "elastic",
      autoCycle = true,
      cycleInterval = 4000,
      pauseOnHover = true,
      children,
    },
    ref
  ) {
    const config =
      easing === "elastic"
        ? {
            ease: "elastic.out(0.6,0.9)",
            durDrop: 2,
            durMove: 2,
            durReturn: 2,
            promoteOverlap: 0.9,
            returnDelay: 0.05,
          }
        : {
            ease: "power1.inOut",
            durDrop: 0.8,
            durMove: 0.8,
            durReturn: 0.8,
            promoteOverlap: 0.45,
            returnDelay: 0.2,
          };

    const childArr = useMemo(
      () => Children.toArray(children) as ReactElement[],
      [children]
    );
    const refs = useMemo<CardRef[]>(
      () => childArr.map(() => React.createRef<HTMLDivElement>()),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [childArr.length]
    );

    const order = useRef<number[]>(
      Array.from({ length: childArr.length }, (_, i) => i)
    );
    const tlRef = useRef<gsap.core.Timeline | null>(null);
    const container = useRef<HTMLDivElement>(null);
    const isAnimating = useRef(false);

    const finishCurrent = useCallback(() => {
      if (tlRef.current) {
        tlRef.current.progress(1).kill();
        tlRef.current = null;
      }
      isAnimating.current = false;
    }, []);

    const next = useCallback(() => {
      if (order.current.length < 2) return;
      finishCurrent();
      isAnimating.current = true;

      const [front, ...rest] = order.current;
      const elFront = refs[front].current!;
      const tl = gsap.timeline({
        onComplete: () => {
          isAnimating.current = false;
        },
      });
      tlRef.current = tl;

      tl.to(elFront, {
        y: "+=500",
        duration: config.durDrop,
        ease: config.ease,
      });

      tl.addLabel("promote", `-=${config.durDrop * config.promoteOverlap}`);
      rest.forEach((idx, i) => {
        const el = refs[idx].current!;
        const slot = makeSlot(i, cardDistance, verticalDistance, refs.length);
        tl.set(el, { zIndex: slot.zIndex }, "promote");
        tl.to(
          el,
          {
            x: slot.x,
            y: slot.y,
            z: slot.z,
            duration: config.durMove,
            ease: config.ease,
          },
          `promote+=${i * 0.15}`
        );
      });

      const backSlot = makeSlot(
        refs.length - 1,
        cardDistance,
        verticalDistance,
        refs.length
      );
      tl.addLabel("return", `promote+=${config.durMove * config.returnDelay}`);
      tl.call(
        () => {
          gsap.set(elFront, { zIndex: backSlot.zIndex });
        },
        undefined,
        "return"
      );
      tl.to(
        elFront,
        {
          x: backSlot.x,
          y: backSlot.y,
          z: backSlot.z,
          duration: config.durReturn,
          ease: config.ease,
        },
        "return"
      );

      tl.call(() => {
        order.current = [...rest, front];
      });
    }, [refs, cardDistance, verticalDistance, config, finishCurrent]);

    const prev = useCallback(() => {
      if (order.current.length < 2) return;
      finishCurrent();
      isAnimating.current = true;

      const last = order.current[order.current.length - 1];
      const elLast = refs[last].current!;
      const total = refs.length;
      const tl = gsap.timeline({
        onComplete: () => {
          isAnimating.current = false;
        },
      });
      tlRef.current = tl;

      const frontSlot = makeSlot(0, cardDistance, verticalDistance, total);
      tl.set(elLast, {
        zIndex: total + 1,
        y: frontSlot.y - 400,
        x: frontSlot.x,
        z: frontSlot.z,
        opacity: 0.5,
      });
      tl.to(elLast, {
        y: frontSlot.y,
        opacity: 1,
        duration: config.durReturn,
        ease: config.ease,
      });

      tl.addLabel("demote", `-=${config.durReturn * 0.7}`);
      const rest = order.current.slice(0, -1);
      rest.forEach((idx, i) => {
        const el = refs[idx].current!;
        const slot = makeSlot(i + 1, cardDistance, verticalDistance, total);
        tl.set(el, { zIndex: slot.zIndex }, "demote");
        tl.to(
          el,
          {
            x: slot.x,
            y: slot.y,
            z: slot.z,
            duration: config.durMove,
            ease: config.ease,
          },
          `demote+=${i * 0.15}`
        );
      });

      tl.call(() => {
        gsap.set(elLast, { zIndex: frontSlot.zIndex });
        order.current = [last, ...rest];
      });
    }, [refs, cardDistance, verticalDistance, config, finishCurrent]);

    useImperativeHandle(ref, () => ({ next, prev }), [next, prev]);

    useEffect(() => {
      const total = refs.length;
      refs.forEach((r, i) =>
        placeNow(
          r.current!,
          makeSlot(i, cardDistance, verticalDistance, total)
        )
      );
    }, [cardDistance, verticalDistance, refs]);

    const nextRef = useRef(next);
    useEffect(() => {
      nextRef.current = next;
    }, [next]);
    const isHovered = useRef(false);

    useEffect(() => {
      if (!autoCycle || childArr.length < 2 || cycleInterval <= 0) return;
      const id = window.setInterval(() => {
        if (pauseOnHover && isHovered.current) return;
        if (typeof document !== "undefined" && document.hidden) return;
        nextRef.current();
      }, cycleInterval);
      return () => window.clearInterval(id);
    }, [autoCycle, cycleInterval, pauseOnHover, childArr.length]);

    const numCards = childArr.length;
    const totalOffsetX = (numCards - 1) * cardDistance;
    const totalOffsetY = (numCards - 1) * verticalDistance;
    const numW = typeof width === "number" ? width : 500;
    const numH = typeof height === "number" ? height : 400;
    const containerW = numW + totalOffsetX;
    const containerH = numH + totalOffsetY;

    const rendered = childArr.map((child, i) =>
      isValidElement(child)
        ? cloneElement(child, {
            key: i,
            ref: refs[i],
            style: {
              width,
              height,
              ...((child.props as Record<string, unknown>).style as Record<string, unknown> ?? {}),
            },
          } as Record<string, unknown>)
        : child
    );

    return (
      <div
        className="relative"
        style={{ width: containerW, height: containerH }}
        onMouseEnter={() => {
          if (pauseOnHover) isHovered.current = true;
        }}
        onMouseLeave={() => {
          if (pauseOnHover) isHovered.current = false;
        }}
      >
        <div
          ref={container}
          style={{
            perspective: 1200,
            overflow: "visible",
            position: "relative",
            width: containerW,
            height: containerH,
          }}
        >
          {rendered}
        </div>
      </div>
    );
  }
);
CardSwap.displayName = "CardSwap";
