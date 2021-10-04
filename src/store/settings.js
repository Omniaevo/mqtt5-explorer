const settingsVuexModule = {
  state: {
    theme: "light",
    outline: false,
  },

  mutations: {
    setTheme: (state, theme) => (state.theme = theme),
    setOutline: (state, outline) => (state.outline = outline),
    setAllSettings: (state, data) => {
      state.theme = data.theme || "light";
      state.outline = data.outline;
    },
  },

  getters: {
    getAllSettings: (state) => state,
    getTheme: (state) => state.theme,
    getOutline: (state) => state.outline,
  },
};

export default settingsVuexModule;
