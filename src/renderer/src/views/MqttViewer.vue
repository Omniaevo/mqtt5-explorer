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
        <h2
          class="viewer__topic"
          :class="{ 'viewer__topic--hint': !selectedView }"
        >
          {{ selectedView?.topic ?? "Select a topic" }}
        </h2>

        <MPivot
          v-model="activeItem"
          class="viewer__pivot"
          :items="pivotItems"
          aria-label="Topic details"
        >
          <template #payload>
            <template v-if="selectedView">
              <p
                v-if="selectedView.counter > 0"
                :title="getCountMessage(selectedView.counter, false)"
                class="viewer__count"
              >
                {{ getCountMessage(selectedView.counter, true) }}
              </p>
              <div v-if="selectedView.old" class="viewer__payload-old">
                {{ selectedView.old.payload }}
              </div>
              <div v-if="selectedView.value" class="viewer__payload-new">
                {{ selectedView.value.payload }}
              </div>
            </template>
          </template>

          <template #properties>
            <pre v-if="selectedView" class="viewer__properties">{{
              selectedView.value?.properties || ""
            }}</pre>
          </template>

          <template #history>
            <HistoryPanel
              :node="selectedNode"
              :version="treeVersion"
              :capacity="settings.historySize"
              :expanded="activeItem === 'history'"
            />
          </template>

          <template #publish>
            <PublishPanel
              ref="publishPanel"
              :selected="selectedView"
              :expanded="activeItem === 'publish'"
              :is-v5="isV5"
              @publish="(packet) => connection.publish(packet)"
            />
          </template>
        </MPivot>
      </div>
    </div>

    <MMessageDialog
      v-model:open="deleteDialog"
      danger
      title="Delete topic"
      :message="`Delete &quot;${selectedView?.topic ?? ''}&quot; and its children?`"
      confirm-label="Delete"
      @confirm="confirmDelete"
    />

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

    <NotificationsFlyout
      v-model:open="notifyDialog"
      v-model:entries="notifyEntries"
      v-model:join-type="notifyJoinType"
      v-model:notify-switch="notifySwitch"
      v-model:file-logging-switch="fileLoggingSwitch"
      :logs-folder="logsFolder"
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
import MMessageDialog from "../components/metro/MMessageDialog.vue";
import MPivot from "../components/metro/MPivot.vue";
import MPageHeader from "../components/metro/MPageHeader.vue";
import NotificationsFlyout from "../components/viewer/NotificationsFlyout.vue";
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
const activeItem = ref("payload");
const deleteDialog = ref(false);
const notifyDialog = ref(false);
const searchInfoOpen = ref(false);
const searchVisible = ref(false);
const searchTerm = ref(undefined);
const searchMode = ref(undefined);
const debouncedSearchTerm = useDebouncedRef(searchTerm, SEARCH_DEBOUNCE_MS);

/** Pivot items; `history` is hidden when no history is kept. */
const pivotItems = computed(() => [
  { value: "payload", label: "payload" },
  ...(isV5 ? [{ value: "properties", label: "properties" }] : []),
  ...(settings.historySize > 0 ? [{ value: "history", label: "history" }] : []),
  { value: "publish", label: "publish" },
]);

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
  (size) => {
    tree.setHistorySize(size);

    if (size === 0 && activeItem.value === "history") {
      activeItem.value = "payload";
    }
  }
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
  grid-template-columns: 2fr 3fr;
  grid-template-rows: 1fr;
}

.viewer__tree {
  overflow: hidden;
  padding: var(--m-subunit);
  background: var(--m-surface);
}

.viewer__details {
  display: flex;
  flex-direction: column;
  overflow: auto;
  padding: var(--m-subunit) var(--m-subunit) var(--m-subunit) var(--m-unit);
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

.viewer__topic {
  margin: 0 0 var(--m-unit);
  font: var(--m-font-title);
  overflow-wrap: anywhere;
}

.viewer__topic--hint {
  color: var(--m-fg-secondary);
}

.viewer__pivot {
  flex: 1;
}

.viewer__count {
  margin: 0 0 var(--m-subunit);
  color: var(--m-fg-secondary);
  font: var(--m-font-caption);
}

.viewer__payload-old,
.viewer__payload-new {
  padding: var(--m-subunit) var(--m-unit) var(--m-subunit) var(--m-subunit);
  overflow-wrap: anywhere;
  word-break: break-all;
}

.viewer__payload-old {
  margin-bottom: var(--m-subunit);
  background: color-mix(in srgb, var(--m-error) 35%, transparent);
}

.viewer__payload-new {
  background: color-mix(in srgb, var(--m-success) 35%, transparent);
}

.viewer__properties {
  margin: 0;
  padding: var(--m-subunit);
  background: var(--m-surface);
  font-family: monospace;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
</style>
