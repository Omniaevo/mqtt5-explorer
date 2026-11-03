import { computed, ref } from "vue";
import { Cloud, CloudAlert, CloudOff, CloudSync } from "@lucide/vue";
import Connection from "../utils/Connection";
import { TabState } from "../../../shared/ipcChannels";
import { useNotifyStore } from "../stores/notify";

const STATES = Connection.connectionStates;
const UNREACHABLE_MESSAGE = "The broker is unreachable";

const STATE_VIEWS = {
  [STATES.CONNECTED]: { icon: Cloud, color: "primary", text: "Connected" },
  [STATES.PENDING]: {
    icon: CloudSync,
    color: "primary",
    text: "Connection pending ...",
    class: "pending",
  },
  [STATES.DISCONNECTED]: {
    icon: CloudOff,
    color: "primary",
    text: "Disconnected",
    class: "grayscale",
  },
  [STATES.ERROR]: { icon: CloudAlert, color: "danger", text: "An error occurred" },
};

/**
 * Connection lifecycle of the viewer: state, its icon description, and the
 * connect / disconnect / reconnect flow. The tab stays open in every state;
 * it reports its state to main and shows broker errors itself.
 * @param {Connection} connection Already initialised connection.
 * @param {(message: string) => void} [onFailed] Called when the broker failed. A manual disconnect is not a failure.
 */
export function useConnectionSession(connection, onFailed = () => {}) {
  const notify = useNotifyStore();
  const state = ref(STATES.PENDING);
  const stateView = computed(() => STATE_VIEWS[state.value]);
  const isConnected = computed(() => state.value === STATES.CONNECTED);
  const isClosed = computed(
    () => state.value === STATES.DISCONNECTED || state.value === STATES.ERROR
  );

  // Kept so that `reconnect` repeats the last `connect`
  let lastClientSettings;
  let lastOnConnected = () => {};

  function configure(clientSettings, onConnected) {
    lastClientSettings = clientSettings;
    lastOnConnected = onConnected;
  }

  /** Connects with the given client settings; `onConnected` runs on every success. */
  function connect(clientSettings, onConnected) {
    configure(clientSettings, onConnected);
    reconnect();
  }

  /** Same settings as `connect`, but waits for `reconnect` (the user's call). */
  function stayDisconnected(clientSettings, onConnected) {
    configure(clientSettings, onConnected);
    state.value = STATES.DISCONNECTED;
  }

  /** Opens a new connection with the settings of the last `connect`. */
  function reconnect() {
    state.value = STATES.PENDING;
    window.api.tabs.setState(TabState.PENDING);

    connection.connect(
      lastClientSettings,
      () => {
        state.value = STATES.CONNECTED;
        window.api.tabs.setState(TabState.CONNECTED);
        lastOnConnected();
      },
      (error) => disconnect(error)
    );
  }

  /** @param {string} [errorMessage] Set when the broker failed; none = manual. */
  function disconnect(errorMessage = undefined) {
    const failed = errorMessage !== undefined;

    connection.disconnect(() => {
      state.value = failed ? STATES.ERROR : STATES.DISCONNECTED;
      window.api.tabs.setState(failed ? TabState.ERROR : TabState.DISCONNECTED);

      if (!failed) return;

      const message = errorMessage || UNREACHABLE_MESSAGE;

      notify.error(message);
      onFailed(message);
    });
  }

  return {
    stateView,
    isConnected,
    isClosed,
    connect,
    stayDisconnected,
    reconnect,
    disconnect,
  };
}
