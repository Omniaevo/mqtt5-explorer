<template>
  <v-container class="connection-container">
    <v-card class="card-width">
      <v-toolbar color="primary" dark flat text>
        <v-toolbar-title>MQTT Connection</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              v-on:click="addTmpConnection"
              v-on="on"
              class="me-2"
              fab
              light
              small
            >
              <v-icon color="primary">mdi-plus</v-icon>
            </v-btn>
          </template>
          <span>New connection</span>
        </v-tooltip>
      </v-toolbar>

      <div class="tab-no-overflow" row>
        <div class="tab-scroll pe-5">
          <v-tabs v-model="tabId" class="tab-width" vertical>
            <v-tabs-slider color="primary lighten-3"></v-tabs-slider>

            <v-tab
              v-for="(connection, i) in connectionsAvailable"
              v-bind:key="'tab-' + i"
            >
              <div class="tab-truncate tab-width text-left">
                {{ connection.name }}
              </div>
            </v-tab>
          </v-tabs>
        </div>

        <v-tabs-items v-model="tabId">
          <v-tab-item
            v-for="(connection, i) in connectionsAvailable"
            v-bind:key="i"
          >
            <v-card-text>
              <!-- Input form -->
              <ConnectionForm
                v-bind:properties="connection"
                v-on:connect="connect(i)"
                v-on:delete="deleteConnection(i)"
                v-on:updated="dataChanged($event, i)"
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

.card-width {
  width: 70ch;
}

.tab-width {
  width: 16ch;
}

.tab-no-overflow {
  height: 34ch !important;
  overflow: hidden !important;
}

.tab-scroll {
  overflow: auto !important;
  overflow-x: hidden !important;
}

.tab-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

<script>
import ConnectionForm from "../components/ConnectionForm.vue";
import ConnectionProperties from "../models/ConnectionProperties";

export default {
  name: "Home",

  components: { ConnectionForm },

  data: () => ({
    tabId: 0,
    defaultConnectionData: new ConnectionProperties(),
  }),

  beforeMount() {
    if (this.connectionsAvailable.length == 0) this.addTmpConnection();
  },

  methods: {
    addTmpConnection() {
      this.$store.commit("addNewConnection", this.defaultConnectionData);
    },
    dataChanged(data, index) {
      data.saved = true;

      this.$store.commit("updateConnection", { data, index });
      this.persistConnections();
    },
    deleteConnection(index) {
      this.tabId = 0;
      this.$store.commit("removeConnection", index);
    },
    connect(index) {
      this.$router.push({ path: `viewer/${index}` });
    },
  },
};
</script>
