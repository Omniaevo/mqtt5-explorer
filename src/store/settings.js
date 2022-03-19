const settingsVuexModule = {
  state: {
    theme: "light",
    outline: false,
    shortKeys: `["ctrl", "f"]`,
    primaryColor: {
      text: "Indie Indigo",
      value: { light: "#3F51B5", dark: "#5C6BC0" },
    },
  },

  mutations: {
    setTheme: (state, theme) => (state.theme = theme),
    setOutline: (state, outline) => (state.outline = outline),
    setPrimaryColor: (state, primary) => (state.primaryColor = primary),
    setShortKeys: (state, short) => (state.shortKeys = short),
    setAllSettings: (state, data) => {
      state.theme = data.theme || "light";
      state.outline = data.outline;
      state.shortKeys = data.shortKeys || `["ctrl", "f"]`;
      // eslint-disable-next-line prettier/prettier
      state.primaryColor = data.primaryColor || { text: "Indie Indigo", value: { light: "#3F51B5", dark: "#5C6BC0" } };
    },
  },

  getters: {
    getAllSettings: (state) => state,
    getTheme: (state) => state.theme,
    getOutline: (state) => state.outline,
    getPrimaryColor: (state) => state.primaryColor,
    getShortKeys: (state) => state.shortKeys,
  },
};

export default settingsVuexModule;
