import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";
import MqttViewer from "../views/MqttViewer.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/viewer/:index",
    name: "Viewer",
    component: MqttViewer,
  },
];

const router = new VueRouter({
  routes,
});

export default router;
