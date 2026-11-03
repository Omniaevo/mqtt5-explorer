import { computed, ref } from "vue";
import { Cloud, CloudCheck, CloudSync } from "@lucide/vue";
import Connection from "../utils/Connection";
import { TabState } from "../../../shared/ipcChannels";

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
    icon: CloudCheck,
    color: "primary",
    text: "Disconnected",
    class: "grayscale",
  },
  [STATES.ERROR]: { icon: CloudCheck, color: "danger", text: "An error occurred" },
};

/**
 * Connection lifecycle of the viewer: state, its icon description, and the
 * disconnect flow. The tab reports to main, which closes it on disconnect and
 * shows the error on Home.
 * @param {Connection} connection Already initialised connection.
 */
export function useConnectionSession(connection) {
  const state = ref(STATES.PENDING);
  const stateView = computed(() => STATE_VIEWS[state.value]);

  /** Connects with the given client settings; `onConnected` runs once. */
  function connect(clientSettings, onConnected) {
    connection.connect(
      clientSettings,
      () => {
        state.value = STATES.CONNECTED;
        window.api.tabs.setState(TabState.CONNECTED);
        onConnected();
      },
      (error) => disconnect(error)
    );
  }

  /** @param {string} [errorMessage] Set when the broker failed; none = manual. */
  function disconnect(errorMessage = undefined) {
    const failed = errorMessage !== undefined;

    connection.disconnect(() => {
      state.value = failed ? STATES.ERROR : STATES.DISCONNECTED;

      if (failed) {
        window.api.tabs.setState(
          TabState.ERROR,
          errorMessage || UNREACHABLE_MESSAGE
        );
      } else {
        window.api.tabs.closeSelf();
      }
    });
  }

  return { stateView, connect, disconnect };
}
