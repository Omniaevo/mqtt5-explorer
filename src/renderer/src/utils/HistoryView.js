const pad = (n, size = 2) => String(n).padStart(size, "0");

/** Local time of an epoch-ms timestamp as `HH:mm:ss.SSS`. */
export const formatEntryTime = (timestamp) => {
  const d = new Date(timestamp);
  const clock = [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) =>
    pad(n)
  );

  return `${clock.join(":")}.${pad(d.getMilliseconds(), 3)}`;
};

/**
 * Rows of the raw value list.
 * @param {{t: number, payload: string}[]} history Oldest first.
 * @returns {{key: number, time: string, payload: string}[]} Newest first.
 */
export const toRawRows = (history) =>
  history
    .map((entry, index) => ({
      key: index,
      time: formatEntryTime(entry.t),
      payload: entry.payload,
    }))
    .reverse();

const messageEntries = new WeakMap();

/** History entry of a message; the same object for the same message. */
const toEntry = (message) => {
  if (!messageEntries.has(message)) {
    messageEntries.set(message, {
      t: message.receivedAt,
      payload: message.payload,
    });
  }

  return messageEntries.get(message);
};

/**
 * Last received messages, newest first. When the node has a value, the first
 * entry is that value. Entries keep their identity across calls, so they can
 * key an animated list.
 * @param {{value?: object, old?: object, history: {t: number, payload: string}[]}} node
 * Topic node; without history (disabled) only `value` and `old` are known.
 * @param {number} limit Maximum entries returned.
 * @returns {{t: number, payload: string}[]}
 */
export const recentMessages = (node, limit) => {
  const entries =
    node.history.length > 0
      ? node.history
      : [node.old, node.value].filter(Boolean).map(toEntry);

  return entries.slice(-limit).reverse();
};

/**
 * Field to plot: the remembered one when still available, else the first.
 * @param {string[]} fields Chartable fields of the latest payload.
 * @param {string | undefined} remembered Field chosen earlier for the topic.
 * @returns {string | null} `null` when the payload itself is plotted.
 */
export const resolveField = (fields, remembered) =>
  fields.includes(remembered) ? remembered : (fields[0] ?? null);
