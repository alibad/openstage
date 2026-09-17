"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { useEffect, useRef, useState, useCallback, ReactNode } from "react";
import { usePrintMode } from "@/lib/print-mode";
import { ease, springConfig } from "@/lib/motion";

/* ─── Scroll Progress Bar ─── */

export function ScrollProgress() {
  const print = usePrintMode();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, springConfig.gentle);

  if (print) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-[100] origin-left print-hidden"
      style={{
        scaleX,
        background:
          "var(--brand-gradient, linear-gradient(90deg, var(--color-brand-1), var(--color-brand-2), var(--color-brand-3), var(--color-brand-4), var(--color-brand-5)))",
      }}
    />
  );
}

/* ─── Floating Particles ─── */

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

export function FloatingParticles({
  count = 40,
  className,
}: {
  count?: number;
  className?: string;
}) {
  const print = usePrintMode();
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (print) return;
    setParticles(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        duration: Math.random() * 20 + 15,
        delay: Math.random() * 10,
        opacity: Math.random() * 0.4 + 0.1,
      }))
    );
  }, [count, print]);

  if (print || particles.length === 0) return null;

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className || ""}`}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -30, 0, 20, 0],
            x: [0, 15, -10, 5, 0],
            opacity: [
              p.opacity,
              p.opacity * 1.5,
              p.opacity,
              p.opacity * 0.7,
              p.opacity,
            ],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Mouse Spotlight ─── */

export function MouseSpotlight({
  className,
  radius = 400,
  opacity = 0.06,
}: {
  className?: string;
  radius?: number;
  opacity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;

    const onMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.background = `radial-gradient(${radius}px circle at ${x}px ${y}px, rgba(125, 211, 252, ${opacity}), transparent 70%)`;
      el.style.opacity = "1";
    };

    const onLeave = () => {
      el.style.opacity = "0";
    };

    parent.addEventListener("mousemove", onMove);
    parent.addEventListener("mouseleave", onLeave);
    return () => {
      parent.removeEventListener("mousemove", onMove);
      parent.removeEventListener("mouseleave", onLeave);
    };
  }, [radius, opacity]);

  return (
    <div
      ref={ref}
      className={`pointer-events-none absolute inset-0 z-[1] transition-opacity duration-500 ${className || ""}`}
      style={{ opacity: 0 }}
    />
  );
}

/* ─── Magnetic Card (3D Tilt) ─── */

export function MagneticCard({
  children,
  className,
  intensity = 8,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      ref.current.style.transform = `perspective(1000px) rotateX(${-y * intensity}deg) rotateY(${x * intensity}deg) scale3d(1.02, 1.02, 1.02)`;
    },
    [intensity]
  );

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform =
      "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-transform duration-300 ease-out ${className || ""}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}

/* ─── Text Reveal by Word ─── */

export function TextRevealByWord({
  text,
  className,
  delay = 0,
  staggerDelay = 0.06,
}: {
  text: string;
  className?: string;
  delay?: number;
  staggerDelay?: number;
}) {
  const print = usePrintMode();
  if (print) return <span className={className}>{text}</span>;

  const words = text.split(" ");

  return (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.25em]"
          variants={{
            hidden: { opacity: 0, y: 12, filter: "blur(8px)" },
            visible: { opacity: 1, y: 0, filter: "blur(0px)" },
          }}
          transition={{
            duration: 0.4,
            delay: delay + i * staggerDelay,
            ease: ease.outQuart,
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}

/* ─── Gradient Divider ─── */

export function GradientDivider({ className }: { className?: string }) {
  const print = usePrintMode();
  if (print) return null;

  return (
    <div
      className={`relative overflow-hidden bg-bg-dark gradient-divider ${className || ""}`}
    >
      <motion.div
        className="h-px mx-auto shimmer-line"
        style={{ maxWidth: "70%" }}
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true, margin: "-20px" }}
        transition={{ duration: 1.5, ease: ease.outQuart }}
      />
    </div>
  );
}
