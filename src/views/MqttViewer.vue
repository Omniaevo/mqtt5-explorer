<template>
  <div class="ma-4 explorer-grid-container">
    <v-card flat class="treeview-container">
      <v-btn v-on:click="disconnectFromMqtt">Disconnect</v-btn>
      <v-treeview v-bind:items="data" hoverable dense rounded open-on-click>
        <template slot="label" slot-scope="{ item, leaf }" class="ma-0">
          <div v-if="leaf" v-on:click="getProperties(item)">
            {{ item.name }} =
            <span class="font-weight-black">
              {{ item.value.payload }}
            </span>
          </div>
          <div v-else>
            {{ item.name }}
            {{ item.value !== undefined ? "=" : "" }}
            <span class="font-weight-black">
              {{ item.value !== undefined ? item.value.payload : "" }}
            </span>
            <span class="caption grey--text ms-4">
              ({{ item.size }} elements inside)
            </span>
          </div>
        </template>
      </v-treeview>
    </v-card>

    <v-card flat class="properties-container">
      <v-card-title>Properties view</v-card-title>
    </v-card>
  </div>
</template>
<style scoped>
.explorer-grid-container {
  display: grid;
  grid-template-areas: "treeview explorer";
  grid-auto-columns: 1fr 2fr;
  gap: 1em;
}

.treeview-container {
  grid-area: "treeview";
  /* background-color: red; */
}

.properties-container {
  grid-area: "properties";
  /* background-color: blue; */
}
</style>

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
    },
    getProperties(item) {
      console.log(item.value);
    },
  },
};
</script>
