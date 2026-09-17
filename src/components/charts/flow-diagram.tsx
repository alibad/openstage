"use client";

import { useRef, useMemo } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";

interface FlowNode {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  color?: string;
}

interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}

interface FlowDiagramProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  /** Layout direction */
  direction?: "horizontal" | "vertical";
  /** Default node color */
  color?: string;
  /** Stagger delay between node reveals */
  stagger?: number;
  className?: string;
}

function ArrowSvg({ direction }: { direction: "right" | "down" }) {
  if (direction === "down") {
    return (
      <svg width="20" height="32" viewBox="0 0 20 32" className="mx-auto">
        <line
          x1="10"
          y1="0"
          x2="10"
          y2="24"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="3 2"
        />
        <polygon points="5,22 10,30 15,22" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg width="48" height="20" viewBox="0 0 48 20" className="my-auto">
      <line
        x1="0"
        y1="10"
        x2="40"
        y2="10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="3 2"
      />
      <polygon points="38,5 46,10 38,15" fill="currentColor" />
    </svg>
  );
}

export function FlowDiagram({
  nodes,
  edges,
  direction = "horizontal",
  color = "#818CF8",
  stagger = 0.15,
  className,
}: FlowDiagramProps) {
  const print = usePrintMode();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const show = print || inView;

  const orderedNodes = useMemo(() => {
    if (edges.length === 0) return nodes;

    const visited = new Set<string>();
    const result: FlowNode[] = [];
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const outEdges = new Map<string, string>();
    const inEdges = new Set<string>();

    for (const e of edges) {
      outEdges.set(e.from, e.to);
      inEdges.add(e.to);
    }

    // Find root (no incoming edges)
    let current = nodes.find((n) => !inEdges.has(n.id))?.id ?? nodes[0]?.id;

    while (current && !visited.has(current)) {
      visited.add(current);
      const node = nodeMap.get(current);
      if (node) result.push(node);
      current = outEdges.get(current) ?? "";
    }

    // Add any unvisited nodes
    for (const n of nodes) {
      if (!visited.has(n.id)) result.push(n);
    }

    return result;
  }, [nodes, edges]);

  const edgeLabelMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of edges) {
      if (e.label) m.set(`${e.from}->${e.to}`, e.label);
    }
    return m;
  }, [edges]);

  const isHorizontal = direction === "horizontal";

  return (
    <div
      ref={ref}
      className={cn(
        "w-full",
        isHorizontal
          ? "flex flex-wrap items-stretch justify-center gap-0"
          : "flex flex-col items-center gap-0",
        className,
      )}
    >
      {orderedNodes.map((node, i) => {
        const nodeColor = node.color ?? color;
        const prevNode = orderedNodes[i - 1];
        const edgeLabel = prevNode
          ? edgeLabelMap.get(`${prevNode.id}->${node.id}`)
          : undefined;

        return (
          <div
            key={node.id}
            className={cn(
              "flex items-center",
              isHorizontal ? "flex-row" : "flex-col",
            )}
          >
            {/* Arrow between nodes */}
            {i > 0 && (
              <div className={cn(
                "flex items-center text-muted/40 shrink-0",
                isHorizontal ? "flex-col px-1" : "flex-row py-1",
              )}>
                <ArrowSvg direction={isHorizontal ? "right" : "down"} />
                {edgeLabel && (
                  <span className="text-[11px] text-muted/60 font-medium mt-1">
                    {edgeLabel}
                  </span>
                )}
              </div>
            )}

            {/* Node */}
            <motion.div
              className={cn(
                "relative flex flex-col items-center text-center px-4 py-5 rounded-xl border backdrop-blur-sm",
                isHorizontal ? "w-[170px]" : "w-[200px]",
              )}
              style={{
                borderColor: `${nodeColor}30`,
                background: `${nodeColor}08`,
              }}
              initial={print ? false : { opacity: 0, y: 12, scale: 0.95 }}
              animate={show ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{
                duration: 0.5,
                delay: i * stagger,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              {node.icon && (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                  style={{ background: `${nodeColor}15`, color: nodeColor }}
                >
                  {node.icon}
                </div>
              )}
              <h4
                className="text-sm font-semibold leading-tight"
                style={{ color: nodeColor }}
              >
                {node.label}
              </h4>
              {node.description && (
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  {node.description}
                </p>
              )}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
