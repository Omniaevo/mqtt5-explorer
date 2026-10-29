import { watch } from "vue";
import { useSettingsStore } from "../stores/settings";
import { textOnAccent } from "../utils/color";

const rootElement = () => document.documentElement;

/**
 * Keeps the Metro CSS variables in line with the settings store and the OS color scheme.
 */
export function useThemeSync() {
  const settings = useSettingsStore();
  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const currentAccent = () =>
    settings.primaryColor.value?.[settings.resolvedTheme];

  const applyAll = () => {
    const accent = currentAccent();
    const style = rootElement().style;

    rootElement().dataset.theme = settings.resolvedTheme;
    if (!accent) return;
    style.setProperty("--m-accent", accent);
    style.setProperty("--m-on-accent", textOnAccent(accent));
  };

  settings.setSystemPrefersDark(darkQuery.matches);
  darkQuery.addEventListener("change", (event) =>
    settings.setSystemPrefersDark(event.matches)
  );

  watch(() => settings.resolvedTheme, applyAll);
  watch(() => settings.primaryColor, applyAll, { deep: true });

  return { applyAll };
}
