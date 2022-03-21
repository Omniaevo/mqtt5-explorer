const settingsVuexModule = {
  state: {
    theme: "light",
    outline: false,
    searchShortKeys: `["ctrl", "f"]`,
    primaryColor: {
      text: "Indie Indigo",
      value: { light: "#3F51B5", dark: "#5C6BC0" },
    },
  },

  mutations: {
    setTheme: (state, theme) => (state.theme = theme),
    setOutline: (state, outline) => (state.outline = outline),
    setPrimaryColor: (state, primary) => (state.primaryColor = primary),
    setSearchShortKeys: (state, short) => (state.searchShortKeys = short),
    setAllSettings: (state, data) => {
      state.theme = data.theme || "light";
      state.outline = data.outline;
      state.searchShortKeys = data.searchShortKeys || `["ctrl", "f"]`;
      // eslint-disable-next-line prettier/prettier
      state.primaryColor = data.primaryColor || { text: "Indie Indigo", value: { light: "#3F51B5", dark: "#5C6BC0" } };
    },
  },

  getters: {
    getAllSettings: (state) => state,
    getTheme: (state) => state.theme,
    getOutline: (state) => state.outline,
    getPrimaryColor: (state) => state.primaryColor,
    getSearchShortKeys: (state) => state.searchShortKeys,
  },
};

export default settingsVuexModule;
