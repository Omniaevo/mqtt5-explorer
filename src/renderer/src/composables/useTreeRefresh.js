import { shallowRef } from "vue";

/**
 * Manual change trigger for the non-reactive topic tree.
 * Call `request()` once per batch of tree mutations: `version` changes and
 * `lastBatchAt` holds the batch time, so rows can tell if they were updated
 * in the latest batch (blink effect). The main process already limits the
 * batch rate, so no throttle here.
 */
export function useTreeRefresh() {
  const version = shallowRef(0);
  let lastBatchAt = 0; // Not reactive on purpose: `version` drives the render

  const request = (batchTimestamp) => {
    lastBatchAt = batchTimestamp;
    version.value++;
  };

  const wasUpdatedInLastBatch = (node) => node.lastUpdate >= lastBatchAt;

  return { version, request, wasUpdatedInLastBatch };
}
