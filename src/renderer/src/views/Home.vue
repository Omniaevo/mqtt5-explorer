<template>
  <div class="home-page" :class="wallpaperClasses">
    <div class="home">
      <div class="home__column">
        <h1 class="home__brand">
          <img class="home__logo" :src="logo" alt="" width="24" height="24" />
          MQTT5 Explorer
        </h1>

        <AppTextField
          ref="searchField"
          v-model="searchConnection"
          class="home__search"
          label="Search connections"
          label-hidden
          placeholder="Search connections or type a broker URL"
          @keydown.enter="connectFromSearch"
          @keydown.esc="clearSearch"
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

        <QuickConnectRow
          v-if="quickConnectTarget"
          :url="connectionUrl(quickConnectTarget)"
          @connect="connectQuick"
        />

        <section v-if="recentConnections.length" class="home__section">
          <h2 class="home__caption">Recent connections</h2>
          <ul class="home__tiles" aria-label="Recent connections">
            <ConnectionTile
              v-for="connection in recentConnections"
              :key="connection.id"
              :connection="connection"
              :query="searchConnection"
              :menu-items="menuItemsFor(connection)"
              :tab-state="tabStateOf(connection)"
              @connect="connect(connection)"
              @action="runAction($event, connection)"
            />
          </ul>
        </section>

        <TopicSearchResults
          v-if="topicGroups.length"
          :groups="topicGroups"
          :query="searchConnection"
          @open="openTopic"
        />

        <section class="home__section">
          <div class="home__divider">
            <h2 class="home__divider-title">All connections</h2>
            <span class="home__divider-line" aria-hidden="true" />
            <AppButton variant="tonal" color="primary" @click="openNew">
              <Plus :size="16" aria-hidden="true" />
              New connection
            </AppButton>
          </div>
          <ul v-if="otherConnections.length" class="home__list home__panel" aria-label="All connections">
            <ConnectionRow
              v-for="connection in otherConnections"
              :key="connection.id"
              :connection="connection"
              :query="searchConnection"
              :menu-items="menuItemsFor(connection)"
              :tab-state="tabStateOf(connection)"
              @connect="connect(connection)"
              @action="runAction($event, connection)"
            />
          </ul>
          <p v-else-if="emptyListText" class="home__empty home__panel">{{ emptyListText }}</p>
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
  </div>
</template>

<script setup>
import { computed, onBeforeMount, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";
import { Copy, Download, Pencil, Pin, Plus, Search, Trash2, X } from "@lucide/vue";
import logo from "../assets/logo.png";
import ConnectionDialog from "../components/ConnectionDialog.vue";
import ConnectionRow from "../components/home/ConnectionRow.vue";
import QuickConnectRow from "../components/home/QuickConnectRow.vue";
import TopicSearchResults from "../components/home/TopicSearchResults.vue";
import ConnectionTile from "../components/home/ConnectionTile.vue";
import AppButton from "../components/ui/AppButton.vue";
import AppDialog from "../components/ui/AppDialog.vue";
import AppTextField from "../components/ui/AppTextField.vue";
import { useDebouncedRef } from "../composables/useDebouncedRef";
import ConnectionProperties from "../models/ConnectionProperties";
import { useConnectionsStore } from "../stores/connections";
import { useNotifyStore } from "../stores/notify";
import { useSettingsStore } from "../stores/settings";
import { wallpaperClasses as buildWallpaperClasses } from "../utils/wallpapers";
import connectionMatches from "../utils/connectionMatches";
import parseBrokerUrl from "../utils/parseBrokerUrl";
import toPlain from "../utils/toPlain";
import { connectionUrl } from "../../../shared/connectionUrl";
import { MenuEvent } from "../../../shared/ipcChannels";

const connections = useConnectionsStore();
const notify = useNotifyStore();
const settings = useSettingsStore();
const wallpaperClasses = computed(() => buildWallpaperClasses(settings.wallpaper));

const TOPIC_SEARCH_DEBOUNCE_MS = 250;
const TOPIC_SEARCH_MIN_LENGTH = 2;

const searchConnection = ref("");
const debouncedSearch = useDebouncedRef(searchConnection, TOPIC_SEARCH_DEBOUNCE_MS);

/** Topics found in the connected tabs: `[{ tabId, title, topics }]`. */
const topicGroups = ref([]);
let topicSearchCount = 0;
const deleteDialog = ref(false);
const connectionToDelete = ref(null);

/** Connection shown in the dialog: `{ connection, mode }`, or null before the first open. */
const editing = ref(null);
const dialogOpen = ref(false);

/** Reduced state of the open connection tabs, by connection id. */
const tabStates = ref(new Map());

const searchField = useTemplateRef("searchField");

const recentConnections = computed(() =>
  connections.recentConnections.filter(matchesSearch)
);
const otherConnections = computed(() =>
  connections.otherConnections.filter(matchesSearch)
);

/** Broker URL typed in the search field, or undefined when the text is not one. */
const quickConnectTarget = computed(() => parseBrokerUrl(searchConnection.value));

const emptyListText = computed(() => {
  if (searchConnection.value.trim()) {
    return recentConnections.value.length || quickConnectTarget.value
      ? ""
      : "No connections match your search.";
  }

  return connections.recentConnections.length
    ? "No other connections."
    : "No connections yet.";
});

/** Asks main for the matching topics; an answer that is not the latest one is dropped. */
async function searchTopics(text) {
  const query = text.trim();
  const searchId = ++topicSearchCount;

  if (query.length < TOPIC_SEARCH_MIN_LENGTH) {
    topicGroups.value = [];
    return;
  }

  const groups = await window.api.search.topics(query);

  if (searchId === topicSearchCount) topicGroups.value = groups;
}

watch(debouncedSearch, searchTopics);

function openTopic(tabId, topic) {
  window.api.search.openTopic(tabId, topic);
}

function matchesSearch(connection) {
  return connectionMatches(connection, searchConnection.value);
}

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
  copy.lastError = undefined;
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

/** Main rejects invalid connection data: tell the user instead of doing nothing. */
async function connect(connection) {
  const opened = await window.api.tabs.openConnection(toPlain(connection));

  if (!opened) {
    notify.error(`Cannot open "${connection.name}": check its settings`);
  }
}

function saveAndConnect(data) {
  save(data);
  connect(data);
}

/** Opens a tab without saving the connection (D26). */
function connectTemporary(data) {
  connect(data);
}

/** Opens a temporary tab with default properties and the typed broker URL. */
function connectQuick() {
  const target = quickConnectTarget.value;
  const defaults = new ConnectionProperties();

  defaults.init({ ...defaults, ...target, name: target.host });
  connectTemporary(defaults);
}

/** Enter in the search: the typed URL first, else the first match. */
function connectFromSearch() {
  if (quickConnectTarget.value) return connectQuick();

  const [firstMatch] = [...recentConnections.value, ...otherConnections.value];

  if (firstMatch) connect(firstMatch);
}

function clearSearch() {
  searchConnection.value = "";
}

function isTypingTarget(target) {
  return target.closest("input, textarea, select, [contenteditable]") !== null;
}

/** Ctrl/Cmd+L, or `/` outside text fields, focuses the search; ignored while a dialog is open. */
function focusSearchOnShortcut(event) {
  if (dialogOpen.value || deleteDialog.value) return;

  const isAddressShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l";
  const isSlash = event.key === "/" && !isTypingTarget(event.target);

  if (!isAddressShortcut && !isSlash) return;
  event.preventDefault();
  searchField.value.focus();
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

onMounted(() => {
  searchField.value.focus();
  window.addEventListener("keydown", focusSearchOnShortcut);
});

onBeforeMount(() => {
  unsubscribeMenuEvents = [
    window.api.app.on(MenuEvent.EXPORT_DATA, exportConnectionData),
    window.api.app.on(MenuEvent.IMPORT_DATA, importConnectionData),
    window.api.tabs.onConnectionStates(setTabStates),
  ];
  window.api.tabs.getConnectionStates().then(setTabStates);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", focusSearchOnShortcut);
  unsubscribeMenuEvents.forEach((unsubscribe) => unsubscribe());
});
</script>

<style scoped>
/* The wallpaper sits on the page; only the inner .home scrolls, so the pattern stays fixed */
.home-page {
  block-size: 100vh;
}

.home {
  block-size: 100%;
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
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.home__tiles,
.home__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Solid surface so the list stays readable over a wallpaper */
.home__panel {
  padding: var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

/* Columns must match RECENT_TILES_PER_ROW in the settings store */
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
