import { ipcMain } from "electron";
import { Channel, TabKind } from "../shared/ipcChannels";

const OPENABLE_KINDS = [TabKind.SETTINGS, TabKind.CONNECTION];
const MAX_STRIP_HEIGHT = 400;

const isPlainObject = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Returns a safe payload for `TabManager.open`, or undefined when invalid. */
export function parseOpenRequest(kind, payload = {}) {
  if (!OPENABLE_KINDS.includes(kind)) return undefined;
  if (!isPlainObject(payload)) return undefined;

  const { connectionId, connection } = payload;

  if (connectionId !== undefined && typeof connectionId !== "string") {
    return undefined;
  }
  if (connection !== undefined && !isPlainObject(connection)) return undefined;

  return { kind, payload: { connectionId, connection } };
}

/** Returns the strip height clamped to a sane range, or undefined when invalid. */
export function parseStripHeight(height) {
  if (typeof height !== "number" || !Number.isFinite(height)) return undefined;

  return Math.min(Math.max(Math.round(height), 0), MAX_STRIP_HEIGHT);
}

/**
 * Registers the tab channels. Only the shell (the window webContents)
 * may use them: a tab view that asks is ignored.
 *
 * @param {object} deps
 * @param {import("./TabManager").default} deps.tabs
 * @param {() => Electron.WebContents} deps.getShellContents
 * @returns {() => void} Removes the handlers.
 */
export function registerTabsIpc({ tabs, getShellContents }) {
  const fromShell = (event) => event.sender === getShellContents();
  const onShell = (channel, handler) =>
    ipcMain.on(channel, (event, ...args) => {
      if (fromShell(event)) handler(...args);
    });

  onShell(Channel.TABS_SELECT, (id) => {
    if (typeof id === "string") tabs.select(id);
  });
  onShell(Channel.TABS_CLOSE, (id) => {
    if (typeof id === "string") tabs.close(id);
  });
  onShell(Channel.TABS_OPEN, (kind, payload) => {
    const request = parseOpenRequest(kind, payload);

    if (request) tabs.open(request.kind, request.payload);
  });
  onShell(Channel.SHELL_SET_HEIGHT, (height) => {
    const parsed = parseStripHeight(height);

    if (parsed !== undefined) tabs.setStripHeight(parsed);
  });
  ipcMain.handle(Channel.TABS_GET_STATE, (event) =>
    fromShell(event) ? tabs.snapshot() : undefined
  );

  return () => {
    [
      Channel.TABS_SELECT,
      Channel.TABS_CLOSE,
      Channel.TABS_OPEN,
      Channel.SHELL_SET_HEIGHT,
    ].forEach((channel) => ipcMain.removeAllListeners(channel));
    ipcMain.removeHandler(Channel.TABS_GET_STATE);
  };
}
