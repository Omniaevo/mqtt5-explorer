import Vue from "vue";
import Vuex from "vuex";
import dataVuexModule from "./data";

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    data: dataVuexModule,
  },
});
