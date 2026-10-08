import { describe, it, expect } from "vitest";
import SearchEngine from "./SearchEngine";

const { modes, methods } = SearchEngine;

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

    it("falls back to a plain search when '=' is missing", () => {
      expect(SearchEngine.getSearchAndValue("query::a.b", "x")).toEqual({
        search: "query::a.b",
        value: "x",
      });
    });

    it("ignores a non-string target in plain mode", () => {
      expect(SearchEngine.getSearchAndValue("abc", payload)).toEqual({
        search: "abc",
        value: "",
      });
    });

    it("compares only the text before a second '='", () => {
      expect(
        SearchEngine.getSearchAndValue("query::a.b=x=y", payload).search
      ).toBe("x");
    });
  });

  describe("invalid regular expression (current behaviour)", () => {
    it("throws a SyntaxError instead of returning false", () => {
      expect(() => methods[modes.REG_EXP]("(", "abc")).toThrow(SyntaxError);
    });
  });
});
