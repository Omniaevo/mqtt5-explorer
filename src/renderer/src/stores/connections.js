import { defineStore } from "pinia";
import { RECENT_TILES_PER_ROW, useSettingsStore } from "./settings";
import { StoreKey } from "../../../shared/ipcChannels";

// Old data may hold a number, new data an ISO string; anything unreadable counts as never
const connectedTime = ({ lastConnectedAt }) =>
  (lastConnectedAt && new Date(lastConnectedAt).getTime()) || 0;

// Newest first
const byMostRecentlyConnected = (a, b) => connectedTime(b) - connectedTime(a);

const byName = (a, b) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

export const useConnectionsStore = defineStore("connections", {
  state: () => ({
    brokerConnections: [],
    selectedConnectionId: 0,
  }),

  getters: {
    getByIndex: (state) => (index) => state.brokerConnections[index],
    savedConnections: (state) => state.brokerConnections.filter((c) => c.saved),

    /** Top connections for the Home tiles: only those connected at least once. */
    recentConnections() {
      const { recentRows } = useSettingsStore();

      return this.savedConnections
        .filter((c) => connectedTime(c) > 0)
        .sort(byMostRecentlyConnected)
        .slice(0, recentRows * RECENT_TILES_PER_ROW);
    },

    /** Saved connections not in the recent tiles (never connected included), alphabetical. */
    otherConnections() {
      const recentIds = new Set(this.recentConnections.map((c) => c.id));

      return this.savedConnections
        .filter((c) => !recentIds.has(c.id))
        .sort(byName);
    },
  },

  actions: {
    setSelectedConnectionId(id) {
      this.selectedConnectionId = id;
    },

    add(connection) {
      this.brokerConnections.push(connection);
    },

    update(index, connection) {
      this.brokerConnections[index] = connection;
    },

    remove(index, callback) {
      this.brokerConnections.splice(index, 1);
      if (callback) callback();
    },

    /** Stamps a saved connection with the current time and saves it. No-op for an unsaved one. */
    markConnected(id) {
      const connection = this.savedConnections.find((c) => c.id === id);

      if (!connection) return;

      connection.lastConnectedAt = new Date().toISOString();
      connection.lastError = undefined;
      this.persist();
    },

    /**
     * Saves why the last connection attempt of a saved connection failed. A failed
     * attempt still counts as recent, so it stamps `lastConnectedAt` (the field
     * name is kept: persisted data). No-op for an unsaved connection.
     */
    markFailed(id, message) {
      const connection = this.savedConnections.find((c) => c.id === id);

      if (!connection) return;

      connection.lastConnectedAt = new Date().toISOString();
      connection.lastError = message;
      this.persist();
    },

    replaceAll(connections) {
      this.brokerConnections = connections;
    },

    load() {
      const saved = JSON.parse(window.api.store.get(StoreKey.CONNECTIONS) || "[]");

      // Generate IDs if missing (retro-compatibility)
      saved.forEach((connection) => {
        connection.id = connection.id || crypto.randomUUID();
      });

      this.brokerConnections = saved;
    },

    persist() {
      window.api.store.set(
        StoreKey.CONNECTIONS,
        JSON.stringify(this.savedConnections)
      );
    },
  },
});
