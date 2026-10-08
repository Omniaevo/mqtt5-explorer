import SearchEngine from "../shared/SearchEngine";

const JOIN = Object.freeze({ OR: "or", AND: "and" });
const MODES = Object.values(SearchEngine.modes);

const DISABLED = Object.freeze({
  notifyEnabled: false,
  loggingEnabled: false,
  joinType: JOIN.OR,
  entries: [],
});

/**
 * Decides which incoming packets are notified and/or logged.
 * The UI owns the configuration and pushes it with `setConfig`.
 * Matchers are compiled once per configuration, not once per packet.
 */
class MessageFilter {
  #onNotify;
  #onLog;
  #notifyEnabled = false;
  #loggingEnabled = false;
  #joinType = JOIN.OR;
  #matchers = [];

  /**
   * @param {(packet: object) => void} onNotify Called for a matching packet.
   * @param {(packet: object) => void} onLog Called for a matching packet.
   */
  constructor(onNotify, onLog) {
    this.#onNotify = onNotify;
    this.#onLog = onLog;
  }

  /** True when no packet can match, so `process` has nothing to do. */
  get isIdle() {
    return (
      (!this.#notifyEnabled && !this.#loggingEnabled) ||
      this.#matchers.length === 0
    );
  }

  /**
   * Replaces the configuration. The input comes from the renderer, so every
   * field is checked.
   * @param {{notifyEnabled: boolean, loggingEnabled: boolean,
   * joinType: "or"|"and", entries: {term: string, mode: string}[]}} config
   */
  setConfig(config) {
    this.#notifyEnabled = config?.notifyEnabled === true;
    this.#loggingEnabled = config?.loggingEnabled === true;
    this.#joinType = config?.joinType === JOIN.AND ? JOIN.AND : JOIN.OR;
    this.#matchers = (Array.isArray(config?.entries) ? config.entries : [])
      .filter((entry) => typeof entry?.term === "string")
      .map((entry) =>
        SearchEngine.matcher(entry.term, MessageFilter.#validMode(entry.mode))
      );
  }

  /** Back to the state before any configuration: everything off. */
  reset() {
    this.setConfig(DISABLED);
  }

  /**
   * Notifies and/or logs the packet when it matches the conditions.
   * A packet with an empty payload (a retained message clear) never matches.
   * @param {{topic: string, payload: string}} packet
   */
  process(packet) {
    if (this.isIdle || !packet.payload) return;
    if (!this.#matches(packet)) return;

    if (this.#loggingEnabled) this.#onLog(packet);
    if (this.#notifyEnabled) this.#onNotify(packet);
  }

  static #validMode(mode) {
    return MODES.includes(mode) ? mode : SearchEngine.modes.ALL;
  }

  #matches(packet) {
    const isMatchedBy = MessageFilter.#matchesEntry(packet);

    return this.#joinType === JOIN.AND
      ? this.#matchers.every(isMatchedBy)
      : this.#matchers.some(isMatchedBy);
  }

  /**
   * One entry matches on the full topic, the last level name or the packet.
   * (The packet is the target of the `query::` syntax.)
   */
  static #matchesEntry(packet) {
    const name = packet.topic.slice(packet.topic.lastIndexOf("/") + 1);

    return (matches) =>
      matches(packet.topic) || matches(name) || matches(packet);
  }
}

export default MessageFilter;
