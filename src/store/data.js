const dataVuexModule = {
  state: {
    brokerConnections: [],
  },

  mutations: {
    addNewConnection: (state, data) => state.brokerConnections.push(data),
    removeConnection: (state, index) =>
      state.brokerConnections.splice(index, 1),
  },

  getters: {
    getAllConnections: (state) => state.brokerConnections,
    getConnectionByIndex: (state) => (index) => state.brokerConnections[index],
  },
};

export default dataVuexModule;
