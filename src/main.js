import Vue from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import Connection from "./utils/Connection";
import Store from "electron-store";

Vue.config.productionTip = false;
Vue.prototype.$bus = new Vue();
Vue.prototype.$connection = new Connection();
Vue.prototype.$estore = new Store();

Vue.mixin({
  data: () => ({
    connectionsStore: "saved_mqtt_connections",
  }),

  computed: {
    connectionsAvailable() {
      return this.$store.getters.getAllConnections;
    },
  },

  methods: {
    persistConnections() {
      console.log(
        this.connectionsStore,
        JSON.stringify(this.connectionsAvailable.filter((c) => c.saved))
      );
      this.$estore.set(
        this.connectionsStore,
        JSON.stringify(this.connectionsAvailable.filter((c) => c.saved))
      );
    },
    loadConnections() {
      this.$store.commit(
        "loadPersistentConnections",
        JSON.parse(this.$estore.get(this.connectionsStore) || "[]")
      );
    },
  },
});

new Vue({
  router,
  store,
  vuetify,
  render: (h) => h(App),
}).$mount("#app");
