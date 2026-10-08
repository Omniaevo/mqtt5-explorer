import mqtt from "mqtt";
import fs from "fs";

/**
 * Owns the MQTT client. Packets and status changes are pushed to the
 * renderer through the callbacks given to the constructor.
 */
class MqttService {
  #maxReconnects = 5;
  #totalReconnects = 0;
  #client = undefined;
  #properties = undefined;
  #onMessage;
  #onStatus;

  /**
   * @param {(packet: object) => void} onMessage
   * @param {(status: {status: string, error?: string}) => void} onStatus
   */
  constructor(onMessage, onStatus) {
    this.#onMessage = onMessage;
    this.#onStatus = onStatus;
  }

  /**
   * Opens a new connection. A previous connection is closed first.
   * @param {object} properties Connection properties (see ConnectionProperties).
   * @param {object} clientProps Client settings (keepalive, timeouts, ...).
   */
  connect(properties, clientProps) {
    this.dispose();

    this.#properties = properties;
    this.#totalReconnects = 0;
    this.#maxReconnects = clientProps.maxReconnects;

    try {
      this.#client = this.#createClient(clientProps);
    } catch (err) {
      this.#onStatus({ status: "closed", error: err?.toString() ?? "" });
      return;
    }

    this.#bindEvents(this.#client);
  }

  publish(packet) {
    const options = { qos: packet.qos, retain: packet.retain };

    if (this.#properties.version > 4 && packet.properties) {
      options.properties = this.#toPublishProperties(packet.properties);
    }

    if (packet.topic != undefined) {
      this.#client?.publish(packet.topic, packet.payload, options);
    }
  }

  /** @returns {Promise<void>} Resolved when the client is closed. */
  disconnect() {
    return new Promise((resolve) => {
      if (!this.#client) return resolve();

      this.#client.end(true, {}, () => resolve());
    });
  }

  /** Closes the client without waiting and drops it. */
  dispose() {
    this.#client?.end(true);
    this.#client = undefined;
  }

  #createClient = (clientProps) => {
    const props = this.#properties;
    const url = `${props.protocol}://${props.host}:${props.port}`;
    const options = {
      clientId: props.clientId || clientProps.clientId,
      protocolVersion: props.version,
      rejectUnauthorized: props.validateCertificate,
      keepalive: clientProps.keepalive,
      reconnectPeriod: clientProps.reconnectPeriod * 1000,
      connectTimeout: clientProps.connectTimeout * 1000,
      resubscribe: true,
      clean: true,
    };

    if (props.username) options.username = props.username;
    if (props.password) options.password = props.password;

    if (!props.tls) return mqtt.connect(url, options);

    options.ca = props.caCertPath
      ? [fs.readFileSync(props.caCertPath)]
      : undefined;
    options.cert = props.clientCertPath
      ? fs.readFileSync(props.clientCertPath)
      : undefined;
    options.key = props.clientKeyPath
      ? fs.readFileSync(props.clientKeyPath)
      : undefined;
    options.protocol = props.protocol;
    options.host = props.host;
    options.port = props.port;

    return mqtt.connect(options);
  };

  #bindEvents = (client) => {
    // Events of a replaced client must not reach the renderer
    const on = (event, handler) =>
      client.on(event, (...args) => {
        if (this.#client === client) handler(...args);
      });

    on("error", (err) => {
      this.#onStatus({ status: "closed", error: err?.toString() ?? "" });
    });
    on("close", () => {
      if (this.#totalReconnects >= this.#maxReconnects) {
        this.#onStatus({ status: "closed", error: "" });
      }
    });
    on("reconnect", () => {
      this.#totalReconnects += 1;
    });
    on("connect", () => {
      // The resubscription is automatically managed by MQTT.js
      if (this.#totalReconnects === 0) this.#subscribe(client);

      this.#maxReconnects = 1;
      this.#totalReconnects = 0;

      this.#onStatus({ status: "connected" });
    });
    on("message", (_topic, _payload, packet) => {
      this.#onMessage({
        topic: packet.topic,
        receivedAt: Date.now(),
        payload: packet.payload.toString("utf-8"),
        qos: packet.qos,
        retain: packet.retain,
        properties: this.#toRendererProperties(packet.properties),
      });
    });
  };

  #subscribe = (client) => {
    const topics = this.#properties.topics;

    if (this.#properties.version > 4) {
      client.subscribe(topics, { rap: true }, () => {});
    } else {
      client.subscribe(topics, () => {});
    }
  };

  /** Correlation data is binary: the UI only shows it as text. */
  #toRendererProperties = (properties) => {
    if (!properties?.correlationData) return properties;

    return {
      ...properties,
      correlationData: properties.correlationData.toString("utf-8"),
    };
  };

  #toPublishProperties = (properties) => {
    const result = {};

    Object.keys(properties).forEach((key) => {
      if (properties[key]) result[key] = properties[key];
    });

    if (Object.keys(result.userProperties ?? {}).length === 0) {
      delete result.userProperties;
    }

    if (result.correlationData != undefined) {
      result.correlationData = Buffer.from(result.correlationData);
    }

    return Object.keys(result).length > 0 ? result : undefined;
  };
}

export default MqttService;
