import { parseConnection } from "./tabsIpc";
import { StoreKey } from "../shared/ipcChannels";

/**
 * Parses the saved connections the renderer stores as a JSON string.
 * Invalid entries are skipped.
 * @param {string | undefined} raw
 * @returns {object[] | undefined} Undefined when the value is unreadable.
 */
export function parseSavedConnections(raw) {
  try {
    const list = JSON.parse(raw ?? "[]");

    return Array.isArray(list)
      ? list.map(parseConnection).filter(Boolean)
      : undefined;
  } catch {
    return undefined;
  }
}

/** @returns {string[]} The stored connection ids; empty when the value is invalid. */
export function parsePinnedIds(value) {
  return Array.isArray(value)
    ? value.filter((id) => typeof id === "string")
    : [];
}

/**
 * Restores the pinned tabs and keeps the tabs in step with the saved
 * connections. When the saved connections are unreadable nothing is restored
 * or dropped, so a damaged value never erases the pinned list.
 *
 * @param {object} deps
 * @param {{get: Function, onDidChange: Function}} deps.store
 * @param {import("./TabManager").default} deps.tabs
 * @returns {() => void} Stops following the store.
 */
export function restorePinnedTabs({ store, tabs }) {
  const connections = parseSavedConnections(store.get(StoreKey.CONNECTIONS));

  if (connections) {
    tabs.restorePinned(parsePinnedIds(store.get(StoreKey.PINNED_TABS)), connections);
  }

  return store.onDidChange(StoreKey.CONNECTIONS, (raw) => {
    const changed = parseSavedConnections(raw);

    if (changed) tabs.syncSavedConnections(changed);
  });
}
