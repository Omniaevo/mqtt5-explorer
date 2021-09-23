<template>
  <v-container class="connection-container">
    <v-card>
      <v-toolbar color="primary" text flat dark>
        <v-btn
          v-on:click="addNewConnection"
          color="pink"
          class="me-2"
          fab
          left
          small
        >
          <v-icon>mdi-plus</v-icon>
        </v-btn>
        <v-toolbar-title>MQTT Connection</v-toolbar-title>
      </v-toolbar>

      <div row>
        <v-tabs v-on:change="changeTab" style="max-width: 10em;" v-model="tabId" vertical>
          <v-tab v-for="(conn, i) in connectionsAvailable" v-bind:key="i">
            {{ conn.name }}
          </v-tab>
        </v-tabs>

        <v-tabs-items v-model="tabId">
          <v-tab-item v-for="(conn, i) in connectionsAvailable" v-bind:key="i">
            <v-card-text>
              <!-- Input form -->
              <ConnectionForm
                v-bind:data="connectionsAvailable[i]"
                v-on:update="dataChanged($event, i)"
              />
            </v-card-text>
          </v-tab-item>
        </v-tabs-items>
      </div>
    </v-card>
  </v-container>
</template>

<style scoped>
.connection-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

div[row] {
  display: flex;
  flex-direction: row;
  gap: 1.5em;
}
</style>

<script>
import ConnectionForm from "../components/ConnectionForm.vue";

export default {
  name: "Home",

  components: { ConnectionForm },

  data: () => ({
    connectionsAvailable: [],
    defaultConnectionData: {
      name: "new-connection",
      host: undefined,
      port: "1883",
      username: undefined,
      password: undefined,
    },
    tabId: 0,
  }),

  beforeMount() {
    if (this.$store.getters.getAllConnections.length > 0) {
      this.connectionsAvailable = this.$store.getters.getAllConnections;
    } else {
      // New connection empty
      this.connectionsAvailable.push(this.defaultConnectionData);
    }
  },

  methods: {
    addNewConnection() {
      this.connectionsAvailable.push(this.defaultConnectionData);
      console.log("add new connection", this.connectionsAvailable);
    },
    changeTab(tab) {
      console.log(tab);
    },
    dataChanged(data, index) {
      console.log(data, index);
      // this.$store.commit("updateConnection", data, index);
    },
  },
};
</script>
