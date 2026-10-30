import { describe, expect, it } from "vitest";
import {
  formatEntryTime,
  recentMessages,
  resolveField,
  toRawRows,
} from "./HistoryView";

const at = (h, m, s, ms) => new Date(2026, 0, 2, h, m, s, ms).getTime();

describe("formatEntryTime", () => {
  it("should pad every part to HH:mm:ss.SSS", () => {
    expect(formatEntryTime(at(3, 4, 5, 6))).toBe("03:04:05.006");
  });
});

describe("toRawRows", () => {
  const history = [
    { t: at(1, 0, 0, 0), payload: "first" },
    { t: at(2, 0, 0, 0), payload: "second" },
  ];

  it("should list the newest entry first", () => {
    expect(toRawRows(history).map((row) => row.payload)).toEqual([
      "second",
      "first",
    ]);
  });

  it("should give each row a unique key", () => {
    const keys = toRawRows(history).map((row) => row.key);

    expect(new Set(keys).size).toBe(2);
  });

  it("should return no rows for an empty history", () => {
    expect(toRawRows([])).toEqual([]);
  });
});

describe("resolveField", () => {
  it("should keep the remembered field when it is available", () => {
    expect(resolveField(["a", "b"], "b")).toBe("b");
  });

  it("should fall back to the first field when nothing is remembered", () => {
    expect(resolveField(["a", "b"], undefined)).toBe("a");
  });

  it("should fall back to the first field when the remembered one is gone", () => {
    expect(resolveField(["a", "b"], "z")).toBe("a");
  });

  it("should return null when the payload has no fields", () => {
    expect(resolveField([], "a")).toBeNull();
  });
});

describe("recentMessages", () => {
  const history = [1, 2, 3].map((t) => ({ t, payload: `p${t}` }));

  it("should return the history newest first", () => {
    expect(recentMessages({ history }, 10).map((e) => e.t)).toEqual([3, 2, 1]);
  });

  it("should return at most the limit, newest kept", () => {
    expect(recentMessages({ history }, 2).map((e) => e.t)).toEqual([3, 2]);
  });

  it("should fall back to value and old without history", () => {
    const node = {
      value: { receivedAt: 6, payload: "new" },
      old: { receivedAt: 5, payload: "old" },
      history: [],
    };

    expect(recentMessages(node, 10)).toEqual([
      { t: 6, payload: "new" },
      { t: 5, payload: "old" },
    ]);
  });

  it("should keep fallback entries identical across calls", () => {
    const value = { receivedAt: 6, payload: "new" };
    const node = { value, history: [] };

    expect(recentMessages(node, 10)[0]).toBe(recentMessages(node, 10)[0]);
  });
});
