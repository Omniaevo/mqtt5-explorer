import { BrowserWindow, dialog, ipcMain, shell } from "electron";
import os from "os";
import path from "path";
import MqttService from "./MqttService";
import MessageLogger from "./MessageLogger";
import MessageBatcher from "./MessageBatcher";
import { Channel, RendererStoreKeys } from "../shared/ipcChannels";

const LOGS_FOLDER = path.join(os.homedir(), "mqtt5-explorer-logs");

/**
 * Registers the only IPC channels the renderer can use.
 *
 * @param {object} deps
 * @param {() => Electron.BrowserWindow | undefined} deps.getWindow
 * @param {import("electron-store")} deps.store
 * @param {(page: string) => void} deps.onPageChange
 * @param {() => void} deps.focusWindow
 */
export function registerIpcHandlers({
  getWindow,
  store,
  onPageChange,
  focusWindow,
}) {
  const sendToRenderer = (channel, payload) => {
    const win = getWindow();

    if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
  };
  const batcher = new MessageBatcher((messages) =>
    sendToRenderer(Channel.MQTT_BATCH, messages)
  );
  const mqttService = new MqttService(
    (packet) => batcher.add(packet),
    (status) => sendToRenderer(Channel.MQTT_STATUS, status)
  );
  let logger;

  const stopLogger = () => {
    logger?.stopLogging();
    logger = undefined;
  };

  // A new connection or a page reload starts from a clean state
  const resetSession = () => {
    batcher.stop();
    mqttService.dispose();
    stopLogger();
  };

  // Store
  ipcMain.on(Channel.STORE_GET, (event, key) => {
    event.returnValue = RendererStoreKeys.includes(key)
      ? store.get(key)
      : undefined;
  });
  ipcMain.on(Channel.STORE_SET, (event, key, value) => {
    if (RendererStoreKeys.includes(key)) store.set(key, value);

    event.returnValue = null;
  });

  // MQTT
  ipcMain.on(Channel.MQTT_CONNECT, (_, properties, clientSettings) => {
    stopLogger();
    batcher.start();
    mqttService.connect(properties, clientSettings);
  });
  ipcMain.handle(Channel.MQTT_DISCONNECT, () => {
    batcher.stop();

    return mqttService.disconnect();
  });
  ipcMain.on(Channel.MQTT_PUBLISH, (_, packet) => mqttService.publish(packet));

  // Logger
  ipcMain.on(Channel.LOGGER_START, (_, connectionName) => {
    logger = logger ?? new MessageLogger(connectionName);
    logger.startLogging();
  });
  ipcMain.on(Channel.LOGGER_STOP, () => logger?.stopLogging());
  ipcMain.on(Channel.LOGGER_ENQUEUE, (_, message) => logger?.enqueue(message));
  ipcMain.on(Channel.LOGGER_FOLDER, (event) => {
    event.returnValue = logger?.logsFolder ?? LOGS_FOLDER;
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
  ipcMain.on(Channel.APP_SEND_PAGE, (_, page) => onPageChange(page));
  ipcMain.on(Channel.APP_FOCUS_WINDOW, () => focusWindow());
  ipcMain.on(Channel.APP_OPEN_FOLDER, (_, folderPath) => {
    // Only the logs folder tree can be opened
    const resolved = path.resolve(String(folderPath));

    if (resolved.startsWith(LOGS_FOLDER)) shell.openPath(resolved);
  });
  ipcMain.on(Channel.APP_OPEN_EXTERNAL, (_, url) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
  });

  return { resetSession, logsFolder: LOGS_FOLDER };
}
