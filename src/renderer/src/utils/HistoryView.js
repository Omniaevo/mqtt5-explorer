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

/**
 * Field to plot: the remembered one when still available, else the first.
 * @param {string[]} fields Chartable fields of the latest payload.
 * @param {string | undefined} remembered Field chosen earlier for the topic.
 * @returns {string | null} `null` when the payload itself is plotted.
 */
export const resolveField = (fields, remembered) =>
  fields.includes(remembered) ? remembered : (fields[0] ?? null);
