const settingsVuexModule = {
  state: {
    theme: "light",
    outline: false,
    primaryColor: {
      text: "Indie Indigo",
      value: { light: "#3F51B5", dark: "#5C6BC0" },
    },
    keepalive: 120, // In seconds
    reconnectPeriod: 2, // In seconds
    connectTimeout: 20, // In seconds
  },

  mutations: {
    setTheme: (state, theme) => (state.theme = theme),
    setOutline: (state, outline) => (state.outline = outline),
    setPrimaryColor: (state, primary) => (state.primaryColor = primary),
    setKeepalive: (state, keepalive) => (state.keepalive = keepalive),
    setReconnect: (state, reconnect) => (state.reconnectPeriod = reconnect),
    setConnectTimeout: (state, timeout) => (state.connectTimeout = timeout),
    setAllSettings: (state, data) => {
      state.theme = data.theme || "light";
      state.outline = data.outline;
      // eslint-disable-next-line prettier/prettier
      state.primaryColor = data.primaryColor || {
        text: "Indie Indigo",
        value: { light: "#3F51B5", dark: "#5C6BC0" },
      };
      state.keepalive = Math.max(Number(data.keepalive || 0), 120);
      state.reconnectPeriod = Math.max(Number(data.reconnectPeriod || 0), 2);
      state.connectTimeout = Math.max(Number(data.connectTimeout || 0), 20);
    },
  },

  getters: {
    getAllSettings: (state) => state,
    getTheme: (state) => state.theme,
    getOutline: (state) => state.outline,
    getPrimaryColor: (state) => state.primaryColor,
    getKeepalive: (state) => state.keepalive,
    getReconnect: (state) => state.reconnectPeriod,
    getConnectTimeout: (state) => state.connectTimeout,
    getMqttClientSettings: (state) => ({
      keepalive: Number(state.keepalive),
      reconnectPeriod: Number(state.reconnectPeriod),
      connectTimeout: Number(state.connectTimeout),
    }),
  },
};

export default settingsVuexModule;
