"use client";

import { useActiveSection } from "@/lib/use-active-section";

export interface Chapter {
  /** DOM id of the section to observe — must match the rendered `id` */
  id: string;
  /** Display label revealed on hover and used as the link `title` */
  label: string;
  /**
   * Whether the section background is dark. Toggles between `toneOnDark` and
   * `toneOnLight`. Defaults to `true` if omitted.
   */
  dark?: boolean;
}

export interface ChapterNavTone {
  /** Active dot background — Tailwind class, e.g. `"bg-[#7DD3FC]"`. */
  activeDot: string;
  /** Active label text color — Tailwind class. */
  activeText: string;
  /** Optional glow shadow for the active dot — Tailwind class. */
  activeGlow?: string;
  /** Inactive dot background — Tailwind class. */
  inactiveDot: string;
  /** Inactive label hover color — Tailwind class. */
  inactiveTextHover: string;
}

const DEFAULT_TONE_ON_DARK: ChapterNavTone = {
  activeDot: "bg-[#7DD3FC]",
  activeText: "text-[#7DD3FC]",
  activeGlow: "shadow-[0_0_10px_rgba(125,211,252,0.5)]",
  inactiveDot: "bg-white/25 group-hover:bg-white/50",
  inactiveTextHover: "group-hover:text-white/60",
};

const DEFAULT_TONE_ON_LIGHT: ChapterNavTone = {
  activeDot: "bg-[#A78BFA]",
  activeText: "text-[#A78BFA]",
  activeGlow: "shadow-[0_0_10px_rgba(167,139,250,0.4)]",
  inactiveDot: "bg-black/20 group-hover:bg-black/40",
  inactiveTextHover: "group-hover:text-black/60",
};

export interface ChapterNavProps<C extends Chapter = Chapter> {
  /** Chapters in source order; the right-side dots render in this order. */
  chapters: readonly C[];
  /** IntersectionObserver rootMargin (default `"-30% 0px -60% 0px"`). */
  rootMargin?: string;
  /** Tone applied when the active chapter has `dark !== false`. */
  toneOnDark?: ChapterNavTone;
  /** Tone applied when the active chapter has `dark === false`. */
  toneOnLight?: ChapterNavTone;
  /**
   * Extra utility classes for the label `<span>` — typically used to set
   * typography (`"uppercase tracking-[0.2em]"`, `"editorial-italic"`, etc.).
   * Default: `"uppercase tracking-[0.2em]"`.
   */
  labelClassName?: string;
  /**
   * Optional accessor for the link `title` attribute. Defaults to the
   * chapter's `label` — override to surface extra metadata (e.g. speaker
   * name) without touching the visible label.
   */
  getTitle?: (chapter: C) => string;
}

/**
 * ChapterNav — fixed right-side dot navigation that highlights the
 * **deepest-visible** section as the user scrolls. Uses the shared
 * `useActiveSection` hook to track viewport visibility, so the active
 * indicator advances naturally instead of getting stuck on an earlier
 * section that still overlaps the activation band.
 *
 * Defaults to a cyan / purple palette (cyan over dark backgrounds,
 * purple over light). Pass `toneOnDark` / `toneOnLight` to rebrand. Each
 * chapter can opt into the light tone via `dark: false`.
 *
 * Hidden in print mode via `print-hidden`. Hidden below `lg` breakpoint to
 * avoid crowding mobile layouts.
 *
 * @example Minimal usage
 * <ChapterNav
 *   chapters={[
 *     { id: "hero", label: "Open", dark: true },
 *     { id: "next", label: "Next", dark: true },
 *   ]}
 * />
 *
 * @example Custom brand colors
 * <ChapterNav
 *   chapters={CHAPTERS}
 *   toneOnDark={{
 *     activeDot: "bg-[#C9A961]",
 *     activeText: "text-[#C9A961]",
 *     inactiveDot: "bg-white/25 group-hover:bg-white/50",
 *     inactiveTextHover: "group-hover:text-white/60",
 *   }}
 * />
 */
export function ChapterNav<C extends Chapter>({
  chapters,
  rootMargin,
  toneOnDark = DEFAULT_TONE_ON_DARK,
  toneOnLight = DEFAULT_TONE_ON_LIGHT,
  labelClassName = "uppercase tracking-[0.2em]",
  getTitle,
}: ChapterNavProps<C>) {
  const ids = chapters.map((c) => c.id);
  const active = useActiveSection(ids, { rootMargin });
  const onDark = chapters.find((c) => c.id === active)?.dark ?? true;
  const tone = onDark ? toneOnDark : toneOnLight;

  return (
    <nav className="fixed top-1/2 -translate-y-1/2 right-6 z-50 hidden lg:flex flex-col gap-2.5 print-hidden transition-colors duration-500">
      {chapters.map((ch) => {
        const isActive = active === ch.id;
        return (
          <a
            key={ch.id}
            href={`#${ch.id}`}
            className="group flex items-center gap-3 justify-end"
            title={getTitle ? getTitle(ch) : ch.label}
          >
            <span
              className={`text-[10px] font-medium ${labelClassName} transition-all duration-500 ${
                isActive
                  ? `${tone.activeText} opacity-100 translate-x-0`
                  : `${onDark ? "text-white/0" : "text-black/0"} ${tone.inactiveTextHover} translate-x-2 group-hover:translate-x-0`
              }`}
            >
              {ch.label}
            </span>
            <span
              className={`rounded-full transition-all duration-500 ${
                isActive
                  ? `w-2.5 h-2.5 ${tone.activeDot} ${tone.activeGlow ?? ""}`
                  : `w-1.5 h-1.5 ${tone.inactiveDot}`
              }`}
            />
          </a>
        );
      })}
    </nav>
  );
}
