import { onBeforeUnmount, shallowRef } from "vue";

const REFRESH_PERIOD_MS = 100; // At most one render per period
const BLINK_SETTLE_MS = 150; // TopicNode blink lasts 120 ms

/**
 * Manual change trigger for the non-reactive topic tree.
 * Call `request()` after every tree mutation: `version` changes at most once
 * per period, plus one extra time to switch the blink effect off.
 */
export function useTreeRefresh() {
  const version = shallowRef(0);
  let refreshTimer;
  let settleTimer;

  const flush = () => {
    refreshTimer = undefined;
    version.value++;

    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => version.value++, BLINK_SETTLE_MS);
  };

  const request = () => {
    refreshTimer ??= setTimeout(flush, REFRESH_PERIOD_MS);
  };

  onBeforeUnmount(() => {
    clearTimeout(refreshTimer);
    clearTimeout(settleTimer);
  });

  return { version, request };
}
