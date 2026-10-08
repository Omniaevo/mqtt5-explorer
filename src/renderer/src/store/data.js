import Vue from "vue";

const dataVuexModule = {
  state: {
    brokerConnections: [],
    selectedConnectionId: 0,
  },

  mutations: {
    setSelectedConnectionId: (state, id) => (state.selectedConnectionId = id),
    loadPersistentConnections: (state, data) =>
      (state.brokerConnections = data),
    addNewConnection: (state, data) =>
      Vue.set(state.brokerConnections, state.brokerConnections.length, data),
    updateConnection: (state, update) =>
      Vue.set(state.brokerConnections, update.index, update.data),
    removeConnection: (state, { index, callback }) => {
      Vue.delete(state.brokerConnections, index);
      if (callback != undefined) callback();
    },
  },

  getters: {
    getAllConnections: (state) => state.brokerConnections,
    getConnectionByIndex: (state) => (index) => state.brokerConnections[index],
    selectedConnectionId: (state) => state.selectedConnectionId,
  },
};

export default dataVuexModule;
