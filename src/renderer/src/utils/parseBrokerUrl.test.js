import { describe, expect, it } from "vitest";
import parseBrokerUrl from "./parseBrokerUrl";

describe("parseBrokerUrl", () => {
  it.each([
    ["mqtt://localhost", { protocol: "mqtt", host: "localhost", port: 1883 }],
    ["mqtts://localhost", { protocol: "mqtts", host: "localhost", port: 8883 }],
    ["ws://localhost", { protocol: "ws", host: "localhost", port: 80 }],
    ["wss://localhost", { protocol: "wss", host: "localhost", port: 443 }],
  ])("should apply the default port of %s", (url, expected) => {
    expect(parseBrokerUrl(url)).toEqual(expected);
  });

  it("should keep an explicit port", () => {
    expect(parseBrokerUrl("mqtt://broker.local:1884")).toEqual({
      protocol: "mqtt",
      host: "broker.local",
      port: 1884,
    });
  });

  it("should keep an explicit port equal to the ws default", () => {
    expect(parseBrokerUrl("ws://broker.local:80").port).toBe(80);
  });

  it("should ignore the path", () => {
    expect(parseBrokerUrl("wss://broker.local:8084/mqtt")).toEqual({
      protocol: "wss",
      host: "broker.local",
      port: 8084,
    });
  });

  it("should keep the brackets of an IPv6 host", () => {
    expect(parseBrokerUrl("mqtt://[::1]:1884").host).toBe("[::1]");
  });

  it("should accept an IPv6 host without port", () => {
    expect(parseBrokerUrl("mqtts://[2001:db8::1]")).toEqual({
      protocol: "mqtts",
      host: "[2001:db8::1]",
      port: 8883,
    });
  });

  it("should trim surrounding spaces", () => {
    expect(parseBrokerUrl("  mqtt://localhost  ").host).toBe("localhost");
  });

  it("should accept an uppercase protocol", () => {
    expect(parseBrokerUrl("MQTT://localhost").protocol).toBe("mqtt");
  });

  it.each([
    ["an empty string", ""],
    ["a bare host", "localhost"],
    ["a host with port only", "localhost:1883"],
    ["an unsupported protocol", "http://localhost"],
    ["a missing host", "mqtt://"],
    ["an out of range port", "mqtt://localhost:99999"],
    ["a partial protocol", "mqt"],
    ["a non string", undefined],
  ])("should return undefined for %s", (_label, input) => {
    expect(parseBrokerUrl(input)).toBeUndefined();
  });
});
