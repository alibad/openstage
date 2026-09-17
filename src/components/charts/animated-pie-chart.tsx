"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { PieLabelRenderProps } from "recharts";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";

interface PieDatum {
  label: string;
  value: number;
  color?: string;
}

interface AnimatedPieChartProps {
  data: PieDatum[];
  /** Chart title */
  title?: string;
  /** Donut variant (inner radius ratio 0-1) */
  donut?: number;
  /** Show percentage labels */
  showLabels?: boolean;
  /** Value suffix */
  suffix?: string;
  /** Height in px */
  height?: number;
  className?: string;
}

const DEFAULT_COLORS = [
  "#7DD3FC",
  "#818CF8",
  "#A78BFA",
  "#E879A8",
  "#F472B6",
  "#34D399",
  "#FBBF24",
  "#FB923C",
];

export function AnimatedPieChart({
  data,
  title,
  donut = 0,
  showLabels = true,
  suffix = "",
  height = 300,
  className,
}: AnimatedPieChartProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const print = usePrintMode();
  const show = print || inView;

  const chartData = data.map((d, i) => ({
    name: d.label,
    value: d.value,
    fill: d.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }));

  const total = data.reduce((sum, d) => sum + d.value, 0);

  const outerRadius = Math.min(height * 0.38, 130);
  const innerRadius = donut > 0 ? outerRadius * donut : 0;

  return (
    <motion.div
      ref={ref}
      className={cn("w-full", className)}
      initial={print ? false : { opacity: 0, scale: 0.9 }}
      animate={show ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {title && (
        <p className="text-sm font-medium text-muted mb-3 text-center">
          {title}
        </p>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            paddingAngle={2}
            dataKey="value"
            animationBegin={0}
            animationDuration={show ? 1200 : 0}
            animationEasing="ease-out"
            label={
              showLabels
                ? (props: PieLabelRenderProps) => {
                    const { name, value, x, y, textAnchor } = props;
                    const numValue = Number(value) || 0;
                    const pct = ((numValue / total) * 100).toFixed(0);
                    const numX = Number(x) || 0;
                    const numY = Number(y) || 0;
                    const anchor = textAnchor as "start" | "middle" | "end";
                    const dx = anchor === "start" ? 6 : -6;
                    return (
                      <text x={numX + dx} y={numY} textAnchor={anchor} fill="#e4e4ef" fontSize={13} fontWeight={500}>
                        {name} {pct}{suffix}
                      </text>
                    );
                  }
                : false
            }
            labelLine={showLabels ? { stroke: "rgba(255,255,255,0.25)", strokeWidth: 1 } : false}
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#1a1a2e",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "8px",
              color: "#e4e4ef",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#e4e4ef" }}
            itemStyle={{ color: "#e4e4ef" }}
            formatter={(value, name) => {
              return [`${value}${suffix}`, name];
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
