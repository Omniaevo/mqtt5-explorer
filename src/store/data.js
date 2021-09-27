import Vue from "vue";

const dataVuexModule = {
  state: {
    brokerConnections: [],
  },

  mutations: {
    loadPersistentConnections: (state, data) =>
      (state.brokerConnections = data),
    addNewConnection: (state, data) =>
      Vue.set(state.brokerConnections, state.brokerConnections.length, data),
    updateConnection: (state, update) =>
      Vue.set(state.brokerConnections, update.index, update.data),
    removeConnection: (state, index) =>
      Vue.delete(state.brokerConnections, index),
  },

  getters: {
    getAllConnections: (state) => state.brokerConnections,
    getConnectionByIndex: (state) => (index) => state.brokerConnections[index],
  },
};

export default dataVuexModule;
