import { describe, expect, it, vi } from "vitest";
import { tabMenuTemplate } from "./tabMenu";

const actions = () => ({
  pin: vi.fn(),
  unpin: vi.fn(),
  reconnect: vi.fn(),
  disconnect: vi.fn(),
  unload: vi.fn(),
  close: vi.fn(),
  closeOthers: vi.fn(),
});
const connectionTab = (fields) => ({
  id: "connection-1",
  kind: "connection",
  pinned: false,
  state: "connected",
  ...fields,
});
const build = (tab, extra = {}) =>
  tabMenuTemplate({
    tab,
    canPin: true,
    canCloseOthers: true,
    actions: actions(),
    ...extra,
  });
const labels = (template) =>
  template.filter((entry) => entry.label).map((entry) => entry.label);
const item = (template, label) => template.find((entry) => entry.label === label);

describe("tabMenuTemplate", () => {
  it("has no menu for Home", () => {
    expect(build({ id: "home", kind: "home" })).toEqual([]);
  });

  it("offers only Close on Settings", () => {
    expect(labels(build({ id: "settings", kind: "settings" }))).toEqual(["Close"]);
  });

  it("offers every action on a connection tab", () => {
    expect(labels(build(connectionTab()))).toEqual([
      "Pin tab",
      "Reconnect",
      "Disconnect",
      "Unload tab",
      "Close",
      "Close others",
    ]);
  });

  it("offers Unpin on a pinned tab", () => {
    expect(labels(build(connectionTab({ pinned: true })))[0]).toBe("Unpin tab");
  });

  it("disables Pin when the connection is not saved", () => {
    const template = build(connectionTab(), { canPin: false });

    expect(item(template, "Pin tab").enabled).toBe(false);
  });

  it("disables Close others when there is no other tab to close", () => {
    const template = build(connectionTab(), { canCloseOthers: false });

    expect(item(template, "Close others").enabled).toBe(false);
  });

  it.each(["sleeping", "disconnected", "error"])(
    "disables Disconnect on a %s tab",
    (state) => {
      expect(item(build(connectionTab({ state })), "Disconnect").enabled).toBe(false);
    }
  );

  it.each(["sleeping", "pending", "connected"])(
    "disables Reconnect on a %s tab",
    (state) => {
      expect(item(build(connectionTab({ state })), "Reconnect").enabled).toBe(false);
    }
  );

  it.each(["disconnected", "error"])("enables Reconnect on a %s tab", (state) => {
    expect(item(build(connectionTab({ state })), "Reconnect").enabled).toBe(true);
  });

  it("disables Unload on a sleeping tab", () => {
    const template = build(connectionTab({ state: "sleeping" }));

    expect(item(template, "Unload tab").enabled).toBe(false);
  });

  it.each(["pending", "connected", "disconnected", "error"])(
    "enables Unload on a %s tab",
    (state) => {
      expect(item(build(connectionTab({ state })), "Unload tab").enabled).toBe(true);
    }
  );
});
