import os from "os";
import path from "path";
import { once } from "events";
import { mkdir, open } from "fs/promises";

export const LOGS_ROOT = path.join(os.homedir(), "mqtt5-explorer-logs");
export const CSV_HEADER = "Timestamp;Date;Value;Properties\n";

const pad = (value, length = 2) => String(value).padStart(length, "0");

/** @param {Date} date @returns {string} YYYY-MM-DD */
const formatDay = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** @param {Date} date @returns {string} YYYY-MM-DD HH:mm:ss.SSS */
export const formatDate = (date) =>
  `${formatDay(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:` +
  `${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;

/** @param {Date} date @returns {string} YYYY-MM-DD_HH-mm-ss */
export const formatFolderStamp = (date) =>
  `${formatDay(date)}_${pad(date.getHours())}-${pad(date.getMinutes())}-` +
  pad(date.getSeconds());

const pathSafe = (name) => name?.replace(/\//g, "_") || "unknown-topic";

/**
 * One append-only CSV file. The stream opens on the first line and writes
 * the header only if the file is new. Lines wait in memory while the stream
 * is not ready or applies backpressure.
 */
class TopicLogFile {
  #pending = [];
  #pump = null;
  #failed = false;
  #streamPromise;

  /** @param {string} filePath @param {Promise<void>} folderReady */
  constructor(filePath, folderReady) {
    this.#streamPromise = this.#openStream(filePath, folderReady);
  }

  write(line) {
    if (this.#failed) return;

    this.#pending.push(line);
    this.#pump ??= this.#flushPending();
  }

  /** Flushes what is queued, then closes the file. */
  async close() {
    await this.#pump;

    try {
      const stream = await this.#streamPromise;

      stream.end();
      await once(stream, "close");
    } catch {
      // Already reported when the failure happened
    }
  }

  async #openStream(filePath, folderReady) {
    await folderReady;

    const handle = await open(filePath, "a");
    const { size } = await handle.stat();
    const stream = handle.createWriteStream();

    if (size === 0) stream.write(CSV_HEADER);

    return stream;
  }

  async #flushPending() {
    try {
      const stream = await this.#streamPromise;

      while (this.#pending.length > 0) {
        const chunk = this.#pending.join("");

        this.#pending = [];

        if (!stream.write(chunk)) await once(stream, "drain");
      }
    } catch (error) {
      this.#failed = true;
      this.#pending = [];
      console.error("Message logger write failed:", error.message);
    }

    this.#pump = null;
  }
}

/**
 * Appends MQTT messages to one CSV file per topic, under
 * <root>/<connection>/<start timestamp>/. Every start creates a new dated
 * folder. All I/O is async and never blocks the main process.
 */
class MessageLogger {
  #connectionFolder;
  #runFolder = null;
  #active = false;
  #now;
  #files = new Map();
  #folderReady = Promise.resolve();
  #closing = Promise.resolve();

  /**
   * @param {string} connectionName
   * @param {{rootFolder?: string, now?: () => Date}} [options]
   */
  constructor(
    connectionName = String(Date.now()),
    { rootFolder = LOGS_ROOT, now = () => new Date() } = {}
  ) {
    this.#connectionFolder = path.join(rootFolder, pathSafe(connectionName));
    this.#now = now;
  }

  get logsFolder() {
    return this.#runFolder ?? this.#connectionFolder;
  }

  /** Starts a new run in a fresh dated folder. No-op while running. */
  startLogging() {
    if (this.#active) return;

    this.#active = true;
    this.#runFolder = path.join(
      this.#connectionFolder,
      formatFolderStamp(this.#now())
    );

    // Wait for the previous run to flush, so a same-second folder is reused safely
    const runFolder = this.#runFolder;

    this.#folderReady = this.#closing.then(() =>
      mkdir(runFolder, { recursive: true })
    );
    this.#folderReady.catch((error) =>
      console.error("Message logger folder failed:", error.message)
    );
  }

  /** @param {{topic: string, payload: string, properties?: object}} packet */
  enqueue({ topic, payload, properties }) {
    if (!this.#active) return;

    const fileName = pathSafe(topic);
    let file = this.#files.get(fileName);

    if (!file) {
      file = new TopicLogFile(
        path.join(this.#runFolder, `${fileName}.csv`),
        this.#folderReady
      );
      this.#files.set(fileName, file);
    }

    const date = this.#now();
    const props = properties ? JSON.stringify(properties) : "";

    file.write(`${date.getTime()};${formatDate(date)};${payload};${props}\n`);
  }

  /** Stops logging and resolves when every file is flushed and closed. */
  stopLogging() {
    this.#active = false;

    const files = [...this.#files.values()];

    this.#files.clear();
    this.#closing = Promise.all([
      this.#closing,
      ...files.map((file) => file.close()),
    ]).then(() => {});

    return this.#closing;
  }
}

export default MessageLogger;
