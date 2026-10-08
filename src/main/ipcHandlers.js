import { ipcMain, shell } from "electron";
import os from "os";
import path from "path";
import MqttService from "./MqttService";
import MessageLogger from "./MessageLogger";
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
  const mqttService = new MqttService(
    (packet) => sendToRenderer(Channel.MQTT_MESSAGE, packet),
    (status) => sendToRenderer(Channel.MQTT_STATUS, status)
  );
  let logger;

  const stopLogger = () => {
    logger?.stopLogging();
    logger = undefined;
  };

  // A new connection or a page reload starts from a clean state
  const resetSession = () => {
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
    mqttService.connect(properties, clientSettings);
  });
  ipcMain.handle(Channel.MQTT_DISCONNECT, () => mqttService.disconnect());
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
