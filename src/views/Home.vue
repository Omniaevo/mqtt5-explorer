<template>
  <v-container class="connection-container">
    <v-app-bar v-bind:color="darkTheme ? 'gray' : 'white'" app flat>
      <div class="d-flex align-center">
        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              v-on:click="settingsDrawer = !settingsDrawer"
              v-on="on"
              icon
            >
              <v-icon>mdi-{{ settingsDrawer ? "chevron-left" : "cog" }}</v-icon>
            </v-btn>
          </template>
          <span>{{ settingsDrawer ? "Close a" : "A" }}pp settings</span>
        </v-tooltip>
      </div>
    </v-app-bar>

    <v-navigation-drawer v-model="settingsDrawer" app temporary>
      <v-list>
        <v-list-item>
          <v-list-item-content>
            <v-select
              v-model="selectedTheme"
              v-bind:items="['light', 'dark']"
              label="Theme"
            >
              <template v-slot:item="{ item }">
                <div class="text-capitalize">{{ item }}</div>
              </template>

              <template v-slot:selection="{ item }">
                <div class="text-capitalize">{{ item }}</div>
              </template>
            </v-select>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-card class="card-width">
      <v-toolbar color="primary" dark flat text>
        <v-toolbar-title>MQTT Connection</v-toolbar-title>
        <v-spacer />
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
                v-on:connect="connect($event, i)"
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
  height: 41ch !important;
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
    settingsDrawer: false,
    defaultConnectionData: new ConnectionProperties(),
  }),

  computed: {
    selectedTheme: {
      get() {
        return this.$store.getters.getTheme;
      },
      set(newValue) {
        this.$store.commit("setTheme", newValue);
      },
    },
  },

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
    connect(data, index) {
      this.dataChanged(data, index);
      this.$router.push({ path: `viewer/${index}` });
    },
  },
};
</script>
