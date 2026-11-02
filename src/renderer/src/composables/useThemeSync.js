import { watch } from "vue";
import { useSettingsStore } from "../stores/settings";
import { onPrimaryColor } from "../utils/onPrimaryColor";

/**
 * Keeps the `data-theme` attribute and the primary color CSS variables
 * in line with the settings store.
 */
export function useThemeSync() {
  const settings = useSettingsStore();

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

  const applyAll = () => {
    applyThemeAttribute();
    applyPrimaryVars();
  };

  watch(() => settings.theme, applyAll);
  watch(() => settings.primaryColor, applyAll, { deep: true });

  return { applyAll };
}
