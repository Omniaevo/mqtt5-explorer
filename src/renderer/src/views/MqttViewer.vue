<template>
  <div class="viewer">
    <MPageHeader
      class="viewer__header"
      :title="connectionProperties.name"
      :caption="connection.url"
      size="subheader"
      show-back
      @back="disconnectFromMqtt()"
    >
      <template v-if="searchVisible" #actions>
        <SearchBar
          v-model:term="searchTerm"
          v-model:mode="searchMode"
          class="viewer__search"
          @close="toggleSearchField"
          @show-info="searchInfoOpen = true"
        />
      </template>
    </MPageHeader>

    <div class="viewer__panes">
      <div class="viewer__tree">
        <TopicTreeView
          ref="treeView"
          :tree="tree"
          :version="treeVersion"
          :selected="selectedNode"
          :dense="settings.denseTree"
          :is-blinking="isBlinking"
          :matches="nodeMatcher"
          @select="selectNode"
        />
      </div>

      <div class="viewer__details">
        <v-expansion-panels v-model="openPanels" multiple>
          <v-expansion-panel value="topic" title="Topic">
            <v-expansion-panel-text v-if="selectedView" class="wrap-text">
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
              <div
                v-if="selectedView.old"
                class="d-flex rounded mb-1 wrap-text"
              >
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

          <HistoryPanel
            :node="selectedNode"
            :version="treeVersion"
            :capacity="settings.historySize"
            :expanded="openPanels.includes('history')"
            :variant="fieldVariant"
          />

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
          <v-btn color="error" variant="text" @click="confirmDelete"
            >Delete</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <MAppBar :collapsible="false" aria-label="Viewer commands">
      <template #context>
        <template v-if="selectedView">
          <MTooltip text="Clear selection" side="top">
            <MButton
              variant="round"
              icon="dismiss"
              label="Clear selection"
              @click="resetSelection"
            />
          </MTooltip>
          <MTooltip text="Delete topic" side="top">
            <MButton
              variant="round"
              icon="delete"
              label="Delete topic"
              @click="deleteDialog = true"
            />
          </MTooltip>
        </template>
      </template>
      <template #global>
        <MTooltip text="Search" side="top">
          <MButton
            variant="round"
            icon="search"
            label="Search"
            :aria-pressed="searchVisible"
            @click="toggleSearchField"
          />
        </MTooltip>
        <span class="viewer__status">
          <MTooltip text="Notifications" side="top">
            <MButton
              variant="round"
              icon="notifications"
              label="Notifications"
              :aria-label="notificationsLabel"
              @click="toggleNotificationsDialog"
            />
          </MTooltip>
          <span v-if="hasActiveStatus" class="viewer__dot" aria-hidden="true" />
        </span>
        <MTooltip text="Disconnect" side="top">
          <MButton
            variant="round"
            icon="disconnect"
            label="Disconnect"
            @click="disconnectFromMqtt()"
          />
        </MTooltip>
      </template>
    </MAppBar>

    <NotificationsDialog
      v-model="notifyDialog"
      v-model:entries="notifyEntries"
      v-model:join-type="notifyJoinType"
      v-model:notify-switch="notifySwitch"
      v-model:file-logging-switch="fileLoggingSwitch"
      :logs-folder="logsFolder"
      :variant="fieldVariant"
      @show-info="searchInfoOpen = true"
      @open-logs-folder="openLogsFolder"
      @reset="resetNotifyAndLogging"
    />

    <SearchInfoFlyout v-model:open="searchInfoOpen" />
  </div>
</template>

<script setup>
import {
  computed,
  inject,
  markRaw,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import MAppBar from "../components/metro/MAppBar.vue";
import MButton from "../components/metro/MButton.vue";
import MTooltip from "../components/metro/MTooltip.vue";
import MPageHeader from "../components/metro/MPageHeader.vue";
import NotificationsDialog from "../components/viewer/NotificationsDialog.vue";
import HistoryPanel from "../components/viewer/HistoryPanel.vue";
import PublishPanel from "../components/viewer/PublishPanel.vue";
import SearchBar from "../components/viewer/SearchBar.vue";
import SearchInfoFlyout from "../components/viewer/SearchInfoFlyout.vue";
import TopicTreeView from "../components/viewer/TopicTreeView.vue";
import { useDebouncedRef } from "../composables/useDebouncedRef";
import { useNotifyAndLogging } from "../composables/useNotifyAndLogging";
import { useTreeRefresh } from "../composables/useTreeRefresh";
import TopicTree from "../models/TopicTree";
import ConnectionProperties from "../models/ConnectionProperties";
import SearchEngine from "../../../shared/SearchEngine";
import { useConnectionsStore } from "../stores/connections";
import { useNotifyStore } from "../stores/notify";
import { useSettingsStore } from "../stores/settings";

const SEARCH_DEBOUNCE_MS = 250;

const route = useRoute();
const router = useRouter();
const settings = useSettingsStore();
const connections = useConnectionsStore();
const notify = useNotifyStore();
const connection = inject("connection");

const connectionProperties = new ConnectionProperties();
connectionProperties.init(connections.getByIndex(route.params.index));

const isV5 = connectionProperties.version > 4;
const fieldVariant = computed(() =>
  settings.outline ? "outlined" : "underlined"
);

// The topic tree is not reactive (can be large): it is plain data plus a
// version counter that is bumped, throttled, after every change.
const tree = markRaw(new TopicTree(settings.historySize));
const {
  version: treeVersion,
  request: requestTreeRefresh,
  wasUpdatedInLastBatch: isBlinking,
} = useTreeRefresh();

const selectedNode = shallowRef(undefined);
const publishPanel = ref(null);
const treeView = ref(null);
const openPanels = ref(["publish"]);
const deleteDialog = ref(false);
const notifyDialog = ref(false);
const searchInfoOpen = ref(false);
const searchVisible = ref(false);
const searchTerm = ref(undefined);
const searchMode = ref(undefined);
const debouncedSearchTerm = useDebouncedRef(searchTerm, SEARCH_DEBOUNCE_MS);

/** Plain copy of the selected node that follows tree updates. */
const selectedView = computed(() => {
  treeVersion.value; // Dependency only
  const node = selectedNode.value;

  return (
    node && {
      topic: node.topic,
      value: node.value,
      old: node.old,
      counter: node.counter,
    }
  );
});

const {
  notifySwitch,
  fileLoggingSwitch,
  entries: notifyEntries,
  joinType: notifyJoinType,
  logsFolder,
  pushConfig: pushNotifyConfig,
  reset: resetNotifyAndLogging,
} = useNotifyAndLogging(() => connectionProperties.name);

const hasActiveStatus = computed(
  () => notifySwitch.value || fileLoggingSwitch.value
);

/** Button name that also tells what is active, for screen readers. */
const notificationsLabel = computed(() => {
  const active = [
    notifySwitch.value && "notifications active",
    fileLoggingSwitch.value && "logging active",
  ].filter(Boolean);

  return active.length
    ? `Notifications and logging, ${active.join(", ")}`
    : "Notifications and logging";
});

/** Node filter of the tree; compiled once per (term, mode). */
const nodeMatcher = computed(() => {
  const term = debouncedSearchTerm.value;

  if (!term) return undefined;

  const matches = SearchEngine.matcher(
    term,
    searchMode.value || SearchEngine.modes.ALL
  );

  return (node) => node.matchedBy(matches);
});

watch(
  () => settings.historySize,
  (size) => tree.setHistorySize(size)
);

/** Applies the whole batch to the tree, then refreshes the view once. */
function onBatch(packets) {
  const batchTimestamp = Date.now();

  packets.forEach((packet) => tree.apply(packet, batchTimestamp));

  requestTreeRefresh(batchTimestamp);
}

function selectNode(node) {
  selectedNode.value = node;
  publishPanel.value?.load(node);
  openPanels.value = [
    "topic",
    "payload",
    ...(openPanels.value.includes("history") ? ["history"] : []),
    ...(isV5 ? ["properties"] : []),
  ];
}

/** Selects the topic of a clicked notification and shows it in the tree. */
function selectTopic(topic) {
  const path = tree.path(topic);

  if (path.length === 0) return;

  selectNode(path.at(-1));
  treeView.value?.reveal(path);
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
    router.replace({ name: "Home" }).then(() => {
      // A manual disconnect (no message) needs no toast
      if (errorMessage !== undefined) {
        notify.error(errorMessage || "The broker is unreachable");
      }
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

  return node.children.reduce(
    (all, child) => all.concat(collectValueNodes(child)),
    own
  );
}

/** Clears the retained message of the selected topic and its children. */
function confirmDelete() {
  collectValueNodes(selectedNode.value).forEach((node) => {
    connection.publish({
      ...node.value,
      topic: node.topic,
      payload: "",
      retain: true,
    });
  });

  deleteDialog.value = false;
  resetSelection();
}

let unsubscribeMenuEvents = [];

onBeforeMount(() => {
  connection.init(connectionProperties, onBatch);

  window.api.app.sendPage("viewer");
  unsubscribeMenuEvents = [
    window.api.app.on("searchPressed", toggleSearchField),
    window.api.app.on("notificationPressed", toggleNotificationsDialog),
    window.api.notify.onSelectTopic(selectTopic),
  ];
});

onMounted(() => {
  connection.connect(
    settings.mqttClientSettings,
    () => {
      connections.markConnected(connectionProperties.id);
      pushNotifyConfig();
    },
    (err) => disconnectFromMqtt(err)
  );
});

onBeforeUnmount(() =>
  unsubscribeMenuEvents.forEach((unsubscribe) => unsubscribe())
);
</script>

<style scoped>
.viewer {
  position: relative;
  box-sizing: border-box;
  height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr;
  /* Keep the panes clear of the collapsed app bar */
  padding-bottom: 56px;
  background: var(--m-bg);
}

.viewer__header {
  padding: var(--m-unit);
}

.viewer__search {
  width: 60ch;
  max-width: 100%;
}

.viewer__panes {
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
}

.viewer__tree {
  overflow: hidden;
  padding: var(--m-subunit);
  background: var(--m-surface);
}

.viewer__details {
  overflow: auto;
  padding: var(--m-subunit);
  background: var(--m-bg);
}

.viewer__status {
  position: relative;
  display: inline-flex;
}

/* Accent dot at the top right of the circle */
.viewer__dot {
  position: absolute;
  top: 0;
  left: calc(50% + 10px);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--m-accent);
  pointer-events: none;
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
</style>
