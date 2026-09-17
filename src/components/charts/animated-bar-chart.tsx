"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";

interface BarDatum {
  label: string;
  value: number;
  color?: string;
  highlight?: boolean;
}

interface AnimatedBarChartProps {
  data: BarDatum[];
  /** Chart title */
  title?: string;
  /** Value suffix (e.g. "%", "M") */
  suffix?: string;
  /** Horizontal layout */
  horizontal?: boolean;
  /** Show grid lines */
  grid?: boolean;
  /** Default bar color */
  color?: string;
  /** Highlight bar color */
  highlightColor?: string;
  /** Height in px */
  height?: number;
  className?: string;
}

export function AnimatedBarChart({
  data,
  title,
  suffix = "",
  horizontal = false,
  grid = true,
  color = "#818CF8",
  highlightColor = "#7DD3FC",
  height = 300,
  className,
}: AnimatedBarChartProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const print = usePrintMode();
  const show = print || inView;

  const chartData = data.map((d) => ({
    name: d.label,
    value: d.value,
    fill: d.highlight ? (d.color ?? highlightColor) : (d.color ?? color),
  }));

  return (
    <motion.div
      ref={ref}
      className={cn("w-full", className)}
      initial={print ? false : { opacity: 0, y: 20 }}
      animate={show ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {title && (
        <p className="text-sm font-medium text-muted mb-3">{title}</p>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
        >
          {grid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              opacity={0.4}
            />
          )}
          {horizontal ? (
            <>
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <XAxis
                type="number"
                tick={{ fill: "var(--color-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}${suffix}`}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="name"
                tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--color-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}${suffix}`}
              />
            </>
          )}
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
            formatter={(value) => [`${value}${suffix}`, "Value"]}
          />
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            animationBegin={0}
            animationDuration={show ? 1200 : 0}
            animationEasing="ease-out"
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
