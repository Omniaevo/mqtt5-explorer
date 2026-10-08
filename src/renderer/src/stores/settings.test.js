import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useSettingsStore } from "./settings";

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
    expect(s.denseTree).toBe(false);
    expect(s.outline).toBe(false);
    expect(s.closeTray).toBe(true);
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
        denseTree: true,
        outline: true,
        closeTray: false,
        clientId: "my-client",
      })
    );

    expect(s.theme).toBe("dark");
    expect(s.denseTree).toBe(true);
    expect(s.outline).toBe(true);
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

describe("settings store regenerateClientId()", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("sets a new m5e- client ID each time", () => {
    const s = loadSettings(undefined);
    const before = s.clientId;

    s.regenerateClientId();
    const first = s.clientId;
    s.regenerateClientId();

    expect(first).toMatch(/^m5e-[0-9a-f-]{36}$/);
    expect(first).not.toBe(before);
    expect(s.clientId).not.toBe(first);
  });
});
