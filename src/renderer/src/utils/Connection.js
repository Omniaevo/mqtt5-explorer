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
  #batchCallback = () => {};
  #unsubscribers = [];

  get url() {
    return this.#url;
  }

  get protocolVersion() {
    return this.#properties.version;
  }

  /** Stores the properties and drops listeners of any previous session. */
  init(properties, batchCallback) {
    this.#properties = properties;
    this.#url = `${this.#properties.protocol}://${this.#properties.host}:${
      this.#properties.port
    }`;
    this.#batchCallback = batchCallback;

    this.#unsubscribe();
  }

  /** Listens to main-process events, then opens the client. */
  connect(clientProps, onConnect, onClose) {
    this.#unsubscribe();
    this.#unsubscribers = [
      window.api.mqtt.onStatus(({ status, error }) => {
        if (status === "connected") onConnect();
        else onClose(error);
      }),
      window.api.mqtt.onBatch((packets) => this.#batchCallback(packets)),
    ];

    window.api.mqtt.connect(toPlain(this.#properties), toPlain(clientProps));
  }

  publish(packet) {
    window.api.mqtt.publish(toPlain(packet));
  }

  /** Stops listening, then closes the client; `callback` runs when closed. */
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
