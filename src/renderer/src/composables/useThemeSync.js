import { watch } from "vue";
import { useTheme } from "vuetify";
import { useSettingsStore } from "../stores/settings";
import { onPrimaryColor } from "../utils/onPrimaryColor";

/**
 * Keeps the `data-theme` attribute, the primary color CSS variables and
 * the Vuetify theme in line with the settings store.
 * The Vuetify part goes away with Vuetify (T16).
 */
export function useThemeSync() {
  const settings = useSettingsStore();
  const vuetifyTheme = useTheme();

  const applyThemeAttribute = () => {
    document.documentElement.dataset.theme = settings.theme;
  };

  const applyPrimaryVars = () => {
    const mode = settings.isDark ? "dark" : "light";
    const primary = settings.primaryColor.value[mode];
    const { style } = document.documentElement;

    style.setProperty("--color-primary", primary);
    style.setProperty("--color-on-primary", onPrimaryColor(primary));
  };

  const applyVuetifyTheme = () => {
    const { light, dark } = settings.primaryColor.value;

    vuetifyTheme.themes.value.light.colors.primary = light;
    vuetifyTheme.themes.value.dark.colors.primary = dark;
    vuetifyTheme.change(settings.theme);
  };

  const applyAll = () => {
    applyThemeAttribute();
    applyPrimaryVars();
    applyVuetifyTheme();
  };

  watch(() => settings.theme, applyAll);
  watch(() => settings.primaryColor, applyAll, { deep: true });

  return { applyAll };
}
