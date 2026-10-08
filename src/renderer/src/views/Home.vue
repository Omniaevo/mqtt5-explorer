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

    <SettingsDialog v-model="settingsOpen" />

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
import SettingsDialog from "../components/SettingsDialog.vue";
import ConnectionProperties from "../models/ConnectionProperties";
import { useConnectionsStore } from "../stores/connections";
import { useNotifyStore } from "../stores/notify";
import { useSettingsStore } from "../stores/settings";
import logo from "../assets/logo.svg";

const router = useRouter();
const settings = useSettingsStore();
const connections = useConnectionsStore();
const notify = useNotifyStore();

const version = import.meta.env.VITE_APP_VERSION;

const tabId = ref(0);
const settingsOpen = ref(false);
const searchConnection = ref("");
const deleteDialog = ref(false);
const deleteIndex = ref(-1);
const tabsList = ref(null);

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

function toggleSettings() {
  settingsOpen.value = !settingsOpen.value;
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

let unsubscribeMenuEvents = [];

onBeforeMount(() => {
  if (connections.brokerConnections.length === 0) addTmpConnection();
  else tabId.value = connections.selectedConnectionId;

  window.api.app.sendPage("home");
  unsubscribeMenuEvents = [
    window.api.app.on("settingsPressed", toggleSettings),
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
