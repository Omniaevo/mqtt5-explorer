import { defineStore } from "pinia";

// Persisted key: must stay unchanged to keep user data
const CONNECTIONS_KEY = "saved_mqtt_connections";

export const useConnectionsStore = defineStore("connections", {
  state: () => ({
    brokerConnections: [],
    selectedConnectionId: 0,
  }),

  getters: {
    getByIndex: (state) => (index) => state.brokerConnections[index],
    savedConnections: (state) => state.brokerConnections.filter((c) => c.saved),
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
