<template>
  <div class="home">
    <div class="home__column">
      <h1 class="home__brand">
        <img class="home__logo" :src="logo" alt="" width="24" height="24" />
        MQTT5 Explorer
      </h1>

      <AppTextField
        v-model="searchConnection"
        class="home__search"
        label="Search connections"
        label-hidden
        placeholder="Search connections"
      >
        <template #prepend-inner>
          <Search :size="16" aria-hidden="true" class="home__search-icon" />
        </template>
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

      <section v-if="connections.recentConnections.length" class="home__section">
        <h2 class="home__caption">Recent</h2>
        <ul class="home__tiles" aria-label="Recent connections">
          <ConnectionTile
            v-for="connection in connections.recentConnections"
            :key="connection.id"
            :connection="connection"
            :menu-items="menuItemsFor(connection)"
            :tab-state="tabStateOf(connection)"
            @connect="connect(connection)"
            @action="runAction($event, connection)"
          />
        </ul>
      </section>

      <section class="home__section">
        <div class="home__divider">
          <h2 class="home__divider-title">All connections</h2>
          <span class="home__divider-line" aria-hidden="true" />
          <AppButton variant="tonal" color="primary" @click="openNew">
            <Plus :size="16" aria-hidden="true" />
            New connection
          </AppButton>
        </div>
        <ul v-if="connections.otherConnections.length" class="home__list" aria-label="All connections">
          <ConnectionRow
            v-for="connection in connections.otherConnections"
            :key="connection.id"
            :connection="connection"
            :menu-items="menuItemsFor(connection)"
            :tab-state="tabStateOf(connection)"
            @connect="connect(connection)"
            @action="runAction($event, connection)"
          />
        </ul>
        <p v-else class="home__empty">{{ emptyListText }}</p>
      </section>
    </div>

    <ConnectionDialog
      v-if="editing"
      v-model:open="dialogOpen"
      :connection="editing.connection"
      :mode="editing.mode"
      @save="save"
      @connect="saveAndConnect"
      @connect-temp="connectTemporary"
    />

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
import { computed, onBeforeMount, onBeforeUnmount, ref } from "vue";
import { Copy, Download, Pencil, Pin, Plus, Search, Trash2, X } from "@lucide/vue";
import logo from "../assets/logo.png";
import ConnectionDialog from "../components/ConnectionDialog.vue";
import ConnectionRow from "../components/home/ConnectionRow.vue";
import ConnectionTile from "../components/home/ConnectionTile.vue";
import AppButton from "../components/ui/AppButton.vue";
import AppDialog from "../components/ui/AppDialog.vue";
import AppTextField from "../components/ui/AppTextField.vue";
import ConnectionProperties from "../models/ConnectionProperties";
import { useConnectionsStore } from "../stores/connections";
import { useNotifyStore } from "../stores/notify";
import toPlain from "../utils/toPlain";

const connections = useConnectionsStore();
const notify = useNotifyStore();

const searchConnection = ref("");
const deleteDialog = ref(false);
const connectionToDelete = ref(null);

/** Connection shown in the dialog: `{ connection, mode }`, or null before the first open. */
const editing = ref(null);
const dialogOpen = ref(false);

/** Reduced state of the open connection tabs, by connection id. */
const tabStates = ref(new Map());

const emptyListText = computed(() =>
  connections.recentConnections.length
    ? "No other connections."
    : "No connections yet."
);

function tabStateOf(connection) {
  return tabStates.value.get(connection.id)?.state;
}

function menuItemsFor(connection) {
  const canPin = tabStates.value.get(connection.id)?.pinned === false;

  return [
    { id: "edit", label: "Edit", icon: Pencil },
    { id: "duplicate", label: "Duplicate", icon: Copy },
    ...(canPin ? [{ id: "pin", label: "Pin tab", icon: Pin }] : []),
    { id: "export", label: "Export", icon: Download },
    { id: "delete", label: "Delete", icon: Trash2, danger: true, separatorBefore: true },
  ];
}

const MENU_ACTIONS = {
  edit: (connection) => openEdit(connection),
  duplicate: (connection) => duplicate(connection),
  pin: (connection) => window.api.tabs.pinConnection(connection.id),
  export: (connection) => downloadAsJson([connection], connection.name),
  delete: (connection) => confirmDelete(connection),
};

function runAction(actionId, connection) {
  MENU_ACTIONS[actionId](connection);
}

function openDialog(connection, mode) {
  editing.value = { connection, mode };
  dialogOpen.value = true;
}

function openNew() {
  openDialog(new ConnectionProperties(), "new");
}

function openEdit(connection) {
  openDialog(connection, "edit");
}

/** Edits an unsaved copy with a new id; it joins the list only on save. */
function duplicate(source) {
  const copy = new ConnectionProperties();

  copy.init(source);
  copy.id = crypto.randomUUID();
  copy.name = `${source.name} (copy)`;
  openDialog(copy, "edit");
}

/** Adds the connection, or replaces the one with the same id. */
function save(data) {
  const index = connections.brokerConnections.findIndex((c) => c.id === data.id);

  data.saved = true;
  if (index === -1) connections.add(data);
  else connections.update(index, data);
  connections.persist();
}

function connect(connection) {
  window.api.tabs.openConnection(toPlain(connection));
}

function saveAndConnect(data) {
  save(data);
  connect(data);
}

/** Opens a tab without saving the connection (D26). */
function connectTemporary(data) {
  connect(data);
}

function confirmDelete(connection) {
  connectionToDelete.value = connection;
  deleteDialog.value = true;
}

function cancelDelete() {
  deleteDialog.value = false;
  connectionToDelete.value = null;
}

function deleteConnection() {
  const index = connections.brokerConnections.indexOf(connectionToDelete.value);

  connections.remove(index, () => connections.persist());
  deleteDialog.value = false;
}

/** Downloads connections in the format the import reads. */
function downloadAsJson(list, fileLabel) {
  const json = JSON.stringify(list, null, 2);
  const download = document.createElement("a");

  download.href = URL.createObjectURL(
    new Blob([json], { type: "application/json" })
  );
  download.download = `${fileLabel}-${Date.now()}.json`;
  download.click();
  URL.revokeObjectURL(download.href);
}

function exportConnectionData() {
  downloadAsJson(connections.savedConnections, "connections");
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
  } catch {
    notify.error("The selected file is not a valid connections file");
  }
}

function setTabStates(states) {
  tabStates.value = new Map(states.map((state) => [state.connectionId, state]));
}

let unsubscribeMenuEvents = [];

onBeforeMount(() => {
  unsubscribeMenuEvents = [
    window.api.app.on("exportDataPressed", exportConnectionData),
    window.api.app.on("importDataPressed", importConnectionData),
    window.api.tabs.onConnectionStates(setTabStates),
  ];
  window.api.tabs.getConnectionStates().then(setTabStates);
});

onBeforeUnmount(() => {
  unsubscribeMenuEvents.forEach((unsubscribe) => unsubscribe());
});
</script>

<style scoped>
.home {
  block-size: 100vh;
  overflow: auto;
}

.home__column {
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
  inline-size: min(100%, 100ch);
  margin-inline: auto;
  margin-block-start: var(--space-8);
  padding-inline: var(--space-6);
  padding-block-end: var(--space-8);
}

.home__brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
}

.home__search {
  inline-size: min(100%, 60ch);
  margin-inline: auto;
}

.home__search-icon {
  flex: none;
  color: var(--color-text-muted);
}

.home__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.home__caption {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.home__tiles,
.home__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.home__tiles {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-5);
}

/* Narrow window: 2 tile columns */
@media (max-width: 600px) {
  .home__tiles {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.home__divider {
  display: flex;
  align-items: center;
  gap: var(--space-5);
}

.home__divider-title {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
}

.home__divider-line {
  flex: 1;
  block-size: 1px;
  background: var(--color-border);
}

.home__empty {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
</style>
