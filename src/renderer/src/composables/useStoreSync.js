import { onScopeDispose } from "vue";
import { useSettingsStore } from "../stores/settings";
import { useConnectionsStore } from "../stores/connections";
import { StoreKey } from "../../../shared/ipcChannels";

/**
 * Reloads a Pinia store when another renderer changes its persisted key.
 * `applySettings` runs after the settings reload (theme, colors, font scale).
 *
 * @param {{applySettings: () => void}} options
 */
export function useStoreSync({ applySettings }) {
  const settings = useSettingsStore();
  const connections = useConnectionsStore();

  const reloaders = {
    [StoreKey.SETTINGS]: () => {
      settings.load();
      applySettings();
    },
    [StoreKey.CONNECTIONS]: () => connections.load(),
  };

  const unsubscribe = window.api.store.onChanged((key) => reloaders[key]?.());

  onScopeDispose(unsubscribe);
}
