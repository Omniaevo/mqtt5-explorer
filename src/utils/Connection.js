import mqtt from "mqtt";
import TreeNode from "../models/TreeNode";

class Connection {
  #client = undefined;
  #name = "new-connection";
  #protocol = "mqtt://";
  #host = undefined;
  #port = undefined;
  #topics = [];
  #data = [];
  #username = undefined;
  #password = undefined;
  #map = {};
  #idCount = 1;

  constructor(name, host, port, topics, username, password) {
    this.#name = name;
    this.#host = host;
    this.#port = port;
    this.#topics = topics;
    this.#username = username;
    this.#password = password;
    this.#map = {};
    this.#idCount = 1;
  }

  get data() {
    return this.#data;
  }

  connect(onError) {
    const url = this.#protocol + this.#host + ":" + this.#port;
    const options = {
      username: this.#username,
      password: this.#password,
      protocolVersion: 5,
      keepalive: 120,
      reconnectPeriod: 0,
      connectTimeout: 5000,
    };

    this.#client = mqtt.connect(url, options);

    this.#client.on("error", onError);
    this.#client.on("connect", () => {
      // When connected subscribe to a topic
      this.#client.subscribe(this.#topics, () => {});
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
