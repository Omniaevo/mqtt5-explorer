class SearchEngine {
  // Utilities

  static modes = {
    ALL: "searchAll",
    CASES: "caseSensitive",
    WORDS: "strictWord",
    REG_EXP: "regularExpression",
  };

  static normalize(str) {
    return str || "";
  }

  static lowerize(str) {
    return SearchEngine.normalize(str).toLowerCase();
  }

  // Search methods

  static methods = {
    [SearchEngine.modes.ALL]: (searchTerm, target) => {
      return SearchEngine.lowerize(target).includes(
        SearchEngine.lowerize(searchTerm)
      );
    },
    [SearchEngine.modes.CASES]: (searchTerm, target) => {
      return SearchEngine.normalize(searchTerm).includes(
        SearchEngine.normalize(target)
      );
    },
    [SearchEngine.modes.WORDS]: (searchTerm, target) => {
      return (
        SearchEngine.normalize(searchTerm) == SearchEngine.normalize(target)
      );
    },
    [SearchEngine.modes.REG_EXP]: (regExp, target) => {
      return RegExp(regExp).test(target);
    },
  };
}

export default SearchEngine;
