import Vue from "vue";
import Vuex from "vuex";
import dataVuexModule from "./data";
import settingsVuexModule from "./settings";

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    data: dataVuexModule,
    settings: settingsVuexModule,
  },
});
