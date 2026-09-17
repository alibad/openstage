# Motion Spec

The presentations framework has one motion grammar. Every animation in every
deck draws from the same token vocabulary so that decks feel like they belong
to the same family. Ad-hoc cubic-beziers, stiffness/damping values, and
arbitrary duration numbers are forbidden in new code — use the tokens below.

Source of truth: `src/lib/motion.ts`.

---

## 1. Easing tokens

```ts
import { ease } from "@/lib/motion";
```

| Token         | Curve                                    | Use for                                     |
|---------------|------------------------------------------|---------------------------------------------|
| `outQuart`    | `cubic-bezier(0.25, 0.46, 0.45, 0.94)`   | **Default.** Snappy reveals, UI transitions, slide changes |
| `outExpo`     | `cubic-bezier(0.16, 1, 0.3, 1)`          | Hero text landings, big headline reveals    |
| `outBack`     | `cubic-bezier(0.34, 1.56, 0.64, 1)`      | Playful badges, icons, stat pops            |
| `inOutQuart`  | `cubic-bezier(0.76, 0, 0.24, 1)`         | Back-and-forth / symmetric transitions      |
| `inOutExpo`   | `cubic-bezier(0.87, 0, 0.13, 1)`         | Cinematic sweeps, chapter changes           |
| `outCirc`     | `cubic-bezier(0.33, 1, 0.68, 1)`         | Mask / clip-path reveals                    |
| `linear`      | `cubic-bezier(0, 0, 1, 1)`               | Continuous loops, scroll-linked motion      |

Rule of thumb: if you are revealing something the user is about to read, use
`outQuart`. If you want the reveal itself to feel like the event, use `outExpo`.

## 2. Duration tokens

```ts
import { duration } from "@/lib/motion";
```

| Token       | Seconds | Use for                                                  |
|-------------|---------|----------------------------------------------------------|
| `fast`      | 0.25    | Hover states, micro-feedback, toggles                    |
| `base`      | 0.45    | **Default.** Slide changes, UI transitions               |
| `reveal`    | 0.70    | Scroll-triggered content reveals                         |
| `slow`      | 1.10    | Heavier animations (mask, blur), earn-the-payoff moments |
| `cinematic` | 1.60    | Hero landings, intro sequences, art-directed moments     |

## 3. Springs

Two flavours for historical reasons:

- `springConfig.*` — **raw** `{ stiffness, damping, restDelta }` objects for
  `useSpring()` (Framer Motion's hook wants raw values, not a full `Transition`).
- `spring.*` — full `Transition` objects (`type: "spring", ...config`) you can
  spread into a `transition={...}` prop.

```ts
import { spring, springConfig } from "@/lib/motion";

<motion.div transition={spring.ui} />                   // declarative
const y = useSpring(value, springConfig.gentle);        // imperative
```

| Token    | Stiffness | Damping | Feel                                              |
|----------|-----------|---------|---------------------------------------------------|
| `ui`     | 150       | 15      | **Default.** Snappy UI — buttons, magnetics       |
| `gentle` | 100       | 30      | Smooth scroll-linked motion — progress bars       |
| `bouncy` | 260       | 20      | Playful, overshooting — reveal pops               |
| `smooth` | 120       | 28      | Heavy, cinematic — large transforms               |

## 4. Stagger

```ts
import { stagger } from "@/lib/motion";
```

| Token       | Seconds | Use for                                 |
|-------------|---------|-----------------------------------------|
| `tight`     | 0.04    | Characters, dense grids                 |
| `base`      | 0.08    | Words, card grids                       |
| `list`      | 0.12    | **Default** list reveals                |
| `cinematic` | 0.20    | Spacious reveals, attention-getting lists |

## 5. Viewport margins

For scroll-triggered reveals. Applied as `viewport={{ margin }}`.

```ts
import { viewportMargin } from "@/lib/motion";
```

| Token     | Margin   | Triggers…                    |
|-----------|----------|------------------------------|
| `default` | `-80px`  | Slightly early — most reveals |
| `early`   | `-120px` | Earlier — tall sections, heroes |
| `late`    | `-40px`  | Closer to fully visible — below-the-fold |

## 6. Convenience presets

Ready-to-spread `Transition` objects for the most common animations:

```ts
import { tx } from "@/lib/motion";

<motion.div transition={tx.reveal} />
<motion.div transition={tx.hero} />
<motion.div transition={tx.cinematic} />
```

| Preset      | Duration × Ease              | Use for                          |
|-------------|------------------------------|----------------------------------|
| `fast`      | `fast` × `outQuart`          | UI micro-interactions            |
| `reveal`    | `reveal` × `outQuart`        | `<Reveal>` default               |
| `hero`      | `slow` × `outExpo`           | Hero moments                     |
| `bounce`    | `reveal` × `outBack`         | Playful                          |
| `cinematic` | `cinematic` × `inOutExpo`    | Chapter-level transitions        |
| `mask`      | `1` × `outCirc`              | Clip-path reveals                |
| `slide`     | `base` × `outQuart`          | Slide-deck slide change (legacy) |

## 7. Shared variants

`fadeVariants` exports a dictionary of common `{ hidden, visible }` pairs used
across `<Reveal>`, `<StaggerItem>`, etc. Use them instead of inlining your own:

- `fadeUp`, `fadeIn`, `scaleIn`, `slideLeft`, `slideRight`, `blurUp`.

## 8. Slide-deck transitions

Slide mode now supports **per-slide** transition variants via the `transition`
field on each `Slide`:

```ts
{
  id: "hero",
  content: <TitleSlide />,
  transition: "blur",   // fade | slide | blur | zoom | mask | none
  mood: "night",        // optional data-mood override
}
```

Defaults to `"slide"`. Pair `transition` with `mood` to create chapter beats
that feel visually distinct without touching the surrounding deck.

## 9. House rules

1. **No inline cubic-beziers.** If a new easing is needed, add it to
   `ease` with a justification in the PR description.
2. **No `type: "spring"` with raw numbers.** Use `spring.ui` etc.
3. **`<Reveal>` is the default.** Framer Motion directly only when `<Reveal>`
   is insufficient.
4. **Respect `prefers-reduced-motion`.** Primitives that drive physics or
   continuous motion (marquee, webgl-hero, scroll-camera-3d) fall back
   gracefully in print mode; extend that pattern to new primitives.
5. **Stagger over ceremony.** If five things enter, stagger them. Don't fade
   them in as one chunk.
