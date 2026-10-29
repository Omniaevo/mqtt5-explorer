import SearchEngine from "../../../shared/SearchEngine";

/**
 * Selectable search modes (the default mode `ALL` has no button).
 * `icon` is a Metro icon name; `mdiIcon` stays for the Vuetify notifications
 * dialog until it is migrated (M2-12).
 */
export const SEARCH_MODE_OPTIONS = Object.freeze([
  {
    value: SearchEngine.modes.CASES,
    icon: "matchCase",
    mdiIcon: "mdi-format-letter-case",
    ariaLabel: "Uppercase/Lowercase",
  },
  {
    value: SearchEngine.modes.WORDS,
    icon: "wholeWord",
    mdiIcon: "mdi-format-letter-matches",
    ariaLabel: "Match whole word",
  },
  {
    value: SearchEngine.modes.REG_EXP,
    icon: "regex",
    mdiIcon: "mdi-regex",
    ariaLabel: "Regular expression",
  },
]);

/** @returns {string} Vuetify icon of the given mode (`mdi-equal` for the default). */
export function searchModeIcon(mode) {
  return (
    SEARCH_MODE_OPTIONS.find((option) => option.value === mode)?.mdiIcon ??
    "mdi-equal"
  );
}
