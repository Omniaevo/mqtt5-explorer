import { createRouter, createWebHashHistory } from "vue-router";
import Home from "../views/Home.vue";

const router = createRouter({
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

// Component gallery: dev builds only (P9)
if (import.meta.env.DEV) {
  router.addRoute({
    path: "/gallery",
    name: "Gallery",
    component: () => import("../views/Gallery.vue"),
  });
}

export default router;
