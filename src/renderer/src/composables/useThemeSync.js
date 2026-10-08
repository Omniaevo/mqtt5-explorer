import { watch } from "vue";
import { useTheme } from "vuetify";
import { useSettingsStore } from "../stores/settings";

const rootStyle = () => document.documentElement.style;

/**
 * Keeps Vuetify theme, scrollbar CSS variables and treeview density
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

  const applyDensity = () => {
    const mode = settings.denseTree ? "dense" : "default";

    rootStyle().setProperty("--margin", `var(--margin-${mode})`);
  };

  const applyAll = () => {
    applyPrimaryColor();
    vuetifyTheme.change(settings.theme);
    applyScrollbarVars();
    applyDensity();
  };

  watch(() => settings.theme, applyAll);
  watch(() => settings.primaryColor, applyAll, { deep: true });
  watch(() => settings.denseTree, applyDensity);

  return { applyAll };
}
