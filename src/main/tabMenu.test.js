import { describe, expect, it, vi } from "vitest";
import { tabMenuTemplate } from "./tabMenu";

const actions = () => ({ pin: vi.fn(), unpin: vi.fn(), disconnect: vi.fn() });
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

  it("offers Pin and Disconnect on an awake unpinned tab", () => {
    const template = tabMenuTemplate({
      tab: connectionTab(),
      canPin: true,
      actions: actions(),
    });

    expect(labels(template)).toEqual(["Pin tab", "Disconnect"]);
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

  it.each(["sleeping", "disconnected", "error"])(
    "disables Disconnect on a %s tab",
    (state) => {
      const template = tabMenuTemplate({
        tab: connectionTab({ state }),
        canPin: true,
        actions: actions(),
      });

      expect(item(template, "Disconnect").enabled).toBe(false);
    }
  );
});
