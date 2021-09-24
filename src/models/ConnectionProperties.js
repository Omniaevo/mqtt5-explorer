class ConnectionProperties {
  name = "new-connection";
  protocol = "mqtt://";
  version = 5;
  port = 1883;
  topics = [];
  host = undefined;
  username = undefined;
  password = undefined;

  static rules = {
    name: [(val) => !!val.name.trim() || "Connection name is required"],
    protocol: [(val) => !!val.protocol.trim() || "Protocol is required"],
    host: [(val) => !!val.host.trim() || "Host is required"],
    port: [(val) => !!val.port.trim() || "Port is required"],
    topics: [(val) => !!val.topics.trim() || "Topics is required"],
  };

  static validate(properties) {
    return (
      !!properties.name.trim() &&
      !!properties.protocol.trim() &&
      !!properties.host.trim() &&
      !!properties.port.trim() &&
      !!properties.topics.trim() &&
      !!properties.version
    );
  }

  init(properties = undefined) {
    if (properties === undefined) return;

    this.name = properties.name;
    this.protocol = properties.protocol;
    this.version = properties.version;
    this.port = properties.port;
    this.topics = properties.topics;
    this.host = properties.host;
    this.username = properties.username;
    this.password = properties.password;
  }
}

export default ConnectionProperties;
