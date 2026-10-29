/**
 * Color tokens of the Metro themes, as hex.
 * Mirror of assets/css/tokens.css: keep both in step. Tests read the contrast of these pairs.
 */
export const THEME_TOKENS = {
  light: {
    bg: "#ffffff",
    surface: "#f2f2f2",
    fg: "#000000",
    fgSecondary: "#5c5c5c",
    errorText: "#a20025",
  },
  dark: {
    bg: "#1d1d1d",
    surface: "#2b2b2b",
    fg: "#ffffff",
    fgSecondary: "#b3b3b3",
    errorText: "#ff6b81",
  },
};

/** Same in both themes. */
export const STATIC_TOKENS = {
  error: "#a20025",
  onError: "#ffffff",
  success: "#2e7d32",
};
