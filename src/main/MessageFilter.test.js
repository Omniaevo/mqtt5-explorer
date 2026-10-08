import { describe, expect, it, vi } from "vitest";
import SearchEngine from "../shared/SearchEngine";
import MessageFilter from "./MessageFilter";

const { modes } = SearchEngine;

const entry = (term, mode = modes.ALL) => ({ term, mode });

function createFilter(config) {
  const onNotify = vi.fn();
  const onLog = vi.fn();
  const filter = new MessageFilter(onNotify, onLog);

  filter.setConfig({
    notifyEnabled: true,
    loggingEnabled: true,
    joinType: "or",
    entries: [],
    ...config,
  });

  return { filter, onNotify, onLog };
}

const packet = (topic, payload = "on") => ({ topic, payload });

describe("MessageFilter", () => {
  describe("OR", () => {
    it("matches when one entry matches", () => {
      const { filter, onNotify } = createFilter({
        entries: [entry("nothing"), entry("kitchen")],
      });

      filter.process(packet("home/kitchen/light"));

      expect(onNotify).toHaveBeenCalledTimes(1);
    });

    it("ignores a packet that matches no entry", () => {
      const { filter, onNotify, onLog } = createFilter({
        entries: [entry("garage")],
      });

      filter.process(packet("home/kitchen/light"));

      expect(onNotify).not.toHaveBeenCalled();
      expect(onLog).not.toHaveBeenCalled();
    });
  });

  describe("AND", () => {
    const config = {
      joinType: "and",
      entries: [entry("kitchen"), entry("query::payload=on", modes.WORDS)],
    };

    it("matches when every entry matches", () => {
      const { filter, onNotify } = createFilter(config);

      filter.process(packet("home/kitchen/light", "on"));

      expect(onNotify).toHaveBeenCalledTimes(1);
    });

    it("does not match when one entry fails", () => {
      const { filter, onNotify } = createFilter(config);

      filter.process(packet("home/kitchen/light", "off"));

      expect(onNotify).not.toHaveBeenCalled();
    });
  });

  describe("query:: syntax", () => {
    it("searches a field of the packet", () => {
      const { filter, onNotify } = createFilter({
        entries: [entry("query::payload=hot", modes.CASES)],
      });

      filter.process(packet("t", "very hot"));
      filter.process(packet("t", "cold"));

      expect(onNotify).toHaveBeenCalledTimes(1);
    });

    it("searches a nested field such as the MQTT 5 properties", () => {
      const { filter, onNotify } = createFilter({
        entries: [entry("query::properties.contentType=json", modes.WORDS)],
      });

      filter.process({ ...packet("t"), properties: { contentType: "json" } });
      filter.process({ ...packet("t"), properties: { contentType: "text" } });

      expect(onNotify).toHaveBeenCalledTimes(1);
    });

    it("does not match the payload text with a plain term", () => {
      const { filter, onNotify } = createFilter({ entries: [entry("hello")] });

      filter.process(packet("t", "hello"));

      expect(onNotify).not.toHaveBeenCalled();
    });
  });

  describe("level names", () => {
    it("matches the last level name", () => {
      const { filter, onNotify } = createFilter({
        entries: [entry("light", modes.WORDS)],
      });

      filter.process(packet("home/kitchen/light"));

      expect(onNotify).toHaveBeenCalledTimes(1);
    });

    it("does not match a whole word on a middle level", () => {
      const { filter, onNotify } = createFilter({
        entries: [entry("kitchen", modes.WORDS)],
      });

      filter.process(packet("home/kitchen/light"));

      expect(onNotify).not.toHaveBeenCalled();
    });

    it("matches the full topic in regular expression mode", () => {
      const { filter, onNotify } = createFilter({
        entries: [entry("^home/.+/light$", modes.REG_EXP)],
      });

      filter.process(packet("home/kitchen/light"));

      expect(onNotify).toHaveBeenCalledTimes(1);
    });

    it("handles a single-level topic", () => {
      const { filter, onNotify } = createFilter({
        entries: [entry("temp", modes.WORDS)],
      });

      filter.process(packet("temp"));

      expect(onNotify).toHaveBeenCalledTimes(1);
    });
  });

  describe("switches", () => {
    const config = { entries: [entry("a")] };

    it("only logs when notifications are off", () => {
      const { filter, onNotify, onLog } = createFilter({
        ...config,
        notifyEnabled: false,
      });

      filter.process(packet("a"));

      expect(onNotify).not.toHaveBeenCalled();
      expect(onLog).toHaveBeenCalledTimes(1);
    });

    it("only notifies when logging is off", () => {
      const { filter, onNotify, onLog } = createFilter({
        ...config,
        loggingEnabled: false,
      });

      filter.process(packet("a"));

      expect(onNotify).toHaveBeenCalledTimes(1);
      expect(onLog).not.toHaveBeenCalled();
    });

    it("is idle when both are off or there are no entries", () => {
      expect(
        createFilter({
          ...config,
          notifyEnabled: false,
          loggingEnabled: false,
        }).filter.isIdle
      ).toBe(true);
      expect(createFilter({ entries: [] }).filter.isIdle).toBe(true);
      expect(createFilter(config).filter.isIdle).toBe(false);
    });
  });

  it("ignores an empty payload", () => {
    const { filter, onNotify } = createFilter({ entries: [entry("a")] });

    filter.process(packet("a", ""));

    expect(onNotify).not.toHaveBeenCalled();
  });

  it("matches nothing for an invalid regular expression", () => {
    const { filter, onNotify } = createFilter({
      entries: [entry("(", modes.REG_EXP)],
    });

    filter.process(packet("a"));

    expect(onNotify).not.toHaveBeenCalled();
  });

  it("falls back to safe values for a bad configuration", () => {
    const { filter } = createFilter({
      joinType: "xor",
      entries: [entry("a", "unknown"), { term: 5 }, null],
    });

    expect(filter.isIdle).toBe(false);
    expect(() => filter.setConfig(undefined)).not.toThrow();
    expect(filter.isIdle).toBe(true);
  });

  it("does nothing after reset", () => {
    const { filter, onNotify } = createFilter({ entries: [entry("a")] });

    filter.reset();
    filter.process(packet("a"));

    expect(onNotify).not.toHaveBeenCalled();
  });
});
