import { describe, expect, it } from "vitest";
import { parseSizeReport, parseTooltipRequest } from "./tooltipIpc";

const anchor = { x: 1, y: 2, width: 3, height: 4 };

describe("parseTooltipRequest", () => {
  it("accepts a title with an anchor", () => {
    expect(parseTooltipRequest({ title: "A", anchor })).toEqual({
      title: "A",
      subtitle: undefined,
      anchor,
    });
  });

  it("rejects an empty title", () => {
    expect(parseTooltipRequest({ title: "", anchor })).toBeUndefined();
  });

  it("rejects an anchor with a non numeric field", () => {
    expect(
      parseTooltipRequest({ title: "A", anchor: { ...anchor, x: "1" } })
    ).toBeUndefined();
  });

  it("cuts a long title", () => {
    const parsed = parseTooltipRequest({ title: "a".repeat(500), anchor });

    expect(parsed.title).toHaveLength(200);
  });
});

describe("parseSizeReport", () => {
  it("rounds the size", () => {
    expect(parseSizeReport({ id: 1, width: 10.4, height: 5.6 })).toEqual({
      id: 1,
      width: 10,
      height: 6,
    });
  });

  it("rejects a zero size", () => {
    expect(parseSizeReport({ id: 1, width: 0, height: 5 })).toBeUndefined();
  });

  it("rejects a non integer id", () => {
    expect(parseSizeReport({ id: "1", width: 5, height: 5 })).toBeUndefined();
  });

  it("limits a huge size", () => {
    expect(parseSizeReport({ id: 1, width: 1e9, height: 5 }).width).toBe(2000);
  });
});
