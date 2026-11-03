import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useConnectionsStore } from "./connections";
import { useSettingsStore } from "./settings";

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
    it("is empty when nothing was connected yet", () => {
      const store = storeWith([connection("b"), connection("a")]);

      expect(store.recentConnections).toEqual([]);
    });

    it("puts the most recently connected first", () => {
      const store = storeWith([
        connection("old", "2026-01-01T00:00:00Z"),
        connection("never"),
        connection("new", "2026-02-01T00:00:00Z"),
      ]);

      expect(names(store.recentConnections)).toEqual(["new", "old"]);
    });

    it("reads a numeric timestamp from old data", () => {
      const store = storeWith([
        connection("never"),
        connection("old", 1700000000000),
        connection("new", "2026-02-01T00:00:00Z"),
      ]);

      expect(names(store.recentConnections)).toEqual(["new", "old"]);
    });

    it("returns at most 8 connections", () => {
      const many = Array.from({ length: 12 }, (_, i) =>
        connection(`c${i}`, "2026-01-01T00:00:00Z")
      );

      expect(storeWith(many).recentConnections).toHaveLength(8);
    });

    it("follows the rows setting, 4 tiles per row", () => {
      const many = Array.from({ length: 12 }, (_, i) =>
        connection(`c${i}`, "2026-01-01T00:00:00Z")
      );
      const store = storeWith(many);

      useSettingsStore().recentRows = 1;

      expect(store.recentConnections).toHaveLength(4);
    });

    it("ignores unsaved connections", () => {
      const store = storeWith([
        connection("temp", "2026-01-01T00:00:00Z", false),
        connection("a", "2026-01-01T00:00:00Z"),
      ]);

      expect(names(store.recentConnections)).toEqual(["a"]);
    });
  });

  describe("otherConnections", () => {
    it("holds the rest, alphabetical and case-insensitive", () => {
      const many = [..."abcdefgh"].map((n) => connection(n, "2026-01-01T00:00:00Z"));
      const store = storeWith([...many, connection("Zed"), connection("beta")]);

      expect(names(store.otherConnections)).toEqual(["beta", "Zed"]);
    });

    it("is empty with 8 connected connections or fewer", () => {
      const store = storeWith([connection("a", "2026-01-01T00:00:00Z")]);

      expect(store.otherConnections).toEqual([]);
    });

    it("holds the connections that never connected", () => {
      const store = storeWith([connection("b"), connection("a")]);

      expect(names(store.otherConnections)).toEqual(["a", "b"]);
    });
  });

  describe("markFailed", () => {
    it("saves the error of a saved connection", () => {
      const store = storeWith([connection("a")]);

      store.markFailed("a", "Connection refused");

      expect(store.brokerConnections[0].lastError).toBe("Connection refused");
      expect(window.api.store.set).toHaveBeenCalledOnce();
    });

    it("makes the connection recent", () => {
      const store = storeWith([connection("a")]);

      store.markFailed("a", "Connection refused");

      expect(names(store.recentConnections)).toEqual(["a"]);
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
