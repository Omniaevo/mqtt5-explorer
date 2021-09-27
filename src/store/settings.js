const settingsVuexModule = {
  state: {
    theme: "light",
  },

  mutations: {
    setTheme: (state, theme) => (state.theme = theme),
    setAllSettings: (state, data) => {
      state.theme = data.theme || "light";
    },
  },

  getters: {
    getAllSettings: (state) => state,
    getTheme: (state) => state.theme,
  },
};

export default settingsVuexModule;
