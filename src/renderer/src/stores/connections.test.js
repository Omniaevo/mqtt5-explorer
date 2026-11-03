import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useConnectionsStore } from "./connections";

const connection = (name, lastConnectedAt, saved = true) => ({
  id: name,
  name,
  saved,
  lastConnectedAt,
});

const storeWith = (connections) => {
  const store = useConnectionsStore();

  store.replaceAll(connections);
  return store;
};

const names = (connections) => connections.map((c) => c.name);

describe("connections store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.stubGlobal("window", { api: { store: { get: vi.fn(), set: vi.fn() } } });
  });

  describe("recentConnections", () => {
    it("keeps the saved order when nothing was connected yet", () => {
      const store = storeWith([connection("b"), connection("a"), connection("c")]);

      expect(names(store.recentConnections)).toEqual(["b", "a", "c"]);
    });

    it("puts the most recently connected first", () => {
      const store = storeWith([
        connection("old", "2026-01-01T00:00:00Z"),
        connection("never"),
        connection("new", "2026-02-01T00:00:00Z"),
      ]);

      expect(names(store.recentConnections)).toEqual(["new", "old", "never"]);
    });

    it("reads a numeric timestamp from old data", () => {
      const store = storeWith([
        connection("never"),
        connection("old", 1700000000000),
        connection("new", "2026-02-01T00:00:00Z"),
      ]);

      expect(names(store.recentConnections)).toEqual(["new", "old", "never"]);
    });

    it("returns at most 8 connections", () => {
      const many = Array.from({ length: 12 }, (_, i) => connection(`c${i}`));

      expect(storeWith(many).recentConnections).toHaveLength(8);
    });

    it("ignores unsaved connections", () => {
      const store = storeWith([connection("temp", undefined, false), connection("a")]);

      expect(names(store.recentConnections)).toEqual(["a"]);
    });
  });

  describe("otherConnections", () => {
    it("holds the rest, alphabetical and case-insensitive", () => {
      const many = [..."abcdefgh"].map((n) => connection(n, "2026-01-01T00:00:00Z"));
      const store = storeWith([...many, connection("Zed"), connection("beta")]);

      expect(names(store.otherConnections)).toEqual(["beta", "Zed"]);
    });

    it("is empty with 8 connections or fewer", () => {
      expect(storeWith([connection("a")]).otherConnections).toEqual([]);
    });
  });

  describe("markFailed", () => {
    it("saves the error of a saved connection", () => {
      const store = storeWith([connection("a")]);

      store.markFailed("a", "Connection refused");

      expect(store.brokerConnections[0].lastError).toBe("Connection refused");
      expect(window.api.store.set).toHaveBeenCalledOnce();
    });

    it("skips an unsaved connection", () => {
      const store = storeWith([connection("t", undefined, false)]);

      store.markFailed("t", "Connection refused");

      expect(window.api.store.set).not.toHaveBeenCalled();
    });

    it("is cleared by the next successful connect", () => {
      const store = storeWith([connection("a")]);
      store.markFailed("a", "Connection refused");

      store.markConnected("a");

      expect(store.brokerConnections[0].lastError).toBeUndefined();
    });
  });

  describe("markConnected", () => {
    it("stamps and saves a saved connection", () => {
      const store = storeWith([connection("a")]);

      store.markConnected("a");

      expect(store.brokerConnections[0].lastConnectedAt).toMatch(/^\d{4}-\d{2}-/);
      expect(window.api.store.set).toHaveBeenCalledOnce();
    });

    it("skips an unsaved connection", () => {
      const store = storeWith([connection("t", undefined, false)]);

      store.markConnected("t");

      expect(window.api.store.set).not.toHaveBeenCalled();
    });
  });
});
