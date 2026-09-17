"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";

interface LineSeries {
  key: string;
  label?: string;
  color?: string;
}

interface AnimatedLineChartProps {
  data: Record<string, string | number>[];
  /** X-axis data key */
  xKey: string;
  /** Line series definitions */
  series: LineSeries[];
  /** Chart title */
  title?: string;
  /** Value suffix */
  suffix?: string;
  /** Fill area under line */
  area?: boolean;
  /** Show grid */
  grid?: boolean;
  /** Smooth curves */
  smooth?: boolean;
  /** Show dots on data points */
  dots?: boolean;
  /** Height in px */
  height?: number;
  className?: string;
}

const DEFAULT_COLORS = ["#7DD3FC", "#818CF8", "#A78BFA", "#E879A8", "#F472B6"];

export function AnimatedLineChart({
  data,
  xKey,
  series,
  title,
  suffix = "",
  area = false,
  grid = true,
  smooth = true,
  dots = false,
  height = 300,
  className,
}: AnimatedLineChartProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const print = usePrintMode();
  const show = print || inView;

  const curveType = smooth ? "monotone" : "linear";

  const Chart = area ? AreaChart : LineChart;

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
        <Chart
          data={data}
          margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
        >
          {grid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              opacity={0.4}
            />
          )}
          <XAxis
            dataKey={xKey}
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
              const s = series.find((se) => se.key === name);
              return [`${value}${suffix}`, s?.label ?? name];
            }}
          />
          {series.map((s, i) => {
            const c = s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
            if (area) {
              return (
                <Area
                  key={s.key}
                  type={curveType}
                  dataKey={s.key}
                  stroke={c}
                  fill={c}
                  fillOpacity={0.15}
                  strokeWidth={2}
                  dot={dots}
                  animationBegin={i * 200}
                  animationDuration={show ? 1500 : 0}
                  animationEasing="ease-out"
                />
              );
            }
            return (
              <Line
                key={s.key}
                type={curveType}
                dataKey={s.key}
                stroke={c}
                strokeWidth={2}
                dot={dots}
                animationBegin={i * 200}
                animationDuration={show ? 1500 : 0}
                animationEasing="ease-out"
              />
            );
          })}
        </Chart>
      </ResponsiveContainer>
    </motion.div>
  );
}
