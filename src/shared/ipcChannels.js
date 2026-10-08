/** IPC channels shared by the main process and the preload script. */
export const Channel = Object.freeze({
  STORE_GET: "store:get",
  STORE_SET: "store:set",
  MQTT_CONNECT: "mqtt:connect",
  MQTT_DISCONNECT: "mqtt:disconnect",
  MQTT_PUBLISH: "mqtt:publish",
  MQTT_MESSAGE: "mqtt:message",
  MQTT_STATUS: "mqtt:status",
  LOGGER_START: "logger:start",
  LOGGER_STOP: "logger:stop",
  LOGGER_ENQUEUE: "logger:enqueue",
  LOGGER_FOLDER: "logger:folder",
  DIALOG_OPEN_FILE: "dialog:openFile",
  APP_SEND_PAGE: "app:sendPage",
  APP_FOCUS_WINDOW: "app:focusWindow",
  APP_OPEN_FOLDER: "app:openFolder",
  APP_OPEN_EXTERNAL: "app:openExternal",
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

/** Pages the renderer can announce (they select the application menu). */
export const Page = Object.freeze({
  HOME: "home",
  VIEWER: "viewer",
});
