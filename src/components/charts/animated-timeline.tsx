"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";

interface TimelineNode {
  title: string;
  description?: string;
  date?: string;
  icon?: React.ReactNode;
  color?: string;
  /** Extra content rendered below the description */
  content?: React.ReactNode;
}

interface AnimatedTimelineProps {
  nodes: TimelineNode[];
  /** Layout direction */
  direction?: "vertical" | "horizontal";
  /** Connector draws itself on scroll */
  animateConnector?: boolean;
  /** Default node accent color */
  color?: string;
  className?: string;
}

function VerticalTimeline({
  nodes,
  animateConnector,
  color,
}: {
  nodes: TimelineNode[];
  animateConnector: boolean;
  color: string;
}) {
  const print = usePrintMode();
  const DOT_COL = 24;
  const DOT_SIZE = 14;

  return (
    <div className="relative" style={{ paddingLeft: DOT_COL + DOT_SIZE + 16 }}>
      {/* Connector line — centered on the dot column */}
      <div
        className="absolute top-3 bottom-3"
        style={{ left: DOT_COL + DOT_SIZE / 2 - 1, width: 2 }}
      >
        {animateConnector && !print ? (
          <motion.div
            className="w-full h-full origin-top rounded-full"
            style={{ background: `linear-gradient(180deg, ${color}, ${color}40)` }}
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        ) : (
          <div
            className="w-full h-full rounded-full"
            style={{ background: `linear-gradient(180deg, ${color}, ${color}40)` }}
          />
        )}
      </div>

      {nodes.map((node, i) => {
        const nodeColor = node.color ?? color;
        return (
          <TimelineItem key={i} index={i} color={nodeColor} print={print}>
            {/* Dot — absolute, aligned to the dot column */}
            <div
              className="absolute rounded-full border-2 z-10"
              style={{
                left: -(DOT_SIZE + 16),
                top: 4,
                width: DOT_SIZE,
                height: DOT_SIZE,
                borderColor: nodeColor,
                background: `${nodeColor}30`,
                boxShadow: `0 0 10px ${nodeColor}50`,
              }}
            />

            {/* Content */}
            <div className="pb-10 last:pb-0">
              {node.date && (
                <span
                  className="text-sm font-mono font-semibold mb-1.5 block"
                  style={{ color: nodeColor }}
                >
                  {node.date}
                </span>
              )}
              <div className="flex items-start gap-2.5">
                {node.icon && (
                  <span style={{ color: nodeColor }} className="shrink-0 mt-0.5">
                    {node.icon}
                  </span>
                )}
                <h4 className="text-lg font-bold text-white leading-tight">
                  {node.title}
                </h4>
              </div>
              {node.description && (
                <p className="text-sm text-white/60 mt-2 leading-relaxed">
                  {node.description}
                </p>
              )}
              {node.content && <div className="mt-3">{node.content}</div>}
            </div>
          </TimelineItem>
        );
      })}
    </div>
  );
}

function HorizontalTimeline({
  nodes,
  animateConnector,
  color,
}: {
  nodes: TimelineNode[];
  animateConnector: boolean;
  color: string;
}) {
  const print = usePrintMode();

  return (
    <div className="relative pt-8">
      {/* Connector line */}
      <div className="absolute top-3 left-3 right-3 h-px">
        {animateConnector && !print ? (
          <motion.div
            className="w-full h-full origin-left"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}40)` }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}40)` }}
          />
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {nodes.map((node, i) => {
          const nodeColor = node.color ?? color;
          return (
            <TimelineItem key={i} index={i} color={nodeColor} print={print}>
              <div className="relative min-w-[180px] max-w-[240px]">
                {/* Dot */}
                <div
                  className="absolute -top-[22px] left-0 w-[10px] h-[10px] rounded-full border-2 z-10"
                  style={{
                    borderColor: nodeColor,
                    background: `${nodeColor}30`,
                    boxShadow: `0 0 8px ${nodeColor}40`,
                  }}
                />
                {node.date && (
                  <span
                    className="text-xs font-mono font-medium mb-1 block"
                    style={{ color: nodeColor }}
                  >
                    {node.date}
                  </span>
                )}
                <h4 className="text-sm font-semibold text-foreground leading-tight">
                  {node.title}
                </h4>
                {node.description && (
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    {node.description}
                  </p>
                )}
                {node.content && <div className="mt-2">{node.content}</div>}
              </div>
            </TimelineItem>
          );
        })}
      </div>
    </div>
  );
}

function TimelineItem({
  children,
  index,
  color,
  print,
}: {
  children: React.ReactNode;
  index: number;
  color: string;
  print: boolean;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const show = print || inView;

  if (print) {
    return <div className="relative">{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className="relative"
      initial={{ opacity: 0, x: -16 }}
      animate={show ? { opacity: 1, x: 0 } : {}}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      style={
        !show ? { "--node-color": color } as React.CSSProperties : undefined
      }
    >
      {children}
    </motion.div>
  );
}

export function AnimatedTimeline({
  nodes,
  direction = "vertical",
  animateConnector = true,
  color = "#818CF8",
  className,
}: AnimatedTimelineProps) {
  if (direction === "horizontal") {
    return (
      <div className={cn("w-full", className)}>
        <HorizontalTimeline
          nodes={nodes}
          animateConnector={animateConnector}
          color={color}
        />
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <VerticalTimeline
        nodes={nodes}
        animateConnector={animateConnector}
        color={color}
      />
    </div>
  );
}
