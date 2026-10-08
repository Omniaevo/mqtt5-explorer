class SearchEngine {
  // Utilities

  static modes = {
    ALL: "searchAll",
    CASES: "caseSensitive",
    WORDS: "strictWord",
    REG_EXP: "regularExpression",
  };

  static QUERY = "query::";

  static normalize(str) {
    return str || "";
  }

  static lowerize(str) {
    return SearchEngine.normalize(str).toLowerCase();
  }

  static getSearchAndValue(searchTerm, target) {
    if (
      searchTerm == undefined ||
      !searchTerm.includes(SearchEngine.QUERY) ||
      !searchTerm.includes("=")
    ) {
      return {
        search: searchTerm,
        value: typeof target === "string" ? target : "",
      };
    }

    const searchPieces = searchTerm.replace(SearchEngine.QUERY, "").split("=");
    const searchTree = searchPieces[0].split(".");
    let newTarget = target;

    searchTree.forEach((field) => {
      newTarget = newTarget?.[field];
    });

    return {
      search: searchPieces[1],
      value: newTarget,
    };
  }

  // Search methods

  static methods = {
    [SearchEngine.modes.ALL]: (searchTerm, target) => {
      const { search, value } = SearchEngine.getSearchAndValue(
        searchTerm,
        target
      );

      return SearchEngine.lowerize(value).includes(
        SearchEngine.lowerize(search)
      );
    },
    [SearchEngine.modes.CASES]: (searchTerm, target) => {
      const { search, value } = SearchEngine.getSearchAndValue(
        searchTerm,
        target
      );

      return SearchEngine.normalize(value).includes(
        SearchEngine.normalize(search)
      );
    },
    [SearchEngine.modes.WORDS]: (searchTerm, target) => {
      const { search, value } = SearchEngine.getSearchAndValue(
        searchTerm,
        target
      );

      return SearchEngine.normalize(value) == SearchEngine.normalize(search);
    },
    [SearchEngine.modes.REG_EXP]: (regExp, target) => {
      const { search, value } = SearchEngine.getSearchAndValue(regExp, target);

      return RegExp(search).test(value);
    },
  };
}

export default SearchEngine;
