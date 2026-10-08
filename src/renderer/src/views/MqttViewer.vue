<template>
  <div class="page-grid-container">
    <v-app-bar :color="settings.isDark ? 'surface' : 'white'" flat>
      <v-tooltip text="Disconnect" location="bottom">
        <template #activator="{ props: tooltipProps }">
          <v-btn
            v-bind="tooltipProps"
            icon="mdi-arrow-left"
            variant="text"
            @click="disconnectFromMqtt()"
          />
        </template>
      </v-tooltip>

      <v-tooltip :text="stateView.text" location="bottom">
        <template #activator="{ props: tooltipProps }">
          <v-icon
            v-bind="tooltipProps"
            :class="stateView.class"
            :color="stateView.color"
            :icon="stateView.icon"
            class="ms-4"
          />
        </template>
      </v-tooltip>

      <div class="ms-4">
        <div class="text-h6">Connection: {{ connectionProperties.name }}</div>
        <div class="text-caption text-grey">{{ connection.url }}</div>
      </div>

      <v-spacer />
      <v-slide-y-transition>
        <SearchBar
          v-if="searchVisible"
          v-model:term="searchTerm"
          v-model:mode="searchMode"
          :variant="fieldVariant"
          class="search-bar me-2"
          @close="toggleSearchField"
          @show-info="searchInfoDialog = true"
        />
      </v-slide-y-transition>
      <v-spacer />

      <v-tooltip v-if="fileLoggingSwitch" text="Logging is active" location="bottom">
        <template #activator="{ props: tooltipProps }">
          <v-btn
            v-bind="tooltipProps"
            class="ms-2"
            color="error"
            variant="text"
            icon
            @click="toggleNotificationsDialog"
          >
            <v-icon class="rec-icon" icon="mdi-record-rec" />
          </v-btn>
        </template>
      </v-tooltip>

      <v-tooltip v-if="selectedNode" text="Clear selection" location="bottom">
        <template #activator="{ props: tooltipProps }">
          <v-btn
            v-bind="tooltipProps"
            class="ms-2"
            color="error"
            icon="mdi-close"
            variant="text"
            @click="resetSelection"
          />
        </template>
      </v-tooltip>
    </v-app-bar>

    <div class="ma-2 explorer-grid-container">
      <v-card class="treeview-container" flat>
        <v-treeview
          :items="treeItems"
          :search="searchTerm"
          :custom-filter="filterNode"
          :item-children="getChildren"
          item-title="name"
          item-value="id"
          density="compact"
          open-on-click
        >
          <template #title="{ item }">
            <div
              :class="{
                'bg-primary': item.blink || selectedNode?.id === item.id,
                'text-white': item.blink || selectedNode?.id === item.id,
              }"
              class="px-2 ma-0 rounded"
              @click="selectNode(item)"
            >
              {{ item.name }}
              {{ item.value !== undefined ? "=" : "" }}
              <span class="font-weight-black">
                {{ item.value !== undefined ? item.value.payload : "" }}
              </span>
              <span v-if="item.size > 0" class="text-caption text-grey ms-4">
                ({{ item.size }} elements inside)
              </span>
            </div>
          </template>
        </v-treeview>
      </v-card>

      <div class="properties-container">
        <v-expansion-panels v-model="openPanels" multiple>
          <v-expansion-panel value="topic" title="Topic">
            <v-expansion-panel-text v-if="selectedView" class="wrap-text">
              <v-tooltip :text="`Delete &quot;${selectedView.topic}&quot; topic`" location="bottom">
                <template #activator="{ props: tooltipProps }">
                  <v-btn
                    v-bind="tooltipProps"
                    class="me-4"
                    color="error"
                    icon="mdi-delete"
                    variant="text"
                    @click="deleteDialog = true"
                  />
                </template>
              </v-tooltip>
              {{ selectedView.topic }}
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel value="payload">
            <v-expansion-panel-title>
              <span>Payload</span>
              <span
                v-if="selectedView?.counter > 0"
                :title="getCountMessage(selectedView.counter, false)"
                class="text-caption ms-2 text-grey"
              >
                ({{ getCountMessage(selectedView.counter, true) }})
              </span>
            </v-expansion-panel-title>
            <v-expansion-panel-text v-if="selectedView">
              <div v-if="selectedView.old" class="d-flex rounded mb-1 wrap-text">
                <div class="bg-error px-2 py-1">
                  <v-icon icon="mdi-delete" size="small" />
                </div>
                <div class="px-4 flex-fill py-1 long-payload payload-old">
                  {{ selectedView.old.payload }}
                </div>
              </div>
              <div v-if="selectedView.value" class="d-flex rounded wrap-text">
                <div class="bg-success px-2 py-1">
                  <v-icon icon="mdi-lightning-bolt" size="small" />
                </div>
                <div class="px-4 flex-fill py-1 long-payload payload-new">
                  {{ selectedView.value.payload }}
                </div>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel v-if="isV5" value="properties" title="Properties">
            <v-expansion-panel-text v-if="selectedView">
              <pre>{{ selectedView.value?.properties || "" }}</pre>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <PublishPanel
            ref="publishPanel"
            :selected="selectedView"
            :expanded="openPanels.includes('publish')"
            :is-v5="isV5"
            :variant="fieldVariant"
            @publish="(packet) => connection.publish(packet)"
          />
        </v-expansion-panels>
      </div>
    </div>

    <v-dialog v-model="deleteDialog" max-width="50ch" persistent>
      <v-card>
        <v-card-title>Confirm delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete
          <span class="font-weight-black">"{{ selectedView?.topic }}"</span>
          topic and its children?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="text" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <NotificationsDialog
      v-model="notifyDialog"
      v-model:entries="notifyEntries"
      v-model:join-type="notifyJoinType"
      v-model:notify-switch="notifySwitch"
      v-model:file-logging-switch="fileLoggingSwitch"
      :logs-folder="logsFolder"
      :variant="fieldVariant"
      @show-info="searchInfoDialog = true"
      @open-logs-folder="openLogsFolder"
      @reset="resetNotifyAndLogging"
    />

    <SearchInfoDialog v-model="searchInfoDialog" />
  </div>
</template>

<script setup>
import { computed, inject, markRaw, onBeforeMount, onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import { useRoute, useRouter } from "vue-router";
import NotificationsDialog from "../components/viewer/NotificationsDialog.vue";
import PublishPanel from "../components/viewer/PublishPanel.vue";
import SearchBar from "../components/viewer/SearchBar.vue";
import SearchInfoDialog from "../components/viewer/SearchInfoDialog.vue";
import { useNotifyAndLogging } from "../composables/useNotifyAndLogging";
import { useTreeRefresh } from "../composables/useTreeRefresh";
import Connection from "../utils/Connection";
import ConnectionProperties from "../models/ConnectionProperties";
import SearchEngine from "../utils/SearchEngine";
import { useConnectionsStore } from "../stores/connections";
import { useNotifyStore } from "../stores/notify";
import { useSettingsStore } from "../stores/settings";

const STATES = Connection.connectionStates;
const STATE_VIEWS = {
  [STATES.CONNECTED]: { icon: "mdi-lan-connect", color: "primary", text: "Connected" },
  [STATES.PENDING]: {
    icon: "mdi-lan-pending",
    color: "primary",
    text: "Connection pending ...",
    class: "pending",
  },
  [STATES.DISCONNECTED]: {
    icon: "mdi-lan-pending",
    color: "primary",
    text: "Disconnected",
    class: "grayscale",
  },
  [STATES.ERROR]: { icon: "mdi-lan-disconnect", color: "error", text: "An error occurred" },
};

const route = useRoute();
const router = useRouter();
const settings = useSettingsStore();
const connections = useConnectionsStore();
const notify = useNotifyStore();
const connection = inject("connection");

const connectionProperties = new ConnectionProperties();
connectionProperties.init(connections.getByIndex(route.params.index));

const isV5 = connectionProperties.version > 4;
const fieldVariant = computed(() => (settings.outline ? "outlined" : "underlined"));

// The topic tree is not reactive (can be large): it is plain data plus a
// version counter that is bumped, throttled, after every change.
const roots = [];
const { version: treeVersion, request: requestTreeRefresh } = useTreeRefresh();
const treeItems = computed(() => {
  treeVersion.value; // Dependency only

  return roots.slice();
});

const connectionState = ref(STATES.PENDING);
const stateView = computed(() => STATE_VIEWS[connectionState.value]);

const selectedNode = shallowRef(undefined);
const publishPanel = ref(null);
const openPanels = ref(["publish"]);
const deleteDialog = ref(false);
const notifyDialog = ref(false);
const searchInfoDialog = ref(false);
const searchVisible = ref(false);
const searchTerm = ref(undefined);
const searchMode = ref(undefined);

/** Plain copy of the selected node that follows tree updates. */
const selectedView = computed(() => {
  treeVersion.value; // Dependency only
  const node = selectedNode.value;

  return node && {
    topic: node.topic,
    value: node.value,
    old: node.old,
    counter: node.counter,
  };
});

const {
  notifySwitch,
  fileLoggingSwitch,
  entries: notifyEntries,
  joinType: notifyJoinType,
  logsFolder,
  process: processNotifications,
  reset: resetNotifyAndLogging,
} = useNotifyAndLogging(
  () => connectionProperties.name,
  (topic) => {
    const node = findNode(topic);

    if (node) selectNode(node);
  }
);

/** Search function of the tree; an invalid regular expression matches nothing. */
const filterNode = computed(() => (_value, query, internalItem) => {
  try {
    return internalItem.raw.search(query, searchMode.value || SearchEngine.modes.ALL);
  } catch {
    return false;
  }
});

const getChildren = (node) => (node.size > 0 ? node.children : undefined);

function findNode(topic) {
  let level = roots;
  let node;

  for (const name of topic.split("/")) {
    node = level.find((n) => n.name === name);
    if (!node) return undefined;
    level = node.children;
  }

  return node;
}

function addRoot(node) {
  roots.push(markRaw(node));
  requestTreeRefresh();
}

/** @returns {boolean} True when the root is empty now and was removed. */
function mergeIntoRoot(index, node) {
  const toDelete = roots[index].merge(node);

  if (toDelete) roots.splice(index, 1);
  else processNotifications(node);

  requestTreeRefresh();

  return toDelete;
}

function selectNode(node) {
  selectedNode.value = node;
  publishPanel.value?.load(node);
  openPanels.value = ["topic", "payload", ...(isV5 ? ["properties"] : [])];
}

function resetSelection() {
  selectedNode.value = undefined;
  publishPanel.value?.reset();
  openPanels.value = ["publish"];
}

function toggleSearchField() {
  searchVisible.value = !searchVisible.value;

  if (!searchVisible.value) searchTerm.value = undefined;
}

function toggleNotificationsDialog() {
  notifyDialog.value = !notifyDialog.value;
}

function openLogsFolder() {
  window.api.app.openFolder(window.api.logger.logsFolder());
}

function disconnectFromMqtt(errorMessage = undefined) {
  connection.disconnect(() => {
    connectionState.value =
      errorMessage !== undefined ? STATES.ERROR : STATES.DISCONNECTED;

    router.replace({ name: "Home" }).then(() => {
      if (errorMessage === undefined) notify.info("The broker is unreachable");
      else notify.error(errorMessage);
    });
  });
}

function getCountMessage(count, truncate) {
  const truncatedNum = truncate && count > 1000000 ? "1000000+" : count;

  return `${truncatedNum} message${count > 1 ? "s" : ""} received`;
}

/** @returns {object[]} The node and all its descendants that hold a value. */
function collectValueNodes(node) {
  const own = node.value ? [node] : [];

  return node.children.reduce((all, child) => all.concat(collectValueNodes(child)), own);
}

/** Clears the retained message of the selected topic and its children. */
function confirmDelete() {
  collectValueNodes(selectedNode.value).forEach((node) => {
    connection.publish({ ...node.value, topic: node.topic, payload: "", retain: true });
  });

  deleteDialog.value = false;
  resetSelection();
}

let unsubscribeMenuEvents = [];

onBeforeMount(() => {
  connection.init(connectionProperties, addRoot, mergeIntoRoot, () => roots.length);

  window.api.app.sendPage("viewer");
  unsubscribeMenuEvents = [
    window.api.app.on("searchPressed", toggleSearchField),
    window.api.app.on("notificationPressed", toggleNotificationsDialog),
  ];
});

onMounted(() => {
  connection.connect(
    settings.mqttClientSettings,
    () => (connectionState.value = STATES.CONNECTED),
    (err) => disconnectFromMqtt(err)
  );
});

onBeforeUnmount(() => unsubscribeMenuEvents.forEach((unsubscribe) => unsubscribe()));
</script>

<style scoped>
.page-grid-container {
  height: calc(100vh - var(--v-layout-top, 0px));
  display: grid;
  grid-template-rows: 1fr;
}

.explorer-grid-container {
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
  gap: 1em;
}

.treeview-container,
.properties-container {
  overflow: auto;
}

.search-bar {
  max-width: 60ch;
}

.long-payload {
  word-break: break-all;
}

.payload-old {
  background: #ff535655;
}

.payload-new {
  background: #41b05655;
}

.wrap-text {
  overflow-wrap: break-word;
}

.grayscale {
  filter: grayscale(100%);
}

.pending {
  animation: changeGrayscale 1s ease-in-out infinite alternate;
}

.rec-icon {
  animation: recording 1s ease-in-out infinite alternate;
}

@keyframes changeGrayscale {
  from {
    filter: grayscale(0%);
  }

  to {
    filter: grayscale(100%);
  }
}

@keyframes recording {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
