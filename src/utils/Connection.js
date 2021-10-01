import mqtt from "mqtt";
import TreeNode from "../models/TreeNode";
import ConnectionProperties from "../models/ConnectionProperties";

class Connection {
  #client = undefined;
  #url = undefined;
  #properties = new ConnectionProperties();
  #map = {};
  #idCount = 1;
  #addCallback = () => {};
  #mergeCallback = () => {};
  #getSize = () => 0;

  get url() {
    return this.#url;
  }

  get protocolVersion() {
    return this.#properties.version;
  }

  init(properties, addCallback, mergeCallback, getSize) {
    this.#properties = properties;
    // eslint-disable-next-line prettier/prettier
    this.#url = `${this.#properties.protocol}://${this.#properties.host}:${this.#properties.port}`;
    this.#addCallback = addCallback;
    this.#mergeCallback = mergeCallback;
    this.#getSize = getSize;

    this.#client = undefined;
    this.#map = {};
    this.#idCount = 1;
  }

  connect(onError) {
    const options = {
      username: this.#properties.username,
      password: this.#properties.password,
      protocolVersion: this.#properties.version,
      rejectUnauthorized: this.#properties.validateCertificate,
      keepalive: 120,
      reconnectPeriod: 0,
      connectTimeout: 5000,
    };

    this.#client = mqtt.connect(this.#url, options);

    this.#client.on("error", onError);
    this.#client.on("connect", () => {
      const options = { rap: true };

      this.#properties.version > 4
        ? this.#client.subscribe(this.#properties.topics, options, () => {})
        : this.#client.subscribe(this.#properties.topics, () => {});
    });
    // when a message arrives
    this.#client.on("message", (_t, _m, packet) => {
      const splitted = packet.topic.split("/");
      let topic = new TreeNode(() => this.#idCount++, splitted, packet);

      if (this.#map[splitted[0]] === undefined) {
        topic.initObject();
        this.#addCallback(topic);
        this.#map[splitted[0]] = this.#getSize() - 1;
      } else if (this.#mergeCallback(this.#map[splitted[0]], topic)) {
        delete this.#map[splitted[0]];
      }
    });
  }

  publish(packet) {
    const message = packet.payload;
    const topic = packet.topic;
    const options = {
      qos: packet.qos,
      retain: packet.retain,
    };

    if (this.#properties.version > 4 && packet.properties) {
      if (packet.properties.contentType) {
        options.properties = {};
        options.properties.contentType = packet.properties.contentType;
      }

      if (
        packet.properties.userProperties &&
        Object.keys(packet.properties.userProperties).length > 0
      ) {
        if (!options.properties) options.properties = {};
        options.properties.userProperties = packet.properties.userProperties;
      }
    }
    this.#client.publish(topic, message, options);
  }

  disconnect(callback) {
    this.#client.on("close", callback);
    this.#client.end(true, {});
  }
}

export default Connection;
