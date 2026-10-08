const NUMBER_PATTERN = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;
const BOOLEAN_TOKENS = new Map([
  ["true", 1],
  ["on", 1],
  ["yes", 1],
  ["false", 0],
  ["off", 0],
  ["no", 0],
]);

/** @returns {{value: number, isBoolean: boolean} | null} */
const classify = (raw) => {
  if (typeof raw === "boolean") return { value: Number(raw), isBoolean: true };
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? { value: raw, isBoolean: false } : null;
  }
  if (typeof raw !== "string") return null;

  const text = raw.trim();
  const flag = BOOLEAN_TOKENS.get(text.toLowerCase());

  if (flag !== undefined) return { value: flag, isBoolean: true };
  if (!NUMBER_PATTERN.test(text)) return null;

  const value = Number(text);

  return Number.isFinite(value) ? { value, isBoolean: false } : null;
};

/**
 * Number for a finite numeric string; 1/0 for true/false, on/off, yes/no
 * (case-insensitive, trimmed). Also accepts JSON numbers and booleans.
 * @returns {number | null} `null` when the value cannot be plotted.
 */
export const toChartValue = (raw) => classify(raw)?.value ?? null;

/** Parsed JSON object/array of each history entry; `null` for other payloads. */
const parsedEntries = new WeakMap();

const parseContainer = (entry) => {
  if (parsedEntries.has(entry)) return parsedEntries.get(entry);

  let parsed = null;

  try {
    const json = JSON.parse(entry.payload);

    parsed = json !== null && typeof json === "object" ? json : null;
  } catch {
    // Not JSON: stays null.
  }

  parsedEntries.set(entry, parsed);

  return parsed;
};

const leafPaths = (node, prefix = "") =>
  Object.entries(node).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    return child !== null && typeof child === "object"
      ? leafPaths(child, path)
      : classify(child)
        ? [path]
        : [];
  });

const readPath = (container, fieldPath) =>
  fieldPath.split(".").reduce((node, key) => node?.[key], container);

/**
 * Dot paths of the chartable leaves of a JSON object/array payload.
 * @param {{payload: string}} entry History entry.
 * @returns {string[]} Empty for non-JSON payloads.
 */
export const chartableFields = (entry) => {
  const container = parseContainer(entry);

  return container ? leafPaths(container) : [];
};

/**
 * A topic is chartable when its latest payload is chartable directly or has
 * at least one chartable field.
 * @param {{payload: string}[]} history Oldest first.
 */
export const isChartable = (history) => {
  const latest = history.at(-1);

  return (
    latest !== undefined &&
    (classify(latest.payload) !== null || chartableFields(latest).length > 0)
  );
};

/**
 * Series ready for uPlot. Entries that are not chartable become `null` gaps.
 * @param {{t: number, payload: string}[]} history Oldest first; `t` in ms.
 * @param {string | null} fieldPath Dot path inside a JSON payload, or `null`
 * to plot the payload itself.
 * @returns {{xs: number[], ys: (number | null)[], isBoolean: boolean}}
 * `isBoolean` is true when every plotted point came from a boolean.
 */
export const extractSeries = (history, fieldPath) => {
  const points = history.map((entry) =>
    classify(
      fieldPath === null
        ? entry.payload
        : readPath(parseContainer(entry), fieldPath)
    )
  );
  const plotted = points.filter(Boolean);

  return {
    xs: history.map((entry) => entry.t / 1000),
    ys: points.map((point) => point?.value ?? null),
    isBoolean: plotted.length > 0 && plotted.every((p) => p.isBoolean),
  };
};
