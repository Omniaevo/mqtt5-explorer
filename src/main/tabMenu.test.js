import { describe, expect, it, vi } from "vitest";
import { tabMenuTemplate } from "./tabMenu";

const actions = () => ({ pin: vi.fn(), unpin: vi.fn(), unload: vi.fn() });
const connectionTab = (fields) => ({
  id: "connection-1",
  kind: "connection",
  pinned: false,
  state: "connected",
  ...fields,
});
const labels = (template) => template.map((item) => item.label);
const item = (template, label) => template.find((entry) => entry.label === label);

describe("tabMenuTemplate", () => {
  it("has no menu for Home", () => {
    const template = tabMenuTemplate({
      tab: { id: "home", kind: "home" },
      canPin: false,
      actions: actions(),
    });

    expect(template).toEqual([]);
  });

  it("offers Pin and Unload on an awake unpinned tab", () => {
    const template = tabMenuTemplate({
      tab: connectionTab(),
      canPin: true,
      actions: actions(),
    });

    expect(labels(template)).toEqual(["Pin tab", "Unload tab"]);
  });

  it("offers Unpin on a pinned tab", () => {
    const template = tabMenuTemplate({
      tab: connectionTab({ pinned: true }),
      canPin: false,
      actions: actions(),
    });

    expect(labels(template)[0]).toBe("Unpin tab");
  });

  it("disables Pin when the connection is not saved", () => {
    const template = tabMenuTemplate({
      tab: connectionTab(),
      canPin: false,
      actions: actions(),
    });

    expect(item(template, "Pin tab").enabled).toBe(false);
  });

  it("disables Unload on a sleeping tab", () => {
    const template = tabMenuTemplate({
      tab: connectionTab({ state: "sleeping" }),
      canPin: true,
      actions: actions(),
    });

    expect(item(template, "Unload tab").enabled).toBe(false);
  });
});
