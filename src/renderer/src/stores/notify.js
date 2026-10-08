import { defineStore } from "pinia";

/** State of the global snackbar. Replaces the old `$bus` events. */
export const useNotifyStore = defineStore("notify", {
  state: () => ({
    visible: false,
    message: undefined,
    color: "error",
  }),

  actions: {
    show(message, color) {
      this.message = message;
      this.color = color;
      this.visible = true;
    },

    info(message) {
      this.show(message, "info");
    },

    error(message) {
      this.show(message, "error");
    },
  },
});
