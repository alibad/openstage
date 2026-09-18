---
name: pptx-conversion
description: "Convert an existing PowerPoint into a presentation: place the source, deduplicate animation frames, preserve divider slides, reproduce progressive reveals as multiple slides, use real screenshots in device frames, add bilingual support, and author attribution + download link. Use when building a deck from a source .pptx file."
---

## Converting from an Existing PPTX

When creating presentations from an existing PowerPoint file, follow this workflow.

### Step 1: Place the source PPTX

- Store the original in `public/decks/{slug}-original.pptx` (URL-safe filename, no spaces or `#`).
- Extract images into `public/images/{slug}/` using python-pptx.
- The PPTX should be downloadable from the presentation UI (see attribution below).

### Step 2: Deduplicate animation frames

Most PPTX decks use progressive reveals, meaning the same slide appears 3-6 times
with content appearing incrementally. When extracting content, **deduplicate** to find
the real narrative structure. A 34-slide PPTX may only have 8-10 unique content slides.

### Step 3: Preserve cinematic pacing with divider slides

Many PPTX decks use full-bleed section divider slides (bold title, dramatic pause)
between content sections. **Always include these as dedicated slides.** The
structure should alternate:

```
Divider → Content → Divider → Content → ...
```

**Divider slides must use the framework's own visual language**, not the source
PPTX's brand colors. The slide deck already runs inside our dark-themed
`SlideDeck` container with its own navigation, progress bar, and controls.
A random brand-colored background (e.g. maroon, corporate blue) will clash
with the framework chrome and look jarring.

Instead, divider slides should be **purely typographic** using the framework theme:

```tsx
function DividerSlide({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col h-full justify-center items-center text-center gap-5">
      <h2 className="text-6xl md:text-7xl font-bold tracking-tight leading-[1.1] max-w-4xl">
        <span className="scale-gradient-text">{title}</span>
      </h2>
      {subtitle && (
        <p className="text-xl text-muted font-light max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
```

Key principles:
- **Use `scale-gradient-text` for the title** — this is the framework's signature accent.
- **No background overrides** — let the slide deck's dark theme be the background.
- **No icons in circles** — keep it clean typographic. The title IS the visual.
- **Large text (6xl-7xl)** that fills the viewport communicates the transition.
- Optional `subtitle` in `text-muted` for context below the title.

Do NOT copy the source deck's brand colors into divider backgrounds. The framework
has its own visual identity (dark theme, brand gradient, border-border cards) and
all slides must be consistent with it.

### Step 4: Implement progressive reveal (build animations)

Most PPTX decks use progressive reveal — the same slide appears multiple times
with one new element highlighted per click. This is a core storytelling technique:
it controls pacing and lets each point land before the next appears.

**Always reproduce progressive reveals as multiple slides.** Each "frame" of
the animation becomes its own slide entry in the `slides` array, using the same
component with an `activeIndex` prop.

```tsx
const STATS = [
  { value: "25-40%", label: "at risk", color: "#F87171" },
  { value: "~400",   label: "per advisor", color: "#FBBF24" },
  { value: ">50%",   label: "on admin", color: "#FB923C" },
];

function DiscoverySlide({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="grid grid-cols-3 gap-6">
      {STATS.map((stat, i) => {
          const isActive = i === activeIndex;
        return (
          <div
            key={stat.value}
            style={{
              borderColor: isActive ? `${stat.color}33` : "rgba(255,255,255,0.06)",
              background: isActive ? `${stat.color}0D` : "rgba(255,255,255,0.02)",
              opacity: isActive ? 1 : 0.3,
            }}
          >
            {/* ... card content ... */}
          </div>
        );
      })}
    </div>
  );
}

// In the slides array:
{ id: "discovery-1", content: <DiscoverySlide activeIndex={0} /> },
{ id: "discovery-2", content: <DiscoverySlide activeIndex={1} /> },
{ id: "discovery-3", content: <DiscoverySlide activeIndex={2} /> },
```

Pattern rules:
- **Inactive items** get `opacity: 0.3`, dimmed borders/backgrounds, and muted text.
- **Only the active item** (`i === activeIndex`) gets full color and opacity. Show one
  item at a time, not cumulative. This keeps focus on the current point.
- **Callout/summary** only appears on the final frame (when all items revealed).
- **Reserve a spacer** (`<div className="h-[60px]" />`) on earlier frames to prevent
  layout shift when the callout appears.
- Each frame gets its own speaker notes describing what to say while that item lands.
- Use a unique `id` per frame (e.g. `"discovery-1"`, `"discovery-2"`).

When scanning the source PPTX, count the animation frames per section. If slides 7, 8,
and 9 show the same layout with one new card highlighted, that's 3 frames, not 1 slide.

### Step 5: Use real product screenshots (detail → device frame)

Most PPTX decks show product screenshots twice: first as a close-up detail view
(so the audience can read the UI), then inside a laptop/device mockup (for cinematic
impact). **Always reproduce both slides.**

**Slide A — Detail view** (with heading, badge, feature callouts):
```tsx
<div className="flex-1 relative rounded-2xl overflow-hidden border border-border shadow-2xl">
  <Image src="/images/{slug}/screenshot.png" alt="..." fill className="object-cover object-top" />
</div>
```

**Slide B — Device hero** (clean, no text, pure visual):
```tsx
<div className="flex flex-col h-full justify-center items-center">
  <div className="relative w-full max-w-4xl">
    <div className="relative rounded-t-xl border border-white/10 bg-[#1a1a1a] p-2 pt-6">
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white/10" />
      <div className="relative aspect-[16/10] rounded-md overflow-hidden">
        <Image src="/images/{slug}/screenshot.png" alt="..." fill className="object-cover object-top" />
      </div>
    </div>
    <div className="relative h-4 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-b-lg border-x border-b border-white/10">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 rounded-b-sm bg-white/5" />
    </div>
    <div className="absolute -bottom-4 left-[10%] right-[10%] h-6 bg-black/30 blur-xl rounded-full" />
  </div>
</div>
```

Build the laptop frame in CSS (dark body, camera dot, base, shadow) rather than
using extracted device images which are typically low-resolution.

### Step 6: Add bilingual support for Middle East audiences

If the presentation targets an Arabic-speaking audience,
add Arabic/English bilingual support from the start. This avoids a costly retrofit.

1. Structure the content file with a `t` translations object from day one.
2. Translate all content to Arabic (use the full i18n pattern documented in
   Proven Patterns > Bilingual / i18n support).
3. For scroll mode: pass `s` to every section component.
4. For slide mode: use the `buildPresentation(s)` pattern with a wrapper component.
5. Default to English unless the client specifically prefers Arabic.

Adding i18n later requires touching every component and extracting every hardcoded
string. Building it in from the start costs ~20% more effort upfront but saves
a full rewrite later.

### Step 7: Author attribution and source link

Every presentation converted from a PPTX **must** include:

1. **Author attribution** — the original author's name (not the framework default) in:
   - The registry entry (`author` field)
   - Route page metadata
   - Slide deck `Presentation` object
   - Visible on title/hero slide and closing slide
2. **Download link** — a button linking to the original PPTX in `public/decks/`,
   visible on the title slide and closing slide. Use the `download` attribute.

---
