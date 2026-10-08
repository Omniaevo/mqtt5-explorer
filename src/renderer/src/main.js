import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import vuetify from "./plugins/vuetify";
import Connection from "./utils/Connection";

// Custom CSS
import "./assets/css/scrollbar.css";
import "./assets/css/treeview.css";

document.documentElement.style.overflow = "hidden";

const app = createApp(App);

app.provide("connection", new Connection());
app.use(createPinia());
app.use(router);
app.use(vuetify);
app.mount("#app");
