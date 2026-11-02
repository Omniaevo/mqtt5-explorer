Approved on 2026-11-02

# Design tokens proposal

Look: dense, flat, technical. References: GitHub / Grafana (clear data tool, hairline borders) and Linear / Raycast (calm, soft dark).

Taste answers (2026-11-02): compact density, sharp corners, tinted neutrals, GitHub/Grafana + Linear/Raycast.

Source of truth for values: `sample.html` (`@layer tokens`). T02 copies them to `tokens.css`.

## Colors

Neutrals are mixed with `--color-primary` (`--tint: 5%`). The user color changes the mood of the whole app. Other colors stay fixed.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--color-bg` | `#eff1f4` + tint | `#0e0f12` + tint | App canvas, behind panels |
| `--color-surface` | `#fafbfc` + tint | `#16181c` + tint | Panels, header, lists |
| `--color-surface-raised` | `#ffffff` | `#1e2025` + tint | Inputs, dialogs, toasts, popovers |
| `--color-border` | `#d3d7de` + tint | `#2b2e35` + tint | Hairlines (1px) |
| `--color-text` | `#1b1e23` | `#e6e8ec` | Body text |
| `--color-text-muted` | `#5b6270` | `#9097a3` | Labels, hints, meta |
| `--color-primary` | `#3f51b5` | `#5c6bc0` | Default only. Runtime value comes from settings |
| `--color-on-primary` | `#ffffff` | `#ffffff` | Text on primary. Computed at runtime (see below) |
| `--color-danger` | `#cf222e` | `#ff6b6b` | Errors, delete |
| `--color-success` | `#1a7f37` | `#3fb950` | Connected, received |
| `--color-warning` | `#9a6700` | `#d29922` | Pending, search match |
| `--color-focus-ring` | primary 70% | primary 80% + white | `:focus-visible` outline, 2px |

Extra derived tokens (not in the spec list, needed by the components):

- `--color-hover`: text color at 6% (light) / 8% (dark), transparent. Hover on rows and ghost buttons.
- `--color-primary-subtle`: primary 14% / 28% over surface. Selected tree row, selected list row, primary chip.

Accent use (restrained + tinted): filled button, focus ring, selected row (subtle fill + 2px left bar), active tab underline, switch on. No colored header band.

Contrast: text on surface is at least 4.5:1 in both themes. Muted text is about 5.9:1 (light) and 6.3:1 (dark).

### `--color-on-primary` with any user color

`useThemeSync` (T02) computes it when it writes `--color-primary`:

1. Convert the hex color to WCAG relative luminance `L`.
2. Contrast with white: `1.05 / (L + 0.05)`. Contrast with near-black: `(L + 0.05) / 0.05`.
3. Pick the higher one: `#ffffff` or `#111111`.

`sample.html` has a color picker at the top. It runs the same function, so you can test any color.

## Typography

- **Font family: system stack.** `system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Helvetica Neue", Arial, sans-serif`. Reason: desktop app, native look, zero font files, works offline, no license notice. Trade-off: the look changes a little per OS.
- **Mono (payloads, values): system mono.** `ui-monospace, "SF Mono", "Cascadia Mono", "JetBrains Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace`.

| Token | Value | Use |
| --- | --- | --- |
| `--font-size-xs` | `0.6875rem` (11px) | Chips, hints, counts |
| `--font-size-sm` | `0.75rem` (12px) | Tree rows, payload, secondary text |
| `--font-size-md` | `0.8125rem` (13px) | Body, controls |
| `--font-size-lg` | `0.9375rem` (15px) | Dialog and section titles |
| `--font-weight-regular/medium/bold` | 400 / 500 / 600 | Body / labels, buttons / titles |
| `--line-height-tight` | 1.25 | Titles |
| `--line-height-normal` | 1.45 | Body, payload |

## Spacing, shape, motion, sizes

| Group | Tokens | Values |
| --- | --- | --- |
| Spacing | `--space-1` … `--space-8` | 2, 4, 6, 8, 12, 16, 24, 32 px (in rem) |
| Radius | `--radius-sm/md/lg` | 2 / 3 / 4 px (sharp). sm: chips, switch. md: controls. lg: panels, dialogs |
| Elevation | `--shadow-1` | Small shadow for panels. Mostly borders carry depth |
| | `--shadow-2` | Large shadow + 1px border for dialog, toast, popover |
| Motion | `--duration-fast` / `--duration-normal` | 100ms / 180ms |
| | `--easing` | `cubic-bezier(0.2, 0, 0, 1)` |
| Sizes | `--control-height` | 28px (button, input, select) |
| | `--header-height` | 40px |
| | `--row-height` | 24px (tree and list rows). Extra token |

Reason per group: 4px base grid with 2px and 6px steps for dense layouts. Sharp radii give the IDE look. Motion is short because the app is a tool, not a showcase. Reduced motion: T02 adds a `prefers-reduced-motion` rule that sets both durations to 0.

## Open points for T02

- Keep `--tint` as a token. Change it to 0% to remove the tint.
- Touch targets are 28px. This is below the 44px guideline. Accepted for a pointer-driven desktop tool (compact density choice).
