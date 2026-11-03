import { defineStore } from "pinia";
import { DEFAULT_WALLPAPER, normalizeWallpaper } from "../utils/wallpapers";

// Persisted keys: must stay unchanged to keep user data
const SETTINGS_KEY = "saved_app_settings";
const CLOSE_TO_TRAY_KEY = "close_to_tray";

const MIN_KEEPALIVE = 120; // In seconds
const MIN_RECONNECT_PERIOD = 2; // In seconds
const MIN_CONNECT_TIMEOUT = 20; // In seconds

const DEFAULT_HISTORY_SIZE = 50; // Values kept per topic
const MAX_HISTORY_SIZE = 500;

/** Converts any input to an integer in 0..MAX_HISTORY_SIZE. Invalid input gives 0. */
export const clampHistorySize = (value) => {
  const size = Math.trunc(Number(value));
  return Number.isFinite(size)
    ? Math.min(Math.max(size, 0), MAX_HISTORY_SIZE)
    : 0;
};

export const RECENT_TILES_PER_ROW = 4; // Same as the Home tile grid columns
const DEFAULT_RECENT_ROWS = 2;
export const RECENT_ROWS_OPTIONS = [1, 2, 3, 4];
const MAX_RECENT_ROWS = Math.max(...RECENT_ROWS_OPTIONS);

/** Converts any input to an integer in 1..MAX_RECENT_ROWS. Invalid input gives the default. */
export const clampRecentRows = (value) => {
  const rows = Math.trunc(Number(value));
  return Number.isFinite(rows)
    ? Math.min(Math.max(rows, 1), MAX_RECENT_ROWS)
    : DEFAULT_RECENT_ROWS;
};

// Root font size in percent. Tokens use rem, so the whole UI scales with it.
export const FONT_SCALES = [90, 100, 110, 125, 150];
const DEFAULT_FONT_SCALE = 100;

/** Returns the stored scale when it is a known option, else the default. */
const normalizeFontScale = (value) =>
  FONT_SCALES.includes(Number(value)) ? Number(value) : DEFAULT_FONT_SCALE;

const defaultPrimaryColor = () => ({
  text: "Indie Indigo",
  value: { light: "#3F51B5", dark: "#5C6BC0" },
});

export const useSettingsStore = defineStore("settings", {
  state: () => ({
    theme: "light",
    closeTray: true,
    fontScale: DEFAULT_FONT_SCALE,
    primaryColor: defaultPrimaryColor(),
    wallpaper: DEFAULT_WALLPAPER,
    clientId: undefined,
    keepalive: MIN_KEEPALIVE,
    reconnectPeriod: MIN_RECONNECT_PERIOD,
    connectTimeout: MIN_CONNECT_TIMEOUT,
    maxReconnects: 5,
    historySize: DEFAULT_HISTORY_SIZE,
    recentRows: DEFAULT_RECENT_ROWS,
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
      this.closeTray = data.closeTray ?? true;
      this.fontScale = normalizeFontScale(data.fontScale);
      this.primaryColor = data.primaryColor || defaultPrimaryColor();
      this.wallpaper = normalizeWallpaper(data.wallpaper);
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
      this.historySize = clampHistorySize(
        data.historySize ?? DEFAULT_HISTORY_SIZE
      );
      this.recentRows = clampRecentRows(data.recentRows ?? DEFAULT_RECENT_ROWS);
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
