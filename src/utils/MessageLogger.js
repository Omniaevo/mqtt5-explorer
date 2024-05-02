import os from "os";
import path from "path";
import fs from "fs";
import * as moment from "moment";

class MessageLogger {
  #subPath = "";
  #basePath = "";
  #separator = path.sep;

  #writing = false;
  #writingCache = [];

  constructor(connectionName = moment().valueOf().toString()) {
    this.#subPath = this.#pathSafe(connectionName);
    this.#basePath = os.homedir() + "/mqtt5-explorer-logs";
  }

  get logsFolder() {
    return this.#basePath + this.#separator + this.#subPath;
  }

  enqueue({ topic, payload, properties }) {
    const now = moment();
    this.#writingCache.unshift({
      topic,
      payload,
      properties: properties ? JSON.stringify(properties) : "",
      when: now.valueOf(),
      date: now.format("YYYY-MM-DD HH:mm:ss.SSS"),
    });
  }

  async startLogging() {
    this.#writing = true;
    this.#subPath += this.#separator + moment().format("YYYY-MM-DD_HH-mm-ss");

    // Create folders path
    fs.mkdirSync(this.logsFolder, { recursive: true });

    while (this.#writing) {
      if (this.#writingCache.length === 0) {
        await this.#sleep(1000);
        continue;
      }

      const { topic, payload, properties, when, date } =
        this.#writingCache.pop();
      const fileName =
        this.logsFolder + this.#separator + this.#pathSafe(topic) + ".csv";

      // Create file if not exists
      if (!fs.existsSync(fileName)) {
        fs.writeFileSync(fileName, "Timestamp;Date;Value;Properties\n", {
          flag: "w",
        });
      }

      // Update log file
      fs.writeFileSync(fileName, `${when};${date};${payload};${properties}\n`, {
        flag: "a",
      });
    }
  }

  stopLogging() {
    this.#writing = false;
    this.#writingCache = [];
  }

  #pathSafe = (topic) => {
    return topic?.replace(/\//g, "_") || "unknown-topic";
  };

  #sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };
}

export default MessageLogger;
