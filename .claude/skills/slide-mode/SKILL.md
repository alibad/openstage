---
name: slide-mode
description: Fit content within a fixed-height slide for slide-mode decks (type "slides") — the per-slide content budget (max items/callouts), the cut-don't-shrink rule, and the never-stretch-cards-with-flex-1 pattern. Use when building or fixing slide-mode presentations. (For scroll decks use new-deck.)
---

# Slide content budget (slide-mode only)

Slides render in a **fixed-height container**. Content that exceeds the visible area is clipped — there is no scroll. Every slide must fit within its bounds.

**Hard limits per slide:**
- Max **4 list/numbered items** — never 5+
- Max **1 callout block** — and only if items ≤ 3
- Keep item descriptions to **1–2 lines** each
- Use `gap-4` between sections, not `gap-8`, unless the slide has very little content

**If content doesn't fit, cut — do not shrink font sizes or squeeze gaps.**
- Merge the last two items into one
- Move secondary detail to speaker notes
- Split into two slides if needed

## Don't stretch content cards to fill the slide

The slide canvas is fixed-height and already vertically-centers its child via `flex flex-col justify-center`. **Never** use `flex-1` on a content grid that holds small cards — it makes each card balloon to fill the leftover vertical space, leaving 60–80% of every card empty. The result reads as broken and lazy.

**Anti-pattern:**
```tsx
<div className="flex flex-col h-full gap-4">
  <Header />
  <div className="grid grid-cols-3 gap-4 flex-1">  {/* ❌ stretches every card */}
    <Card />  <Card />  <Card />
  </div>
</div>
```

**Correct pattern:**
```tsx
<div className="flex flex-col h-full justify-center gap-4">  {/* center the stack */}
  <Header />
  <div className="grid grid-cols-3 gap-4">  {/* ✅ cards size to content */}
    <Card />  <Card />  <Card />
  </div>
</div>
```

Rules:
- **Never** put `flex-1` on a content grid (`grid grid-cols-N`).
- Outer `flex flex-col h-full` wrappers should use `justify-center` so the natural-height content sits centered in the slide.
- If a card has only 2–3 lines, keep the card height to that — don't pad it out with `flex-1`, `min-h-*`, or `h-full`.
- Body text in card bodies: minimum `text-sm`. Use `text-xs` only for tags/labels, never for paragraph content.
- If a single card visibly overpowers its neighbors at content-size, rebalance the content — don't force equal height with `flex-1`.
