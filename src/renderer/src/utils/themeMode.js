/** Maps the stored theme setting ("light" | "dark" | "system") to "light" | "dark". */
export function resolveTheme(setting, prefersDark) {
  if (setting === "light" || setting === "dark") return setting;
  return prefersDark ? "dark" : "light";
}
