<template>
  <v-card class="ma-6">
    <v-toolbar text color="primary" dark>
      <v-toolbar-title>MQTT Connection</v-toolbar-title>
    </v-toolbar>
    <v-btn text v-on:click="connectToMqtt">Connect</v-btn>
  </v-card>
</template>

<script>
export default {
  name: "Home",

  data: () => ({}),

  methods: {
    connectToMqtt() {
      this.$router.push({ name: "Viewer" });
    },
  },
};
</script>
