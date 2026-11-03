import MqttService from "./MqttService";
import MessageBatcher from "./MessageBatcher";
import MessageFilter from "./MessageFilter";
import MessageLogger, { LOGS_ROOT } from "./MessageLogger";
import Notifier from "./Notifier";
import { Channel } from "../shared/ipcChannels";

/**
 * Everything one renderer needs to talk to one broker: the MQTT client, the
 * batching of its packets, the notification/logging filter and the logger.
 * All output goes to the webContents the session belongs to.
 */
class Session {
  #webContents;
  #createLogger;
  #batcher;
  #notifier;
  #filter;
  #mqttService;
  #logger = undefined;

  /**
   * @param {object} deps
   * @param {Electron.WebContents} deps.webContents Owner of the session.
   * @param {(title: string, body: string) => object} deps.createNotification
   * Builds an Electron-like notification.
   * @param {(webContents: Electron.WebContents) => void} deps.onNotificationClick
   * Called when the user clicks a notification of this session.
   * @param {(connectionName: string) => MessageLogger} [deps.createLogger]
   */
  constructor({
    webContents,
    createNotification,
    onNotificationClick,
    createLogger = (connectionName) => new MessageLogger(connectionName),
  }) {
    this.#webContents = webContents;
    this.#createLogger = createLogger;

    this.#batcher = new MessageBatcher((messages) =>
      this.#send(Channel.MQTT_BATCH, messages)
    );
    this.#notifier = new Notifier({
      createNotification,
      onClick: (topic) => {
        onNotificationClick(webContents);
        this.#send(Channel.NOTIFY_SELECT_TOPIC, topic);
      },
    });
    this.#filter = new MessageFilter(
      (packet) => this.#notifier.notify(packet),
      (packet) => this.#logger?.enqueue(packet)
    );
    this.#mqttService = new MqttService(
      (packet) => {
        this.#filter.process(packet);
        this.#batcher.add(packet);
      },
      (status) => this.#send(Channel.MQTT_STATUS, status)
    );
  }

  /** Folder of the current log run, or the logs root when nothing is logged. */
  get logsFolder() {
    return this.#logger?.logsFolder ?? LOGS_ROOT;
  }

  /** A new connection starts from a clean state. */
  connect(properties, clientSettings) {
    this.#stopLogger();
    this.#resetNotifications();
    this.#batcher.start();
    this.#mqttService.connect(properties, clientSettings);
  }

  /** @returns {Promise<void>} Resolved when the client is closed. */
  disconnect() {
    this.#batcher.stop();
    this.#resetNotifications();
    this.#stopLogger();

    return this.#mqttService.disconnect();
  }

  publish(packet) {
    this.#mqttService.publish(packet);
  }

  setNotifyConfig(config) {
    this.#filter.setConfig(config);
  }

  startLogging(connectionName) {
    this.#logger = this.#logger ?? this.#createLogger(connectionName);
    this.#logger.startLogging();
  }

  /** Pauses logging. The logger is kept, so a later start reuses it. */
  stopLogging() {
    this.#logger?.stopLogging();
  }

  /**
   * Closes the client and releases every resource.
   * @returns {Promise<void>} Resolved when every log stream is flushed.
   */
  dispose() {
    this.#batcher.stop();
    this.#mqttService.dispose();
    this.#resetNotifications();

    return this.#stopLogger();
  }

  #send(channel, payload) {
    if (!this.#webContents.isDestroyed()) {
      this.#webContents.send(channel, payload);
    }
  }

  #resetNotifications() {
    this.#filter.reset();
    this.#notifier.reset();
  }

  /** Resolves when every log stream is flushed and closed. */
  #stopLogger() {
    const stopped = this.#logger?.stopLogging();

    this.#logger = undefined;

    return stopped;
  }
}

export default Session;
