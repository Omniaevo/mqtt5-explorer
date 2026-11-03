import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { clampHistorySize, clampRecentRows, useSettingsStore } from "./settings";

const stubStoredSettings = (stored) =>
  vi.stubGlobal("window", {
    api: { store: { get: () => stored, set: vi.fn() } },
  });

const loadSettings = (stored) => {
  stubStoredSettings(stored);
  const settings = useSettingsStore();
  settings.load();
  return settings;
};

describe("settings store load()", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("applies defaults when nothing is stored", () => {
    const s = loadSettings(undefined);

    expect(s.theme).toBe("light");
    expect(s.closeTray).toBe(true);
    expect(s.fontScale).toBe(100);
    expect(s.primaryColor.text).toBe("Indie Indigo");
    expect(s.clientId).toMatch(/^m5-/);
    expect(s.keepalive).toBe(120);
    expect(s.reconnectPeriod).toBe(2);
    expect(s.connectTimeout).toBe(20);
    expect(s.maxReconnects).toBe(0);
  });

  it("clamps values below the minimums", () => {
    const s = loadSettings(
      JSON.stringify({ keepalive: 10, reconnectPeriod: 1, connectTimeout: 5 })
    );

    expect(s.keepalive).toBe(120);
    expect(s.reconnectPeriod).toBe(2);
    expect(s.connectTimeout).toBe(20);
  });

  it("keeps values above the minimums, also when stored as strings", () => {
    const s = loadSettings(
      JSON.stringify({
        keepalive: "300",
        reconnectPeriod: 10,
        connectTimeout: "60",
        maxReconnects: "3",
      })
    );

    expect(s.keepalive).toBe(300);
    expect(s.reconnectPeriod).toBe(10);
    expect(s.connectTimeout).toBe(60);
    expect(s.maxReconnects).toBe(3);
  });

  it("keeps stored values and falsy-but-valid booleans", () => {
    const s = loadSettings(
      JSON.stringify({
        theme: "dark",
        closeTray: false,
        clientId: "my-client",
      })
    );

    expect(s.theme).toBe("dark");
    expect(s.closeTray).toBe(false);
    expect(s.clientId).toBe("my-client");
    expect(s.isDark).toBe(true);
  });

  it("fills only the missing fields", () => {
    const s = loadSettings(JSON.stringify({ theme: "dark" }));

    expect(s.theme).toBe("dark");
    expect(s.keepalive).toBe(120);
    expect(s.closeTray).toBe(true);
  });

  it("exposes MQTT client settings as numbers", () => {
    const s = loadSettings(JSON.stringify({ keepalive: "200" }));

    expect(s.mqttClientSettings).toMatchObject({
      keepalive: 200,
      reconnectPeriod: 2,
      connectTimeout: 20,
      maxReconnects: 0,
    });
  });
});

describe("settings store historySize", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("defaults to 50 when missing from old settings files", () => {
    expect(loadSettings(JSON.stringify({ theme: "dark" })).historySize).toBe(
      50
    );
  });

  it("keeps 0 (disabled) and valid values, also as strings", () => {
    expect(loadSettings(JSON.stringify({ historySize: 0 })).historySize).toBe(
      0
    );
    expect(
      loadSettings(JSON.stringify({ historySize: "120" })).historySize
    ).toBe(120);
  });

  it.each([
    [-5, 0],
    [9999, 500],
    [12.7, 12],
    ["abc", 0],
    ["", 0],
    [null, 0],
  ])("clamps %j to %i", (input, expected) => {
    expect(clampHistorySize(input)).toBe(expected);
  });
});

describe("settings store regenerateClientId()", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("sets a new m5- client ID each time", () => {
    const s = loadSettings(undefined);
    const before = s.clientId;

    s.regenerateClientId();
    const first = s.clientId;
    s.regenerateClientId();

    expect(first).toMatch(/^m5-[0-9a-f-]{36}$/);
    expect(first).not.toBe(before);
    expect(s.clientId).not.toBe(first);
  });
});

describe("settings store resetToDefaults()", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("restores defaults and keeps the client ID", () => {
    const s = loadSettings(
      JSON.stringify({
        theme: "dark",
        closeTray: false,
        fontScale: 125,
        keepalive: 300,
        maxReconnects: 10,
        primaryColor: { text: "Usual Blue", value: {} },
        clientId: "my-client",
      })
    );

    s.resetToDefaults();

    expect(s.theme).toBe("light");
    expect(s.closeTray).toBe(true);
    expect(s.fontScale).toBe(100);
    expect(s.primaryColor.text).toBe("Indie Indigo");
    expect(s.keepalive).toBe(120);
    expect(s.maxReconnects).toBe(0);
    expect(s.clientId).toBe("my-client");
  });

  it("keeps a known font scale and falls back for an unknown one", () => {
    expect(loadSettings(JSON.stringify({ fontScale: 125 })).fontScale).toBe(125);
    expect(loadSettings(JSON.stringify({ fontScale: 333 })).fontScale).toBe(100);
  });

  it("defaults the wallpaper to none when the stored data has none", () => {
    expect(loadSettings(JSON.stringify({})).wallpaper).toBe("none");
  });

  it("keeps a known wallpaper", () => {
    expect(loadSettings(JSON.stringify({ wallpaper: "grid" })).wallpaper).toBe("grid");
  });

  it("falls back to none for an unknown wallpaper", () => {
    expect(loadSettings(JSON.stringify({ wallpaper: "unknown" })).wallpaper).toBe("none");
  });

  it("resets the wallpaper to none", () => {
    const s = loadSettings(JSON.stringify({ wallpaper: "dots" }));

    s.resetToDefaults();

    expect(s.wallpaper).toBe("none");
  });
});

describe("settings store recentRows", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("defaults to 2 when missing from old settings files", () => {
    expect(loadSettings(JSON.stringify({ theme: "dark" })).recentRows).toBe(2);
  });

  it("keeps a valid value, also as a string", () => {
    expect(loadSettings(JSON.stringify({ recentRows: "3" })).recentRows).toBe(3);
  });

  it.each([
    [0, 1],
    [-4, 1],
    [99, 4],
    [2.8, 2],
    ["abc", 2],
  ])("clamps %j to %i", (input, expected) => {
    expect(clampRecentRows(input)).toBe(expected);
  });
});
