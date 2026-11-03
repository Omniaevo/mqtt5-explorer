import { ipcMain } from "electron";
import { ConnectionFields } from "../shared/connectionFields";
import { Channel, FixedTabId, TabKind, TabState } from "../shared/ipcChannels";

const OPENABLE_KINDS = [TabKind.SETTINGS, TabKind.CONNECTION];
const MAX_STRIP_HEIGHT = 400;
const MAX_ERROR_MESSAGE_LENGTH = 500;
const REPORTABLE_STATES = [
  TabState.PENDING,
  TabState.CONNECTED,
  TabState.DISCONNECTED,
  TabState.ERROR,
];

const LISTENER_CHANNELS = [
  Channel.TABS_SELECT,
  Channel.TABS_CLOSE,
  Channel.TABS_OPEN,
  Channel.TABS_OPEN_CONNECTION,
  Channel.TABS_SET_STATE,
  Channel.TABS_CONTEXT_MENU,
  Channel.TABS_SET_LOGGING,
  Channel.SHELL_SET_HEIGHT,
  Channel.SHELL_SET_STATUS_HEIGHT,
];
const HANDLER_CHANNELS = [Channel.TABS_GET_STATE, Channel.TABS_GET_CONNECTION];

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

const isNonEmptyString = (value) => typeof value === "string" && value !== "";
const pick = (source, keys) =>
  Object.fromEntries(keys.map((key) => [key, source[key]]));

/**
 * Returns a copy of the connection with only the known fields, or undefined
 * when a required field is missing or a field has the wrong type.
 */
export function parseConnection(connection) {
  if (!isPlainObject(connection)) return undefined;

  const { requiredStrings, optionalStrings, numbers, protocols } =
    ConnectionFields;
  const { protocol, topics, validateCertificate } = connection;
  const valid =
    requiredStrings.every((key) => isNonEmptyString(connection[key])) &&
    optionalStrings.every(
      (key) => connection[key] == null || typeof connection[key] === "string"
    ) &&
    numbers.every((key) => Number.isFinite(connection[key])) &&
    protocols.includes(protocol) &&
    Array.isArray(topics) &&
    topics.every((topic) => typeof topic === "string") &&
    typeof validateCertificate === "boolean";

  if (!valid) return undefined;

  return {
    ...pick(connection, [
      ...requiredStrings,
      ...optionalStrings,
      ...numbers,
    ]),
    protocol,
    topics: [...topics],
    validateCertificate,
  };
}

/** Returns a safe state report, or undefined when invalid. */
export function parseStateReport(state, message) {
  if (!REPORTABLE_STATES.includes(state)) return undefined;

  return {
    state,
    message:
      typeof message === "string"
        ? message.slice(0, MAX_ERROR_MESSAGE_LENGTH)
        : "",
  };
}

/** Returns the height of a shell bar clamped to a sane range, or undefined when invalid. */
export function parseBarHeight(height) {
  if (typeof height !== "number" || !Number.isFinite(height)) return undefined;

  return Math.min(Math.max(Math.round(height), 0), MAX_STRIP_HEIGHT);
}

/**
 * Registers the tab channels. The shell (the window webContents) drives the
 * tabs. A tab view can only act on its own tab, and only Home may open a
 * connection.
 *
 * @param {object} deps
 * @param {import("./TabManager").default} deps.tabs
 * @param {() => Electron.WebContents} deps.getShellContents
 * @param {(tabId: string) => void} deps.onContextMenu Shows the menu of a tab.
 * @returns {() => void} Removes the handlers.
 */
export function registerTabsIpc({ tabs, getShellContents, onContextMenu }) {
  const context = {
    tabs,
    fromShell: (event) => event.sender === getShellContents(),
    tabOf: (event) => tabs.tabIdOf(event.sender.id),
  };

  registerShellHandlers({ ...context, onContextMenu });
  registerViewHandlers(context);

  return () => {
    LISTENER_CHANNELS.forEach((channel) => ipcMain.removeAllListeners(channel));
    HANDLER_CHANNELS.forEach((channel) => ipcMain.removeHandler(channel));
  };
}

/** Channels only the shell may use: it drives the tab strip. */
function registerShellHandlers({ tabs, fromShell, onContextMenu }) {
  const onShell = (channel, handler) =>
    ipcMain.on(channel, (event, ...args) => {
      if (fromShell(event)) handler(...args);
    });

  onShell(Channel.TABS_SELECT, (id) => {
    if (typeof id === "string") tabs.select(id);
  });
  onShell(Channel.TABS_OPEN, (kind, payload) => {
    const request = parseOpenRequest(kind, payload);

    if (request) tabs.open(request.kind, request.payload);
  });
  onShell(Channel.TABS_CONTEXT_MENU, (id) => {
    if (typeof id === "string") onContextMenu(id);
  });
  onShell(Channel.SHELL_SET_HEIGHT, (height) => {
    const parsed = parseBarHeight(height);

    if (parsed !== undefined) tabs.setStripHeight(parsed);
  });
  onShell(Channel.SHELL_SET_STATUS_HEIGHT, (height) => {
    const parsed = parseBarHeight(height);

    if (parsed !== undefined) tabs.setStatusBarHeight(parsed);
  });
  ipcMain.handle(Channel.TABS_GET_STATE, (event) =>
    fromShell(event) ? tabs.snapshot() : undefined
  );
}

/** Channels a tab view uses; each one acts on the tab of the sender. */
function registerViewHandlers({ tabs, fromShell, tabOf }) {
  ipcMain.on(Channel.TABS_CLOSE, (event, id) => {
    // The shell closes any tab; a view closes its own tab
    const target = fromShell(event) ? id : tabOf(event);

    if (typeof target === "string") tabs.close(target);
  });
  ipcMain.on(Channel.TABS_OPEN_CONNECTION, (event, connection) => {
    const parsed = parseConnection(connection);

    if (parsed && tabOf(event) === FixedTabId.HOME) {
      tabs.open(TabKind.CONNECTION, {
        connectionId: parsed.id,
        connection: parsed,
      });
    }
  });
  ipcMain.on(Channel.TABS_SET_STATE, (event, state, message) => {
    const report = parseStateReport(state, message);

    if (!report) return;
    if (report.state === TabState.ERROR) {
      tabs.fail(tabOf(event), report.message);
    } else {
      tabs.setState(tabOf(event), report.state);
    }
  });
  ipcMain.on(Channel.TABS_SET_LOGGING, (event, enabled) => {
    if (typeof enabled === "boolean") tabs.setLogging(tabOf(event), enabled);
  });
  ipcMain.handle(Channel.TABS_GET_CONNECTION, (event) =>
    tabs.getConnection(tabOf(event))
  );

}
