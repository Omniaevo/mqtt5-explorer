import { describe, expect, it, vi } from "vitest";

vi.mock("electron", () => ({ ipcMain: {} }));

const { parseOpenRequest, parseStripHeight } = await import("./tabsIpc");

describe("parseOpenRequest", () => {
  it("rejects Home as a kind to open", () => {
    expect(parseOpenRequest("home")).toBeUndefined();
  });

  it("rejects an unknown kind", () => {
    expect(parseOpenRequest("<script>")).toBeUndefined();
  });

  it("rejects a non string connection id", () => {
    expect(parseOpenRequest("connection", { connectionId: 3 })).toBeUndefined();
  });

  it("rejects an array as connection", () => {
    expect(parseOpenRequest("connection", { connection: [] })).toBeUndefined();
  });

  it("keeps only the known payload fields", () => {
    const request = parseOpenRequest("connection", {
      connectionId: "a",
      connection: { name: "b" },
      extra: true,
    });

    expect(request.payload).toEqual({
      connectionId: "a",
      connection: { name: "b" },
    });
  });

  it("accepts Settings without payload", () => {
    expect(parseOpenRequest("settings").kind).toBe("settings");
  });
});

describe("parseStripHeight", () => {
  it("rejects a string", () => {
    expect(parseStripHeight("40")).toBeUndefined();
  });

  it("rejects NaN", () => {
    expect(parseStripHeight(NaN)).toBeUndefined();
  });

  it("clamps a huge value", () => {
    expect(parseStripHeight(99999)).toBe(400);
  });

  it("clamps a negative value", () => {
    expect(parseStripHeight(-5)).toBe(0);
  });

  it("rounds to whole pixels", () => {
    expect(parseStripHeight(40.6)).toBe(41);
  });
});
