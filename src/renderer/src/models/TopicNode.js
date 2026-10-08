import { markRaw } from "vue";
import SearchEngine from "../../../shared/SearchEngine";
import RingBuffer from "../utils/RingBuffer";

/** One level of the topic tree. Children keep their insertion order. */
class TopicNode {
  #children = new Map();
  /** Created on the first recorded entry, so nodes without history cost nothing. */
  #history = undefined;

  value = undefined;
  old = undefined;
  counter = 0;
  /** Time of the last batch that touched this node or a descendant. */
  lastUpdate = 0;

  /**
   * @param {number} id Unique id inside the tree.
   * @param {string} name Last segment of the topic.
   * @param {string} topic Full topic, built from all the path segments.
   */
  constructor(id, name, topic) {
    this.id = id;
    this.name = name;
    this.topic = topic;

    // The tree is never reactive: Vue must not proxy its nodes
    markRaw(this);
  }

  get size() {
    return this.#children.size;
  }

  /** Array copy of the children, for components that need an array. */
  get children() {
    return [...this.#children.values()];
  }

  get isEmpty() {
    return this.value === undefined && this.#children.size === 0;
  }

  child(name) {
    return this.#children.get(name);
  }

  addChild(node) {
    this.#children.set(node.name, node);
  }

  removeChild(name) {
    this.#children.delete(name);
  }

  /** Keeps the previous value object (no copy) and counts the new one. */
  setValue(message) {
    this.old = this.value;
    this.value = message;
    this.counter += 1;
  }

  /** Keeps the previous value object (no copy) as `old`. */
  clearValue() {
    this.old = this.value;
    this.value = undefined;
  }

  /** @returns {{t: number, payload: string}[]} Received values, oldest first. */
  get history() {
    return this.#history?.toArray() ?? [];
  }

  /** Number of recorded entries, without copying them. */
  get historyLength() {
    return this.#history?.length ?? 0;
  }

  /**
   * Adds a received value to the history.
   * @param {{t: number, payload: string}} entry
   * @param {number} capacity Maximum entries kept; 0 or less records nothing.
   */
  recordHistory(entry, capacity) {
    if (capacity < 1) return;

    this.#history ??= new RingBuffer(capacity);
    this.#history.push(entry);
  }

  /** Resizes the history of this node and its descendants; 0 drops it. */
  resizeHistory(capacity) {
    if (capacity < 1) {
      this.#history = undefined;
    } else {
      this.#history?.resize(capacity);
    }

    this.#children.forEach((child) => child.resizeHistory(capacity));
  }

  /** @param {number} timestamp Time of the batch that touched this node. */
  markUpdated(timestamp) {
    this.lastUpdate = timestamp;
  }

  /**
   * @param {(target: *) => boolean} matches Built by `SearchEngine.matcher`.
   * @returns {boolean} True when the topic, the name or the value matches.
   */
  matchedBy(matches) {
    return matches(this.topic) || matches(this.name) || matches(this.value);
  }

  search(searchTerm, mode) {
    return this.matchedBy(SearchEngine.matcher(searchTerm, mode));
  }
}

export default TopicNode;
