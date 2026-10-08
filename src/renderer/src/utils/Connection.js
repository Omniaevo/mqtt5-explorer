import ConnectionProperties from "../models/ConnectionProperties";
import toPlain from "./toPlain";

/**
 * Renderer side of the MQTT connection. The client itself lives in the
 * main process (`window.api.mqtt`): here packets are handed to the viewer.
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
  #messageCallback = () => {};
  #unsubscribers = [];

  get url() {
    return this.#url;
  }

  get protocolVersion() {
    return this.#properties.version;
  }

  init(properties, messageCallback) {
    this.#properties = properties;
    this.#url = `${this.#properties.protocol}://${this.#properties.host}:${
      this.#properties.port
    }`;
    this.#messageCallback = messageCallback;

    this.#unsubscribe();
  }

  connect(clientProps, onConnect, onClose) {
    this.#unsubscribe();
    this.#unsubscribers = [
      window.api.mqtt.onStatus(({ status, error }) => {
        if (status === "connected") onConnect();
        else onClose(error);
      }),
      window.api.mqtt.onMessage((packet) => this.#messageCallback(packet)),
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
}

export default Connection;
