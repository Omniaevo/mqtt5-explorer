import { onUnmounted } from "vue";
import { useSettingsStore } from "../stores/settings";
import { useThemeSync } from "./useThemeSync";
import { StoreKey } from "../../../shared/ipcChannels";

/**
 * For views that only follow the theme (shell, tooltip): loads the settings
 * once, then reloads them when another view saves them. Never saves.
 */
export function useStoreThemeSync() {
  const settings = useSettingsStore();
  const { applyAll } = useThemeSync();

  settings.load();
  applyAll();

  const unsubscribe = window.api.store.onChanged((key) => {
    if (key !== StoreKey.SETTINGS) return;

    settings.load();
    applyAll();
  });

  onUnmounted(unsubscribe);
}
