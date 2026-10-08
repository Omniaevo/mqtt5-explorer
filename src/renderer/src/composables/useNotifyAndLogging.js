import { onBeforeUnmount, ref, watch } from "vue";

export const JOIN_MODES = Object.freeze({ OR: "or", AND: "and" });

/**
 * State of the "Notifications and logging" feature. Every change is pushed
 * to the main process, which matches, notifies and logs.
 * @param {() => string} getConnectionName Used to name the log folder.
 */
export function useNotifyAndLogging(getConnectionName) {
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

  /** Pushes the whole configuration; main does the matching (D18). */
  function pushConfig() {
    window.api.notify.setConfig({
      notifyEnabled: notifySwitch.value,
      loggingEnabled: fileLoggingSwitch.value,
      joinType: joinType.value,
      entries: entries.value.map((entry) => ({
        term: entry.notifyEntry,
        mode: entry.filterType,
      })),
    });
  }

  watch([notifySwitch, fileLoggingSwitch, joinType, entries], pushConfig);

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
    pushConfig,
    reset,
  };
}
