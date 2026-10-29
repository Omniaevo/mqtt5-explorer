import { watch } from "vue";
import { useTheme } from "vuetify";
import { useSettingsStore } from "../stores/settings";
import { textOnAccent } from "../utils/color";

const rootElement = () => document.documentElement;

/**
 * Keeps the Metro CSS variables, Vuetify theme and scrollbar variables
 * in line with the settings store and the OS color scheme.
 */
export function useThemeSync() {
  const settings = useSettingsStore();
  const vuetifyTheme = useTheme();
  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const currentAccent = () =>
    settings.primaryColor.value?.[settings.resolvedTheme];

  const applyMetroVars = () => {
    const accent = currentAccent();
    const style = rootElement().style;

    rootElement().dataset.theme = settings.resolvedTheme;
    if (!accent) return;
    style.setProperty("--m-accent", accent);
    style.setProperty("--m-on-accent", textOnAccent(accent));
  };

  const applyScrollbarVars = () => {
    const mode = settings.resolvedTheme;
    const style = rootElement().style;

    style.setProperty(
      "--scrollbar-thumb-color",
      currentAccent() || `var(--scrollbar-thumb-${mode})`
    );
    style.setProperty("--scrollbar-bg-color", `var(--scrollbar-bg-${mode})`);
  };

  const applyPrimaryColor = () => {
    const { light, dark } = settings.primaryColor.value;

    vuetifyTheme.themes.value.light.colors.primary = light;
    vuetifyTheme.themes.value.dark.colors.primary = dark;
  };

  const applyAll = () => {
    applyPrimaryColor();
    vuetifyTheme.change(settings.resolvedTheme);
    applyScrollbarVars();
    applyMetroVars();
  };

  settings.setSystemPrefersDark(darkQuery.matches);
  darkQuery.addEventListener("change", (event) =>
    settings.setSystemPrefersDark(event.matches)
  );

  watch(() => settings.resolvedTheme, applyAll);
  watch(() => settings.primaryColor, applyAll, { deep: true });

  return { applyAll };
}
