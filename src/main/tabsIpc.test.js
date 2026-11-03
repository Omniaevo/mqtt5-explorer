import { describe, expect, it, vi } from "vitest";

vi.mock("electron", () => ({ ipcMain: {} }));

const { parseConnection, parseOpenRequest, parseStateReport, parseStripHeight } =
  await import("./tabsIpc");

const validConnection = () => ({
  id: "a",
  name: "Broker",
  protocol: "mqtt",
  version: 5,
  host: "localhost",
  port: 1883,
  topics: ["#"],
  validateCertificate: true,
});

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

describe("parseConnection", () => {
  it("accepts a valid connection", () => {
    expect(parseConnection(validConnection())).toMatchObject({ id: "a" });
  });

  it("drops unknown fields", () => {
    const parsed = parseConnection({ ...validConnection(), evil: true });

    expect(parsed).not.toHaveProperty("evil");
  });

  it("rejects a non object", () => {
    expect(parseConnection("broker")).toBeUndefined();
  });

  it("rejects a missing host", () => {
    expect(parseConnection({ ...validConnection(), host: "" })).toBeUndefined();
  });

  it("rejects an unknown protocol", () => {
    expect(
      parseConnection({ ...validConnection(), protocol: "file" })
    ).toBeUndefined();
  });

  it("rejects a port that is not a number", () => {
    expect(
      parseConnection({ ...validConnection(), port: "1883" })
    ).toBeUndefined();
  });

  it("rejects topics that are not strings", () => {
    expect(
      parseConnection({ ...validConnection(), topics: [1] })
    ).toBeUndefined();
  });

  it("rejects a non string password", () => {
    expect(
      parseConnection({ ...validConnection(), password: {} })
    ).toBeUndefined();
  });
});

describe("parseStateReport", () => {
  it("rejects the sleeping state", () => {
    expect(parseStateReport("sleeping")).toBeUndefined();
  });

  it("rejects an unknown state", () => {
    expect(parseStateReport("<b>")).toBeUndefined();
  });

  it("limits the length of the message", () => {
    expect(parseStateReport("error", "x".repeat(900)).message).toHaveLength(500);
  });

  it("uses an empty message when none is given", () => {
    expect(parseStateReport("connected").message).toBe("");
  });
});
