import {
  BrowserWindow,
  dialog,
  ipcMain,
  Notification,
  shell,
  webContents,
} from "electron";
import path from "path";
import Session from "./Session";
import { applyStoreSet } from "./storeSync";
import SessionRegistry from "./SessionRegistry";
import { LOGS_ROOT } from "./MessageLogger";
import { Channel, RendererStoreKeys } from "../shared/ipcChannels";

/**
 * Registers the only IPC channels the renderer can use.
 * MQTT, notification and logger channels act on the session of the sender.
 *
 * @param {object} deps
 * @param {import("electron-store")} deps.store
 * @param {() => void} deps.focusWindow
 * @param {(webContents: Electron.WebContents) => boolean} [deps.isConnectionView]
 * Only a connection view may use the session channels.
 * @param {(webContents: Electron.WebContents) => void} [deps.onSessionFocus]
 * Called when a notification of a session is clicked.
 */
export function registerIpcHandlers({
  store,
  focusWindow,
  isConnectionView = () => true,
  onSessionFocus = () => {},
}) {
  const sessions = new SessionRegistry(
    (webContents) =>
      new Session({
        webContents,
        createNotification: (title, body) => new Notification({ title, body }),
        onNotificationClick: (target) => {
          focusWindow();
          onSessionFocus(target);
        },
      })
  );
  // Shell, Home and Settings get no session
  const sessionOf = (event) =>
    isConnectionView(event.sender) ? sessions.get(event.sender) : undefined;

  // Store
  ipcMain.on(Channel.STORE_GET, (event, key) => {
    event.returnValue = RendererStoreKeys.includes(key)
      ? store.get(key)
      : undefined;
  });
  ipcMain.on(Channel.STORE_SET, (event, key, value) => {
    applyStoreSet(
      {
        store,
        sender: event.sender,
        getAllWebContents: () => webContents.getAllWebContents(),
      },
      key,
      value
    );

    event.returnValue = null;
  });

  // MQTT
  ipcMain.on(Channel.MQTT_CONNECT, (event, properties, clientSettings) =>
    sessionOf(event)?.connect(properties, clientSettings)
  );
  ipcMain.handle(Channel.MQTT_DISCONNECT, (event) =>
    sessionOf(event)?.disconnect()
  );
  ipcMain.on(Channel.MQTT_PUBLISH, (event, packet) =>
    sessionOf(event)?.publish(packet)
  );

  // Notifications and logging: the UI owns the config, main does the matching
  ipcMain.on(Channel.NOTIFY_SET_CONFIG, (event, config) =>
    sessionOf(event)?.setNotifyConfig(config)
  );

  // Logger
  ipcMain.on(Channel.LOGGER_START, (event, connectionName) =>
    sessionOf(event)?.startLogging(connectionName)
  );
  ipcMain.on(Channel.LOGGER_STOP, (event) => sessionOf(event)?.stopLogging());
  ipcMain.on(Channel.LOGGER_FOLDER, (event) => {
    event.returnValue = sessionOf(event)?.logsFolder ?? null;
  });

  // Dialog: the renderer only picks title and filters, never the dialog kind
  ipcMain.handle(Channel.DIALOG_OPEN_FILE, async (event, options = {}) => {
    const result = await dialog.showOpenDialog(
      BrowserWindow.fromWebContents(event.sender),
      {
        title: typeof options.title === "string" ? options.title : undefined,
        filters: Array.isArray(options.filters) ? options.filters : undefined,
        properties: ["openFile"],
      }
    );

    return result.canceled ? undefined : result.filePaths[0];
  });

  // App
  ipcMain.on(Channel.APP_OPEN_FOLDER, (_, folderPath) => {
    // Only the logs folder tree can be opened
    const resolved = path.resolve(String(folderPath));

    if (resolved.startsWith(LOGS_ROOT)) shell.openPath(resolved);
  });
  ipcMain.on(Channel.APP_OPEN_EXTERNAL, (_, url) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
  });

  return { shutdown: () => sessions.shutdown(), logsFolder: LOGS_ROOT };
}
