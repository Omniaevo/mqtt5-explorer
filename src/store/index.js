import Vue from "vue";
import Vuex from "vuex";
import dataVuexModule from "./data";
import createPersistedState from "vuex-persistedstate";

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    data: dataVuexModule,
  },
  plugins: [createPersistedState()],
});
