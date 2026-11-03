import { describe, expect, it, vi } from "vitest";

vi.mock("electron", () => ({ ipcMain: {} }));

const { parsePinnedIds, parseSavedConnections, restorePinnedTabs } =
  await import("./pinnedTabs");

const connection = (id) => ({
  id,
  name: id,
  protocol: "mqtt",
  version: 5,
  host: "localhost",
  port: 1883,
  topics: ["#"],
  validateCertificate: true,
});

function createStore(values) {
  let listener;

  return {
    get: (key) => values[key],
    onDidChange: (key, callback) => {
      listener = callback;
      return vi.fn();
    },
    emit: (raw) => listener(raw),
  };
}

describe("parseSavedConnections", () => {
  it("returns the valid connections and skips the others", () => {
    const raw = JSON.stringify([connection("a"), { id: "broken" }]);

    expect(parseSavedConnections(raw).map(({ id }) => id)).toEqual(["a"]);
  });

  it("returns an empty list when nothing is stored", () => {
    expect(parseSavedConnections(undefined)).toEqual([]);
  });

  it("returns undefined for invalid JSON", () => {
    expect(parseSavedConnections("{oops")).toBeUndefined();
  });

  it("returns undefined when the value is not a list", () => {
    expect(parseSavedConnections('{"a":1}')).toBeUndefined();
  });
});

describe("parsePinnedIds", () => {
  it("keeps only the string ids", () => {
    expect(parsePinnedIds(["a", 1, null, "b"])).toEqual(["a", "b"]);
  });

  it("returns an empty list for a value that is not a list", () => {
    expect(parsePinnedIds("a")).toEqual([]);
  });
});

describe("restorePinnedTabs", () => {
  const createTabs = () => ({
    restorePinned: vi.fn(),
    syncSavedConnections: vi.fn(),
  });

  it("restores the pinned ids with the saved connections", () => {
    const tabs = createTabs();
    const store = createStore({
      saved_mqtt_connections: JSON.stringify([connection("a")]),
      pinned_tabs: ["a"],
    });

    restorePinnedTabs({ store, tabs });

    expect(tabs.restorePinned).toHaveBeenCalledWith(["a"], [connection("a")]);
  });

  it("restores nothing when the saved connections are unreadable", () => {
    const tabs = createTabs();
    const store = createStore({
      saved_mqtt_connections: "{oops",
      pinned_tabs: ["a"],
    });

    restorePinnedTabs({ store, tabs });

    expect(tabs.restorePinned).not.toHaveBeenCalled();
  });

  it("syncs the tabs when the saved connections change", () => {
    const tabs = createTabs();
    const store = createStore({});

    restorePinnedTabs({ store, tabs });
    store.emit(JSON.stringify([connection("b")]));

    expect(tabs.syncSavedConnections).toHaveBeenCalledWith([connection("b")]);
  });

  it("ignores a change that is unreadable", () => {
    const tabs = createTabs();
    const store = createStore({});

    restorePinnedTabs({ store, tabs });
    store.emit("{oops");

    expect(tabs.syncSavedConnections).not.toHaveBeenCalled();
  });
});
