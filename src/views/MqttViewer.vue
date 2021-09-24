<template>
  <div class="ma-4 explorer-grid-container">
    <v-card flat class="treeview-container">
      <v-btn v-on:click="disconnectFromMqtt">Disconnect</v-btn>
      <v-treeview
        v-bind:items="$connection.data"
        dense
        hoverable
        open-on-click
        rounded
        transition
      >
        <template slot="label" slot-scope="{ item, leaf }" class="ma-0">
          <div
            v-bind:class="{
              primary: item.blink,
              'white--text': item.blink,
              'px-2': true,
              rounded: true,
            }"
            v-on:click="getProperties(item)"
          >
            {{ item.name }}
            {{ item.value !== undefined ? "=" : "" }}
            <span class="font-weight-black">
              {{ item.value !== undefined ? item.value.payload : "" }}
            </span>
            <span v-if="leaf" class="caption grey--text ms-4">
              ({{ item.size }} elements inside)
            </span>
          </div>
        </template>
      </v-treeview>
    </v-card>

    <v-card flat class="properties-container">
      <v-card-title>{{ connectionProperties.name }}</v-card-title>
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
import ConnectionProperties from "../models/ConnectionProperties";

export default {
  name: "MqttViewer",

  data: () => ({
    connectionProperties: new ConnectionProperties(),
  }),

  beforeMount() {
    this.connectionProperties.init(
      this.$store.getters.getConnectionByIndex(this.$route.params.index)
    );
    this.$connection.init(this.connectionProperties);
  },

  mounted() {
    this.$connection.connect((err) => {
      console.error(err);
      this.disconnectFromMqtt();
    });
  },

  methods: {
    disconnectFromMqtt() {
      this.$connection.disconnect(() => this.$router.replace({ name: "Home" }));
    },
    getProperties(item) {
      console.log(item.value);
    },
  },
};
</script>
