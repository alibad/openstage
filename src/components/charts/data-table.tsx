"use client";

import { useRef, useState, useMemo } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/cn";
import { usePrintMode } from "@/lib/print-mode";
import { ArrowUp, ArrowDown } from "lucide-react";

type CellValue = string | number | React.ReactNode;

interface Column {
  key: string;
  label: string;
  /** Alignment */
  align?: "left" | "center" | "right";
  /** Make this column sortable */
  sortable?: boolean;
  /** Custom cell renderer */
  render?: (value: CellValue, row: Record<string, CellValue>) => React.ReactNode;
  /** Minimum width */
  minWidth?: string;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, CellValue>[];
  /** Highlight a row when this function returns true */
  highlightRow?: (row: Record<string, CellValue>, index: number) => boolean;
  /** Stagger row reveal on scroll */
  staggerRows?: boolean;
  /** Zebra striping */
  striped?: boolean;
  /** Compact row height */
  compact?: boolean;
  /** Accent color for highlighted rows */
  highlightColor?: string;
  className?: string;
}

export function DataTable({
  columns,
  data,
  highlightRow,
  staggerRows = true,
  striped = false,
  compact = false,
  highlightColor = "#818CF8",
  className,
}: DataTableProps) {
  const print = usePrintMode();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const show = print || inView;

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal ?? "");
      const bStr = String(bVal ?? "");
      return sortDir === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [data, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <motion.div
      ref={ref}
      className={cn("w-full overflow-x-auto", className)}
      initial={print ? false : { opacity: 0, y: 12 }}
      animate={show ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4 }}
    >
      <table className="w-full text-sm border-collapse table-fixed">
        <thead>
          <tr className="border-b border-white/15">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "text-xs font-semibold text-white/70 uppercase tracking-wider pb-3 px-3",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center",
                  col.sortable && "cursor-pointer select-none hover:text-foreground transition-colors",
                )}
                style={{ minWidth: col.minWidth, width: col.minWidth }}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    sortDir === "asc"
                      ? <ArrowUp className="w-3 h-3" />
                      : <ArrowDown className="w-3 h-3" />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIdx) => {
            const isHighlighted = highlightRow?.(row, rowIdx) ?? false;

            const cellClasses = (col: Column) =>
              cn(
                compact ? "py-2.5 px-3" : "py-3.5 px-3",
                "truncate",
                col.align === "right" && "text-right",
                col.align === "center" && "text-center",
                isHighlighted ? "text-white font-medium" : "text-white/80",
              );

            const rowContent = (
              <tr
                className={cn(
                  "border-b border-white/10 transition-colors hover:bg-white/[0.05]",
                  striped && rowIdx % 2 === 1 && "bg-white/[0.03]",
                  isHighlighted && "bg-opacity-5",
                )}
                style={
                  isHighlighted
                    ? { backgroundColor: `${highlightColor}18` }
                    : undefined
                }
              >
                {columns.map((col) => (
                  <td key={col.key} className={cellClasses(col)}>
                    {col.render
                      ? col.render(row[col.key], row)
                      : row[col.key]}
                  </td>
                ))}
              </tr>
            );

            if (!staggerRows || print) return <>{rowContent}</>;

            return (
              <motion.tr
                key={rowIdx}
                className={cn(
                  "border-b border-white/10 transition-colors hover:bg-white/[0.05]",
                  striped && rowIdx % 2 === 1 && "bg-white/[0.03]",
                )}
                style={
                  isHighlighted
                    ? { backgroundColor: `${highlightColor}18` }
                    : undefined
                }
                initial={{ opacity: 0, x: -8 }}
                animate={show ? { opacity: 1, x: 0 } : {}}
                transition={{
                  duration: 0.3,
                  delay: rowIdx * 0.05,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cellClasses(col)}>
                    {col.render
                      ? col.render(row[col.key], row)
                      : row[col.key]}
                  </td>
                ))}
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </motion.div>
  );
}
