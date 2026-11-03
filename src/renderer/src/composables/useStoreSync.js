import { onScopeDispose } from "vue";
import { useSettingsStore } from "../stores/settings";
import { useConnectionsStore } from "../stores/connections";

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
    saved_app_settings: () => {
      settings.load();
      applySettings();
    },
    saved_mqtt_connections: () => connections.load(),
  };

  const unsubscribe = window.api.store.onChanged((key) => reloaders[key]?.());

  onScopeDispose(unsubscribe);
}
