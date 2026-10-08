export const FLUSH_INTERVAL_MS = 100;

/**
 * Collects packets and hands them over, all together, once per interval.
 * Every packet is kept (no coalescing). Nothing is flushed when empty.
 */
class MessageBatcher {
  #onFlush;
  #intervalMs;
  #pending = [];
  #timer = undefined;

  /**
   * @param {(messages: object[]) => void} onFlush
   * @param {number} [intervalMs]
   */
  constructor(onFlush, intervalMs = FLUSH_INTERVAL_MS) {
    this.#onFlush = onFlush;
    this.#intervalMs = intervalMs;
  }

  add(message) {
    this.#pending.push(message);
  }

  /** Starts the flush timer. A running timer is restarted and pending messages are dropped. */
  start() {
    this.stop();
    this.#timer = setInterval(this.#flush, this.#intervalMs);
  }

  /** Stops the timer and drops the messages not flushed yet. */
  stop() {
    clearInterval(this.#timer);
    this.#timer = undefined;
    this.#pending = [];
  }

  #flush = () => {
    if (this.#pending.length === 0) return;

    const messages = this.#pending;

    this.#pending = [];
    this.#onFlush(messages);
  };
}

export default MessageBatcher;
