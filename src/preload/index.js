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
    /**
     * Called with the key another renderer just changed.
     * @param {(key: string) => void} callback
     * @returns {() => void} Unsubscribe function.
     */
    onChanged: (callback) => subscribe(Channel.STORE_CHANGED, callback),
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
    /**
     * Called when main asks this view to show a toast.
     * @param {(message: string, color: "error" | "info") => void} callback
     * @returns {() => void} Unsubscribe function.
     */
    onShow: (callback) => subscribe(Channel.NOTIFY_SHOW, callback),
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

  tabs: {
    /** @returns {Promise<{tabs: object[], activeId: string}>} */
    getState: () => ipcRenderer.invoke(Channel.TABS_GET_STATE),
    /**
     * Called with the new tab list on every change.
     * @param {(state: {tabs: object[], activeId: string}) => void} callback
     * @returns {() => void} Unsubscribe function.
     */
    onState: (callback) => subscribe(Channel.TABS_STATE, callback),
    /** @param {string} id */
    select: (id) => ipcRenderer.send(Channel.TABS_SELECT, id),
    /** @param {string} id */
    close: (id) => ipcRenderer.send(Channel.TABS_CLOSE, id),
    /** Closes the tab of the calling view. */
    closeSelf: () => ipcRenderer.send(Channel.TABS_CLOSE),
    /**
     * Opens the connection in its own tab, or selects the tab it already has.
     * Only the Home view may call it.
     * @param {object} connection Plain connection properties.
     */
    openConnection: (connection) =>
      ipcRenderer.send(Channel.TABS_OPEN_CONNECTION, connection),
    /**
     * Connection properties of the tab that owns the calling view.
     * @returns {Promise<object | undefined>}
     */
    getConnection: () => ipcRenderer.invoke(Channel.TABS_GET_CONNECTION),
    /**
     * Reports the connection state of the calling view's tab. An "error"
     * state shows the message on Home and closes the tab.
     * @param {"pending" | "connected" | "disconnected" | "error"} state
     * @param {string} [message] Error text.
     */
    setState: (state, message) =>
      ipcRenderer.send(Channel.TABS_SET_STATE, state, message),
    /**
     * @param {"settings" | "connection"} kind
     * @param {{connectionId?: string, connection?: object}} [payload]
     */
    open: (kind, payload) => ipcRenderer.send(Channel.TABS_OPEN, kind, payload),
    /** @param {number} height Strip height in pixels. */
    setStripHeight: (height) =>
      ipcRenderer.send(Channel.SHELL_SET_HEIGHT, height),
  },

  // Shell only: the window has no native frame
  window: {
    /**
     * Pops up the app menu (Windows and Linux).
     * @param {{x: number, y: number}} anchor Window position in pixels.
     */
    openMenu: (anchor) => ipcRenderer.send(Channel.SHELL_OPEN_MENU, anchor),
    minimize: () => ipcRenderer.send(Channel.WINDOW_MINIMIZE),
    toggleMaximize: () => ipcRenderer.send(Channel.WINDOW_TOGGLE_MAXIMIZE),
    /** Closes the window, or hides it to the tray. */
    close: () => ipcRenderer.send(Channel.WINDOW_CLOSE),
    /** @returns {Promise<{maximized: boolean}>} */
    getState: () => ipcRenderer.invoke(Channel.WINDOW_GET_STATE),
    /**
     * @param {(state: {maximized: boolean}) => void} callback
     * @returns {() => void} Unsubscribe function.
     */
    onState: (callback) => subscribe(Channel.WINDOW_STATE, callback),
  },

  // Native tooltip: the shell asks for it, a view of its own draws it above the tabs
  tooltip: {
    /**
     * Shell only. Shows a tooltip below an element after the caller's delay.
     * @param {{title: string, subtitle?: string, anchor: {x: number, y: number, width: number, height: number}}} request
     */
    show: (request) => ipcRenderer.send(Channel.TOOLTIP_SHOW, request),
    /** Shell only. */
    hide: () => ipcRenderer.send(Channel.TOOLTIP_HIDE),
    /** Tooltip view only: tells main it can receive content. */
    ready: () => ipcRenderer.send(Channel.TOOLTIP_READY),
    /**
     * Tooltip view only.
     * @param {(content: {id: number, title: string, subtitle?: string}) => void} callback
     * @returns {() => void} Unsubscribe function.
     */
    onContent: (callback) => subscribe(Channel.TOOLTIP_CONTENT, callback),
    /** Tooltip view only: size of the drawn content, for the view bounds. */
    reportSize: (size) => ipcRenderer.send(Channel.TOOLTIP_SIZE, size),
  },

  app: {
    /** Operating system name, as given by `process.platform`. */
    platform: process.platform,
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
