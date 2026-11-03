import { ConnectionFields } from "../../../shared/connectionFields";

/** Settings of one saved connection, with the form validation rules. */
class ConnectionProperties {
  id = crypto.randomUUID();
  name = "new-connection";
  protocol = "mqtt";
  version = 5;
  port = 1883;
  validateCertificate = true;
  topics = ["#", "$SYS/#"];
  host = undefined;
  username = undefined;
  password = undefined;
  tls = false;
  caCert = undefined;
  clientId = undefined;
  clientCert = undefined;
  clientKey = undefined;
  caCertPath = undefined;
  clientCertPath = undefined;
  clientKeyPath = undefined;
  lastConnectedAt = undefined;
  saved = false;

  static rules = {
    name: [(val) => !!val || "Connection name is required"],
    protocol: [(val) => !!val || "Protocol is required"],
    host: [(val) => !!val || "Host is required"],
    port: [(val) => !!val || "Port is required"],
    topics: [(val) => !!val || "Topics is required"],
  };

  /** True when every required field is filled. */
  static validate(properties) {
    return (
      !!properties.name &&
      !!properties.protocol &&
      !!properties.host &&
      !!properties.port &&
      !!properties.topics &&
      !!properties.version
    );
  }

  /** Copies the stored fields; `tls` is derived from the protocol. */
  init(properties = undefined) {
    if (properties === undefined) return;

    ConnectionFields.all.forEach((field) => {
      this[field] = properties[field];
    });

    this.tls = this.protocol.replace("mqtt", "").replace("ws", "") === "s";
  }
}

export default ConnectionProperties;
