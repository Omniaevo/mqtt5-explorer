import { v4 as uuidv4 } from "uuid";

class ConnectionProperties {
  id = uuidv4();
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
  saved = false;

  static rules = {
    name: [(val) => !!val || "Connection name is required"],
    protocol: [(val) => !!val || "Protocol is required"],
    host: [(val) => !!val || "Host is required"],
    port: [(val) => !!val || "Port is required"],
    topics: [(val) => !!val || "Topics is required"],
  };

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

  init(properties = undefined) {
    if (properties === undefined) return;

    this.id = properties.id;
    this.name = properties.name;
    this.protocol = properties.protocol;
    this.version = properties.version;
    this.port = properties.port;
    this.validateCertificate = properties.validateCertificate;
    this.topics = properties.topics;
    this.host = properties.host;
    this.username = properties.username;
    this.password = properties.password;
    this.caCert = properties.caCert;
    this.clientId = properties.clientId;
    this.clientCert = properties.clientCert;
    this.clientKey = properties.clientKey;
    this.caCertPath = properties.caCertPath;
    this.clientCertPath = properties.clientCertPath;
    this.clientKeyPath = properties.clientKeyPath;

    this.tls = this.protocol.replace("mqtt", "").replace("ws", "") === "s";
  }
}

export default ConnectionProperties;
