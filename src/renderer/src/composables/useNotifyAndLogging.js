import { onBeforeUnmount, ref, watch } from "vue";
import sendNotification from "../utils/sendNotification";
import toPlain from "../utils/toPlain";

export const JOIN_MODES = Object.freeze({ OR: "or", AND: "and" });

/**
 * State and matching of the "Notifications and logging" feature.
 * @param {() => string} getConnectionName Used to name the log folder.
 * @param {(topic: string) => void} onSelectTopic Called when a notification is clicked.
 */
export function useNotifyAndLogging(getConnectionName, onSelectTopic) {
  const notifySwitch = ref(false);
  const fileLoggingSwitch = ref(false);
  const entries = ref([]);
  const joinType = ref(JOIN_MODES.OR);
  const logsFolder = ref("");

  watch(fileLoggingSwitch, (enabled) => {
    if (enabled) {
      window.api.logger.start(getConnectionName());
      logsFolder.value = window.api.logger.logsFolder();
    } else {
      window.api.logger.stop();
    }
  });

  onBeforeUnmount(() => window.api.logger.stop());

  function matchesConditions(node) {
    if (entries.value.length === 0) return false;

    const matchesEntry = (entry) =>
      node.search(entry.notifyEntry, entry.filterType);

    return joinType.value === JOIN_MODES.AND
      ? entries.value.every(matchesEntry)
      : entries.value.some(matchesEntry);
  }

  /** Logs and/or notifies `node` when its message matches the conditions. */
  function process(node) {
    if (!notifySwitch.value && !fileLoggingSwitch.value) return;
    if (!node.value || !matchesConditions(node)) return;

    if (fileLoggingSwitch.value) {
      window.api.logger.enqueue(toPlain(node.value));
    }

    if (notifySwitch.value) {
      sendNotification(node.value.topic, node.value.payload, () => {
        onSelectTopic(node.value.topic);
        window.api.app.focusWindow();
      });
    }
  }

  function reset() {
    notifySwitch.value = false;
    fileLoggingSwitch.value = false;
    entries.value = [];
  }

  return {
    notifySwitch,
    fileLoggingSwitch,
    entries,
    joinType,
    logsFolder,
    process,
    reset,
  };
}
