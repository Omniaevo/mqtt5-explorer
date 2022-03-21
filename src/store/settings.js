const settingsVuexModule = {
  state: {
    theme: "light",
    outline: false,
    primaryColor: {
      text: "Indie Indigo",
      value: { light: "#3F51B5", dark: "#5C6BC0" },
    },
  },

  mutations: {
    setTheme: (state, theme) => (state.theme = theme),
    setOutline: (state, outline) => (state.outline = outline),
    setPrimaryColor: (state, primary) => (state.primaryColor = primary),
    setAllSettings: (state, data) => {
      state.theme = data.theme || "light";
      state.outline = data.outline;
      // eslint-disable-next-line prettier/prettier
      state.primaryColor = data.primaryColor || { text: "Indie Indigo", value: { light: "#3F51B5", dark: "#5C6BC0" } };
    },
  },

  getters: {
    getAllSettings: (state) => state,
    getTheme: (state) => state.theme,
    getOutline: (state) => state.outline,
    getPrimaryColor: (state) => state.primaryColor,
  },
};

export default settingsVuexModule;
