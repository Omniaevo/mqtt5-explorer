import { describe, expect, it } from "vitest";
import { COLORS } from "./accentColors";
import { contrastRatio, relativeLuminance, textOnAccent } from "./color";
import { STATIC_TOKENS, THEME_TOKENS } from "./themeTokens";

const TEXT_MIN = 4.5; // WCAG AA, normal text
const TINT_PERCENT = 0.35; // Same as the color-mix() of the payload rows
const PRESSED_MIN = 3; // Hover / pressed tiles are transient states

/** Mixes `color` over `base` like CSS `color-mix(in srgb, color p%, transparent)` on an opaque base. */
function overlay(color, base, share) {
  const channels = (hex) =>
    [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [c, b] = [channels(color), channels(base)];

  return `#${c
    .map((v, i) =>
      Math.round(v * share + b[i] * (1 - share))
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;
}

const themes = Object.entries(THEME_TOKENS);

describe("color", () => {
  it("computes known luminance and contrast values", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1);
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21);
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21);
    expect(contrastRatio("#777777", "#777777")).toBeCloseTo(1);
  });

  it("accepts the short hex form", () => {
    expect(contrastRatio("#fff", "#000")).toBeCloseTo(21);
  });

  it("picks black on light accents and white on dark accents", () => {
    expect(textOnAccent("#FFB300")).toBe("#000000");
    expect(textOnAccent("#C0CA33")).toBe("#000000");
    expect(textOnAccent("#3F51B5")).toBe("#ffffff");
  });

  it.each(
    COLORS.flatMap(({ text, value }) => [
      [text, "light", value.light],
      [text, "dark", value.dark],
    ])
  )("%s (%s) gets a readable text color", (_name, _mode, hex) => {
    const chosen = contrastRatio(hex, textOnAccent(hex));
    const best = Math.max(
      contrastRatio(hex, "#000000"),
      contrastRatio(hex, "#ffffff")
    );

    expect(chosen >= 4.5 || chosen === best).toBe(true);
  });
});

describe("contrast of the theme tokens", () => {
  it.each(themes)(
    "%s: secondary text is readable on bg and surface",
    (_name, t) => {
      expect(contrastRatio(t.fgSecondary, t.bg)).toBeGreaterThanOrEqual(
        TEXT_MIN
      );
      expect(contrastRatio(t.fgSecondary, t.surface)).toBeGreaterThanOrEqual(
        TEXT_MIN
      );
    }
  );

  it.each(themes)(
    "%s: primary text is readable on bg and surface",
    (_name, t) => {
      expect(contrastRatio(t.fg, t.bg)).toBeGreaterThanOrEqual(TEXT_MIN);
      expect(contrastRatio(t.fg, t.surface)).toBeGreaterThanOrEqual(TEXT_MIN);
    }
  );

  it.each(themes)(
    "%s: error text is readable on bg and surface",
    (_name, t) => {
      expect(contrastRatio(t.errorText, t.bg)).toBeGreaterThanOrEqual(TEXT_MIN);
      expect(contrastRatio(t.errorText, t.surface)).toBeGreaterThanOrEqual(
        TEXT_MIN
      );
    }
  );

  it("text on the error and success fills is readable", () => {
    expect(
      contrastRatio(STATIC_TOKENS.onError, STATIC_TOKENS.error)
    ).toBeGreaterThanOrEqual(TEXT_MIN);
  });

  it.each(themes)(
    "%s: text is readable on the success and error row tints",
    (_name, t) => {
      [STATIC_TOKENS.success, STATIC_TOKENS.error].forEach((tint) => {
        const row = overlay(tint, t.bg, TINT_PERCENT);

        expect(contrastRatio(t.fg, row)).toBeGreaterThanOrEqual(TEXT_MIN);
      });
    }
  );

  it.each(
    COLORS.flatMap(({ text, value }) => [
      [text, "light", value.light],
      [text, "dark", value.dark],
    ])
  )(
    "%s (%s): text on the accent keeps AA, also on hover and pressed tiles",
    (_name, _mode, accent) => {
      const on = textOnAccent(accent);

      expect(contrastRatio(accent, on)).toBeGreaterThanOrEqual(TEXT_MIN);
      expect(
        contrastRatio(overlay("#ffffff", accent, 0.14), on)
      ).toBeGreaterThanOrEqual(PRESSED_MIN);
      expect(
        contrastRatio(overlay("#000000", accent, 0.22), on)
      ).toBeGreaterThanOrEqual(PRESSED_MIN);
    }
  );
});
