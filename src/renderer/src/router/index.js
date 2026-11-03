import { createRouter, createWebHashHistory } from "vue-router";
import Home from "../views/Home.vue";

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", redirect: "/home" },
    { path: "/home", name: "Home", component: Home },
    {
      path: "/viewer/:tabId",
      name: "Viewer",
      component: () => import("../views/MqttViewer.vue"),
      // Main owns the connection properties of the tab (see `tabs:getConnection`)
      beforeEnter: async (to) => {
        to.meta.connection = await window.api.tabs.getConnection();

        return to.meta.connection ? true : { name: "Home" };
      },
    },
  ],
});
