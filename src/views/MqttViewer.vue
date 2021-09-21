<template>
  <v-card class="ma-6">{{ client }}</v-card>
</template>

<script>
import Connection from "../utils/Connection";

export default {
  name: "MqttViewer",

  data: () => ({
    client: undefined,
  }),

  beforeMount() {
    this.client = new Connection(
      "gcloud",
      "35.195.129.171",
      "1883",
      "omniaevo",
      "poiqwe10"
    ).connectToMqtt();
  },

  methods: {},
};
</script>
