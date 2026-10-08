import TopicNode from "./TopicNode";

const TOPIC_SEPARATOR = "/";

/**
 * Tree of MQTT topics, updated in place by incoming messages.
 * An empty payload removes the value; branches left empty are pruned.
 */
class TopicTree {
  #nextId = 1;
  // Virtual node: its children are the root topics
  #top = new TopicNode(0, "", "");

  /** Array copy of the root nodes, in insertion order. */
  get roots() {
    return this.#top.children;
  }

  /**
   * Applies a message to the tree.
   * @param {{topic: string, payload: string|Uint8Array}} message
   * @param {number} batchTimestamp Time of the batch; stamped on the node and
   * its ancestors to drive the blink effect.
   * @returns {TopicNode|undefined} The updated node, or undefined when the
   * message removed a value.
   */
  apply(message, batchTimestamp = Date.now()) {
    const segments = message.topic.split(TOPIC_SEPARATOR);

    return TopicTree.#hasPayload(message)
      ? this.#store(segments, message, batchTimestamp)
      : this.#remove(segments, batchTimestamp);
  }

  /** @returns {TopicNode|undefined} The node of the topic, if it exists. */
  find(topic) {
    return this.path(topic).at(-1);
  }

  /** @returns {TopicNode[]} Nodes from the root level down to the topic; empty if it does not exist. */
  path(topic) {
    const nodes = [];
    let node = this.#top;

    for (const name of topic.split(TOPIC_SEPARATOR)) {
      node = node.child(name);
      if (!node) return [];

      nodes.push(node);
    }

    return nodes;
  }

  static #hasPayload(message) {
    return message.payload?.length > 0;
  }

  #store(segments, message, batchTimestamp) {
    let node = this.#top;

    segments.forEach((name, depth) => {
      const existing = node.child(name);

      node =
        existing ?? this.#createChild(node, name, segments.slice(0, depth + 1));
      node.markUpdated(batchTimestamp);
    });

    node.setValue(message);

    return node;
  }

  #createChild(parent, name, pathSegments) {
    const node = new TopicNode(
      this.#nextId++,
      name,
      pathSegments.join(TOPIC_SEPARATOR)
    );

    parent.addChild(node);

    return node;
  }

  #remove(segments, batchTimestamp) {
    const path = [this.#top];

    for (const name of segments) {
      const node = path.at(-1).child(name);
      if (!node) return undefined;

      path.push(node);
    }

    path.slice(1).forEach((node) => node.markUpdated(batchTimestamp));
    path.at(-1).clearValue();
    TopicTree.#pruneEmptyBranch(path);

    return undefined;
  }

  /** Detaches empty nodes, from the leaf up to the first one in use. */
  static #pruneEmptyBranch(path) {
    for (let depth = path.length - 1; depth > 0; depth--) {
      if (!path[depth].isEmpty) return;

      path[depth - 1].removeChild(path[depth].name);
    }
  }
}

export default TopicTree;
