import mqtt from "mqtt";
import TreeNode from "../models/TreeNode";
import ConnectionProperties from "../models/ConnectionProperties";

class Connection {
  #client = undefined;
  #url = undefined;
  #properties = new ConnectionProperties();
  #data = [];
  #map = {};
  #idCount = 1;

  get data() {
    return this.#data;
  }

  init(properties) {
    this.#properties = properties;
    // eslint-disable-next-line prettier/prettier
    this.#url = `${this.#properties.protocol}${this.#properties.host}:${this.#properties.port}`;

    this.#client = undefined;
    this.#data = [];
    this.#map = {};
    this.#idCount = 1;
  }

  connect(onError) {
    const options = {
      username: this.#properties.username,
      password: this.#properties.password,
      protocolVersion: this.#properties.version,
      keepalive: 120,
      reconnectPeriod: 0,
      connectTimeout: 5000,
    };

    this.#client = mqtt.connect(this.#url, options);

    this.#client.on("error", onError);
    this.#client.on("connect", () => {
      // When connected subscribe to a topic
      this.#client.subscribe(this.#properties.topics, () => {});
    });
    // when a message arrives
    this.#client.on("message", (_t, _m, packet) => {
      const splitted = packet.topic.split("/");
      let topic = new TreeNode(() => this.#idCount++, splitted, packet);

      if (this.#map[splitted[0]] === undefined) {
        topic.initObject();
        this.#data.push(topic);
        this.#map[splitted[0]] = this.#data.length - 1;
      } else {
        this.#data[this.#map[splitted[0]]].merge(topic);
      }
    });
  }

  disconnect(callback) {
    this.#client.on("close", callback);
    this.#client.end(true, {});
  }
}

export default Connection;
