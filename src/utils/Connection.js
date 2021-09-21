import mqtt from "mqtt";

class Connection {
  #client = undefined;
  #name = "new-connection";
  #protocol = "mqtt://";
  #host = undefined;
  #port = undefined;
  #username = undefined;
  #password = undefined;
  #subscription = "#";

  constructor(name, host, port, username, password) {
    this.#name = name;
    this.#host = host;
    this.#port = port;
    this.#username = username;
    this.#password = password;
  }

  connectToMqtt() {
    let url = this.#protocol + this.#host + ":" + this.#port;
    console.log(url);
    let options = {
      username: this.#username,
      password: this.#password,
      protocolVersion: 5,
    };

    this.#client = mqtt.connect(url, options);

    return this.#client;
  }
}

export default Connection;
