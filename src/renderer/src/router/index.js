import { createRouter, createWebHashHistory } from "vue-router";
import Home from "../views/Home.vue";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "Home", component: Home },
    {
      path: "/settings",
      name: "Settings",
      component: () => import("../views/SettingsPage.vue"),
    },
    {
      path: "/viewer/:index",
      name: "Viewer",
      component: () => import("../views/MqttViewer.vue"),
    },
  ],
});

export default router;
