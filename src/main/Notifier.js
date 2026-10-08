export const THROTTLE_MS = 1000;
// Above this size, topics whose throttle window is over are forgotten
const MAX_TRACKED_TOPICS = 1000;

/**
 * Shows OS notifications, at most one per topic in each throttle window.
 */
class Notifier {
  #createNotification;
  #onClick;
  #now;
  #lastShown = new Map();

  /**
   * @param {object} deps
   * @param {(title: string, body: string) => {on: Function, show: Function}} deps.createNotification
   * Builds an Electron-like notification.
   * @param {(topic: string) => void} deps.onClick Called when the user clicks one.
   * @param {() => number} [deps.now] Clock in ms; replaceable for tests.
   */
  constructor({ createNotification, onClick, now = Date.now }) {
    this.#createNotification = createNotification;
    this.#onClick = onClick;
    this.#now = now;
  }

  /** @param {{topic: string, payload: string}} packet */
  notify({ topic, payload }) {
    const now = this.#now();

    if (now - (this.#lastShown.get(topic) ?? -Infinity) < THROTTLE_MS) return;

    this.#lastShown.set(topic, now);
    this.#forgetOldTopics(now);

    const notification = this.#createNotification(topic, payload);

    notification.on("click", () => this.#onClick(topic));
    notification.show();
  }

  /** Forgets the throttle state, e.g. when the connection ends. */
  reset() {
    this.#lastShown.clear();
  }

  #forgetOldTopics(now) {
    if (this.#lastShown.size <= MAX_TRACKED_TOPICS) return;

    this.#lastShown.forEach((shownAt, topic) => {
      if (now - shownAt >= THROTTLE_MS) this.#lastShown.delete(topic);
    });
  }
}

export default Notifier;
