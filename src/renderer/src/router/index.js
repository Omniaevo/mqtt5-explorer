import { createRouter, createWebHashHistory } from "vue-router";
import Home from "../views/Home.vue";

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", redirect: "/home" },
    { path: "/home", name: "Home", component: Home },
    {
      path: "/viewer/:index",
      name: "Viewer",
      component: () => import("../views/MqttViewer.vue"),
    },
  ],
});
