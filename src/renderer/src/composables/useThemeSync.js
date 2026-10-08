import { watch } from "vue";
import { useTheme } from "vuetify";
import { useSettingsStore } from "../stores/settings";

const rootStyle = () => document.documentElement.style;

/**
 * Keeps Vuetify theme and scrollbar CSS variables
 * in line with the settings store.
 */
export function useThemeSync() {
  const settings = useSettingsStore();
  const vuetifyTheme = useTheme();

  const applyScrollbarVars = () => {
    const mode = settings.isDark ? "dark" : "light";
    const primary = settings.primaryColor.value?.[mode];

    rootStyle().setProperty(
      "--scrollbar-thumb-color",
      primary || `var(--scrollbar-thumb-${mode})`
    );
    rootStyle().setProperty(
      "--scrollbar-bg-color",
      `var(--scrollbar-bg-${mode})`
    );
  };

  const applyPrimaryColor = () => {
    const { light, dark } = settings.primaryColor.value;

    vuetifyTheme.themes.value.light.colors.primary = light;
    vuetifyTheme.themes.value.dark.colors.primary = dark;
  };

  const applyAll = () => {
    applyPrimaryColor();
    vuetifyTheme.change(settings.theme);
    applyScrollbarVars();
  };

  watch(() => settings.theme, applyAll);
  watch(() => settings.primaryColor, applyAll, { deep: true });

  return { applyAll };
}
