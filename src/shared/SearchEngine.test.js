import { describe, it, expect, vi } from "vitest";
import SearchEngine from "./SearchEngine";

const { modes } = SearchEngine;
const methods = Object.fromEntries(
  Object.values(modes).map((mode) => [
    mode,
    (term, target) => SearchEngine.matcher(term, mode)(target),
  ])
);

describe("SearchEngine", () => {
  describe("modes", () => {
    it("ALL: case-insensitive substring", () => {
      expect(methods[modes.ALL]("TEMP", "room/temperature")).toBe(true);
      expect(methods[modes.ALL]("hum", "room/temperature")).toBe(false);
    });

    it("CASES: case-sensitive substring", () => {
      expect(methods[modes.CASES]("temp", "room/temperature")).toBe(true);
      expect(methods[modes.CASES]("TEMP", "room/temperature")).toBe(false);
    });

    it("WORDS: exact, case-sensitive match", () => {
      expect(methods[modes.WORDS]("temp", "temp")).toBe(true);
      expect(methods[modes.WORDS]("temp", "temperature")).toBe(false);
      expect(methods[modes.WORDS]("Temp", "temp")).toBe(false);
    });

    it("REG_EXP: regular expression test", () => {
      expect(methods[modes.REG_EXP]("^room/\\w+$", "room/temp")).toBe(true);
      expect(methods[modes.REG_EXP]("^temp", "room/temp")).toBe(false);
    });

    it("treats a missing or non-string target as an empty string", () => {
      expect(methods[modes.ALL]("x", undefined)).toBe(false);
      expect(methods[modes.ALL]("", undefined)).toBe(true);
    });
  });

  describe("query:: syntax", () => {
    const payload = { a: { b: "Hello" }, n: 5 };

    it("searches a nested field of an object target", () => {
      expect(methods[modes.ALL]("query::a.b=hell", payload)).toBe(true);
      expect(methods[modes.CASES]("query::a.b=hell", payload)).toBe(false);
      expect(methods[modes.WORDS]("query::a.b=Hello", payload)).toBe(true);
    });

    it("matches nothing when the path does not exist", () => {
      expect(methods[modes.ALL]("query::a.x.y=hello", payload)).toBe(false);
    });

    it("works with regular expressions", () => {
      expect(methods[modes.REG_EXP]("query::a.b=^H.*o$", payload)).toBe(true);
    });

    it("ignores an object target in plain mode", () => {
      expect(methods[modes.ALL]("abc", payload)).toBe(false);
      expect(methods[modes.ALL]("", payload)).toBe(true);
    });

    it("compares only the text before a second '='", () => {
      expect(methods[modes.ALL]("query::a.b=hell=o", payload)).toBe(true);
      expect(methods[modes.ALL]("query::a.b=x=hello", payload)).toBe(false);
    });

    it("searches in a numeric field", () => {
      expect(methods[modes.WORDS]("query::n=5", payload)).toBe(true);
    });
  });

  describe("matcher", () => {
    it("defaults to the ALL mode", () => {
      expect(SearchEngine.matcher("TEMP")("room/temp")).toBe(true);
    });

    it("can be reused for many targets", () => {
      const matches = SearchEngine.matcher("^a", modes.REG_EXP);

      expect(["ab", "ba", "ac"].filter(matches)).toEqual(["ab", "ac"]);
    });

    it("matches nothing for an invalid regular expression", () => {
      const matches = SearchEngine.matcher("(", modes.REG_EXP);

      expect(matches("abc")).toBe(false);
      expect(matches("(")).toBe(false);
    });

    it("compiles the regular expression once", () => {
      const spy = vi.spyOn(globalThis, "RegExp");

      const matches = SearchEngine.matcher("a", modes.REG_EXP);
      matches("a");
      matches("b");
      matches("c");

      expect(spy).toHaveBeenCalledTimes(1);
      spy.mockRestore();
    });
  });
});
