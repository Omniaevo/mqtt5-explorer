const dataVuexModule = {
  state: {
    brokerConnections: [],
  },

  mutations: {
    addNewConnection: (state, data) => state.brokerConnections.push(data),
    removeConnection: (state, index) =>
      state.brokerConnections.splice(index, 1),
    updateConnection: (state, data) =>
      (state.brokerConnections[data[1]] = data[0]),
  },

  getters: {
    getAllConnections: (state) => state.brokerConnections,
    getConnectionByIndex: (state) => (index) => state.brokerConnections[index],
  },
};

export default dataVuexModule;
