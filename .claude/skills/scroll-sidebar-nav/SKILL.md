---
name: scroll-sidebar-nav
description: Build the fixed chapter-dot sidebar navigation on a scrollytelling page — dots always visible, labels revealed on hover/active only so they never overlap page content on the right. Use when adding or fixing scroll-page sidebar nav. Copy from src/components/chapter-nav.tsx.
---

# Scroll-page sidebar nav

When building a fixed sidebar nav (chapter dots on a scrollytelling page), **never render labels as always-visible text** — they will overlap page content on the right side.

## Correct pattern: dots always, labels on hover only

```tsx
<nav className="fixed top-1/2 -translate-y-1/2 right-6 z-50 hidden lg:flex flex-col gap-1.5 items-end">
  {CHAPTERS.map((ch) => {
    const isActive = active === ch.id;
    const isHovered = hovered === ch.id;
    return (
      <button key={ch.id} onMouseEnter={() => setHovered(ch.id)} onMouseLeave={() => setHovered(null)}>
        {/* Label slides in from the right on hover/active — zero footprint otherwise */}
        <AnimatePresence>
          {(isActive || isHovered) && (
            <motion.span
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ duration: 0.15 }}
            >
              {ch.label}
            </motion.span>
          )}
        </AnimatePresence>
        {/* Dot grows on active/hover */}
        <motion.div animate={{ width: isActive ? 20 : isHovered ? 12 : 6 }} style={{ height: 6, borderRadius: 3 }} />
      </button>
    );
  })}
</nav>
```

- Resting state: dots only (~6px wide) — no overlap risk
- Active chapter: label slides in + dot expands to pill
- Hover: same reveal, dimmer color

Reference: `src/components/chapter-nav.tsx` — copy from there when adding a new scroll deck.
