import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import Shell from "./views/Shell.vue";
import TooltipOverlay from "./views/TooltipOverlay.vue";
import router from "./router";
import Connection from "./utils/Connection";

// Fonts (bundled for offline use)
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/ibm-plex-mono/latin-600.css";

// Custom CSS
import "./assets/css/tokens.css";
import "./assets/css/scrollbar.css";

document.documentElement.style.overflow = "hidden";

// The shell and the tooltip view are not tabs: no router, no connection or toast host
const HOSTS = { "#/shell": Shell, "#/tooltip": TooltipOverlay };
const host = HOSTS[window.location.hash];
const app = createApp(host ?? App);

app.use(createPinia());

if (!host) {
  app.provide("connection", new Connection());
  app.use(router);
}

app.mount("#app");
