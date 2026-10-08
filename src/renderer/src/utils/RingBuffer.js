/** Fixed-capacity buffer: when full, a new item replaces the oldest one. */
class RingBuffer {
  #items;
  #start = 0;
  #length = 0;

  /** @param {number} capacity Maximum number of items, at least 1. */
  constructor(capacity) {
    RingBuffer.#assertCapacity(capacity);

    this.#items = new Array(capacity);
  }

  static #assertCapacity(capacity) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError("RingBuffer capacity must be an integer >= 1");
    }
  }

  get capacity() {
    return this.#items.length;
  }

  get length() {
    return this.#length;
  }

  push(item) {
    const end = (this.#start + this.#length) % this.capacity;

    this.#items[end] = item;

    if (this.#length < this.capacity) {
      this.#length += 1;
    } else {
      this.#start = (this.#start + 1) % this.capacity;
    }
  }

  /** @returns {Array} Copy of the items, oldest first. */
  toArray() {
    return Array.from(
      { length: this.#length },
      (_, index) => this.#items[(this.#start + index) % this.capacity]
    );
  }

  /** Changes the capacity. When it shrinks, the newest items are kept. */
  resize(capacity) {
    RingBuffer.#assertCapacity(capacity);

    const kept = this.toArray().slice(-capacity);

    this.#items = new Array(capacity);
    kept.forEach((item, index) => (this.#items[index] = item));
    this.#start = 0;
    this.#length = kept.length;
  }

  clear() {
    this.#items = new Array(this.capacity);
    this.#start = 0;
    this.#length = 0;
  }
}

export default RingBuffer;
