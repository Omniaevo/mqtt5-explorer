<template>
  <div class="viewer">
    <AppHeader>
      <template #start>
        <AppTooltip :text="statusText">
          <span
            class="state-icon"
            role="img"
            tabindex="0"
            :aria-label="statusText"
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

      <div class="address">
        <AppTooltip text="Copy URL">
          <button
            class="address__copy"
            type="button"
            :aria-label="`Copy URL ${connection.url}`"
            @click="copyUrl"
          >
            <span class="address__url">{{ connection.url }}</span>
            <span class="address__name">{{ connectionProperties.name }}</span>
          </button>
        </AppTooltip>
        <!-- The rec icon takes the bell's place while file logging is active -->
        <AppTooltip v-if="fileLoggingSwitch" text="Logging is active">
          <AppButton
            variant="icon"
            size="sm"
            color="danger"
            aria-label="Logging is active"
            @click="toggleNotificationsDialog"
          >
            <CircleDot class="rec-icon" :size="16" aria-hidden="true" />
          </AppButton>
        </AppTooltip>
        <AppTooltip v-else text="Notifications">
          <AppButton
            variant="icon"
            size="sm"
            aria-label="Notifications"
            @click="toggleNotificationsDialog"
          >
            <component
              :is="notifySwitch ? BellRing : Bell"
              :size="16"
              aria-hidden="true"
            />
          </AppButton>
        </AppTooltip>
        <AppTooltip v-if="canPin" :text="pinned ? 'Unpin tab' : 'Pin tab'">
          <AppButton
            variant="icon"
            size="sm"
            :aria-label="pinned ? 'Unpin tab' : 'Pin tab'"
            :aria-pressed="pinned"
            @click="togglePin"
          >
            <component :is="pinned ? PinOff : Pin" :size="16" aria-hidden="true" />
          </AppButton>
        </AppTooltip>
      </div>

      <!-- Icon button that grows into the search bar when opened -->
      <div class="search" :class="{ 'search--open': searchVisible }">
        <SearchBar
          v-if="searchVisible"
          v-model:term="searchTerm"
          v-model:mode="searchMode"
          @close="toggleSearchField"
          @show-info="searchInfoDialog = true"
        />
        <AppTooltip v-else text="Search">
          <AppButton
            ref="searchButton"
            variant="icon"
            aria-label="Search"
            @click="toggleSearchField"
          >
            <SearchIcon :size="18" aria-hidden="true" />
          </AppButton>
        </AppTooltip>
      </div>

      <template #end>
        <AppButton
          v-if="isClosed"
          variant="tonal"
          color="primary"
          @click="reconnectAndReset"
        >
          Reconnect
        </AppButton>
        <AppButton v-else variant="tonal" @click="disconnect()">
          Disconnect
        </AppButton>
      </template>
    </AppHeader>

    <div v-if="isClosed" class="banner" role="status">Disconnected</div>

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
                :disabled="!isConnected"
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
              <AppButton
                color="primary"
                :disabled="!isConnected"
                @click="publishPanel?.submit()"
              >
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
  useTemplateRef,
  watch,
} from "vue";
import { useRoute } from "vue-router";
import {
  Bell,
  BellRing,
  CircleDot,
  Pin,
  PinOff,
  RefreshCw,
  Search as SearchIcon,
  Trash2,
  X,
} from "@lucide/vue";
import NotificationsDialog from "../components/viewer/NotificationsDialog.vue";
import HistoryPanel from "../components/viewer/HistoryPanel.vue";
import AppButton from "../components/ui/AppButton.vue";
import AppDialog from "../components/ui/AppDialog.vue";
import AppHeader from "../components/ui/AppHeader.vue";
import AppTabs from "../components/ui/AppTabs.vue";
import AppTooltip from "../components/ui/AppTooltip.vue";
import PublishPanel from "../components/viewer/PublishPanel.vue";
import SearchBar from "../components/viewer/SearchBar.vue";
import SearchInfoDialog from "../components/viewer/SearchInfoDialog.vue";
import TopicTreeView from "../components/viewer/TopicTreeView.vue";
import { useConnectionSession } from "../composables/useConnectionSession";
import { useDebouncedRef } from "../composables/useDebouncedRef";
import { useTopicSearchResponder } from "../composables/useTopicSearchResponder";
import { useNotifyAndLogging } from "../composables/useNotifyAndLogging";
import { useTopicSelection } from "../composables/useTopicSelection";
import { useTreeRefresh } from "../composables/useTreeRefresh";
import TopicTree from "../models/TopicTree";
import ConnectionProperties from "../models/ConnectionProperties";
import SearchEngine from "../../../shared/SearchEngine";
import { useConnectionsStore } from "../stores/connections";
import { useNotifyStore } from "../stores/notify";
import { useSettingsStore } from "../stores/settings";
import {
  formatEntryTime,
  formatMessageCount,
  messageKey,
  recentMessages,
} from "../utils/HistoryView";
import { retainedClearPackets } from "../utils/retainedClear";
import { MenuEvent, TabState } from "../../../shared/ipcChannels";

const SEARCH_DEBOUNCE_MS = 250;
// ponytail: fixed cap, enough rows to fill a tall window; measure the
// free height if rows ever look cut short.
const MAX_SHOWN_MESSAGES = 50;

const route = useRoute();
const settings = useSettingsStore();
const connections = useConnectionsStore();
const notify = useNotifyStore();
const connection = inject("connection");

const connectionProperties = new ConnectionProperties();
connectionProperties.init(route.meta.connection);

const isV5 = connectionProperties.version > 4;

// The topic tree is not reactive (can be large): it is plain data plus a
// version counter that is bumped, throttled, after every change.
const tree = markRaw(new TopicTree(settings.historySize));
const {
  version: treeVersion,
  request: requestTreeRefresh,
  wasUpdatedInLastBatch: isBlinking,
} = useTreeRefresh((messageCount) =>
  window.api.tabs.addActivity(messageCount)
);

const publishPanel = ref(null);
const treeView = ref(null);
const activeTab = ref("publish");
const deleteDialog = ref(false);
const notifyDialog = ref(false);
const searchInfoDialog = ref(false);
const searchVisible = ref(false);
const searchTerm = ref(undefined);
const searchMode = ref(undefined);
const searchButton = useTemplateRef("searchButton");
const debouncedSearchTerm = useDebouncedRef(searchTerm, SEARCH_DEBOUNCE_MS);
useTopicSearchResponder(tree);

const {
  stateView,
  statusText,
  isConnected,
  isClosed,
  connect,
  stayDisconnected,
  reconnect,
  disconnect,
} = useConnectionSession(connection, (message) =>
  connections.markFailed(connectionProperties.id, message)
);
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

// The logger ends with the connection: the user turns it on again after reconnect
watch(isClosed, (closed) => {
  if (closed) fileLoggingSwitch.value = false;
});

watch(
  () => settings.historySize,
  (size) => tree.setHistorySize(size)
);

/** Applies the whole batch to the tree, then refreshes the view once. */
function onBatch(packets) {
  const batchTimestamp = Date.now();

  packets.forEach((packet) => tree.apply(packet, batchTimestamp));

  requestTreeRefresh(batchTimestamp, packets.length);
}

function toggleSearchField() {
  searchVisible.value = !searchVisible.value;

  if (!searchVisible.value) closeSearchField();
}

/** Clears the term and gives the focus back to the search button. */
async function closeSearchField() {
  searchTerm.value = undefined;
  await nextTick();
  searchButton.value?.$el.focus();
}

/** Copies the broker URL to the clipboard and drops the focus from the box. */
async function copyUrl(event) {
  event.currentTarget.blur();
  await navigator.clipboard.writeText(connection.url);
  notify.info("URL copied");
}

/** Fresh start: the old topics may no longer exist on the broker. */
function reconnectAndReset() {
  tree.clear();
  resetSelection();
  requestTreeRefresh(Date.now());
  reconnect();
}

/** Only a saved connection can be pinned. */
const canPin = computed(() =>
  connections.savedConnections.some((saved) => saved.id === connectionProperties.id)
);
const pinned = ref(false);

async function togglePin() {
  pinned.value = await window.api.tabs.setPinned(!pinned.value);
}

function toggleNotificationsDialog() {
  notifyDialog.value = !notifyDialog.value;
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

  unsubscribeMenuEvents = [
    window.api.app.on(MenuEvent.SEARCH, toggleSearchField),
    window.api.app.on(MenuEvent.NOTIFICATION, toggleNotificationsDialog),
    window.api.notify.onSelectTopic(selectTopic),
    window.api.tabs.onDisconnect(() => disconnect()),
    window.api.tabs.onReconnect(() => isClosed.value && reconnectAndReset()),
  ];
});

onMounted(async () => {
  const start =
    route.meta.initialState === TabState.DISCONNECTED
      ? stayDisconnected
      : connect;

  start(settings.mqttClientSettings, () => {
    connections.markConnected(connectionProperties.id);
    pushNotifyConfig();
  });

  pinned.value = await window.api.tabs.getPinned();
});

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
/* Address box: URL in mono, connection name muted, small actions inside */
.address {
  display: flex;
  align-items: center;
  flex: 1;
  gap: var(--space-2);
  min-inline-size: 0;
  block-size: var(--control-height);
  padding-inline-end: var(--space-2);
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
}

.address:focus-within {
  outline: 2px solid var(--color-primary);
  outline-offset: -1px;
}

.address__copy {
  display: flex;
  align-items: center;
  flex: 1;
  gap: var(--space-4);
  min-inline-size: 0;
  block-size: 100%;
  padding-inline: var(--space-5);
  overflow: hidden;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  text-align: start;
  white-space: nowrap;
  cursor: pointer;
}

.address__copy:hover {
  background: var(--color-hover);
}

.address__copy:focus-visible {
  outline: none;
}

.address__url {
  overflow: hidden;
  flex: 0 1 auto;
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  text-overflow: ellipsis;
}

.address__name {
  overflow: hidden;
  flex: 1 1 0;
  min-inline-size: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-overflow: ellipsis;
}

/* Disconnected: the tree and history stay visible, read only */
.banner {
  padding: var(--space-3) var(--space-6);
  border-block-end: 1px solid var(--color-border);
  background: color-mix(in oklab, var(--color-bg), var(--color-danger) 14%);
  color: var(--color-text);
  font-size: var(--font-size-sm);
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

/* Closed: button wide. Open: grows to the bar width */
.search {
  display: flex;
  flex: 0 0 var(--control-height);
  min-inline-size: 0;
  margin-inline-start: var(--space-3);
  transition: flex-basis var(--duration-normal) var(--easing);
}

/* Clip the bar content while it grows; closed state keeps the button focus ring */
.search--open {
  flex: 0 1 52ch;
  overflow: hidden;
}

.search--open > * {
  flex: 1;
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
  font-family: var(--font-mono);
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
  /* Cap so long properties do not push the messages out of the tab */
  --properties-max-height: 30vh;

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
  max-block-size: var(--properties-max-height);
  margin: 0;
  overflow: auto;
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
  font-family: var(--font-mono);
}

.message-time {
  align-self: center;
  font-family: var(--font-mono);
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
  .search {
    transition: none;
  }

  .pending,
  .rec-icon {
    animation: none;
  }
}
</style>
