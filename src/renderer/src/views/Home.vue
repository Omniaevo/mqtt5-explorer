<template>
  <div class="connection-container">
    <v-app-bar flat>
      <div
        class="title ms-4"
        style="cursor: pointer"
        @click="scrollTabs('top')"
      >
        MQTT Connections
      </div>
      <v-spacer />
      <v-text-field
        v-model="searchConnection"
        label="Search connections"
        variant="outlined"
        density="compact"
        clearable
        hide-details
      />
      <v-spacer />
      <v-tooltip location="bottom">
        <template #activator="{ props: tooltipProps }">
          <v-btn
            v-bind="tooltipProps"
            class="me-2"
            color="primary"
            icon="mdi-plus"
            variant="tonal"
            size="small"
            @click="addTmpConnection"
          />
        </template>
        <span>New connection</span>
      </v-tooltip>
    </v-app-bar>

    <v-navigation-drawer
      v-model="settingsDrawer"
      width="560"
      location="right"
      floating
      temporary
    >
      <v-list>
        <v-list-item>
          <v-select
            v-model="settings.theme"
            :items="THEMES"
            :variant="fieldVariant"
            label="Theme"
            hide-details
          />
        </v-list-item>

        <v-list-item>
          <v-select
            v-model="settings.primaryColor"
            :items="COLORS"
            :variant="fieldVariant"
            item-title="text"
            item-value="value"
            label="Primary color"
            hide-details
            return-object
          >
            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps">
                <template #append>
                  <v-icon :color="item.raw.value[themeMode]">
                    {{
                      settings.isDark
                        ? "mdi-moon-waning-crescent"
                        : "mdi-white-balance-sunny"
                    }}
                  </v-icon>
                </template>
              </v-list-item>
            </template>
          </v-select>
        </v-list-item>

        <v-list-item>
          <div class="settings-switches">
            <v-switch
              v-model="settings.outline"
              label="Outlined fields"
              color="primary"
              hide-details
              inset
            />
            <v-switch
              v-model="settings.denseTree"
              label="Dense topics tree"
              color="primary"
              hide-details
              inset
            />
            <v-switch
              v-model="settings.closeTray"
              label="Close to system tray"
              color="primary"
              hide-details
              inset
            />
          </div>
        </v-list-item>

        <v-divider class="mx-3" />

        <v-list-item>
          <v-text-field
            v-model="settings.clientId"
            :variant="fieldVariant"
            label="MQTT Client ID"
            clearable
            hide-details
          />
        </v-list-item>

        <v-list-item>
          <v-select
            v-model="settings.keepalive"
            :items="KEEPALIVE_OPTIONS"
            :variant="fieldVariant"
            label="MQTT Keepalive (in seconds)"
            hide-details
          />
        </v-list-item>

        <v-list-item>
          <div class="d-flex" style="gap: 1em">
            <v-select
              v-model="settings.reconnectPeriod"
              :items="RECONNECT_PERIOD_OPTIONS"
              :variant="fieldVariant"
              label="MQTT Reconnect period (in seconds)"
              hide-details
            />
            <v-select
              v-model="settings.maxReconnects"
              :items="MAX_RECONNECTS_OPTIONS"
              :variant="fieldVariant"
              label="Max number of reconnects (0 for disabling)"
              hide-details
            />
          </div>
        </v-list-item>

        <v-list-item>
          <v-select
            v-model="settings.connectTimeout"
            :items="CONNECT_TIMEOUT_OPTIONS"
            :variant="fieldVariant"
            label="MQTT Connection timeout (in seconds)"
            hide-details
          />
        </v-list-item>

        <v-divider class="mx-3" />

        <v-list density="compact">
          <v-list-subheader>Keyboard shortcuts</v-list-subheader>
          <v-list-item
            v-for="shortcut in SHORTCUTS"
            :key="shortcut.label"
            :title="shortcut.label"
          >
            <template #append>
              <span class="text-caption"
                >{{ modifierKey }} + {{ shortcut.keys }}</span
              >
            </template>
          </v-list-item>
        </v-list>
      </v-list>

      <template #append>
        <div class="d-flex justify-center pa-2">
          <v-btn
            color="primary"
            prepend-icon="mdi-bug"
            size="x-small"
            variant="text"
            @click="openBugsUrl"
          >
            Report a bug
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <div class="ma-2 connection-area">
      <v-card ref="tabsList" class="conn-tabs-container" flat>
        <v-tabs v-model="tabId" direction="vertical">
          <v-tab
            v-for="(connection, i) in connections.brokerConnections"
            v-show="filteredConnectionIds.has(connection.id)"
            :key="'tab-' + connection.id"
            :value="i"
            class="tabs-left"
          >
            <div class="tab-truncate" :class="{ 'text-primary': tabId === i }">
              {{ connection.name }}
            </div>
          </v-tab>
        </v-tabs>
      </v-card>

      <v-tabs-window v-model="tabId" class="tab-items-container">
        <v-tabs-window-item
          v-for="(connection, i) in connections.brokerConnections"
          :key="'connection-' + connection.id"
          :value="i"
          class="tab-items-container"
        >
          <ConnectionForm
            :properties="connection"
            @connect="connect($event, i)"
            @delete="confirmDelete(i)"
            @updated="dataChanged($event, i)"
          />
        </v-tabs-window-item>
      </v-tabs-window>
    </div>

    <div class="foot-bar">
      <div class="text-caption text-grey client-id pa-2">
        <span>Client ID:</span>
        <span class="text-primary font-weight-bold">{{
          settings.clientId
        }}</span>
      </div>

      <div class="app-version text-grey pa-2">
        <div class="d-flex align-center">
          <v-img :src="logo" class="me-1" width="1.4em" />
          v{{ version }}
        </div>
      </div>
    </div>

    <!-- Connection deletion confirmation -->
    <v-dialog v-model="deleteDialog" max-width="50ch" persistent>
      <v-card v-if="connectionToDelete">
        <v-card-title>Confirm delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete
          <span class="font-weight-black"
            >"{{ connectionToDelete.name }}"?</span
          >
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelDelete">Cancel</v-btn>
          <v-btn color="error" variant="text" @click="deleteConnection">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeMount, onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";
import ConnectionForm from "../components/ConnectionForm.vue";
import ConnectionProperties from "../models/ConnectionProperties";
import { useConnectionsStore } from "../stores/connections";
import { useNotifyStore } from "../stores/notify";
import { useSettingsStore } from "../stores/settings";
import { isMacOs } from "../utils/platform";
import logo from "../assets/logo.svg";

const THEMES = [
  { title: "Light", value: "light" },
  { title: "Dark", value: "dark" },
];
const KEEPALIVE_OPTIONS = [60, 120, 180, 240, 300];
const RECONNECT_PERIOD_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const MAX_RECONNECTS_OPTIONS = [0, 5, 10, 15, 20];
const CONNECT_TIMEOUT_OPTIONS = [10, 20, 30, 40, 50, 60, 120, 180, 240, 300];

const COLORS = [
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
];

const SHORTCUTS = [
  { label: "Edit settings", keys: "COMMA" },
  { label: "Toggle search", keys: "F" },
  { label: "Notifications and logging", keys: "Shift + N" },
  { label: "Reload the page", keys: "R" },
  { label: "Force reload the page", keys: "Shift + R" },
  { label: "Quit the app", keys: "Q" },
  { label: "Show shortcuts dialog", keys: "K" },
  { label: "About the app", keys: "I" },
];

const router = useRouter();
const settings = useSettingsStore();
const connections = useConnectionsStore();
const notify = useNotifyStore();

const version = import.meta.env.VITE_APP_VERSION;
const modifierKey = isMacOs ? "Cmd" : "Ctrl";

const tabId = ref(0);
const settingsDrawer = ref(false);
const searchConnection = ref("");
const deleteDialog = ref(false);
const deleteIndex = ref(-1);
const tabsList = ref(null);

const fieldVariant = computed(() =>
  settings.outline ? "outlined" : "underlined"
);
const themeMode = computed(() => (settings.isDark ? "dark" : "light"));

const connectionToDelete = computed(
  () => connections.brokerConnections[deleteIndex.value]
);

const filteredConnectionIds = computed(() => {
  const search = (searchConnection.value || "").toLowerCase();

  return new Set(
    connections.brokerConnections
      .filter((c) => c.name.toLowerCase().includes(search))
      .map((c) => c.id)
  );
});

function scrollTabs(to = "bottom") {
  nextTick(() => {
    const tabs = tabsList.value?.$el;

    tabs?.scroll({
      top: to === "bottom" ? tabs.scrollHeight : 0,
      behavior: "smooth",
    });
  });
}

function toggleSettingsDrawer() {
  settingsDrawer.value = !settingsDrawer.value;
}

function addTmpConnection() {
  connections.add(new ConnectionProperties());
  searchConnection.value = "";
  tabId.value = connections.brokerConnections.length - 1;
  scrollTabs("bottom");
}

function dataChanged(data, index) {
  data.saved = true;
  connections.update(index, data);
  connections.persist();
}

function connect(data, index) {
  dataChanged(data, index);
  router.push({ name: "Viewer", params: { index } });
}

function confirmDelete(index) {
  deleteIndex.value = index;
  deleteDialog.value = true;
}

function cancelDelete() {
  deleteDialog.value = false;
  deleteIndex.value = -1;
}

function deleteConnection() {
  connections.remove(deleteIndex.value, () => {
    connections.persist();
    tabId.value = 0;
    scrollTabs("top");
  });
  deleteDialog.value = false;
}

function exportConnectionData() {
  const json = JSON.stringify(connections.savedConnections, null, 2);
  const download = document.createElement("a");

  download.href = URL.createObjectURL(
    new Blob([json], { type: "application/json" })
  );
  download.download = `connections-${Date.now()}.json`;
  download.click();
  URL.revokeObjectURL(download.href);
}

function importConnectionData(fileContent) {
  try {
    const imported = (JSON.parse(fileContent) || []).filter(
      ConnectionProperties.validate
    );

    // Generate IDs if missing (retro-compatibility)
    imported.forEach((connection) => {
      connection.id = connection.id || crypto.randomUUID();
    });

    connections.replaceAll(imported);
    connections.persist();
    tabId.value = 0;
  } catch {
    notify.error("The selected file is not a valid connections file");
  }
}

function openBugsUrl() {
  window.api.app.openExternal(import.meta.env.VITE_GITHUB_BUGS);
}

let unsubscribeMenuEvents = [];

onBeforeMount(() => {
  if (connections.brokerConnections.length === 0) addTmpConnection();
  else tabId.value = connections.selectedConnectionId;

  window.api.app.sendPage("home");
  unsubscribeMenuEvents = [
    window.api.app.on("settingsPressed", toggleSettingsDrawer),
    window.api.app.on("exportDataPressed", exportConnectionData),
    window.api.app.on("importDataPressed", importConnectionData),
  ];
});

onBeforeUnmount(() => {
  connections.setSelectedConnectionId(tabId.value);
  unsubscribeMenuEvents.forEach((unsubscribe) => unsubscribe());
});
</script>

<style scoped>
.connection-container {
  height: calc(100vh - var(--v-layout-top, 0px));
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr min-content;
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

.settings-switches {
  display: flex;
  flex-wrap: wrap;
  gap: 0 1em;
}

.foot-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-version {
  font-size: 0.8rem;
}

.client-id {
  display: flex;
  gap: 0.5em;
  align-items: center;
}
</style>
