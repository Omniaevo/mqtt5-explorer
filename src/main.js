import Vue from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import Connection from "./utils/Connection";
import Store from "electron-store";
import { v4 as uuidv4 } from "uuid";

document.documentElement.style.overflow = "hidden";
Vue.config.productionTip = false;

Vue.prototype.$bus = new Vue();
Vue.prototype.$connection = new Connection();
Vue.prototype.$estore = new Store();

Vue.mixin({
  data: () => ({
    connectionsStore: "saved_mqtt_connections",
    settingsStore: "saved_app_settings",
  }),

  computed: {
    connectionsAvailable() {
      return this.$store.getters.getAllConnections;
    },
    allSettings() {
      return this.$store.getters.getAllSettings;
    },
    theme() {
      return this.$store.getters.getTheme;
    },
    outline() {
      return this.$store.getters.getOutline;
    },
    closeToTray() {
      return this.$store.getters.getCloseToTray;
    },
    darkTheme() {
      return (this.theme || "light") === "dark";
    },
    primaryColor() {
      return this.$store.getters.getPrimaryColor;
    },
    clientId() {
      return this.$store.getters.getClientId;
    },
    keepalive() {
      return this.$store.getters.getKeepalive;
    },
    reconnectPeriod() {
      return this.$store.getters.getReconnect;
    },
    connectTimeout() {
      return this.$store.getters.getConnectTimeout;
    },
    maxReconnects() {
      return this.$store.getters.getMaxReconnects;
    },
    isMacOs() {
      return process.platform === "darwin";
    },
  },

  methods: {
    persistConnections() {
      this.$estore.set(
        this.connectionsStore,
        JSON.stringify(this.connectionsAvailable.filter((c) => c.saved))
      );
    },
    loadConnections() {
      const savedConnections = JSON.parse(
        this.$estore.get(this.connectionsStore) || "[]"
      );

      // Generate new UUIDs if not present (for retro-compatibility)
      savedConnections.forEach((connection) => {
        connection.id = connection.id || uuidv4();
      });

      this.$store.commit("loadPersistentConnections", savedConnections);
    },
    persistSettings() {
      this.$estore.set(this.settingsStore, JSON.stringify(this.allSettings));
    },
    loadSettings() {
      this.$store.commit(
        "setAllSettings",
        JSON.parse(this.$estore.get(this.settingsStore) || "{}")
      );
    },
    loadColors(color) {
      this.$vuetify.theme.themes.light.primary = color.value.light;
      this.$vuetify.theme.themes.dark.primary = color.value.dark;
    },
    loadCustomCssTheme(isDark) {
      const path = isDark
        ? "/styles/dark-scrollbar.css"
        : "/styles/light-scrollbar.css";

      const scrollTheme = document.createElement("link");
      const oldScroll = document.getElementById("scroll-bar");

      scrollTheme.setAttribute("id", "scroll-bar");
      scrollTheme.setAttribute("rel", "stylesheet");
      scrollTheme.setAttribute("href", path);

      if (oldScroll != undefined) {
        oldScroll.parentElement.removeChild(oldScroll);
      }

      document.head.appendChild(scrollTheme);
    },
  },
});

new Vue({
  router,
  store,
  vuetify,
  render: (h) => h(App),
}).$mount("#app");
