/** IPC channels shared by the main process and the preload script. */
export const Channel = Object.freeze({
  STORE_GET: "store:get",
  STORE_SET: "store:set",
  STORE_CHANGED: "store:changed",
  MQTT_CONNECT: "mqtt:connect",
  MQTT_DISCONNECT: "mqtt:disconnect",
  MQTT_PUBLISH: "mqtt:publish",
  MQTT_BATCH: "mqtt:batch",
  MQTT_STATUS: "mqtt:status",
  LOGGER_START: "logger:start",
  LOGGER_STOP: "logger:stop",
  LOGGER_FOLDER: "logger:folder",
  NOTIFY_SET_CONFIG: "notify:setConfig",
  NOTIFY_SELECT_TOPIC: "notify:selectTopic",
  NOTIFY_SHOW: "notify:show",
  DIALOG_OPEN_FILE: "dialog:openFile",
  APP_OPEN_FOLDER: "app:openFolder",
  APP_OPEN_EXTERNAL: "app:openExternal",
  TABS_STATE: "tabs:state",
  TABS_GET_STATE: "tabs:getState",
  TABS_SELECT: "tabs:select",
  TABS_CLOSE: "tabs:close",
  TABS_OPEN: "tabs:open",
  TABS_OPEN_CONNECTION: "tabs:openConnection",
  TABS_GET_CONNECTION: "tabs:getConnection",
  TABS_SET_STATE: "tabs:setState",
  SHELL_SET_HEIGHT: "shell:setHeight",
  SHELL_OPEN_MENU: "shell:openMenu",
  WINDOW_MINIMIZE: "window:minimize",
  WINDOW_TOGGLE_MAXIMIZE: "window:toggleMaximize",
  WINDOW_CLOSE: "window:close",
  WINDOW_GET_STATE: "window:getState",
  WINDOW_STATE: "window:state",
});

/** Kinds of tab the main process can host. */
export const TabKind = Object.freeze({
  HOME: "home",
  SETTINGS: "settings",
  CONNECTION: "connection",
});

/** Ids of the tabs that exist at most once. */
export const FixedTabId = Object.freeze({
  HOME: "home",
  SETTINGS: "settings",
});

/** Connection state of a tab. Tabs without a connection are always ready. */
export const TabState = Object.freeze({
  SLEEPING: "sleeping",
  PENDING: "pending",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  ERROR: "error",
});

/** Menu events sent from the main process to the renderer. */
export const MenuEvent = Object.freeze({
  SETTINGS: "settingsPressed",
  EXPORT_DATA: "exportDataPressed",
  IMPORT_DATA: "importDataPressed",
  SEARCH: "searchPressed",
  NOTIFICATION: "notificationPressed",
});

/** Store keys the renderer may read and write. */
export const RendererStoreKeys = Object.freeze([
  "saved_mqtt_connections",
  "saved_app_settings",
  "close_to_tray",
]);
