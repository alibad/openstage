"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ScrollText,
  Presentation,
  Clock,
  User,
  Building2,
  Search,
  List,
  LayoutGrid,
  Group,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { PresentationMeta } from "@/content/registry";

type Filter = "all" | "scroll" | "slides";
type ViewMode = "list" | "grid";
type GroupBy = "none" | "type" | "customer" | "author" | "date";
type SortKey = "title" | "author" | "date" | "type" | "customer";
type SortDir = "asc" | "desc";

/** Customer group → hub page. Add new mappings here as hubs are built. */
const GROUP_HUB_HREF: Record<string, string> = {
  Upskilling: "/upskilling",
};

const DATE_ORDER: Record<string, number> = {};
function parseDateRank(d: string): number {
  if (DATE_ORDER[d] !== undefined) return DATE_ORDER[d];
  const months = ["january","february","march","april","may","june","july","august","september","october","november","december"];
  const parts = d.toLowerCase().trim().split(/\s+/);
  let year = 0, month = 0;
  for (const p of parts) {
    const n = parseInt(p, 10);
    if (!isNaN(n) && n > 1900) { year = n; continue; }
    const mi = months.findIndex(m => m.startsWith(p));
    if (mi >= 0) month = mi + 1;
  }
  const rank = year * 100 + month;
  DATE_ORDER[d] = rank;
  return rank;
}

interface GalleryFiltersProps {
  presentations: PresentationMeta[];
  scrollCount: number;
  slideCount: number;
}

export function GalleryFilters({
  presentations,
  scrollCount,
  slideCount,
}: GalleryFiltersProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [groupBy, setGroupBy] = useState<GroupBy>("customer");
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const toggleSort = useCallback((key: SortKey) => {
    setSortKey(prev => {
      if (prev === key) {
        setSortDir(d => d === "asc" ? "desc" : "asc");
        return key;
      }
      setSortDir("asc");
      return key;
    });
  }, []);

  const filtered = useMemo(() => {
    let result = presentations;

    if (filter !== "all") {
      result = result.filter((p) => p.type === filter);
    }

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.subtitle?.toLowerCase().includes(q) ?? false) ||
          p.description.toLowerCase().includes(q) ||
          (p.customer?.toLowerCase().includes(q) ?? false) ||
          p.author.toLowerCase().includes(q),
      );
    }

    return result;
  }, [presentations, filter, query]);

  const sorted = useMemo(() => {
    const items = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    items.sort((a, b) => {
      switch (sortKey) {
        case "title": return dir * a.title.localeCompare(b.title);
        case "author": return dir * a.author.localeCompare(b.author);
        case "customer": return dir * (a.customer || "").localeCompare(b.customer || "");
        case "type": return dir * a.type.localeCompare(b.type);
        case "date": return dir * (parseDateRank(a.date) - parseDateRank(b.date));
        default: return 0;
      }
    });
    return items;
  }, [filtered, sortKey, sortDir]);

  const grouped = useMemo(() => {
    if (groupBy === "none") return [{ key: "", items: sorted }];

    const map = new Map<string, PresentationMeta[]>();
    sorted.forEach((p) => {
      let key: string;
      switch (groupBy) {
        case "type":
          key = p.type === "scroll" ? "Scroll" : "Slides";
          break;
        case "customer":
          key = p.customer || "No Customer";
          break;
        case "author":
          key = p.author;
          break;
        case "date":
          key = p.date;
          break;
        default:
          key = "";
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, items]) => ({ key, items }));
  }, [sorted, groupBy]);

  return (
    <>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search presentations..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-brand-2/40 focus:ring-1 focus:ring-brand-2/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface border border-border">
          <FilterTab active={filter === "all"} onClick={() => setFilter("all")} label="All" count={presentations.length} />
          <FilterTab active={filter === "scroll"} onClick={() => setFilter("scroll")} label="Scroll" count={scrollCount} icon={<ScrollText className="w-3 h-3" />} />
          <FilterTab active={filter === "slides"} onClick={() => setFilter("slides")} label="Slides" count={slideCount} icon={<Presentation className="w-3 h-3" />} />
        </div>

        {/* Group by */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-border">
          <Group className="w-3 h-3 text-muted ml-2" />
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="text-xs font-medium bg-transparent text-foreground border-none outline-none cursor-pointer pr-2 py-1"
          >
            <option value="none">No grouping</option>
            <option value="type">By type</option>
            <option value="customer">By customer</option>
            <option value="author">By author</option>
            <option value="date">By date</option>
          </select>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-0.5 p-1 rounded-xl bg-surface border border-border">
          <button
            onClick={() => setView("list")}
            className={cn(
              "p-1.5 rounded-lg transition-all duration-200",
              view === "list" ? "bg-bg-light text-foreground shadow-sm" : "text-muted hover:text-foreground",
            )}
            aria-label="List view"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setView("grid")}
            className={cn(
              "p-1.5 rounded-lg transition-all duration-200",
              view === "grid" ? "bg-bg-light text-foreground shadow-sm" : "text-muted hover:text-foreground",
            )}
            aria-label="Grid view"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {grouped.map((group) => {
          const hubHref = groupBy === "customer" ? GROUP_HUB_HREF[group.key] : undefined;
          return (
          <div key={group.key || "all"}>
            {group.key && (
              <div className="flex items-center gap-3 mb-4">
                {hubHref ? (
                  <Link
                    href={hubHref}
                    className="group/hub flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-brand-2/40 hover:bg-brand-2/5 transition-colors"
                  >
                    <span className="text-[11px] font-semibold text-foreground group-hover/hub:text-brand-2 transition-colors">{group.key}</span>
                    <span className="text-[10px] tabular-nums text-muted bg-border/60 px-1.5 py-0.5 rounded-md">{group.items.length}</span>
                    <ChevronRight className="w-3 h-3 text-muted/60 group-hover/hub:text-brand-2 group-hover/hub:translate-x-0.5 transition-all" />
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border">
                    <span className="text-[11px] font-semibold text-foreground">{group.key}</span>
                    <span className="text-[10px] tabular-nums text-muted bg-border/60 px-1.5 py-0.5 rounded-md">{group.items.length}</span>
                  </div>
                )}
                <div className="flex-1 h-px bg-border/60" />
              </div>
            )}

            {view === "list" ? (
              <PresentationTable
                items={group.items}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {group.items.map((p) => (
                  <PresentationTile key={p.slug} presentation={p} />
                ))}
              </div>
            )}
          </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted py-12">
          {query.trim() ? `No presentations match "${query}".` : "No presentations match this filter."}
        </p>
      )}
    </>
  );
}

function FilterTab({ active, onClick, label, count, icon }: {
  active: boolean; onClick: () => void; label: string; count: number; icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
        active ? "bg-bg-light text-foreground shadow-sm" : "text-muted hover:text-foreground",
      )}
    >
      {icon}
      {label}
      <span className={cn("tabular-nums ml-0.5", active ? "text-brand-2" : "text-muted/60")}>{count}</span>
    </button>
  );
}

/* ─── List View: proper table with sortable headers ─── */

function SortIcon({ column, activeKey, activeDir }: { column: SortKey; activeKey: SortKey; activeDir: SortDir }) {
  if (column !== activeKey) return <ArrowUpDown className="w-3 h-3 text-muted/40" />;
  return activeDir === "asc"
    ? <ArrowUp className="w-3 h-3 text-brand-2" />
    : <ArrowDown className="w-3 h-3 text-brand-2" />;
}

function PresentationTable({
  items,
  sortKey,
  sortDir,
  onSort,
}: {
  items: PresentationMeta[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const thClass = "px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap";

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <table className="w-full table-fixed">
        <colgroup>
          <col className="w-[44px]" />
          <col />
          <col className="w-[140px] hidden lg:table-column" />
          <col className="w-[130px] hidden md:table-column" />
          <col className="w-[120px] hidden md:table-column" />
          <col className="w-[100px] hidden sm:table-column" />
          <col className="w-[36px]" />
        </colgroup>
        <thead>
          <tr className="border-b border-border bg-surface">
            <th className="w-[44px]" />
            <th className={cn(thClass, "text-left")} onClick={() => onSort("title")}>
              <span className="inline-flex items-center gap-1.5">
                Title
                <SortIcon column="title" activeKey={sortKey} activeDir={sortDir} />
              </span>
            </th>
            <th className={cn(thClass, "text-left hidden lg:table-cell")} onClick={() => onSort("customer")}>
              <span className="inline-flex items-center gap-1.5">
                Customer
                <SortIcon column="customer" activeKey={sortKey} activeDir={sortDir} />
              </span>
            </th>
            <th className={cn(thClass, "text-left hidden md:table-cell")} onClick={() => onSort("author")}>
              <span className="inline-flex items-center gap-1.5">
                Author
                <SortIcon column="author" activeKey={sortKey} activeDir={sortDir} />
              </span>
            </th>
            <th className={cn(thClass, "text-left hidden md:table-cell")} onClick={() => onSort("date")}>
              <span className="inline-flex items-center gap-1.5">
                Date
                <SortIcon column="date" activeKey={sortKey} activeDir={sortDir} />
              </span>
            </th>
            <th className={cn(thClass, "text-left hidden sm:table-cell")} onClick={() => onSort("type")}>
              <span className="inline-flex items-center gap-1.5">
                Type
                <SortIcon column="type" activeKey={sortKey} activeDir={sortDir} />
              </span>
            </th>
            <th className="w-[36px]" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((p) => (
            <tr key={p.slug} className="group hover:bg-bg-light/50 transition-colors">
              <td className="px-3 py-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  p.type === "scroll" ? "bg-brand-3/10 text-brand-3" : "bg-brand-2/10 text-brand-2",
                )}>
                  {p.type === "scroll" ? <ScrollText className="w-3.5 h-3.5" /> : <Presentation className="w-3.5 h-3.5" />}
                </div>
              </td>
              <td className="px-4 py-3 min-w-0">
                <Link href={`/${p.slug}`} className="block min-w-0">
                  <h3 className="font-semibold text-sm text-foreground group-hover:text-brand-2 transition-colors truncate">
                    {p.title}
                  </h3>
                  {p.subtitle && (
                    <p className="text-xs text-muted truncate mt-0.5">{p.subtitle}</p>
                  )}
                </Link>
              </td>
              <td className="px-4 py-3 hidden lg:table-cell">
                {p.customer ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted truncate">
                    <Building2 className="w-3 h-3 shrink-0 text-muted/60" />
                    <span className="truncate">{p.customer}</span>
                  </span>
                ) : (
                  <span className="text-xs text-muted/30">&mdash;</span>
                )}
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                  <User className="w-3 h-3 shrink-0 text-muted/60" />
                  <span className="truncate">{p.author}</span>
                </span>
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted tabular-nums">
                  <Clock className="w-3 h-3 shrink-0 text-muted/60" />
                  {p.date}
                </span>
              </td>
              <td className="px-4 py-3 hidden sm:table-cell">
                <span className={cn(
                  "inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                  p.type === "scroll"
                    ? "text-brand-3 bg-brand-3/10"
                    : "text-brand-2 bg-brand-2/10",
                )}>
                  {p.type}{p.slideCount ? ` · ${p.slideCount}` : ""}
                </span>
              </td>
              <td className="px-2 py-3">
                <Link href={`/${p.slug}`} tabIndex={-1} aria-hidden>
                  <ChevronRight className="w-4 h-4 text-muted/30 group-hover:text-brand-2 group-hover:translate-x-0.5 transition-all" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Grid View: cards with dates ─── */

function PresentationTile({ presentation: p }: { presentation: PresentationMeta }) {
  const gradients: Record<string, string> = {
    scroll: "from-purple-500/10 to-pink-500/10",
    slides: "from-blue-500/10 to-cyan-500/10",
  };

  return (
    <Link href={`/${p.slug}`} className="group block">
      <div className="rounded-2xl border border-border bg-surface hover:border-brand-2/30 hover:shadow-md hover:shadow-brand-2/5 transition-all duration-300 overflow-hidden flex flex-col h-full">
        <div className={cn("h-20 bg-gradient-to-br flex items-end justify-between p-4", gradients[p.type] || gradients.scroll)}>
          <TypeBadge type={p.type} slideCount={p.slideCount} />
          <span className="text-[10px] text-muted/70 tabular-nums">{p.date}</span>
        </div>

        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-bold text-foreground group-hover:text-brand-2 transition-colors mb-1 line-clamp-2 leading-snug">
            {p.title}
          </h3>

          {p.subtitle && (
            <p className="text-muted text-xs leading-relaxed mb-2 line-clamp-2">
              {p.subtitle}
            </p>
          )}

          <p className="text-muted/50 text-[11px] leading-relaxed line-clamp-2 mb-3">
            {p.description}
          </p>

          <div className="mt-auto flex items-center justify-between text-[10px] text-muted pt-3 border-t border-border/50">
            <span className="flex items-center gap-1">
              <User className="w-2.5 h-2.5" />
              {p.author}
            </span>
            {p.customer ? (
              <span className="flex items-center gap-1 truncate max-w-[50%]">
                <Building2 className="w-2.5 h-2.5 shrink-0" />
                {p.customer}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {p.date}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function TypeBadge({ type, slideCount }: { type: string; slideCount?: number }) {
  if (type === "scroll") {
    return (
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-3 bg-accent-light border border-brand-3/15 px-2.5 py-1 rounded-full">
        <ScrollText className="w-3 h-3" />
        Scroll
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-2 bg-brand-2/10 border border-brand-2/15 px-2.5 py-1 rounded-full">
      <Presentation className="w-3 h-3" />
      Slides
      {slideCount && <span className="text-brand-2/60">· {slideCount}</span>}
    </span>
  );
}
