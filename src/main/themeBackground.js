// Base of `--color-bg` in tokens.css, without the primary tint
const BACKGROUNDS = Object.freeze({ light: "#eff1f4", dark: "#0e0f12" });
const DEFAULT_THEME = "light";

/**
 * Background color of a view that has no page yet, so a new tab does not
 * flash white in the dark theme.
 * @param {string | undefined} storedSettings The saved app settings, as JSON.
 * @returns {string}
 */
export function themeBackground(storedSettings) {
  let theme;

  try {
    theme = JSON.parse(storedSettings || "{}").theme;
  } catch {
    theme = undefined;
  }

  return BACKGROUNDS[theme] ?? BACKGROUNDS[DEFAULT_THEME];
}
