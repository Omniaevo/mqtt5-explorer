import KeyboardMap from "./KeyboardMap";

class ShortKeysListener {
  static META = "META";

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

  static keyCodeToDescription(keyCode) {
    return keyCode === ShortKeysListener.META ? keyCode : KeyboardMap[keyCode];
  }

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
    if (this.#keysList.includes(event.keyCode)) {
      event.preventDefault();

      this.#keyTracker[event.keyCode] = true;

      // Manage `META` key
      if (
        Object.keys(this.#keyTracker).includes(ShortKeysListener.META) &&
        event.metaKey
      ) {
        this.#keyTracker[ShortKeysListener.META] = true;
      }

      const isComboPressed = Object.keys(this.#keyTracker).reduce(
        (pressed, key) => pressed && this.#keyTracker[key],
        true
      );

      if (this.#lastKey === event.keyCode && isComboPressed) {
        this.#callback();
      }
    }
  };

  #keyUpHandler = (event) => {
    if (this.#keysList.includes(event.keyCode)) {
      event.preventDefault();

      this.#keyTracker[event.keyCode] = false;
    }
  };
}

export default ShortKeysListener;
