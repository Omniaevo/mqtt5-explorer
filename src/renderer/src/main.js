import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import Connection from "./utils/Connection";

import "./assets/css/tokens.css";
import "./assets/css/base.css";
import "./assets/css/motion.css";

document.documentElement.style.overflow = "hidden";

const app = createApp(App);

app.provide("connection", new Connection());
app.use(createPinia());
app.use(router);
app.mount("#app");
