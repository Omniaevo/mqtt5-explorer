<template>
  <v-app>
    <v-main v-bind:class="{ 'blue-grey': !darkTheme, 'lighten-5': !darkTheme }">
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
  overflow: hidden;
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
    this.loadColors(this.primaryColor);
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
    outline() {
      this.persistSettings();
    },
    clientId() {
      this.persistSettings();
    },
    keepalive() {
      this.persistSettings();
    },
    reconnectPeriod() {
      this.persistSettings();
    },
    connectTimeout() {
      this.persistSettings();
    },
    maxReconnects() {
      this.persistSettings();
    },
    primaryColor: {
      deep: true,
      handler(newValue) {
        this.loadColors(newValue);
        this.persistSettings();
      },
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
