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

  function findMatches(node) {
    const found = entries.value.flatMap((entry) =>
      node.deepSearch(entry.notifyEntry, entry.filterType)
    );

    if (joinType.value !== JOIN_MODES.AND) return found;

    return found.filter(
      (match) =>
        match &&
        entries.value.every((entry) =>
          match.search(entry.notifyEntry, entry.filterType)
        )
    );
  }

  /** Logs and/or notifies the messages of `node` that match the conditions. */
  function process(node) {
    if (!notifySwitch.value && !fileLoggingSwitch.value) return;

    findMatches(node).forEach((match) => {
      if (!match?.value) return;

      if (fileLoggingSwitch.value) {
        window.api.logger.enqueue(toPlain(match.value));
      }

      if (notifySwitch.value) {
        sendNotification(match.value.topic, match.value.payload, () => {
          onSelectTopic(match.value.topic);
          window.api.app.focusWindow();
        });
      }
    });
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
