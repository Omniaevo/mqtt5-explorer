import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/viewer",
    name: "Viewer",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/MqttViewer.vue"),
  },
];

const router = new VueRouter({
  routes,
});

export default router;
