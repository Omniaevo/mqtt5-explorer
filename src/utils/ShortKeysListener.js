class ShortKeysListener {
  #keysList = [];
  #element = undefined;
  #callback = () => {};

  #lastKey = undefined;
  #keyTracker = {};

  constructor(keysList, callback) {
    if (keysList) this.#keysList = keysList;
    if (callback) this.#callback = callback;

    if (this.#keysList.length > 0) {
      this.#lastKey = this.#keysList[this.#keysList.length - 1];
    }
  }

  // Public methods

  startListener(element) {
    this.#element = element;
    this.#keysList.forEach((key) => (this.#keyTracker[key] = false));

    this.#element.addEventListener("keydown", this.#keyDownHandler);
    this.#element.addEventListener("keyup", this.#keyUpHandler);
  }

  destroyListener() {
    // Remove listeners
    this.#element.removeEventListener("keydown", this.#keyDownHandler);
    this.#element.removeEventListener("keyup", this.#keyUpHandler);

    // Reset class
    this.#keyTracker = {};
    this.#element = undefined;
    this.#callback = () => {};
    this.#keysList = [];
  }

  // Private methods

  #keyDownHandler = (event) => {
    if (this.#keysList.includes(event.key)) {
      event.preventDefault();

      this.#keyTracker[event.key] = true;

      const isComboPressed = Object.keys(this.#keyTracker).reduce(
        (pressed, key) => pressed && this.#keyTracker[key],
        true
      );

      if (this.#lastKey === event.key && isComboPressed) {
        this.#callback();
      }
    }
  };

  #keyUpHandler = (event) => {
    if (this.#keysList.includes(event.key)) {
      event.preventDefault();

      this.#keyTracker[event.key] = false;
    }
  };
}

export default ShortKeysListener;
