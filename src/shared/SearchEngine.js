/**
 * Text search shared by the main process and the renderer.
 * Plain JS: no Vue and no Node APIs.
 *
 * A term is either a plain text, or `query::field.path=text` to search the
 * text inside a field of an object target.
 */
class SearchEngine {
  static modes = {
    ALL: "searchAll",
    CASES: "caseSensitive",
    WORDS: "strictWord",
    REG_EXP: "regularExpression",
  };

  static QUERY = "query::";

  static #NEVER = () => false;

  /**
   * Builds a matcher. Do the work once per (term, mode), then reuse it.
   * An invalid regular expression gives a matcher that matches nothing.
   * @param {string} [term]
   * @param {string} [mode] One of `SearchEngine.modes`; default is ALL.
   * @returns {(target: *) => boolean}
   */
  static matcher(term, mode = SearchEngine.modes.ALL) {
    const { fieldPath, search } = SearchEngine.#parse(term);
    const test = SearchEngine.#compile(search, mode);

    return (target) => test(SearchEngine.#textOf(target, fieldPath));
  }

  static #parse(term) {
    const text = term ?? "";

    if (!text.includes(SearchEngine.QUERY) || !text.includes("=")) {
      return { fieldPath: undefined, search: text };
    }

    const [path, search] = text.replace(SearchEngine.QUERY, "").split("=");

    return { fieldPath: path.split("."), search };
  }

  /** @returns {(text: string) => boolean} */
  static #compile(search, mode) {
    const { modes } = SearchEngine;

    switch (mode) {
      case modes.CASES:
        return (text) => text.includes(search);
      case modes.WORDS:
        return (text) => text === search;
      case modes.REG_EXP:
        return SearchEngine.#compileRegExp(search);
      default: {
        const lowerSearch = search.toLowerCase();

        return (text) => text.toLowerCase().includes(lowerSearch);
      }
    }
  }

  static #compileRegExp(source) {
    try {
      const regExp = new RegExp(source);

      return (text) => regExp.test(text);
    } catch {
      return SearchEngine.#NEVER;
    }
  }

  /** Text to search in: the target itself, or the field of it. */
  static #textOf(target, fieldPath) {
    const value = fieldPath
      ? fieldPath.reduce((object, field) => object?.[field], target)
      : target;

    return ["string", "number", "boolean"].includes(typeof value)
      ? String(value)
      : "";
  }
}

export default SearchEngine;
