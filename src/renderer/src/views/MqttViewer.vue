<template>
  <div class="viewer">
    <AppHeader>
      <template #start>
        <AppTooltip text="Disconnect">
          <AppButton
            variant="icon"
            aria-label="Disconnect"
            @click="disconnectFromMqtt()"
          >
            <ArrowLeft :size="18" aria-hidden="true" />
          </AppButton>
        </AppTooltip>

        <AppTooltip :text="stateView.text">
          <span
            class="state-icon"
            role="img"
            tabindex="0"
            :aria-label="stateView.text"
          >
            <component
              :is="stateView.icon"
              :size="18"
              :class="[`state-icon--${stateView.color}`, stateView.class]"
              aria-hidden="true"
            />
          </span>
        </AppTooltip>
      </template>

      <div class="connection">
        <h1 class="connection__name">{{ connectionProperties.name }}</h1>
        <div class="connection__url">{{ connection.url }}</div>
      </div>

      <AppTooltip v-if="fileLoggingSwitch" text="Logging is active">
        <AppButton
          variant="icon"
          color="danger"
          aria-label="Logging is active"
          @click="toggleNotificationsDialog"
        >
          <CircleDot class="rec-icon" :size="18" aria-hidden="true" />
        </AppButton>
      </AppTooltip>

      <template #end>
        <Transition name="search-slide">
          <SearchBar
            v-if="searchVisible"
            v-model:term="searchTerm"
            v-model:mode="searchMode"
            class="search-bar"
            @close="toggleSearchField"
            @show-info="searchInfoDialog = true"
          />
        </Transition>
      </template>
    </AppHeader>

    <main class="explorer">
      <section class="treeview-panel" aria-label="Topics">
        <TopicTreeView
          ref="treeView"
          :tree="tree"
          :version="treeVersion"
          :selected="selectedNode"
          :is-blinking="isBlinking"
          :matches="nodeMatcher"
          @select="selectNode"
        />
      </section>

      <section class="properties-panel" aria-label="Topic details">
        <div class="topic-bar">
          <div v-if="selectedView" class="topic-bar__topic long-payload">
            <template v-for="(segment, i) in topicSegments" :key="i">
              <span v-if="i > 0" class="topic-bar__separator">/</span
              ><span>{{ segment }}</span>
            </template>
          </div>
          <div v-else class="topic-bar__topic topic-bar__topic--empty">
            No topic selected
          </div>

          <template v-if="selectedView">
            <AppTooltip text="Clear selection">
              <AppButton
                variant="icon"
                aria-label="Clear selection"
                @click="resetSelection"
              >
                <X :size="18" aria-hidden="true" />
              </AppButton>
            </AppTooltip>
            <AppTooltip :text="`Delete &quot;${selectedView.topic}&quot; topic`">
              <AppButton
                variant="icon"
                color="danger"
                aria-label="Delete topic"
                @click="deleteDialog = true"
              >
                <Trash2 :size="18" aria-hidden="true" />
              </AppButton>
            </AppTooltip>
          </template>
        </div>

        <AppTabs
          v-model="activeTab"
          class="details-tabs"
          aria-label="Topic details"
          :tabs="viewerTabs"
        >
          <template #list-end>
            <div v-if="activeTab === 'publish'" class="tabs-actions">
              <AppTooltip
                v-if="publishPanel?.canSync"
                text="Synchronize with new data"
              >
                <AppButton
                  variant="icon"
                  aria-label="Synchronize with new data"
                  @click="publishPanel.sync()"
                >
                  <RefreshCw :size="16" aria-hidden="true" />
                </AppButton>
              </AppTooltip>
              <AppButton color="primary" @click="publishPanel?.submit()">
                Publish
              </AppButton>
            </div>
          </template>

          <template #payload>
            <div v-if="selectedView" class="payload-tab">
              <div
                v-if="selectedView.counter > 0"
                :title="formatMessageCount(selectedView.counter, false)"
                class="message-count"
              >
                {{ formatMessageCount(selectedView.counter, true) }}
              </div>
              <!-- Keyed by topic: a new selection renders without animation -->
              <TransitionGroup
                :key="selectedView.topic"
                class="messages-list"
                name="message"
                tag="div"
              >
                <div
                  v-for="(message, i) in messagesView"
                  :key="messageKey(message)"
                  :class="
                    i === 0 && selectedView.value
                      ? 'payload-new newest'
                      : 'payload-old'
                  "
                  class="message-row"
                >
                  <span class="message-text long-payload">{{
                    message.payload
                  }}</span>
                  <span v-if="message.t" class="message-time">{{
                    formatEntryTime(message.t)
                  }}</span>
                </div>
              </TransitionGroup>

              <section v-if="isV5" class="properties">
                <h2 class="properties__title">Properties</h2>
                <pre class="properties__value">{{
                  selectedView.value?.properties || ""
                }}</pre>
              </section>
            </div>
          </template>

          <template #history>
            <HistoryPanel
              :node="selectedNode"
              :version="treeVersion"
              :capacity="settings.historySize"
              :active="activeTab === 'history'"
            />
          </template>

          <template #publish>
            <PublishPanel
              ref="publishPanel"
              :selected="selectedView"
              :is-v5="isV5"
              @publish="(packet) => connection.publish(packet)"
            />
          </template>
        </AppTabs>
      </section>
    </main>

    <AppDialog
      v-model:open="deleteDialog"
      title="Confirm delete"
      persistent
      hide-close
    >
      <p>
        Are you sure you want to delete
        <strong>"{{ selectedView?.topic }}"</strong>
        topic and its children?
      </p>
      <template #actions>
        <AppButton variant="text" @click="deleteDialog = false">
          Cancel
        </AppButton>
        <AppButton variant="text" color="danger" @click="confirmDelete">
          Delete
        </AppButton>
      </template>
    </AppDialog>

    <NotificationsDialog
      v-model="notifyDialog"
      v-model:entries="notifyEntries"
      v-model:join-type="notifyJoinType"
      v-model:notify-switch="notifySwitch"
      v-model:file-logging-switch="fileLoggingSwitch"
      :logs-folder="logsFolder"
      @show-info="searchInfoDialog = true"
      @open-logs-folder="openLogsFolder"
      @reset="resetNotifyAndLogging"
    />

    <SearchInfoDialog v-model="searchInfoDialog" />

    <SettingsDialog v-model="settingsOpen" />
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
  watch,
} from "vue";
import { useRoute } from "vue-router";
import { ArrowLeft, CircleDot, RefreshCw, Trash2, X } from "@lucide/vue";
import NotificationsDialog from "../components/viewer/NotificationsDialog.vue";
import HistoryPanel from "../components/viewer/HistoryPanel.vue";
import AppButton from "../components/ui/AppButton.vue";
import AppDialog from "../components/ui/AppDialog.vue";
import AppHeader from "../components/ui/AppHeader.vue";
import AppTabs from "../components/ui/AppTabs.vue";
import AppTooltip from "../components/ui/AppTooltip.vue";
import PublishPanel from "../components/viewer/PublishPanel.vue";
import SettingsDialog from "../components/SettingsDialog.vue";
import SearchBar from "../components/viewer/SearchBar.vue";
import SearchInfoDialog from "../components/viewer/SearchInfoDialog.vue";
import TopicTreeView from "../components/viewer/TopicTreeView.vue";
import { useConnectionSession } from "../composables/useConnectionSession";
import { useDebouncedRef } from "../composables/useDebouncedRef";
import { useNotifyAndLogging } from "../composables/useNotifyAndLogging";
import { useTopicSelection } from "../composables/useTopicSelection";
import { useTreeRefresh } from "../composables/useTreeRefresh";
import TopicTree from "../models/TopicTree";
import ConnectionProperties from "../models/ConnectionProperties";
import SearchEngine from "../../../shared/SearchEngine";
import { useConnectionsStore } from "../stores/connections";
import { useSettingsStore } from "../stores/settings";
import {
  formatEntryTime,
  formatMessageCount,
  messageKey,
  recentMessages,
} from "../utils/HistoryView";
import { retainedClearPackets } from "../utils/retainedClear";

const SEARCH_DEBOUNCE_MS = 250;
// ponytail: fixed cap, enough rows to fill a tall window; measure the
// free height if rows ever look cut short.
const MAX_SHOWN_MESSAGES = 50;

const route = useRoute();
const settings = useSettingsStore();
const connections = useConnectionsStore();
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

const publishPanel = ref(null);
const treeView = ref(null);
const activeTab = ref("publish");
const deleteDialog = ref(false);
const notifyDialog = ref(false);
const settingsOpen = ref(false);
const searchInfoDialog = ref(false);
const searchVisible = ref(false);
const searchTerm = ref(undefined);
const searchMode = ref(undefined);
const debouncedSearchTerm = useDebouncedRef(searchTerm, SEARCH_DEBOUNCE_MS);

const { stateView, connect, disconnect: disconnectFromMqtt } =
  useConnectionSession(connection);
const {
  selectedNode,
  selectedView,
  topicSegments,
  selectNode,
  selectTopic,
  resetSelection,
} = useTopicSelection({ tree, treeVersion, activeTab, publishPanel, treeView });

/** Last messages, newest first; built only while the payload tab shows. */
const messagesView = computed(() => {
  treeVersion.value; // Dependency only
  const node = selectedNode.value;

  return node && activeTab.value === "payload"
    ? recentMessages(node, MAX_SHOWN_MESSAGES)
    : [];
});

const viewerTabs = computed(() => [
  { value: "payload", label: "Payload", disabled: !selectedView.value },
  { value: "history", label: "History", disabled: !selectedView.value },
  // Eager: the tree loads the selected topic into it at any time
  { value: "publish", label: "Publish", eager: true },
]);

const {
  notifySwitch,
  fileLoggingSwitch,
  entries: notifyEntries,
  joinType: notifyJoinType,
  logsFolder,
  pushConfig: pushNotifyConfig,
  reset: resetNotifyAndLogging,
} = useNotifyAndLogging(() => connectionProperties.name);

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

function toggleSearchField() {
  searchVisible.value = !searchVisible.value;

  if (!searchVisible.value) searchTerm.value = undefined;
}

function toggleNotificationsDialog() {
  notifyDialog.value = !notifyDialog.value;
}

function toggleSettings() {
  settingsOpen.value = !settingsOpen.value;
}

function openLogsFolder() {
  window.api.app.openFolder(window.api.logger.logsFolder());
}

/** Clears the retained messages of the selected topic and its children. */
function confirmDelete() {
  retainedClearPackets(selectedNode.value).forEach((packet) =>
    connection.publish(packet)
  );

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
    window.api.app.on("settingsPressed", toggleSettings),
    window.api.notify.onSelectTopic(selectTopic),
  ];
});

onMounted(() => connect(settings.mqttClientSettings, pushNotifyConfig));

onBeforeUnmount(() =>
  unsubscribeMenuEvents.forEach((unsubscribe) => unsubscribe())
);
</script>

<style scoped>
.viewer {
  display: flex;
  flex-direction: column;
  block-size: 100vh;
}

/* Header */
.connection {
  min-inline-size: 0;
  line-height: var(--line-height-tight);
}

.connection__name {
  margin: 0;
  overflow: hidden;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.connection__url {
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.state-icon {
  display: inline-flex;
  margin-inline: var(--space-3);
}

.state-icon--primary {
  color: var(--color-primary);
}

.state-icon--danger {
  color: var(--color-danger);
}

.search-bar {
  inline-size: 60ch;
  max-inline-size: 100%;
}

/* Search bar slides in from the top edge of the header */
.search-slide-enter-active,
.search-slide-leave-active {
  transition:
    transform var(--duration-normal) var(--easing),
    opacity var(--duration-normal) var(--easing);
}

.search-slide-enter-from,
.search-slide-leave-to {
  opacity: 0;
  transform: translateY(-50%);
}

/* Layout */
.explorer {
  display: grid;
  flex: 1;
  grid-template-columns: 2fr 3fr;
  grid-template-rows: minmax(0, 1fr);
  gap: var(--space-5);
  min-block-size: 0;
  margin: var(--space-4);
}

.treeview-panel {
  min-inline-size: 0;
  padding: var(--space-4);
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

/* Flat on the page background, like the connection form in Home */
.properties-panel {
  display: flex;
  min-inline-size: 0;
  overflow: hidden;
  flex-direction: column;
}

.topic-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: none;
  min-block-size: var(--header-height);
  padding-inline: var(--space-6) var(--space-4);
}

.topic-bar__topic {
  flex: 1;
  min-inline-size: 0;
}

.topic-bar__topic--empty {
  color: var(--color-text-muted);
}

.topic-bar__separator {
  margin-inline: var(--space-2);
  color: var(--color-primary);
  font-weight: var(--font-weight-bold);
}

/* Taller than wide: tree on top, details below */
@media (orientation: portrait) {
  .explorer {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 2fr) minmax(0, 3fr);
  }
}

/* Tabs fill the panel below the topic bar; each panel scrolls on its own */
.details-tabs {
  flex: 1 1 0;
}

.details-tabs :deep(.app-tabs__header) {
  padding-inline-end: var(--space-5);
  border-block-end: 1px solid var(--color-border);
}

.details-tabs :deep(.app-tabs__panel) {
  overflow: auto;
  padding: var(--space-6);
}

.tabs-actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

/* Payload tab: column so the properties can sit at the bottom */
.payload-tab {
  display: flex;
  flex-direction: column;
  min-block-size: 100%;
}

.message-count {
  margin-block-end: var(--space-4);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.long-payload {
  overflow-wrap: break-word;
  word-break: break-all;
}

.properties {
  margin-block-start: auto;
  padding-block-start: var(--space-6);
}

/* Title, then a divider line filling the rest of the row */
.properties__title {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin: 0 0 var(--space-4);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.properties__title::after {
  content: "";
  flex: 1;
  border-block-start: 1px solid var(--color-border);
}

.properties__value {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
}

/* Takes the free space above the properties; rows fade out downwards. */
.messages-list {
  /* Room for two single-line rows (current 1.4em, previous 1em), each with
     its padding and margin, so the tab stays usable in a very short window.
     The tab scrolls when the window is shorter than this. */
  --min-rows-height: calc(
    var(--font-size-md) * var(--line-height-normal) * 2.4 + var(--space-2) * 6
  );

  flex: 1 1 0;
  min-block-size: var(--min-rows-height);
  overflow: hidden;
  mask-image: linear-gradient(to bottom, black, transparent);
}

/* New message: the current one morphs to an older one, the list slides
   down and the new one fades and scales in, all at the same time. */
.message-row {
  display: flex;
  margin-block-end: var(--space-2);
  padding: var(--space-2) var(--space-6);
  border-radius: var(--radius-md);
  overflow-wrap: break-word;
  transition:
    background-color 150ms linear,
    font-size 150ms linear;
}

.message-text {
  flex: 1;
  min-inline-size: 0;
}

.message-time {
  align-self: center;
  flex-shrink: 0;
  margin-inline-start: var(--space-6);
  font-size: 0.85em;
  opacity: 0.7;
  white-space: nowrap;
}

.newest {
  font-size: 1.4em;
}

.payload-old {
  background: color-mix(in oklab, var(--color-danger) 33%, transparent);
}

.payload-new {
  background: color-mix(in oklab, var(--color-success) 33%, transparent);
}

.message-move,
.message-enter-active {
  transition:
    transform 150ms linear,
    opacity 150ms linear;
}

/* Starts once the slide has made some room. */
.message-enter-active {
  transition-delay: 75ms;
}

.message-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

/* State icons */
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

@media (prefers-reduced-motion: reduce) {
  .message-row,
  .message-move,
  .message-enter-active,
  .search-slide-enter-active,
  .search-slide-leave-active {
    transition: none;
  }

  .pending,
  .rec-icon {
    animation: none;
  }
}
</style>
