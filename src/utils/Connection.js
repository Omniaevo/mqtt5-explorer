import mqtt from "mqtt";
import TreeNode from "../models/TreeNode";

class Connection {
  #client = undefined;
  #name = "new-connection";
  #protocol = "mqtt://";
  #host = undefined;
  #port = undefined;
  #topic = "#";
  #data = [];
  #username = undefined;
  #password = undefined;

  constructor(name, host, port, topic, username, password) {
    this.#name = name;
    this.#host = host;
    this.#port = port;
    this.#topic = topic;
    this.#username = username;
    this.#password = password;
    this.#connectToMqtt();
  }

  #connectToMqtt() {
    let url = this.#protocol + this.#host + ":" + this.#port;
    console.log("url", url);
    let options = {
      username: this.#username,
      password: this.#password,
      protocolVersion: 5,
    };
    this.#client = mqtt.connect(url, options);

    this.#client.on("connect", () => {
      // When connected subscribe to a topic
      this.#client.subscribe(["#", "$SYS/#"], () => {
        const map = {};
        let idCount = 1;

        // when a message arrives
        this.#client.on("message", (_t, _m, packet) => {
          const splitted = packet.topic.split("/");
          let topic = new TreeNode(() => idCount++, splitted, packet);

          if (map[splitted[0]] === undefined) {
            topic.initObject();
            this.#data.push(topic);
            map[splitted[0]] = this.#data.length - 1;
          } else {
            this.#data[map[splitted[0]]].merge(topic);
          }
        });
      });
    });
  }

  get data() {
    return this.#data;
  }

  disconnect(callback) {
    this.#client.on("close", callback);
    this.#client.end(true, {});
  }
}

export default Connection;
