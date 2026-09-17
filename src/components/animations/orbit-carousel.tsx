"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, type LucideIcon } from "lucide-react";

export interface OrbitItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  icon: LucideIcon;
}

export interface OrbitCarouselProps {
  items: OrbitItem[];
  centerLabel?: string;
  centerImage?: string;
  autoPlayDuration?: number;
  /** CSS class for the progress ring stroke, e.g. "stroke-white/50" */
  accentColor?: string;
}

export function OrbitCarousel({
  items,
  centerLabel,
  centerImage,
  autoPlayDuration = 6000,
  accentColor = "stroke-white/50",
}: OrbitCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const progressRef = useRef(0);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);

  const svgRadius = 46;
  const circumference = 2 * Math.PI * svgRadius;

  const updateProgressDOM = useCallback(
    (pct: number) => {
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${pct}%`;
      }
      if (ringRef.current) {
        const fraction = (activeIndex + pct / 100) / items.length;
        ringRef.current.setAttribute(
          "stroke-dashoffset",
          String(circumference - fraction * circumference)
        );
      }
    },
    [activeIndex, circumference, items.length]
  );

  useEffect(() => {
    let animationFrame: number;
    let startTime: number;

    const tick = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      if (isAutoPlaying) {
        const currentProgress = Math.min(
          (elapsed / autoPlayDuration) * 100,
          100
        );
        progressRef.current = currentProgress;
        updateProgressDOM(currentProgress);

        if (elapsed >= autoPlayDuration) {
          setActiveIndex((prev) => (prev + 1) % items.length);
          startTime = timestamp;
          progressRef.current = 0;
          updateProgressDOM(0);
        }
        animationFrame = requestAnimationFrame(tick);
      }
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [isAutoPlaying, activeIndex, updateProgressDOM, autoPlayDuration, items.length]);

  const resetProgress = useCallback(() => {
    progressRef.current = 0;
    updateProgressDOM(0);
  }, [updateProgressDOM]);

  const handleNodeClick = useCallback(
    (index: number) => {
      setActiveIndex(index);
      setIsAutoPlaying(false);
      resetProgress();
    },
    [resetProgress]
  );

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    setIsAutoPlaying(false);
    resetProgress();
  }, [resetProgress, items.length]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    setIsAutoPlaying(false);
    resetProgress();
  }, [resetProgress, items.length]);

  const baseFraction = activeIndex / items.length;
  const strokeDashoffset = circumference - baseFraction * circumference;
  const activeAngleDeg = (activeIndex * 360) / items.length - 90;

  const ActiveIcon = items[activeIndex].icon;

  return (
    <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
      <div className="relative w-[340px] h-[340px] md:w-[480px] md:h-[480px] shrink-0">
        {/* Outer decorative ring */}
        <div className="absolute inset-0 rounded-full border border-white/[0.06]" />

        {/* SVG progress ring */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full -rotate-90 overflow-visible pointer-events-none z-10"
        >
          {/* Track ring */}
          <circle
            cx="50"
            cy="50"
            r={svgRadius}
            fill="none"
            className="stroke-white/[0.06]"
            strokeWidth="0.6"
          />
          {/* Swept "past" arc */}
          <circle
            cx="50"
            cy="50"
            r={svgRadius}
            fill="none"
            className="stroke-white/[0.12] transition-all duration-700 ease-out"
            strokeWidth="1.2"
            strokeDasharray={circumference}
            strokeDashoffset={
              circumference - (activeIndex / items.length) * circumference
            }
          />
          {/* Live progress arc */}
          <circle
            ref={ringRef}
            cx="50"
            cy="50"
            r={svgRadius}
            fill="none"
            className={accentColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        {/* Rotating connection ray */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-[46%] h-[1px] origin-left z-0 pointer-events-none"
          animate={{ rotate: activeAngleDeg }}
          transition={{ type: "spring", stiffness: 45, damping: 15 }}
        >
          <div className="w-full h-full bg-gradient-to-r from-transparent via-white/10 to-white/30" />
        </motion.div>

        {/* Center element */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] md:w-[130px] md:h-[130px] rounded-full z-20 group cursor-pointer"
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
        >
          <div className="w-full h-full rounded-full overflow-hidden relative border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.04)]">
            {centerImage ? (
              <img
                src={centerImage}
                alt={centerLabel || ""}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/[0.08] to-white/[0.02]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIndex}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    className="text-white/30"
                  >
                    <ActiveIcon size={28} strokeWidth={1.2} />
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </div>
          {centerLabel && (
            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
              <span className="text-white/40 text-[9px] font-medium uppercase tracking-[0.25em] whitespace-nowrap">
                {centerLabel}
              </span>
            </div>
          )}
        </div>

        {/* Orbiting nodes */}
        {items.map((step, i) => {
          const angleRad =
            (i * 2 * Math.PI) / items.length - Math.PI / 2;
          const x = Math.cos(angleRad) * svgRadius;
          const y = Math.sin(angleRad) * svgRadius;

          const isActive = i === activeIndex;
          const isPast = i < activeIndex;

          let nodeClasses =
            "bg-white/90 border-white/80 text-black/70";
          let iconSize = 14;

          if (isActive) {
            nodeClasses =
              "bg-white border-white text-black scale-125 shadow-[0_0_20px_rgba(255,255,255,0.15)] z-40";
            iconSize = 16;
          } else if (isPast) {
            nodeClasses =
              "bg-white/90 border-white/80 text-black/70";
          }

          const isBottomHalf = y > 5;

          return (
            <button
              key={step.id}
              onClick={() => handleNodeClick(i)}
              className="absolute flex flex-col items-center justify-center transition-all duration-700 z-30 group -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `calc(50% + ${x}%)`,
                top: `calc(50% + ${y}%)`,
              }}
            >
              <div
                className={`w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center border transition-all duration-500 ${nodeClasses} hover:scale-110 hover:border-white/30`}
              >
                <step.icon size={iconSize} strokeWidth={1.5} />
              </div>
              <span
                className={`absolute ${isBottomHalf ? "top-full mt-1.5" : "bottom-full mb-1.5"} z-[50] text-[8px] uppercase tracking-[0.15em] font-medium transition-all duration-500 whitespace-nowrap px-1.5 py-0.5 rounded flex flex-col items-center gap-0.5 ${
                  isActive
                    ? "text-white/80 opacity-100"
                    : "text-white/40 opacity-0 md:opacity-100 group-hover:text-white/60"
                }`}
              >
                <span>
                  {String(i + 1).padStart(2, "0")} · {step.subtitle}
                </span>
                {isActive && (
                  <span className="text-white/40 text-[7px] tracking-[0.12em] normal-case font-normal">
                    {step.title}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Story card */}
      <div className="flex-1 w-full max-w-lg relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="relative bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden"
          >
            <div className="h-56 md:h-[240px] w-full relative overflow-hidden">
              <motion.img
                src={items[activeIndex].image}
                alt={items[activeIndex].title}
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="w-full h-full object-cover opacity-60 filter grayscale-[40%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,12,18,1)] via-[rgba(10,12,18,0.4)] to-transparent" />
            </div>

            <div className="p-6 md:p-8 relative flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-medium">
                  {String(activeIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
                </span>
              </div>
              <h3 className="text-2xl md:text-[28px] text-white/90 tracking-tight leading-tight font-normal">
                {items[activeIndex].title}
              </h3>
              <p className="text-white/40 text-[13px] md:text-[14px] font-normal leading-relaxed tracking-wide max-w-sm min-h-[5.5rem]">
                {items[activeIndex].description}
              </p>

              <div className="absolute bottom-0 left-0 h-[1px] bg-white/[0.06] w-full">
                <div
                  ref={progressBarRef}
                  className="h-full bg-white/30 transition-none"
                  style={{
                    width: isAutoPlaying ? `${progressRef.current}%` : "0%",
                  }}
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-between text-white/30 px-1">
          <button
            onClick={handlePrev}
            className="text-[9px] uppercase tracking-[2px] hover:text-white/70 transition-colors py-2 font-medium"
          >
            Prev
          </button>

          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/90 text-black hover:bg-white transition-all"
          >
            {isAutoPlaying ? (
              <Pause size={11} strokeWidth={2} />
            ) : (
              <Play size={11} strokeWidth={2} className="ml-0.5" />
            )}
          </button>

          <button
            onClick={handleNext}
            className="text-[9px] uppercase tracking-[2px] hover:text-white/70 transition-colors py-2 font-medium"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
