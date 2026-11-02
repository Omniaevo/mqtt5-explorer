<template>
  <div class="connection-container">
    <AppHeader>
      <template #start>
        <button class="title" type="button" @click="scrollTabs('top')">
          MQTT Connections
        </button>
      </template>

      <AppTextField
        v-model="searchConnection"
        class="search-field"
        label="Search connections"
        label-hidden
        placeholder="Search connections"
      >
        <template v-if="searchConnection" #append-inner>
          <AppButton
            variant="icon"
            size="sm"
            aria-label="Clear search"
            @click="searchConnection = ''"
          >
            <X :size="16" aria-hidden="true" />
          </AppButton>
        </template>
      </AppTextField>

      <template #end>
        <AppTooltip text="New connection">
          <AppButton
            variant="tonal"
            color="primary"
            aria-label="New connection"
            @click="addTmpConnection"
          >
            <Plus :size="16" aria-hidden="true" />
          </AppButton>
        </AppTooltip>
      </template>
    </AppHeader>

    <SettingsDialog v-model="settingsOpen" />

    <AppTabs
      ref="tabsRef"
      v-model="tabId"
      class="connection-area"
      orientation="vertical"
      aria-label="Connections"
      :tabs="connectionTabs"
    >
      <template
        v-for="(connection, i) in connections.brokerConnections"
        :key="connection.id"
        #[i]
      >
        <ConnectionForm
          :properties="connection"
          @connect="connect($event, i)"
          @delete="confirmDelete(i)"
          @updated="dataChanged($event, i)"
        />
      </template>
    </AppTabs>

    <footer class="foot-bar">
      <div class="client-id">
        <span>Client ID:</span>
        <span class="client-id__value">{{ settings.clientId }}</span>
      </div>

      <div class="app-version">
        <img class="app-version__logo" :src="logo" alt="" />
        v{{ version }}
      </div>
    </footer>

    <!-- Connection deletion confirmation -->
    <AppDialog
      v-model:open="deleteDialog"
      title="Confirm delete"
      persistent
      hide-close
    >
      <p v-if="connectionToDelete">
        Are you sure you want to delete
        <strong>"{{ connectionToDelete.name }}"?</strong>
      </p>
      <template #actions>
        <AppButton variant="text" @click="cancelDelete">Cancel</AppButton>
        <AppButton variant="text" color="danger" @click="deleteConnection">
          Delete
        </AppButton>
      </template>
    </AppDialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeMount, onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";
import { Plus, X } from "@lucide/vue";
import ConnectionForm from "../components/ConnectionForm.vue";
import SettingsDialog from "../components/SettingsDialog.vue";
import AppButton from "../components/ui/AppButton.vue";
import AppDialog from "../components/ui/AppDialog.vue";
import AppHeader from "../components/ui/AppHeader.vue";
import AppTabs from "../components/ui/AppTabs.vue";
import AppTextField from "../components/ui/AppTextField.vue";
import AppTooltip from "../components/ui/AppTooltip.vue";
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
const tabsRef = ref(null);

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

const connectionTabs = computed(() =>
  connections.brokerConnections.map((connection, index) => ({
    value: index,
    label: connection.name,
    hidden: !filteredConnectionIds.value.has(connection.id),
  }))
);

function scrollTabs(to = "bottom") {
  nextTick(() => {
    const tabs = tabsRef.value?.listElement;

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
  display: flex;
  flex-direction: column;
  block-size: 100vh;
}

.title {
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  white-space: nowrap;
  cursor: pointer;
}

.search-field {
  inline-size: min(100%, 40ch);
  margin-inline: auto;
}

.connection-area {
  --app-tabs-list-size: minmax(0, 2fr);
  --app-tabs-panel-size: minmax(0, 3fr);

  flex: 1;
  margin: var(--space-4);
  overflow: hidden;
}

/* Taller than wide: connection list on top, form below.
   Doubled class beats the wrapper's vertical-orientation rule. */
@media (orientation: portrait) {
  .connection-area.connection-area[data-orientation="vertical"] {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 2fr) minmax(0, 3fr);
  }
}

.connection-area :deep(.app-tabs__header) {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.foot-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  color: var(--color-text-muted);
}

.client-id {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  font-size: var(--font-size-sm);
}

.client-id__value {
  color: var(--color-primary);
  font-weight: var(--font-weight-bold);
}

.app-version {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  font-size: var(--font-size-sm);
}

.app-version__logo {
  inline-size: 1.4em;
  block-size: 1.4em;
}
</style>
