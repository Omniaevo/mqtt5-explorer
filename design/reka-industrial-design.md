---
name: reka-industrial-design
description: Design system "Reka Industrial" — dense, flat, technical desktop-tool UI (GitHub/Grafana clarity + Linear/Raycast calm dark). Vue 3 + Reka UI headless primitives + hand-written scoped CSS on design tokens, IBM Plex fonts, Lucide icons, user-tintable primary color, light/dark themes. Use when building or restyling any screen, component, dialog, form, list, tree, toast, tooltip or chart that must match this style, when the user mentions "reka industrial", "our design system", "app style", design tokens, or asks to make UI look like the MQTT5 Explorer app.
---

# Reka Industrial design system

Source of truth in this repo:

- `design/tokens.md` — approved token rationale (2026-11-02).
- `design/sample.html` — static gallery of every component, both themes side by side.
- `src/renderer/src/assets/css/tokens.css` — shipped tokens + base reset. **When docs and code differ, code wins.**
- `src/renderer/src/components/ui/App*.vue` — reference components.

## 1. Identity in one paragraph

A data tool, not a showcase. Compact density (28px controls, 24px rows, 13px body). Sharp corners (2–4px). Depth comes from 1px hairline borders and three neutral layers, not from shadows. Neutrals are tinted 5% with the primary color, so a user-picked primary changes the mood of the whole app. Accent use is restrained: the primary color marks only selection, focus, the active tab, "on" states and the one main action. Monospace for every machine value (topics, IDs, URLs, payloads, timestamps). Motion is short (100/180ms) and functional. No gradients, no colored header bands, no large radii, no decorative illustrations.

Visual references: GitHub / Grafana (clear data, hairlines) + Linear / Raycast (soft calm dark).

## 2. Stack rules

| Concern | Use | Never |
| --- | --- | --- |
| Framework | Vue 3 `<script setup>` SFC | Options API |
| Behavior / a11y primitives | `reka-ui` (Dialog, Select, Tabs, Switch, ToggleGroup, Tooltip, Toast, Accordion…) | Vuetify, PrimeVue, other styled kits |
| Styling | Scoped `<style>` per component, plain CSS, tokens only | Tailwind, CSS-in-JS, inline hex colors |
| Icons | `@lucide/vue`, `:size="16"` (14 in tree rows), stroke 2 set once via `setLucideProps({ strokeWidth: 2 })` | Icon fonts, mixed icon sets |
| Fonts | `@fontsource/ibm-plex-sans` + `@fontsource/ibm-plex-mono`, weights 400/500/600, bundled (offline) | Web font CDNs |
| Lists > ~200 rows | `@tanstack/vue-virtual` | Rendering all rows |
| Charts | `uplot`, colors read from CSS vars at runtime | Hard-coded chart colors |

Before writing a new component, reuse an existing `App*` wrapper (`AppButton`, `AppTextField`, `AppTextarea`, `AppSelect`, `AppSwitch`, `AppToggleGroup`, `AppTabs`, `AppAccordion`, `AppDialog`, `AppTooltip`, `AppHeader`). Build a new `App*` wrapper only when Reka has the primitive and no wrapper exists.

## 3. Tokens (copy as-is)

Every color, size, space, radius, duration in components comes from these variables. A raw value in a component is a bug, except `1px`/`2px` borders, `0.45` disabled opacity and `ch`-based widths.

```css
:root {
  --font-sans: "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Helvetica Neue", Arial, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, "SF Mono", "Cascadia Mono", "JetBrains Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace;

  --font-size-xs: 0.6875rem; /* 11px: chips, hints, counts */
  --font-size-sm: 0.75rem;   /* 12px: labels, tree rows, payload, secondary */
  --font-size-md: 0.8125rem; /* 13px: body, controls */
  --font-size-lg: 0.9375rem; /* 15px: dialog, page and section titles */
  --font-weight-regular: 400;
  --font-weight-medium: 500; /* labels, buttons, tabs */
  --font-weight-bold: 600;   /* titles, highlighted values */
  --line-height-tight: 1.25;
  --line-height-normal: 1.45;

  --space-1: 0.125rem; /* 2 */
  --space-2: 0.25rem;  /* 4 */
  --space-3: 0.375rem; /* 6 */
  --space-4: 0.5rem;   /* 8 */
  --space-5: 0.75rem;  /* 12 */
  --space-6: 1rem;     /* 16 */
  --space-7: 1.5rem;   /* 24 */
  --space-8: 2rem;     /* 32 */

  --radius-sm: 2px; /* chips, switch thumb, inline highlights */
  --radius-md: 3px; /* rows, menu items, tags */
  --radius-lg: 4px; /* controls, panels, dialogs, popovers, toasts */

  --duration-fast: 100ms;
  --duration-normal: 180ms;
  --easing: cubic-bezier(0.2, 0, 0, 1);

  --control-height: 1.75rem; /* 28px */
  --header-height: 2.5rem;   /* 40px */
  --row-height: 1.5rem;      /* 24px */

  --tint: 5%; /* share of primary mixed into neutrals; 0% = pure gray */
}

:root,
[data-theme="light"] {
  color-scheme: light;
  --color-primary: #3f51b5;
  --color-on-primary: #ffffff;
  --color-bg: color-mix(in oklab, #eff1f4, var(--color-primary) var(--tint));
  --color-surface: color-mix(in oklab, #fafbfc, var(--color-primary) var(--tint));
  --color-surface-raised: #ffffff;
  --color-border: color-mix(in oklab, #d3d7de, var(--color-primary) var(--tint));
  --color-text: #1b1e23;
  --color-text-muted: #5b6270;
  --color-danger: #cf222e;
  --color-success: #1a7f37;
  --color-warning: #9a6700;
  --color-focus-ring: color-mix(in oklab, var(--color-primary) 70%, transparent);
  --color-hover: color-mix(in oklab, var(--color-text) 6%, transparent);
  --color-primary-subtle: color-mix(in oklab, var(--color-primary) 14%, var(--color-surface));
  --shadow-1: 0 1px 2px rgb(20 24 31 / 0.10);
  --shadow-2: 0 8px 24px rgb(20 24 31 / 0.16), 0 0 0 1px var(--color-border);
}

[data-theme="dark"] {
  color-scheme: dark;
  --color-primary: #5c6bc0;
  --color-on-primary: #ffffff;
  --color-bg: color-mix(in oklab, #0e0f12, var(--color-primary) var(--tint));
  --color-surface: color-mix(in oklab, #16181c, var(--color-primary) var(--tint));
  --color-surface-raised: color-mix(in oklab, #1e2025, var(--color-primary) var(--tint));
  --color-border: color-mix(in oklab, #2b2e35, var(--color-primary) var(--tint));
  --color-text: #e6e8ec;
  --color-text-muted: #9097a3;
  --color-danger: #ff6b6b;
  --color-success: #3fb950;
  --color-warning: #d29922;
  --color-focus-ring: color-mix(in oklab, var(--color-primary) 80%, white 10%);
  --color-hover: color-mix(in oklab, var(--color-text) 8%, transparent);
  --color-primary-subtle: color-mix(in oklab, var(--color-primary) 28%, var(--color-surface));
  --shadow-1: 0 1px 2px rgb(0 0 0 / 0.40);
  --shadow-2: 0 8px 24px rgb(0 0 0 / 0.50), 0 0 0 1px var(--color-border);
}
```

### Surface layers (back to front)

1. `--color-bg` — window canvas, footer, flat content areas, code/payload wells.
2. `--color-surface` — panels, header bar, list/tree containers. 1px border, `--radius-lg`, usually no shadow.
3. `--color-surface-raised` — inputs, dialogs, popovers, select menus, toasts, accordion. Floating ones add `--shadow-2` (which includes a 1px border ring).

### Derived colors — mix, never invent

Make every new tint with `color-mix(in oklab, …)` from tokens:

| Need | Recipe |
| --- | --- |
| Hover background | `var(--color-hover)` |
| Pressed background | `color-mix(in oklab, var(--color-text) 12%, transparent)` |
| Selected (soft) | `var(--color-primary-subtle)` |
| Tonal button bg | `color-mix(in oklab, <fg> 14%, var(--color-surface))` → 22% hover → 30% active |
| Filled hover/active | `color-mix(in oklab, <bg> 85%, var(--color-text))` → 70% |
| Status row tint (diff) | `color-mix(in oklab, var(--color-success\|danger) 33%, transparent)` |
| Search match highlight | `color-mix(in oklab, var(--color-warning) 35%, transparent)` + `--radius-sm` |
| Toast bg | `color-mix(in oklab, var(--color-surface-raised), <accent> 14%)` |
| Overlay | `color-mix(in oklab, black 45%, transparent)` |

### Semantic color meaning

- **primary**: selection, focus, active tab, switch on, main action, scrollbar thumb, text selection, chart line, small accents (separators in a topic path, a key value in a footer).
- **success**: connected, received, new value.
- **danger**: error, delete, disconnect, old/removed value.
- **warning**: pending, search match.
- **text-muted**: labels, hints, meta, counts, inactive tabs, icons at rest.

### Runtime primary color

The user picks a primary per theme (`{ light, dark }`). On change, set `--color-primary` on `document.documentElement` and compute `--color-on-primary` by WCAG contrast (white vs `#111111`, higher wins). Reuse `src/renderer/src/utils/onPrimaryColor.js` and `composables/useThemeSync.js`; do not re-implement. Theme switch = `document.documentElement.dataset.theme = "light" | "dark"`. Font scale = root `font-size` percentage, which is why all sizes are `rem`.

## 4. Base layer

```css
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: var(--font-sans); font-size: var(--font-size-md);
       line-height: var(--line-height-normal); color: var(--color-text); background: var(--color-bg); }
button, input, select, textarea { font: inherit; color: inherit; }
button { padding: 0; border: 0; background: none; cursor: pointer; }
:focus-visible { outline: 2px solid var(--color-focus-ring); outline-offset: 1px; }
@media (prefers-reduced-motion: reduce) { :root { --duration-fast: 0ms; --duration-normal: 0ms; } }

::-webkit-scrollbar { width: 8px; height: 8px; background: var(--color-bg); }
::-webkit-scrollbar-thumb { background: var(--color-primary); border-radius: var(--radius-sm); }
::selection { background: var(--color-primary); color: var(--color-on-primary); }
```

The app root has `overflow: hidden`; each panel scrolls on its own.

## 5. Typography rules

- Sans for UI text. Mono (`--font-mono`) for **every machine value**: topics, client IDs, URLs, ports, payloads, JSON, timestamps, tags. Inputs that hold such values get the `mono` prop.
- Sizes: body/controls `md`; labels, tree rows, payloads, descriptions `sm`; chips, hints, counts, URL under a title `xs`; titles `lg`.
- Weight: titles 600, labels/buttons/tabs 500, body 400. Bold (600) inside mono marks the value that matters (e.g. `uptime = **16593**`).
- Field label: `sm`, `medium`, `text-muted`, above the control with `--space-2` gap. Never floating labels, never placeholder-as-label.
- Group caption: `xs`, bold, uppercase, `letter-spacing: 0.06em`, muted. Or section divider: muted `sm` medium title + `::after` 1px line that fills the row.
- Long values: `overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-inline-size: 0`. Payloads that must wrap: `overflow-wrap: break-word; word-break: break-all`.
- Widths in `ch` for text-shaped controls (port `12ch`, search `40ch`–`60ch`, dialogs `50ch`).

## 6. Component recipes

All use logical properties (`inline-size`, `block-size`, `padding-inline`, `inset-inline-start`, `border-block-end`), BEM-like class names (`app-x`, `app-x__part`, `app-x--modifier`), and style Reka state through `[data-state]`, `[data-highlighted]`, `[data-disabled]`, `[aria-pressed]`.

### Button — `AppButton`

Props: `variant` = `filled | tonal | text | icon`, `color` = `neutral | primary | danger`, `size` = `sm (24px) | md (28px)`.

- Height `--control-height`, padding-inline `--space-5`, radius `--radius-lg`, no border, weight 500, `line-height-tight`, gap `--space-3` for icon + label.
- Internal vars `--button-fg / --button-bg / --button-bg-hover / --button-bg-active`; variants only change these vars.
- `filled neutral` = inverted (bg `--color-text`, fg `--color-bg`). `filled primary` = primary + on-primary. `filled danger` = danger + on-primary.
- `text` / `icon` = transparent, fg is the color, hover `--color-hover`.
- `tonal` = 14% tint of fg over surface.
- `icon` is square (`inline-size = block-size`), **must** have `aria-label`, usually wrapped in `AppTooltip`.
- Disabled: `opacity: 0.45; cursor: not-allowed`.
- One filled primary per view max. Dialog confirm/cancel pairs are often both `text` (danger confirm = `text danger`).

### Text field / textarea / select — `AppTextField`, `AppTextarea`, `AppSelect`

- Root: column, gap `--space-2`, `min-inline-size: 0`. Label above, message below (`xs`, muted; danger when invalid).
- Control box: `min-block-size: --control-height`, padding-inline `--space-4`, 1px `--color-border`, `--radius-lg`, bg `--color-surface-raised`.
- States: hover → border `--color-text-muted`; focus-within / `[data-state="open"]` → border `--color-primary`, no outline ring on the box; invalid → border `--color-danger` + `aria-invalid` + `aria-describedby`.
- Prepend/append slots for inline icon buttons (`size="sm"`). Clear button only while value exists and field is editable.
- Textarea uses mono font, `resize: vertical`.
- Select menu (teleported → **unscoped** style): bg raised, `--shadow-2`, `--radius-lg`, viewport padding `--space-2`, `position="popper"`, `side-offset` 4px, `min-inline-size: var(--reka-select-trigger-width)`. Items: `--row-height`, radius `md`, highlighted → `--color-hover`, checked → primary text + weight 500 + `Check` icon at inline end.
- `labelHidden` keeps the label for screen readers (compact header search).

### Switch — `AppSwitch`

Track 28×16, padding 2px, radius `lg`, off = `--color-border`, on = primary. Thumb 12×12 square-ish (`--radius-sm`), raised bg + `--shadow-1`; checked thumb = on-primary, moved with `translate`. The `<label>` wraps it so text toggles it.

### Toggle group — `AppToggleGroup`

Segmented control: one 1px bordered box, radius `lg`, `overflow: hidden`, items split by 1px inline-start border. Items muted at rest; pressed (`[aria-pressed="true"]`) = `--color-primary-subtle` bg + primary text. Icon-only items carry `aria-label` + tooltip. Use for theme pickers, view modes, search modes.

### Tabs — `AppTabs`

- Horizontal: triggers `--header-height` tall, padding-inline `--space-6`, muted 500; hover `--color-hover`; active = primary text. Animated 2px primary `TabsIndicator` at block end (uses `--reka-tabs-indicator-size/position`). The header row carries a 1px bottom border and a `list-end` slot for actions.
- Vertical (master list, e.g. connections): grid `list | panel`, list is a bordered surface panel that scrolls; active row = `--color-primary-subtle` + normal text (primary text on tint reads poorly) + 2px primary indicator on inline start.
- Panels mount on first visit and stay mounted (`force-mount` + hide `[data-state="inactive"]`).

### Accordion — `AppAccordion`

Bordered raised box, radius `lg`; items split by 1px lines. Trigger `min-block-size: calc(--control-height + --space-4)`, padding-inline `--space-5`, 500 weight, optional muted leading icon, trailing `ChevronDown` that rotates 180° when open. Content animates height with `--reka-accordion-content-height`, body padding `--space-5`. Use for "Advanced" form sections.

### Dialog — `AppDialog`

- Overlay black 45%, z 2000. Content z 2001, raised bg, `--radius-lg`, `--shadow-2`, `inline-size: min(var(--dialog-max-width, 50ch), 100% - 2*--space-6)`, max height viewport minus margins.
- Header: `--header-height`, padding-inline `--space-6 --space-4`, bottom hairline, title `lg` bold tight, optional header actions, icon close button.
- Body: padding `--space-6`, scrolls. Footer actions: right-aligned, gap `--space-4`, padding `--space-5 --space-6`, top hairline.
- `persistent` blocks Esc/outside click for destructive confirms. `fullscreenOnSmall` → full window, radius 0 below 600px.
- Animation: overlay fade + content `scale(0.96)` fade, `--duration-normal`.

### Tooltip — `AppTooltip`

Inverted chip: bg `--color-text`, fg `--color-bg`, `sm` text, padding `--space-2 --space-4`, radius `lg`, arrow filled with `--color-text`, offset 4px, z 3000, delay 400ms (one `TooltipProvider` at app root). Every icon-only button gets one.

### Toast (Reka Toast in `App.vue`)

Top-center viewport (`inset-block-start: --space-6`), max `32rem`. Raised bg tinted 14% with accent, 4px inline-start accent border (primary by default, danger for errors), `--shadow-2`, radius `lg`, gap `--space-5`, padding `--space-4 --space-5`. Ghost close button `--control-height` square. 5s duration, swipe up, slides in from top (`translateY(-100%)`). Errors use `type="foreground"`.

### Chip / tag

Height 18px, padding-inline `--space-3`, `xs`, 1px border, `--radius-sm`, muted. Variants: `primary` = subtle fill, no border; `success | warning | danger` = color text + `border-color: currentcolor`. Editable tags (topic list) = subtle fill, mono `sm`, radius `md`, small ghost `X`.

### Header bar — `AppHeader`

`min-block-size: --header-height`, padding-inline `--space-4`, gap `--space-4`, surface bg, bottom hairline. Slots `start | default (grows) | end`. Title `lg` bold; a mono `xs` muted line (URL) may sit under it. Icon actions at the end; status icons colored primary/danger. No colored band, no drag region.

### Settings row

Title (`md`) + muted description (`sm`) on the left, control on the right; stacked below 600px. Settings dialog groups rows under section titles.

## 7. Data display patterns

- **Tree / list rows**: `--row-height` (24px) or virtualized fixed px height, `sm` font, mono labels, radius `md`. Hover `--color-hover`. Selected tree row = **solid primary bg + on-primary text** (hints inherit color, 0.8 opacity). Selected list row = `--color-primary-subtle` (+ optional 2px primary inline-start bar). Indent = `depth * 16px + --space-4`. Chevron 14px, `visibility: hidden` when leaf (keeps alignment). Collapsed node shows muted `xs` count hint at inline end.
- **Live update flash**: absolute overlay of primary at 0.5 opacity fading to 0 in 120ms, re-keyed on each update.
- **Payload / code well**: mono `sm`, bg `--color-bg`, 1px border, radius `md`, padding `--space-4 --space-5`, `overflow-x: auto`.
- **Value diff rows**: old value tinted danger 33%, new value tinted success 33%, radius `md`. Newest row larger (1.4em), older rows fade out with `mask-image: linear-gradient(to bottom, black, transparent)`.
- **Meta text**: counts like `(42 of 1000 values)` muted `sm`/`xs`, pushed to inline end with `margin-inline-start: auto`.
- **Empty states**: one muted sentence. No illustrations.
- **Charts**: read `--color-primary` and `--color-text` via `getComputedStyle` at draw time, line = primary, grid/ticks = text at low alpha. Redraw on theme or primary change.

## 8. Layout patterns

- Full-height column: header (fixed) → content (`flex: 1; min-block-size: 0`) → optional footer (muted `sm`, padding `--space-4`, on bg).
- Master/detail: CSS grid `2fr 3fr`, gap `--space-5`, margin `--space-4`, `grid-template-rows: minmax(0, 1fr)`. Master = bordered surface panel (padding `--space-4`). Detail = flat on `--color-bg` with its own toolbar row (`--header-height`) + tabs.
- `@media (orientation: portrait)`: stack master over detail (`2fr / 3fr` rows). Below 600px: dialogs fullscreen, settings rows stack.
- Forms: column gap `--space-6`, rows of fields with gap `--space-7`; narrow fields capped in `ch`; sticky action bar at bottom with top hairline, primary action pushed to inline end. Dividers = 1px `--color-border`, block margin `--space-6`.
- Always add `min-inline-size: 0` / `min-block-size: 0` to flex/grid children that hold long text or scroll areas.
- z-index scale: dialog 2000/2001, select menu 2100, tooltip/toast 3000. Teleported content (select, tooltip, toast) needs **unscoped** CSS and `position: relative` so Reka copies the z-index.

## 9. Motion

- Hover/border/background: `--duration-fast`. Open/close, indicator slide, switch, chevron rotate: `--duration-normal`. Always `--easing`.
- Enter = fade + small scale (0.96) or translate from the edge it comes from. Exit mirrors enter.
- Status loops (pending, recording) = 1s alternate opacity/grayscale pulses only.
- Every animation and transition has a `prefers-reduced-motion: reduce` off switch (tokens already zero the durations; keyframe animations need `animation: none`).

## 10. Accessibility minimums

- Text ≥ 4.5:1 on its surface in both themes (tokens satisfy this; keep it when adding colors).
- Visible `:focus-visible` ring (2px focus-ring color). Inside clipped containers use negative `outline-offset`.
- Every input has a real `<label>` (`useId()` for `for`/`id`), errors linked via `aria-describedby`, `aria-invalid`.
- Icon-only controls: `aria-label` + tooltip; decorative icons `aria-hidden="true"`.
- 28px targets are an accepted trade-off for a pointer-driven desktop tool; do not go smaller than 24px.

## 11. Component authoring template

```vue
<template>
  <div class="app-thing" :class="[$attrs.class, { 'app-thing--invalid': error }]" :style="$attrs.style">
    <!-- Reka primitive + parts here; style its [data-state] attributes -->
  </div>
</template>

<script setup>
/**
 * One-line purpose. Model, slots, and which attrs go where.
 * `class` and `style` go to the root; other attrs go to the inner control.
 */
import { computed, useAttrs, useId } from "vue";

defineOptions({ inheritAttrs: false });
const props = defineProps({ label: { type: String, required: true }, error: { type: String, default: undefined } });
const model = defineModel();
const attrs = useAttrs();
const id = useId();
const ROOT_ATTRS = ["class", "style"];
const innerAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([name]) => !ROOT_ATTRS.includes(name))),
);
</script>

<style scoped>
.app-thing {
  /* Tokens only. Local knobs as --thing-* custom properties. */
}
</style>
```

## 12. Do / Don't

| Do | Don't |
| --- | --- |
| Hairline borders to separate | Heavy shadows on resting panels |
| Radii 2/3/4px | Pills, `border-radius` > 4px (except avatars) |
| Primary only for state + one main action | Primary headers, primary backgrounds on large areas |
| Tinted neutrals via `--tint` | Pure `#fff`/`#000` canvases, new gray hex values |
| Mono for machine data | Sans for IDs, topics, JSON |
| Muted text for secondary info | Lighter font weights (300) or tiny <11px text |
| `color-mix(in oklab, …)` for tints | `rgba()` of hard-coded colors, opacity on text for hierarchy |
| Both themes checked for every change | Light-only styling |
| Logical properties | `left/right/width/height` in new code (legacy in virtual lists is OK) |

## 13. Review checklist before finishing UI work

1. No raw colors, sizes, radii or durations outside tokens.
2. Looks right in light **and** dark, and with a light (e.g. yellow) and dark (e.g. navy) user primary — on-primary text stays readable.
3. Height of every control = `--control-height`; rows = `--row-height`; bars = `--header-height`.
4. Machine values in mono; labels muted `sm` 500.
5. Hover, focus-visible, active, disabled, invalid states all present.
6. Long text truncates or wraps on purpose; flex/grid children have `min-*-size: 0`.
7. Teleported parts styled unscoped with correct z-index.
8. Reduced motion respected.
9. Existing `App*` component reused where one fits.
10. Compare against `design/sample.html` for spacing and density.
