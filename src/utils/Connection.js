import mqtt from "mqtt";
import TreeNode from "../models/TreeNode";
import ConnectionProperties from "../models/ConnectionProperties";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

class Connection {
  static connectionStates = {
    CONNECTED: 0,
    PENDING: 1,
    DISCONNECTED: 2,
    ERROR: 3,
  };

  #client = undefined;
  #url = undefined;
  #properties = new ConnectionProperties();
  #map = {};
  #idCount = 1;
  #closeCallback = () => {};
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
    this.#url = `${this.#properties.protocol}://${this.#properties.host}:${
      this.#properties.port
    }`;
    this.#addCallback = addCallback;
    this.#mergeCallback = mergeCallback;
    this.#getSize = getSize;

    this.#client = undefined;
    this.#map = {};
    this.#idCount = 1;
  }

  connect(onConnect, onClose) {
    const options = {
      clientId: `mqtt5-explorer-${uuidv4()}`,
      protocolVersion: this.#properties.version,
      rejectUnauthorized: this.#properties.validateCertificate,
      keepalive: 120,
      reconnectPeriod: 1000,
      connectTimeout: 30000,
      clean: true,
    };

    if (this.#properties.username) {
      options.username = this.#properties.username;
    }

    if (this.#properties.password) {
      options.password = this.#properties.password;
    }

    if (this.#properties.tls) {
      options.ca = this.#properties.caCertPath
        ? [fs.readFileSync(this.#properties.caCertPath)]
        : undefined;
      options.cert = this.#properties.clientCertPath
        ? fs.readFileSync(this.#properties.clientCertPath)
        : undefined;
      options.key = this.#properties.clientKeyPath
        ? fs.readFileSync(this.#properties.clientKeyPath)
        : undefined;

      options.protocol = this.#properties.protocol;
      options.host = this.#properties.host;
      options.port = this.#properties.port;
    }

    this.#closeCallback = onClose;
    this.#client = this.#properties.tls
      ? mqtt.connect(options)
      : mqtt.connect(this.#url, options);

    this.#client.on("error", (err) => {
      this.#closeCallback(err?.toString());
    });
    this.#client.on("connect", () => {
      const options = { rap: true };

      this.#properties.version > 4
        ? this.#client.subscribe(this.#properties.topics, options, () => {})
        : this.#client.subscribe(this.#properties.topics, () => {});

      onConnect();
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
      const keys = Object.keys(packet.properties);

      if (keys.length > 0) options.properties = {};

      keys.forEach((key) => {
        if (packet.properties[key]) {
          options.properties[key] = packet.properties[key];
        }
      });

      if (
        options.properties?.userProperties != undefined &&
        Object.keys(options.properties.userProperties).length === 0
      ) {
        delete options.properties.userProperties;
      }
    }

    if (topic != undefined) this.#client.publish(topic, message, options);
  }

  disconnect(callback) {
    this.#client.end(true, {}, callback);
  }
}

export default Connection;
