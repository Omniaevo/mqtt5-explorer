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
        <v-tabs
          v-model="tabId"
          v-on:change="onChangeCallback"
          class="tab-width"
          vertical
        >
          <v-tab v-for="(conn, i) in connectionsAvailable" v-bind:key="i">
            <div class="tab-truncate tab-width text-left">{{ conn.name }}</div>
          </v-tab>
        </v-tabs>

        <v-tabs-items v-model="tabId">
          <v-tab-item v-for="(conn, i) in connectionsAvailable" v-bind:key="i">
            <v-card-text>
              <!-- Input form -->
              <ConnectionForm
                v-bind:data="conn"
                v-on:updated="dataChanged($event, i)"
                v-on:delete="deleteConnection(i)"
                v-on:connect="connect(i)"
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

.tab-width {
  width: 16ch;
}

.tab-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

<script>
import ConnectionForm from "../components/ConnectionForm.vue";

export default {
  name: "Home",

  components: { ConnectionForm },

  data: () => ({
    tabId: 0,
    onChangeCallback: () => {},
    defaultConnectionData: {
      name: "new-connection",
      host: undefined,
      port: "1883",
      username: undefined,
      password: undefined,
    },
  }),

  beforeMount() {
    // Load stored connections
    if (this.connectionsAvailable.length == 0) this.addNewConnection();
  },

  computed: {
    connectionsAvailable() {
      return this.$store.getters.getAllConnections;
    },
  },

  methods: {
    addNewConnection() {
      this.$store.commit("addNewConnection", this.defaultConnectionData);
    },
    dataChanged(data, index) {
      this.$store.commit("updateConnection", { data, index });
    },
    deleteConnection(index) {
      this.onChangeCallback = () => {
        this.$store.commit("removeConnection", index);
        this.onChangeCallback = () => {};
      };
      this.tabId = 0;
    },
    connect(index) {
      this.$router.push({ path: `viewer/${index}` });
    },
  },
};
</script>
