import TreeNode from "../models/TreeNode";
import ConnectionProperties from "../models/ConnectionProperties";
import toPlain from "./toPlain";

/**
 * Renderer side of the MQTT connection. The client itself lives in the
 * main process (`window.api.mqtt`): here packets are turned into tree nodes.
 */
class Connection {
  static connectionStates = {
    CONNECTED: 0,
    PENDING: 1,
    DISCONNECTED: 2,
    ERROR: 3,
  };

  #url = undefined;
  #properties = new ConnectionProperties();
  #map = {};
  #idCount = 1;
  #addCallback = () => {};
  #mergeCallback = () => {};
  #getSize = () => 0;
  #unsubscribers = [];

  get url() {
    return this.#url;
  }

  get protocolVersion() {
    return this.#properties.version;
  }

  init(properties, addCallback, mergeCallback, getSize) {
    this.#properties = properties;
    this.#url = `${this.#properties.protocol}://${this.#properties.host}:${
      this.#properties.port
    }`;
    this.#addCallback = addCallback;
    this.#mergeCallback = mergeCallback;
    this.#getSize = getSize;

    this.#unsubscribe();
    this.#map = {};
    this.#idCount = 1;
  }

  connect(clientProps, onConnect, onClose) {
    this.#unsubscribe();
    this.#unsubscribers = [
      window.api.mqtt.onStatus(({ status, error }) => {
        if (status === "connected") onConnect();
        else onClose(error);
      }),
      window.api.mqtt.onMessage((packet) => this.#onMessage(packet)),
    ];

    window.api.mqtt.connect(toPlain(this.#properties), toPlain(clientProps));
  }

  publish(packet) {
    window.api.mqtt.publish(toPlain(packet));
  }

  disconnect(callback) {
    this.#unsubscribe();
    window.api.mqtt.disconnect().then(callback);
  }

  #unsubscribe = () => {
    this.#unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.#unsubscribers = [];
  };

  #onMessage = (packet) => {
    const splitted = packet.topic.split("/");
    let topic = new TreeNode(() => this.#idCount++, splitted, packet);

    if (this.#map[splitted[0]] === undefined) {
      topic.initObject();
      this.#addCallback(topic);
      this.#map[splitted[0]] = this.#getSize() - 1;
    } else if (this.#mergeCallback(this.#map[splitted[0]], topic)) {
      delete this.#map[splitted[0]];
    }
  };
}

export default Connection;
