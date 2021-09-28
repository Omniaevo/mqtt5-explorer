class ConnectionProperties {
  name = "new-connection";
  protocol = "mqtt";
  version = 5;
  port = 1883;
  validateCertificate = true;
  topics = ["#", "$SYS/#"];
  host = undefined;
  username = undefined;
  password = undefined;
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

    this.name = properties.name;
    this.protocol = properties.protocol;
    this.version = properties.version;
    this.port = properties.port;
    this.validateCertificate = properties.validateCertificate;
    this.topics = properties.topics;
    this.host = properties.host;
    this.username = properties.username;
    this.password = properties.password;
  }
}

export default ConnectionProperties;
