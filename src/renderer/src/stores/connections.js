import { defineStore } from "pinia";

// Persisted key: must stay unchanged to keep user data
const CONNECTIONS_KEY = "saved_mqtt_connections";
const MAX_RECENT_CONNECTIONS = 8;

// Old data may hold a number, new data an ISO string; anything unreadable counts as never
const connectedTime = ({ lastConnectedAt }) =>
  (lastConnectedAt && new Date(lastConnectedAt).getTime()) || 0;

// Newest first; connections never connected go last, in their saved order
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

    /** Top connections for the Home tiles. Without history: the first saved ones. */
    recentConnections() {
      return [...this.savedConnections]
        .sort(byMostRecentlyConnected)
        .slice(0, MAX_RECENT_CONNECTIONS);
    },

    /** Saved connections not in the recent tiles, alphabetical. */
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
      this.persist();
    },

    replaceAll(connections) {
      this.brokerConnections = connections;
    },

    load() {
      const saved = JSON.parse(window.api.store.get(CONNECTIONS_KEY) || "[]");

      // Generate IDs if missing (retro-compatibility)
      saved.forEach((connection) => {
        connection.id = connection.id || crypto.randomUUID();
      });

      this.brokerConnections = saved;
    },

    persist() {
      window.api.store.set(
        CONNECTIONS_KEY,
        JSON.stringify(this.savedConnections)
      );
    },
  },
});
