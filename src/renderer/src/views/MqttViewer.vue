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
        <nav
          class="viewer__topic"
          :class="{ 'viewer__topic--hint': !selectedView }"
          aria-label="Topic path"
        >
          <ol v-if="selectedView" class="viewer__crumbs">
            <li v-for="(segment, index) in topicSegments" :key="index">
              {{ segment }}
            </li>
          </ol>
          <template v-else>Select a topic</template>
        </nav>

        <MPivot
          v-model="activeItem"
          class="viewer__pivot"
          :items="pivotItems"
          aria-label="Topic details"
        >
          <template #payload>
            <div v-if="selectedView" class="viewer__payload-pane">
              <p
                v-if="selectedView.counter > 0"
                :title="getCountMessage(selectedView.counter, false)"
                class="viewer__count"
              >
                {{ getCountMessage(selectedView.counter, true) }}
              </p>
              <TransitionGroup
                v-if="payloadRows.length"
                :key="selectedView.topic"
                tag="div"
                name="m-rows"
                class="viewer__rows"
              >
                <div
                  v-for="row in payloadRows"
                  :key="row.key"
                  class="viewer__row"
                  :class="{ 'viewer__row--current': row.isCurrent }"
                >
                  <span class="viewer__payload">{{ row.payload }}</span>
                  <span class="viewer__time">{{ row.time }}</span>
                </div>
              </TransitionGroup>
            </div>
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
            ref="searchButton"
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
  nextTick,
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
import { formatEntryTime, toRawRows } from "../utils/HistoryView";
import TopicTree from "../models/TopicTree";
import ConnectionProperties from "../models/ConnectionProperties";
import SearchEngine from "../../../shared/SearchEngine";
import { useConnectionsStore } from "../stores/connections";
import { useNotifyStore } from "../stores/notify";
import { useSettingsStore } from "../stores/settings";

const SEARCH_DEBOUNCE_MS = 250;
const MAX_PAYLOAD_ROWS = 50;

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
const searchButton = ref(null);
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

const timeOf = (message) =>
  message.receivedAt ? formatEntryTime(message.receivedAt) : "";

/**
 * Received values of the selected topic, newest first: the current value,
 * the previous one, then the history. The list is only capped; the clipped
 * container shows as many rows as the height allows.
 *
 * The row key is the message sequence number: it stays the same while the row
 * moves down, which lets the list animate.
 */
const payloadRows = computed(() => {
  treeVersion.value; // Dependency only
  const node = selectedNode.value;

  if (!node) return [];

  const expected = (node.value ? 1 : 0) + (node.old ? 1 : 0);
  const entries = node.history.slice(-MAX_PAYLOAD_ROWS);
  const rows = toRawRows(entries).map((row) => ({
    ...row,
    key: node.counter - (entries.length - 1 - row.key),
  }));

  // Without history (size 0) only the last two values are known
  if (rows.length < expected) {
    rows.length = 0;

    if (node.value) {
      rows.push({
        key: node.counter,
        payload: node.value.payload,
        time: timeOf(node.value),
      });
    }

    if (node.old) {
      rows.push({
        key: node.counter - 1,
        payload: node.old.payload,
        time: timeOf(node.old),
      });
    }
  }

  return rows.map((row, index) => ({
    ...row,
    isCurrent: index === 0 && Boolean(node.value),
  }));
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

/** Topic levels; the "/" separators are drawn by CSS. */
const topicSegments = computed(
  () => selectedView.value?.topic.split("/") ?? []
);

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

  if (searchVisible.value) return;

  searchTerm.value = undefined;
  // The search bar (and its focus) is gone: return to its command
  nextTick(() => searchButton.value?.$el.focus());
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

.viewer__crumbs {
  display: flex;
  flex-wrap: wrap;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* The separator is drawn here, so it is not part of the topic text */
.viewer__crumbs li + li::before {
  content: "/";
  padding-inline: var(--m-subunit);
  color: var(--m-fg-secondary);
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

.viewer__payload-pane {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Fills the free height; rows beyond it are clipped and the rest fades out */
.viewer__rows {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  mask-image: linear-gradient(to bottom, #000, transparent);
}

/* Older value: red tint. The transition morphs it to and from the current look */
.viewer__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--m-unit);
  margin-bottom: var(--m-subunit);
  padding: var(--m-subunit) var(--m-unit) var(--m-subunit) var(--m-subunit);
  overflow-wrap: anywhere;
  word-break: break-all;
  background: color-mix(in srgb, var(--m-error) 35%, transparent);
  transition:
    transform var(--m-duration-normal) var(--m-ease),
    opacity var(--m-duration-normal) var(--m-ease),
    font-size var(--m-duration-normal) var(--m-ease),
    padding var(--m-duration-normal) var(--m-ease),
    background-color var(--m-duration-normal) var(--m-ease);
}

.viewer__row--current {
  padding-block: calc(var(--m-unit) / 2);
  font-size: 1.25em;
  background: color-mix(in srgb, var(--m-success) 35%, transparent);
}

.viewer__payload {
  min-width: 0;
}

/* A new row fades in and scales up at the top; the others slide down (FLIP) */
.m-rows-enter-from {
  opacity: 0;
  transform: scale(0.85);
  transform-origin: left center;
}

/* No transition to wait for: the row goes away at once */
.m-rows-leave-active {
  display: none;
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .viewer__row {
    transition: none;
  }
}

/* Sits on the success / error tint: the secondary color would be too faint there */
.viewer__time {
  flex: none;
  color: var(--m-fg);
  font: var(--m-font-caption);
  white-space: nowrap;
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
