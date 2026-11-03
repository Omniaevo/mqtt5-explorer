import { onBeforeUnmount, shallowRef } from "vue";

/**
 * Manual change trigger for the non-reactive topic tree.
 * Call `request()` once per batch of tree mutations: `version` changes and
 * `lastBatchAt` holds the batch time, so rows can tell if they were updated
 * in the latest batch (blink effect). The main process already limits the
 * batch rate, so no throttle here.
 *
 * While the view is hidden (background tab) the refresh is frozen: the
 * caller still mutates the tree, but `version` stays. One refresh runs when
 * the view shows again.
 * @param {(messageCount: number) => void} [onHiddenBatch] Called for every
 *   batch that arrives while hidden, with its message count.
 */
export function useTreeRefresh(onHiddenBatch = () => {}) {
  const version = shallowRef(0);
  let lastBatchAt = 0; // Not reactive on purpose: `version` drives the render
  let stale = false; // Batches arrived while hidden

  const request = (batchTimestamp, messageCount = 0) => {
    lastBatchAt = batchTimestamp;

    if (document.hidden) {
      if (messageCount > 0) onHiddenBatch(messageCount);
      stale = true;
      return;
    }

    version.value++;
  };

  const refreshWhenVisible = () => {
    if (document.hidden || !stale) return;

    stale = false;
    version.value++;
  };

  document.addEventListener("visibilitychange", refreshWhenVisible);
  onBeforeUnmount(() =>
    document.removeEventListener("visibilitychange", refreshWhenVisible)
  );

  const wasUpdatedInLastBatch = (node) => node.lastUpdate >= lastBatchAt;

  return { version, request, wasUpdatedInLastBatch };
}
