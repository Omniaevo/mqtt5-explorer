const LIGHT_TEXT = "#ffffff";
const DARK_TEXT = "#111111";
const DARK_TEXT_LUMINANCE = 0.0056; // Relative luminance of #111111
const HEX_COLOR_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** `#rgb` or `#rrggbb` to `[r, g, b]` (0..255). */
const hexToRgb = (hex) => {
  const digits = hex.slice(1);
  const full =
    digits.length === 3 ? [...digits].map((d) => d + d).join("") : digits;

  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};

/** WCAG relative luminance of an sRGB color. */
const relativeLuminance = ([r, g, b]) => {
  const [lr, lg, lb] = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
};

/**
 * Text color (white or near-black) with the best WCAG contrast on a
 * background color. Invalid input falls back to white.
 * @param {string} backgroundHex `#rgb` or `#rrggbb`.
 */
export const onPrimaryColor = (backgroundHex) => {
  if (!HEX_COLOR_PATTERN.test(backgroundHex)) return LIGHT_TEXT;

  const luminance = relativeLuminance(hexToRgb(backgroundHex));
  const contrastWithLight = 1.05 / (luminance + 0.05);
  const contrastWithDark = (luminance + 0.05) / (DARK_TEXT_LUMINANCE + 0.05);

  return contrastWithLight >= contrastWithDark ? LIGHT_TEXT : DARK_TEXT;
};
