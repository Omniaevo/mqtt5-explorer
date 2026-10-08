import { createRouter, createWebHashHistory } from "vue-router";
import Home from "../views/Home.vue";

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "Home", component: Home },
    {
      path: "/viewer/:index",
      name: "Viewer",
      component: () => import("../views/MqttViewer.vue"),
    },
  ],
});
