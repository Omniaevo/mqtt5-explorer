<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>

    <v-snackbar
      v-model="onMsg"
      v-bind:timeout="5000"
      color="error"
      elevation="4"
      centered
      top
    >
      {{ message }}

      <template v-slot:action="{ attrs }">
        <v-btn v-bind="attrs" v-on:click="onMsg = false" icon>
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<style>
.rounded {
  border-radius: 10vw;
}
</style>

<script>
export default {
  name: "App",

  data: () => ({
    onMsg: false,
    message: undefined,
  }),

  beforeMount() {
    this.loadCustomCssTheme(this.darkTheme);
    this.$bus.$on("error", this.displayMsg);
    this.loadSettings();
    this.loadConnections();
  },

  beforeDestroy() {
    this.$bus.$off("error", this.displayMsg);
  },

  watch: {
    theme(newValue) {
      const isDark = (newValue || "light") === "dark";

      this.loadCustomCssTheme(isDark);
      this.persistSettings();
      this.$vuetify.theme.dark = isDark;
    },
  },

  methods: {
    displayMsg(message) {
      this.message = message;
      this.onMsg = true;
    },
  },
};
</script>
