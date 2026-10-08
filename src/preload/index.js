import { contextBridge, ipcRenderer } from "electron";
import { Channel, MenuEvent } from "../shared/ipcChannels";

const menuEvents = Object.values(MenuEvent);

/** Subscribes to a main-process channel. Returns the unsubscribe function. */
const subscribe = (channel, callback) => {
  const listener = (_event, ...args) => callback(...args);

  ipcRenderer.on(channel, listener);

  return () => ipcRenderer.removeListener(channel, listener);
};

/**
 * API exposed to the renderer as `window.api`.
 * Every method maps to one fixed IPC channel.
 */
const api = {
  store: {
    /** @param {string} key @returns {string | undefined} */
    get: (key) => ipcRenderer.sendSync(Channel.STORE_GET, key),
    /** @param {string} key @param {string} value */
    set: (key, value) => ipcRenderer.sendSync(Channel.STORE_SET, key, value),
  },

  mqtt: {
    /**
     * @param {object} connectionProps Connection properties.
     * @param {object} clientSettings Keepalive, timeouts, max reconnects.
     */
    connect: (connectionProps, clientSettings) =>
      ipcRenderer.send(Channel.MQTT_CONNECT, connectionProps, clientSettings),
    /** @returns {Promise<void>} */
    disconnect: () => ipcRenderer.invoke(Channel.MQTT_DISCONNECT),
    /** @param {{topic: string, payload: string, qos: number, retain: boolean, properties?: object}} packet */
    publish: (packet) => ipcRenderer.send(Channel.MQTT_PUBLISH, packet),
    /**
     * @param {(packet: {topic: string, payload: string, qos: number, retain: boolean, properties?: object}) => void} callback
     * @returns {() => void} Unsubscribe function.
     */
    onMessage: (callback) => subscribe(Channel.MQTT_MESSAGE, callback),
    /**
     * @param {(status: {status: "connected" | "closed", error?: string}) => void} callback
     * @returns {() => void} Unsubscribe function.
     */
    onStatus: (callback) => subscribe(Channel.MQTT_STATUS, callback),
  },

  logger: {
    /** @param {string} connectionName */
    start: (connectionName) =>
      ipcRenderer.send(Channel.LOGGER_START, connectionName),
    stop: () => ipcRenderer.send(Channel.LOGGER_STOP),
    /** @param {{topic: string, payload: string, properties?: object}} message */
    enqueue: (message) => ipcRenderer.send(Channel.LOGGER_ENQUEUE, message),
    /** @returns {string} */
    logsFolder: () => ipcRenderer.sendSync(Channel.LOGGER_FOLDER),
  },

  app: {
    /** Operating system name, as given by `process.platform`. */
    platform: process.platform,
    /** @param {"home" | "viewer"} name */
    sendPage: (name) => ipcRenderer.send(Channel.APP_SEND_PAGE, name),
    focusWindow: () => ipcRenderer.send(Channel.APP_FOCUS_WINDOW),
    /** @param {string} path Folder inside the logs folder. */
    openFolder: (path) => ipcRenderer.send(Channel.APP_OPEN_FOLDER, path),
    /** @param {string} url An http(s) URL. */
    openExternal: (url) => ipcRenderer.send(Channel.APP_OPEN_EXTERNAL, url),
    /**
     * Listens to a menu event.
     * @param {"settingsPressed" | "exportDataPressed" | "importDataPressed" | "searchPressed" | "notificationPressed"} channel
     * @param {(...args: any[]) => void} callback
     * @returns {() => void} Unsubscribe function.
     */
    on: (channel, callback) => {
      if (!menuEvents.includes(channel)) {
        throw new Error(`Unknown menu event: ${channel}`);
      }

      return subscribe(channel, callback);
    },
  },
};

contextBridge.exposeInMainWorld("api", api);
