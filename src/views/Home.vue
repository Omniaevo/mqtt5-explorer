<template>
  <v-container class="connection-container">
    <v-app-bar
      v-bind:color="darkTheme ? 'gray' : 'white'"
      class="transparent"
      app
      flat
    >
      <v-spacer />
      <div class="d-flex align-center">
        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              v-on:click="settingsDrawer = !settingsDrawer"
              v-on="on"
              icon
            >
              <v-icon>mdi-cog</v-icon>
            </v-btn>
          </template>
          <span>{{ settingsDrawer ? "Close a" : "A" }}pp settings</span>
        </v-tooltip>
      </div>
    </v-app-bar>

    <v-navigation-drawer v-model="settingsDrawer" app floating right temporary>
      <v-list>
        <v-list-item>
          <v-list-item-content>
            <v-select
              v-model="selectedTheme"
              v-bind:items="['light', 'dark']"
              v-bind:outlined="outline"
              label="Theme"
              hide-details
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

        <v-list-item>
          <v-list-item-content>
            <v-select
              v-model="selectedColor"
              v-bind:items="colors"
              v-bind:outlined="outline"
              item-text="text"
              item-value="value"
              label="Primary color"
              hide-details
              return-object
            />
          </v-list-item-content>
        </v-list-item>

        <v-list-item>
          <v-switch v-model="selectedOutline" label="Outlined fields" inset />
        </v-list-item>
      </v-list>

      <template v-slot:append>
        <v-list dense>
          <v-list-item>
            <v-list-item-content class="d-flex flex-row justify-end caption">
              <v-img
                class="me-4"
                src="../assets/logo.svg"
                style="max-width: 2em"
              />
              v{{ version }}
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </template>
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

      <div v-bind:class="'tab-no-overflow-' + outline" row>
        <div class="tab-scroll pe-5">
          <v-tabs v-model="tabId" class="tab-width" vertical>
            <v-tab
              v-for="(connection, i) in connectionsAvailable"
              v-bind:key="'tab-' + i"
            >
              <div
                v-bind:class="{
                  'tab-truncate': true,
                  'tab-width': true,
                  'text-left': true,
                  'primary--text': tabId === i,
                  'text--lighten-2': darkTheme,
                }"
              >
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
                v-on:delete="deleteDialog = true"
                v-on:updated="dataChanged($event, i)"
              />
            </v-card-text>

            <v-dialog v-model="deleteDialog" max-width="50ch" persistent>
              <v-card>
                <v-card-title>Confirm delete</v-card-title>
                <v-card-text>
                  Are you sure you want to delete
                  <span class="font-weight-black">
                    "{{ connection.name }}"?
                  </span>
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn v-on:click="deleteDialog = false" text> Cancel </v-btn>
                  <v-btn
                    v-on:click="
                      deleteConnection(i);
                      deleteDialog = false;
                    "
                    color="error"
                    text
                  >
                    Delete
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
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

.tab-no-overflow-false {
  height: 33ch !important;
  overflow: hidden !important;
}

.tab-no-overflow-true {
  height: 38ch !important;
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
    deleteDialog: false,
    colors: [
      { text: "Punchy Pink", value: { light: "#E91E63", dark: "#EC407A" } },
      { text: "Hipster Purple", value: { light: "#9C27B0", dark: "#AB47BC" } },
      { text: "Sober Purple", value: { light: "#673AB7", dark: "#7E57C2" } },
      { text: "Indie Indigo", value: { light: "#3F51B5", dark: "#5C6BC0" } },
      { text: "Usual Blue", value: { light: "#2196F3", dark: "#42A5F5" } },
      { text: "Delicate Cyan", value: { light: "#00BCD4", dark: "#00BCD4" } },
      { text: "Tasty Teal", value: { light: "#009688", dark: "#26A69A" } },
      { text: "Envy Green", value: { light: "#4CAF50", dark: "#66BB6A" } },
      { text: "Juicy Lime", value: { light: "#C0CA33", dark: "#C0CA33" } },
      { text: "Precious Amber", value: { light: "#FFB300", dark: "#FFB300" } },
      { text: "Original Orange", value: { light: "#FF5722", dark: "#FF7043" } },
      { text: "Boring Brown", value: { light: "#795548", dark: "#8D6E63" } },
      { text: "Metallic Grey", value: { light: "#607D8B", dark: "#78909C" } },
    ],
  }),

  computed: {
    version() {
      return process.env.VUE_APP_VERSION;
    },
    selectedTheme: {
      get() {
        return this.$store.getters.getTheme;
      },
      set(newValue) {
        this.$store.commit("setTheme", newValue);
      },
    },
    selectedOutline: {
      get() {
        return this.$store.getters.getOutline;
      },
      set(newValue) {
        this.$store.commit("setOutline", newValue);
      },
    },
    selectedColor: {
      get() {
        return this.$store.getters.getPrimaryColor;
      },
      set(newValue) {
        this.$store.commit("setPrimaryColor", newValue);
      },
    },
  },

  beforeMount() {
    if (this.connectionsAvailable.length == 0) this.addTmpConnection();
    else this.tabId = this.$store.getters.selectedConnectionId;
  },

  beforeDestroy() {
    this.$store.commit("setSelectedConnectionId", this.tabId);
  },

  methods: {
    addTmpConnection() {
      this.$store.commit("addNewConnection", this.defaultConnectionData);
      this.tabId = this.connectionsAvailable.length - 1;
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
