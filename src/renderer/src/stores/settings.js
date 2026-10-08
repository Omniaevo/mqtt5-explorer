import { defineStore } from "pinia";

// Persisted keys: must stay unchanged to keep user data
const SETTINGS_KEY = "saved_app_settings";
const CLOSE_TO_TRAY_KEY = "close_to_tray";

const MIN_KEEPALIVE = 120; // In seconds
const MIN_RECONNECT_PERIOD = 2; // In seconds
const MIN_CONNECT_TIMEOUT = 20; // In seconds

const defaultPrimaryColor = () => ({
  text: "Indie Indigo",
  value: { light: "#3F51B5", dark: "#5C6BC0" },
});

export const useSettingsStore = defineStore("settings", {
  state: () => ({
    theme: "light",
    denseTree: false,
    outline: false,
    closeTray: true,
    primaryColor: defaultPrimaryColor(),
    clientId: undefined,
    keepalive: MIN_KEEPALIVE,
    reconnectPeriod: MIN_RECONNECT_PERIOD,
    connectTimeout: MIN_CONNECT_TIMEOUT,
    maxReconnects: 5,
  }),

  getters: {
    isDark: (state) => state.theme === "dark",
    mqttClientSettings: (state) => ({
      clientId: state.clientId,
      keepalive: Number(state.keepalive),
      reconnectPeriod: Number(state.reconnectPeriod),
      connectTimeout: Number(state.connectTimeout),
      maxReconnects: Number(state.maxReconnects),
    }),
  },

  actions: {
    /** Applies stored data, filling defaults and clamping to the minimums. */
    setAll(data = {}) {
      this.theme = data.theme || "light";
      this.denseTree = data.denseTree ?? false;
      this.outline = data.outline ?? false;
      this.closeTray = data.closeTray ?? true;
      this.primaryColor = data.primaryColor || defaultPrimaryColor();
      this.clientId = data.clientId || `m5-${crypto.randomUUID()}`;
      this.keepalive = Math.max(Number(data.keepalive || 0), MIN_KEEPALIVE);
      this.reconnectPeriod = Math.max(
        Number(data.reconnectPeriod || 0),
        MIN_RECONNECT_PERIOD
      );
      this.connectTimeout = Math.max(
        Number(data.connectTimeout || 0),
        MIN_CONNECT_TIMEOUT
      );
      this.maxReconnects = Number(data.maxReconnects || 0);
    },

    /** Restores all defaults and keeps the current client ID. */
    resetToDefaults() {
      this.setAll({ clientId: this.clientId });
    },

    /** Replaces the MQTT client ID with a new random one. */
    regenerateClientId() {
      this.clientId = `m5-${crypto.randomUUID()}`;
    },

    load() {
      this.setAll(JSON.parse(window.api.store.get(SETTINGS_KEY) || "{}"));
    },

    persist() {
      window.api.store.set(SETTINGS_KEY, JSON.stringify(this.$state));
      window.api.store.set(CLOSE_TO_TRAY_KEY, `${this.closeTray}`);
    },
  },
});
