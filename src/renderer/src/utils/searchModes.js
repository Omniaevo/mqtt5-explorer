import { CaseSensitive, Equal, Regex, WholeWord } from "@lucide/vue";
import SearchEngine from "../../../shared/SearchEngine";

/** Selectable search modes (the default mode `ALL` has no button). */
export const SEARCH_MODE_OPTIONS = Object.freeze([
  {
    value: SearchEngine.modes.CASES,
    icon: CaseSensitive,
    title: "Uppercase/Lowercase",
  },
  {
    value: SearchEngine.modes.WORDS,
    icon: WholeWord,
    title: "Match whole word",
  },
  {
    value: SearchEngine.modes.REG_EXP,
    icon: Regex,
    title: "Regular expression",
  },
]);

/** @returns {object} Lucide icon of the given mode (`Equal` for the default). */
export function searchModeIcon(mode) {
  return (
    SEARCH_MODE_OPTIONS.find((option) => option.value === mode)?.icon ??
    Equal
  );
}
