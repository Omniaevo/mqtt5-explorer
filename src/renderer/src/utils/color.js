const BLACK = "#000000";
const WHITE = "#ffffff";

/** Reads "#rgb" or "#rrggbb" into [r, g, b] (0..255). */
function parseHex(hex) {
  const digits = hex.replace("#", "");
  const full =
    digits.length === 3
      ? [...digits].map((digit) => digit + digit).join("")
      : digits;
  const value = parseInt(full, 16);

  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/** WCAG 2.x relative luminance of a hex color (0..1). */
export function relativeLuminance(hex) {
  const [r, g, b] = parseHex(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colors (1..21). */
export function contrastRatio(a, b) {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x
  );

  return (light + 0.05) / (dark + 0.05);
}

/** Black or white, whichever reads better on the given accent color. */
export function textOnAccent(hex) {
  return contrastRatio(hex, BLACK) >= contrastRatio(hex, WHITE) ? BLACK : WHITE;
}
