import SearchEngine from "../../../shared/SearchEngine";

/**
 * Selectable search modes (the default mode `ALL` has no button).
 * `icon` is a Metro icon name.
 */
export const SEARCH_MODE_OPTIONS = Object.freeze([
  {
    value: SearchEngine.modes.CASES,
    icon: "matchCase",
    ariaLabel: "Uppercase/Lowercase",
  },
  {
    value: SearchEngine.modes.WORDS,
    icon: "wholeWord",
    ariaLabel: "Match whole word",
  },
  {
    value: SearchEngine.modes.REG_EXP,
    icon: "regex",
    ariaLabel: "Regular expression",
  },
]);

/** @returns {string} Metro icon of the given mode (`exactMatch` for the default). */
export function searchModeIcon(mode) {
  return (
    SEARCH_MODE_OPTIONS.find((option) => option.value === mode)?.icon ??
    "exactMatch"
  );
}
