<template>
  <div
    class="home"
    @click="deselectOnEmptyArea"
    @keydown.esc="selectedId = null"
  >
    <MHub title="MQTT5 Explorer">
      <template #header-end>
        <MTextBox
          v-model="searchConnection"
          class="home__search"
          placeholder="Search connections"
          prefix-icon="search"
          clearable
        />
      </template>

      <MHubSection v-if="pinned.length" title="pinned">
        <div class="home__tiles" :style="sectionStyle(pinned.length)">
          <MTile
            v-for="connection in pinned"
            :key="connection.id"
            :size="tileSize(pinned.length)"
            :selected="connection.id === selectedId"
            @activate="connect(connection)"
            @select="select(connection)"
          >
            <template #front>
              <ConnectionTileFront :connection="connection" />
            </template>
          </MTile>
        </div>
      </MHubSection>

      <MHubSection v-if="recent.length" title="recent">
        <div class="home__tiles" :style="sectionStyle(recent.length)">
          <MTile
            v-for="connection in recent"
            :key="connection.id"
            :size="tileSize(recent.length)"
            :selected="connection.id === selectedId"
            @activate="connect(connection)"
            @select="select(connection)"
          >
            <template #front>
              <ConnectionTileFront :connection="connection" />
            </template>
          </MTile>
        </div>
      </MHubSection>

      <MHubSection title="all connections">
        <p v-if="noMatch" class="home__empty">no connections match</p>
        <div
          ref="tilesArea"
          class="home__tiles"
          :style="sectionStyle(all.length)"
        >
          <MTile
            v-for="connection in all"
            :key="connection.id"
            :size="tileSize(all.length)"
            :selected="connection.id === selectedId"
            @activate="connect(connection)"
            @select="select(connection)"
          >
            <template #front>
              <ConnectionTileFront :connection="connection" />
            </template>
          </MTile>
        </div>
      </MHubSection>
    </MHub>

    <MAppBar expanded :collapsible="false" aria-label="Connection commands">
      <template #context>
        <template v-if="selected">
          <MButton
            variant="round"
            icon="edit"
            label="Edit"
            @click="openEditor(selected)"
          />
          <MButton
            variant="round"
            :icon="selected.pinned ? 'unpin' : 'pin'"
            :label="selected.pinned ? 'Unpin' : 'Pin'"
            @click="connections.togglePinned(selected.id)"
          />
          <MButton
            variant="round"
            icon="delete"
            label="Delete"
            @click="deleteDialogOpen = true"
          />
        </template>
      </template>
      <template #global>
        <MButton
          variant="round"
          icon="add"
          label="New connection"
          @click="openNewEditor"
        />
      </template>
    </MAppBar>

    <SettingsDialog v-model="settingsOpen" />

    <ConnectionEditorFlyout
      v-model:open="editorOpen"
      :connection="editedConnection"
      @connect="saveAndConnect"
      @delete="deleteFromEditor"
      @updated="saveFromEditor"
    />

    <MMessageDialog
      v-model:open="deleteDialogOpen"
      title="Delete connection"
      :message="deleteMessage"
      confirm-label="Delete"
      danger
      @confirm="deleteSelected"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeMount, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import ConnectionEditorFlyout from "../components/ConnectionEditorFlyout.vue";
import ConnectionTileFront from "../components/ConnectionTileFront.vue";
import SettingsDialog from "../components/SettingsDialog.vue";
import MAppBar from "../components/metro/MAppBar.vue";
import MButton from "../components/metro/MButton.vue";
import MHub from "../components/metro/MHub.vue";
import MHubSection from "../components/metro/MHubSection.vue";
import MMessageDialog from "../components/metro/MMessageDialog.vue";
import MTextBox from "../components/metro/MTextBox.vue";
import MTile from "../components/metro/MTile.vue";
import ConnectionProperties from "../models/ConnectionProperties";
import { useConnectionsStore } from "../stores/connections";
import { useNotifyStore } from "../stores/notify";
import {
  allConnections,
  filterConnections,
  pinnedConnections,
  recentConnections,
} from "../utils/hubSections";

const router = useRouter();
const connections = useConnectionsStore();
const notify = useNotifyStore();

const searchConnection = ref("");
const selectedId = ref(null);
const settingsOpen = ref(false);
const editorOpen = ref(false);
const deleteDialogOpen = ref(false);
const editedConnection = ref(null);

const visible = computed(() =>
  filterConnections(connections.savedConnections, searchConnection.value)
);
const pinned = computed(() => pinnedConnections(visible.value));
const recent = computed(() => recentConnections(visible.value));
const all = computed(() => allConnections(visible.value));
const TILE_SIZE = 150;
const WIDE_TILE_WIDTH = 310;
const WIDE_TILES_MAX = 3; // sections with this many tiles or fewer use wide tiles
const TILE_GAP = 5; // keep equal to --m-subunit

// Rows that fit in the section height; tiles fill a column before starting the next
const tilesArea = ref(null);
const rows = ref(2);
const tileSize = (count) => (count <= WIDE_TILES_MAX ? "wide" : "medium");
const sectionStyle = (count) => ({
  "--rows": rows.value,
  "--tile-width": `${tileSize(count) === "wide" ? WIDE_TILE_WIDTH : TILE_SIZE}px`,
});

const heightObserver = new ResizeObserver(([entry]) => {
  rows.value = Math.max(
    1,
    Math.floor((entry.contentRect.height + TILE_GAP) / (TILE_SIZE + TILE_GAP))
  );
});

onMounted(() => heightObserver.observe(tilesArea.value));
onBeforeUnmount(() => heightObserver.disconnect());

const noMatch = computed(
  () => searchConnection.value.trim() !== "" && all.value.length === 0
);
const selected = computed(() =>
  connections.savedConnections.find((c) => c.id === selectedId.value)
);

const deleteMessage = computed(
  () => `Are you sure you want to delete "${selected.value?.name}"?`
);

function select(connection) {
  selectedId.value = connection.id;
}

/** A click that lands outside any tile and outside the app bar clears the selection. */
function deselectOnEmptyArea(event) {
  if (!event.target.closest(".m-tile, .m-app-bar")) selectedId.value = null;
}

const indexOf = (connection) =>
  connections.brokerConnections.indexOf(connection);

function connect(connection) {
  router.push({ name: "Viewer", params: { index: indexOf(connection) } });
}

function openNewEditor() {
  editedConnection.value = new ConnectionProperties();
  editorOpen.value = true;
}

function openEditor(connection) {
  editedConnection.value = connection;
  editorOpen.value = true;
}

/** Stores the editor copy: replaces the saved connection or appends a new one. */
function save(data) {
  data.saved = true;
  const index = connections.brokerConnections.findIndex(
    (c) => c.id === data.id
  );

  if (index === -1) connections.add(data);
  else connections.update(index, data);
  connections.persist();
  return data;
}

function saveFromEditor(data) {
  save(data);
  editorOpen.value = false;
}

function saveAndConnect(data) {
  editorOpen.value = false;
  connect(save(data));
}

function deleteFromEditor() {
  editorOpen.value = false;
  selectedId.value = editedConnection.value.id;
  deleteDialogOpen.value = true;
}

function deleteSelected() {
  const index = indexOf(selected.value);

  connections.remove(index, connections.persist);
  selectedId.value = null;
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
    selectedId.value = null;
  } catch {
    notify.error("The selected file is not a valid connections file");
  }
}

let unsubscribeMenuEvents = [];

onBeforeMount(() => {
  window.api.app.sendPage("home");
  unsubscribeMenuEvents = [
    window.api.app.on(
      "settingsPressed",
      () => (settingsOpen.value = !settingsOpen.value)
    ),
    window.api.app.on("exportDataPressed", exportConnectionData),
    window.api.app.on("importDataPressed", importConnectionData),
  ];
});

onBeforeUnmount(() =>
  unsubscribeMenuEvents.forEach((unsubscribe) => unsubscribe())
);
</script>

<style scoped>
.home {
  position: relative;
  box-sizing: border-box;
  height: 100vh;
  /* Keep the last row of tiles clear of the collapsed app bar */
  padding-bottom: 76px;
}

.home__search {
  width: 280px;
}

/* Tiles fill columns top to bottom; the section is as wide as its columns */
.home__tiles {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(var(--rows), 150px);
  grid-auto-columns: var(--tile-width);
  align-content: start;
  height: 100%;
  gap: var(--m-subunit);
}

.home__empty {
  margin: 0 0 var(--m-unit);
  color: var(--m-fg-secondary);
}
</style>
