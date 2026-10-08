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
     * Receives the packets collected by the main process, in arrival order.
     * @param {(packets: {topic: string, payload: string, qos: number, retain: boolean, properties?: object}[]) => void} callback
     * @returns {() => void} Unsubscribe function.
     */
    onBatch: (callback) => subscribe(Channel.MQTT_BATCH, callback),
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
    /** @returns {string} */
    logsFolder: () => ipcRenderer.sendSync(Channel.LOGGER_FOLDER),
  },

  notify: {
    /**
     * Sets what main notifies and logs. Call it on every change.
     * @param {{notifyEnabled: boolean, loggingEnabled: boolean, joinType: "or" | "and", entries: {term: string, mode: string}[]}} config
     */
    setConfig: (config) => ipcRenderer.send(Channel.NOTIFY_SET_CONFIG, config),
    /**
     * Called with the topic of a notification the user clicked.
     * @param {(topic: string) => void} callback
     * @returns {() => void} Unsubscribe function.
     */
    onSelectTopic: (callback) =>
      subscribe(Channel.NOTIFY_SELECT_TOPIC, callback),
  },

  dialog: {
    /**
     * Shows the native "open file" dialog.
     * @param {{title?: string, filters?: {name: string, extensions: string[]}[]}} [options]
     * @returns {Promise<string | undefined>} Selected path, or undefined if canceled.
     */
    openFile: (options) =>
      ipcRenderer.invoke(Channel.DIALOG_OPEN_FILE, options),
  },

  app: {
    /** Operating system name, as given by `process.platform`. */
    platform: process.platform,
    /** @param {"home" | "viewer"} name */
    sendPage: (name) => ipcRenderer.send(Channel.APP_SEND_PAGE, name),
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
