<template>
  <v-card class="ma-6">
    <v-btn v-on:click="disconnectFromMqtt">Disconnect</v-btn>
    <v-treeview v-bind:items="data" hoverable dense rounded open-on-click></v-treeview>
  </v-card>
</template>

<script>
import Connection from "../utils/Connection";

export default {
  name: "MqttViewer",

  data: () => ({
    client: undefined,
    data: [],
  }),

  beforeMount() {
    this.client = new Connection(
      "gcloud",
      "35.195.129.171",
      "1883",
      "omniaevo",
      "poiqwe10"
    );
    this.data = this.client.data;
  },

  methods: {
    disconnectFromMqtt() {
      this.client.disconnect();
      // this.data = [];
    },
  },
};
</script>
