import Vue from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import Connection from "./utils/Connection";
import Store from "electron-store";
import { v4 as uuidv4 } from "uuid";

// Custom CSS
import "./assets/css/scrollbar.css";
import "./assets/css/treeview.css";

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
    denseTree() {
      return this.$store.getters.getDenseTree;
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
      this.$estore.set("close_to_tray", `${this.allSettings.closeTray}`);
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

      this.loadCustomCssTheme(this.darkTheme);
    },
    loadCustomCssTheme(isDark) {
      // Setup theme and colors
      const mode = isDark ? "dark" : "light";
      const primaryColor = isDark
        ? this.primaryColor.value?.dark
        : this.primaryColor.value?.light;

      // Select the root style
      const rootStyle = document.querySelector(":root").style;

      rootStyle.setProperty(
        "--scrollbar-thumb-color",
        primaryColor || `var(--scrollbar-thumb-${mode})`
      );
      rootStyle.setProperty(
        "--scrollbar-bg-color",
        `var(--scrollbar-bg-${mode})`
      );
    },
    loadCustomCssTreeview(isDense) {
      const mode = isDense ? "dense" : "default";

      // Select the root style
      const rootStyle = document.querySelector(":root").style;

      rootStyle.setProperty("--margin", `var(--margin-${mode})`);
    },
    sendNotification(title, body, onClick = () => {}) {
      new window.Notification(title, { body }).onclick = onClick;
    },
  },
});

new Vue({
  router,
  store,
  vuetify,
  render: (h) => h(App),
}).$mount("#app");
