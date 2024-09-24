<template>
  <div class="connection-container">
    <v-app-bar flat>
      <div v-on:click="scrollTabs('top')" class="title" style="cursor: pointer">
        MQTT Connections
      </div>
      <v-spacer />
      <v-text-field
        v-model="searchConnection"
        label="Search connections"
        clearable
        dense
        hide-details
        outlined
      />
      <v-spacer />
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            v-bind="attrs"
            v-on:click="addTmpConnection"
            v-on="on"
            class="me-2"
            color="primary"
            fab
            small
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </template>
        <span>New connection</span>
      </v-tooltip>
    </v-app-bar>

    <v-navigation-drawer
      v-model="settingsDrawer"
      width="62ch"
      app
      floating
      right
      temporary
    >
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
            >
              <template v-slot:item="{ item, on, attrs }">
                <v-list-item v-bind="attrs" v-on="on" selectable>
                  <v-list-item-content>{{ item.text }}</v-list-item-content>
                  <v-list-item-action>
                    <v-icon v-if="!darkTheme" v-bind:color="item.value.light">
                      mdi-white-balance-sunny
                    </v-icon>
                    <v-icon v-else v-bind:color="item.value.dark">
                      mdi-moon-waning-crescent
                    </v-icon>
                  </v-list-item-action>
                </v-list-item>
              </template>
            </v-select>
          </v-list-item-content>
        </v-list-item>

        <v-list-item>
          <v-list-item-content class="px-3">
            <div class="d-flex justify-space-between" style="gap: 1em">
              <v-switch
                v-model="selectedOutline"
                label="Outlined fields"
                inset
              />
              <v-switch
                v-model="selectedCloseToTray"
                label="Close to system tray"
                inset
              />
            </div>
          </v-list-item-content>
        </v-list-item>

        <v-divider class="mx-3" />

        <v-list>
          <v-list-item>
            <v-list-item-content>
              <v-text-field
                v-model="selectClientId"
                v-bind:outlined="outline"
                label="MQTT Client ID"
                clearable
                hide-details
              />
            </v-list-item-content>
          </v-list-item>

          <v-list-item>
            <v-list-item-content>
              <v-select
                v-model.number="selectedKeepalive"
                v-bind:items="[60, 120, 180, 240, 300]"
                v-bind:outlined="outline"
                label="MQTT Keepalive (in seconds)"
                hide-details
              />
            </v-list-item-content>
          </v-list-item>

          <v-list-item>
            <v-list-item-content>
              <div class="d-flex" style="gap: 1em">
                <v-select
                  v-model.number="selectedReconnectPeriod"
                  v-bind:items="[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
                  v-bind:outlined="outline"
                  label="MQTT Reconnect period (in seconds)"
                  hide-details
                />

                <v-select
                  v-model.number="selectedMaxReconnects"
                  v-bind:items="[0, 5, 10, 15, 20]"
                  v-bind:outlined="outline"
                  label="Max number of reconnects (0 for disabling)"
                  hide-details
                />
              </div>
            </v-list-item-content>
          </v-list-item>

          <v-list-item>
            <v-list-item-content>
              <v-select
                v-model.number="selectedConnectTimeout"
                v-bind:items="[10, 20, 30, 40, 50, 60, 120, 180, 240, 300]"
                v-bind:outlined="outline"
                label="MQTT Connection timeout (in seconds)"
                hide-details
              />
            </v-list-item-content>
          </v-list-item>
        </v-list>

        <v-divider class="mx-3" />

        <v-list dense>
          <v-list-item>
            <v-list-item-action-text>
              Available shortcuts
            </v-list-item-action-text>
          </v-list-item>
          <v-list-item link>
            <v-list-item-content>Edit settings</v-list-item-content>
            <v-list-item-action-text>
              {{ isMacOs ? "Cmd" : "Ctrl" }} + COMMA
            </v-list-item-action-text>
          </v-list-item>
          <v-list-item link>
            <v-list-item-content>Toggle search</v-list-item-content>
            <v-list-item-action-text>
              {{ isMacOs ? "Cmd" : "Ctrl" }} + F
            </v-list-item-action-text>
          </v-list-item>
          <v-list-item link>
            <v-list-item-content>Notifications and logging</v-list-item-content>
            <v-list-item-action-text>
              {{ isMacOs ? "Cmd" : "Ctrl" }} + Shift + N
            </v-list-item-action-text>
          </v-list-item>
        </v-list>
      </v-list>

      <template v-slot:append>
        <v-list-item dense>
          <v-list-item-content>
            <div class="d-flex flex-row justify-center caption">
              <v-btn v-on:click="openBugsUrl" color="primary" text x-small>
                <v-icon class="me-2" small>mdi-bug</v-icon>
                Report a bug
              </v-btn>
            </div>
          </v-list-item-content>
        </v-list-item>
      </template>
    </v-navigation-drawer>

    <div class="ma-2 connection-area">
      <v-card id="tabs-list" class="conn-tabs-container" flat>
        <v-tabs v-model="tabId" vertical>
          <v-tab
            v-for="(connection, i) in connectionsAvailable"
            v-show="filteredConnectionIDs.includes(connection.id)"
            v-bind:key="'tab-' + i"
            v-bind:class="{
              'tabs-left': filteredConnectionIDs.includes(connection.id),
            }"
          >
            <div
              v-bind:class="{
                'tab-truncate': true,
                'primary--text': tabId === i,
                'text--lighten-2': darkTheme,
              }"
            >
              {{ connection.name }}
            </div>
          </v-tab>
        </v-tabs>
      </v-card>
      <v-tabs-items v-model="tabId" class="tab-items-container">
        <v-tab-item
          v-for="(connection, i) in connectionsAvailable"
          v-bind:key="'connection-' + connection.id"
          class="tab-items-container"
        >
          <ConnectionForm
            v-bind:properties="connection"
            v-on:connect="connect($event, i)"
            v-on:delete="confirmDelete(i)"
            v-on:updated="dataChanged($event, i)"
          />
        </v-tab-item>
      </v-tabs-items>
    </div>

    <div class="foot-bar">
      <div class="caption client-id grey--text pa-2">
        <span>Client ID:</span>
        <span class="primary--text font-weight-bold">{{ clientId }}</span>
      </div>

      <div class="caption grey--text pa-2">
        <div class="d-flex align-center">
          <v-img
            class="me-2"
            src="../assets/logo.svg"
            style="max-width: 1.5em"
          />
          v{{ version }}
        </div>
      </div>
    </div>

    <!-- Connection deletion confirmation -->
    <v-dialog
      v-if="deleteIndex >= 0 && deleteIndex < connectionsAvailable.length"
      v-model="deleteDialog"
      max-width="50ch"
      persistent
    >
      <v-card>
        <v-card-title>Confirm delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete
          <span class="font-weight-black">
            "{{ connectionsAvailable[deleteIndex].name }}"?
          </span>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            v-on:click="
              deleteDialog = false;
              deleteIndex = -1;
            "
            text
          >
            Cancel
          </v-btn>
          <v-btn
            v-on:click="
              deleteConnection(deleteIndex);
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
  </div>
</template>

<style scoped>
.connection-container {
  height: 100vh;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: min-content 1fr min-content;
}

.connection-area {
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 2fr;
  grid-template-rows: 1fr;
  gap: 1em;
}

.conn-tabs-container {
  overflow: auto;
}

.tab-items-container {
  width: 100%;
  height: 100%;
  background: transparent !important;
}

.tabs-left {
  display: flex;
  justify-content: left;
}

.tab-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.foot-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.client-id {
  display: flex;
  gap: 0.5em;
  align-items: center;
}
</style>

<script>
import ConnectionForm from "../components/ConnectionForm.vue";
import ConnectionProperties from "../models/ConnectionProperties";
import { shell, ipcRenderer } from "electron";

export default {
  name: "Home",

  components: { ConnectionForm },

  data: () => ({
    tabId: 0,
    deleteIndex: -1,
    settingsDrawer: false,
    deleteDialog: false,
    searchConnection: undefined,
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
    filteredConnectionIDs() {
      return this.connectionsAvailable
        .filter(
          (c) =>
            !this.searchConnection ||
            c.name.toLowerCase().includes(this.searchConnection.toLowerCase())
        )
        .map((c) => c.id);
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
    selectedCloseToTray: {
      get() {
        return this.$store.getters.getCloseToTray;
      },
      set(newValue) {
        this.$store.commit("setCloseToTray", newValue);
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
    selectClientId: {
      get() {
        return this.$store.getters.getClientId;
      },
      set(newValue) {
        this.$store.commit("setClientId", newValue);
      },
    },
    selectedKeepalive: {
      get() {
        return this.$store.getters.getKeepalive;
      },
      set(newValue) {
        this.$store.commit("setKeepalive", newValue);
      },
    },
    selectedReconnectPeriod: {
      get() {
        return this.$store.getters.getReconnect;
      },
      set(newValue) {
        this.$store.commit("setReconnect", newValue);
      },
    },
    selectedConnectTimeout: {
      get() {
        return this.$store.getters.getConnectTimeout;
      },
      set(newValue) {
        this.$store.commit("setConnectTimeout", newValue);
      },
    },
    selectedMaxReconnects: {
      get() {
        return this.$store.getters.getMaxReconnects;
      },
      set(newValue) {
        this.$store.commit("setMaxReconnects", newValue);
      },
    },
  },

  beforeMount() {
    if (this.connectionsAvailable.length == 0) this.addTmpConnection();
    else this.tabId = this.$store.getters.selectedConnectionId;

    ipcRenderer.send("enterHomePage");
    ipcRenderer.on("settingsPressed", this.toggleSettingsDrawer);
  },

  beforeDestroy() {
    this.$store.commit("setSelectedConnectionId", this.tabId);
    ipcRenderer.removeListener("settingsPressed", this.toggleSettingsDrawer);
  },

  methods: {
    scrollTabs(to = "bottom") {
      this.$nextTick(() => {
        const tabs = document.querySelector("#tabs-list");
        const direction = to === "bottom" ? tabs.scrollHeight : 0;

        tabs.scroll({ top: direction, behavior: "smooth" });
      });
    },
    toggleSettingsDrawer() {
      this.settingsDrawer = !this.settingsDrawer;
    },
    addTmpConnection() {
      this.$store.commit("addNewConnection", new ConnectionProperties());
      this.searchConnection = undefined;
      this.tabId = this.connectionsAvailable.length - 1;
      this.scrollTabs("bottom");
    },
    dataChanged(data, index) {
      data.saved = true;

      this.$store.commit("updateConnection", { data, index });
      this.persistConnections();
    },
    confirmDelete(index) {
      this.deleteIndex = index;
      this.deleteDialog = true;
    },
    deleteConnection(index) {
      this.$store.commit("removeConnection", {
        index,
        callback: () => {
          this.persistConnections();
          this.tabId = 0;
          this.scrollTabs("top");
        },
      });
    },
    connect(data, index) {
      this.dataChanged(data, index);
      this.$router.push({ path: `viewer/${index}` });
    },
    openBugsUrl() {
      shell.openExternal(process.env.VUE_APP_GITHUB_BUGS);
    },
  },
};
</script>
