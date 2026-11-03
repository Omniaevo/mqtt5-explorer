<template>
  <div class="connection-container">
    <AppHeader>
      <template #start>
        <span class="title">MQTT Connections</span>
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
            @click="openNew"
          >
            <Plus :size="16" aria-hidden="true" />
          </AppButton>
        </AppTooltip>
      </template>
    </AppHeader>

    <ul class="connection-list" aria-label="Connections">
      <li
        v-for="connection in filteredConnections"
        :key="connection.id"
        class="connection-list__item"
      >
        <span class="connection-list__name">{{ connection.name }}</span>
        <span class="connection-list__url">{{ connection.protocol }}://{{ connection.host }}:{{ connection.port }}</span>
        <AppButton variant="text" color="primary" @click="connect(connection)">Connect</AppButton>
        <AppButton variant="text" @click="openEdit(connection)">Edit</AppButton>
        <AppButton variant="text" @click="duplicate(connection)">Duplicate</AppButton>
        <AppButton variant="text" color="danger" @click="confirmDelete(connection)">
          Delete
        </AppButton>
      </li>
    </ul>

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
import { Plus, X } from "@lucide/vue";
import ConnectionDialog from "../components/ConnectionDialog.vue";
import AppButton from "../components/ui/AppButton.vue";
import AppDialog from "../components/ui/AppDialog.vue";
import AppHeader from "../components/ui/AppHeader.vue";
import AppTextField from "../components/ui/AppTextField.vue";
import AppTooltip from "../components/ui/AppTooltip.vue";
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

const filteredConnections = computed(() => {
  const search = (searchConnection.value || "").toLowerCase();

  return connections.brokerConnections.filter((connection) =>
    connection.name.toLowerCase().includes(search)
  );
});

function openDialog(connection, mode) {
  editing.value = { connection, mode };
  dialogOpen.value = true;
}

function openNew() {
  searchConnection.value = "";
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
  } catch {
    notify.error("The selected file is not a valid connections file");
  }
}

let unsubscribeMenuEvents = [];

onBeforeMount(() => {
  unsubscribeMenuEvents = [
    window.api.app.on("exportDataPressed", exportConnectionData),
    window.api.app.on("importDataPressed", importConnectionData),
  ];
});

onBeforeUnmount(() => {
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
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  white-space: nowrap;
}

.search-field {
  inline-size: min(100%, 40ch);
  margin-inline: auto;
}

.connection-list {
  flex: 1;
  margin: var(--space-4);
  padding: 0;
  overflow: auto;
  list-style: none;
}

.connection-list__item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-5);
  border-block-end: 1px solid var(--color-border);
}

.connection-list__name {
  font-weight: var(--font-weight-medium);
}

.connection-list__url {
  flex: 1;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
}
</style>
