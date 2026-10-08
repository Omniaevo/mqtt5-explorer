import SearchEngine from "./SearchEngine";

/** Selectable search modes (the default mode `ALL` has no button). */
export const SEARCH_MODE_OPTIONS = Object.freeze([
  {
    value: SearchEngine.modes.CASES,
    icon: "mdi-format-letter-case",
    title: "Uppercase/Lowercase",
  },
  {
    value: SearchEngine.modes.WORDS,
    icon: "mdi-format-letter-matches",
    title: "Match whole word",
  },
  {
    value: SearchEngine.modes.REG_EXP,
    icon: "mdi-regex",
    title: "Regular expression",
  },
]);

/** @returns {string} Icon of the given mode (`mdi-equal` for the default). */
export function searchModeIcon(mode) {
  return (
    SEARCH_MODE_OPTIONS.find((option) => option.value === mode)?.icon ??
    "mdi-equal"
  );
}
