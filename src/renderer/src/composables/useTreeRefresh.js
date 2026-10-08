import { onBeforeUnmount, shallowRef } from "vue";

const BLINK_SETTLE_MS = 150; // TopicNode blink lasts 120 ms

/**
 * Manual change trigger for the non-reactive topic tree.
 * Call `request()` once per batch of tree mutations: `version` changes
 * right away, plus one extra time to switch the blink effect off.
 * The main process already limits the batch rate, so no throttle here.
 */
export function useTreeRefresh() {
  const version = shallowRef(0);
  let settleTimer;

  const request = () => {
    version.value++;

    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => version.value++, BLINK_SETTLE_MS);
  };

  onBeforeUnmount(() => clearTimeout(settleTimer));

  return { version, request };
}
