import { describe, expect, it } from "vitest";
import connectionMatches from "./connectionMatches";

const connection = { name: "Factory Floor", host: "broker.local", clientId: "explorer-01" };

describe("connectionMatches", () => {
  it("should match everything when the query is blank", () => {
    expect(connectionMatches(connection, "  ")).toBe(true);
  });

  it.each([
    ["name", "FLOOR"],
    ["host", "Broker"],
    ["client id", "explorer"],
  ])("should match the %s ignoring case", (_field, query) => {
    expect(connectionMatches(connection, query)).toBe(true);
  });

  it("should not match other text", () => {
    expect(connectionMatches(connection, "warehouse")).toBe(false);
  });

  it("should not fail when the client id is missing", () => {
    expect(connectionMatches({ name: "a", host: "b" }, "x")).toBe(false);
  });
});
