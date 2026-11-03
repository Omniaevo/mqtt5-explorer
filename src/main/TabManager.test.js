import { describe, expect, it, vi } from "vitest";
import TabManager from "./TabManager";

const CONTENT_SIZE = { width: 1000, height: 700 };

let nextWebContentsId = 1;

function createFakeView(route) {
  return {
    route,
    webContentsId: nextWebContentsId++,
    visible: undefined,
    bounds: undefined,
    radius: undefined,
    destroyed: false,
    focusCount: 0,
    reloads: [],
    sent: [],
    send(...message) {
      this.sent.push(message);
    },
    setBounds(bounds) {
      this.bounds = bounds;
    },
    setBorderRadius(radius) {
      this.radius = radius;
    },
    setVisible(visible) {
      this.visible = visible;
    },
    focus() {
      this.focusCount++;
    },
    reload(ignoreCache) {
      this.reloads.push(ignoreCache);
    },
    destroy() {
      this.destroyed = true;
    },
  };
}

function createManager() {
  const views = [];
  const onChange = vi.fn();
  const contentSize = { ...CONTENT_SIZE };
  const cornerRadius = { value: 12 };
  const manager = new TabManager({
    createView: (route) => {
      const view = createFakeView(route);

      views.push(view);
      return view;
    },
    getContentSize: () => contentSize,
    getCornerRadius: () => cornerRadius.value,
    onChange,
  });

  return { manager, views, onChange, contentSize, cornerRadius };
}

const ids = (manager) => manager.list().map((tab) => tab.id);

describe("TabManager", () => {
  it("starts with an active Home tab", () => {
    const { manager, views } = createManager();

    expect(manager.active()).toMatchObject({ id: "home", kind: "home" });
    expect(views[0].route).toBe("/home");
  });

  it("does not close Home", () => {
    const { manager } = createManager();

    expect(manager.close("home")).toBe(false);
    expect(ids(manager)).toEqual(["home"]);
  });

  it("keeps Home first when other tabs open", () => {
    const { manager } = createManager();

    manager.open("connection", { connectionId: "a" });
    manager.open("settings");

    expect(ids(manager)[0]).toBe("home");
  });

  it("places Settings right after Home", () => {
    const { manager } = createManager();

    manager.open("connection", { connectionId: "a" });
    manager.open("settings");

    expect(ids(manager)[1]).toBe("settings");
  });

  it("selects the existing Settings tab instead of opening a second one", () => {
    const { manager } = createManager();

    manager.open("settings");
    manager.select("home");
    manager.open("settings");

    expect(manager.active().id).toBe("settings");
    expect(ids(manager)).toEqual(["home", "settings"]);
  });

  it("exposes the broker url of a connection tab", () => {
    const { manager } = createManager();
    const connection = { name: "A", protocol: "mqtt", host: "broker", port: 1883 };

    const id = manager.open("connection", { connectionId: "a", connection });

    expect(manager.list().find((tab) => tab.id === id).url).toBe("mqtt://broker:1883");
  });

  it("selects the existing tab of a connection", () => {
    const { manager } = createManager();
    const first = manager.open("connection", { connectionId: "a" });

    manager.select("home");
    const second = manager.open("connection", { connectionId: "a" });

    expect(second).toBe(first);
    expect(manager.active().id).toBe(first);
  });

  it("opens one tab for each connection without a saved id", () => {
    const { manager } = createManager();

    manager.open("connection", { connection: { name: "tmp" } });
    manager.open("connection", { connection: { name: "tmp" } });

    expect(manager.list()).toHaveLength(3);
  });

  it("loads a connection tab on its own route", () => {
    const { manager, views } = createManager();
    const id = manager.open("connection", { connectionId: "a" });

    expect(views.at(-1).route).toBe(`/viewer/${id}`);
  });

  it("shows only the selected view", () => {
    const { manager, views } = createManager();

    manager.open("settings");

    expect(views.map((view) => view.visible)).toEqual([false, true]);
  });

  it("selects the right neighbour when the active tab closes", () => {
    const { manager } = createManager();
    manager.open("settings");
    const middle = manager.open("connection", { connectionId: "a" });
    manager.open("connection", { connectionId: "b" });

    manager.select(middle);
    manager.close(middle);

    expect(manager.active().connectionId).toBe("b");
  });

  it("selects the left neighbour when the last tab closes", () => {
    const { manager } = createManager();
    manager.open("settings");
    const last = manager.open("connection", { connectionId: "a" });

    manager.close(last);

    expect(manager.active().id).toBe("settings");
  });

  it("keeps the active tab when another tab closes", () => {
    const { manager } = createManager();
    const other = manager.open("connection", { connectionId: "a" });
    manager.open("settings");

    manager.close(other);

    expect(manager.active().id).toBe("settings");
  });

  it("destroys the view of a closed tab", () => {
    const { manager, views } = createManager();
    const id = manager.open("connection", { connectionId: "a" });

    manager.close(id);

    expect(views[1].destroyed).toBe(true);
  });

  it("emits the state on select", () => {
    const { manager, onChange } = createManager();
    manager.open("settings");
    onChange.mockClear();

    manager.select("home");

    expect(onChange).toHaveBeenCalledWith({
      tabs: manager.list(),
      activeId: "home",
    });
  });

  it("emits the state on close", () => {
    const { manager, onChange } = createManager();
    manager.open("settings");
    onChange.mockClear();

    manager.close("settings");

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("does not emit when the selected tab is unknown", () => {
    const { manager, onChange } = createManager();

    manager.select("missing");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not expose connection properties in the state", () => {
    const { manager } = createManager();
    const id = manager.open("connection", {
      connectionId: "a",
      connection: { name: "Broker", password: "secret" },
    });

    expect(JSON.stringify(manager.snapshot())).not.toContain("secret");
    expect(manager.getConnection(id).password).toBe("secret");
  });

  it("places views under the strip", () => {
    const { manager, views } = createManager();

    manager.setStripHeight(40);

    expect(views[0].bounds).toEqual({ x: 0, y: 40, width: 1000, height: 660 });
  });

  it("rounds the views by the corner radius", () => {
    const { manager, views } = createManager();

    manager.resize();

    expect(views[0].radius).toBe(12);
  });

  it("squares the views when the radius drops to zero", () => {
    const { manager, views, cornerRadius } = createManager();

    cornerRadius.value = 0;
    manager.resize();

    expect(views[0].radius).toBe(0);
  });

  it("focuses the active view on request", () => {
    const { manager, views } = createManager();
    const focusesBefore = views[0].focusCount;

    manager.focusActive();

    expect(views[0].focusCount).toBe(focusesBefore + 1);
  });

  it("follows the window size on resize", () => {
    const { manager, views, contentSize } = createManager();

    contentSize.width = 500;
    contentSize.height = 300;
    manager.resize();

    expect(views[0].bounds).toMatchObject({ width: 500, height: 300 });
  });

  it("sends a message to the active view only", () => {
    const { manager, views } = createManager();

    manager.open("settings");
    manager.sendToActive("settingsPressed", 1);

    expect(views.map((view) => view.sent)).toEqual([
      [],
      [["settingsPressed", 1]],
    ]);
  });

  it("starts a connection tab as pending", () => {
    const { manager } = createManager();
    const id = manager.open("connection", { connectionId: "a" });

    expect(manager.list().find((tab) => tab.id === id).state).toBe("pending");
  });

  it("finds the tab that owns a webContents", () => {
    const { manager, views } = createManager();
    const id = manager.open("connection", { connectionId: "a" });

    expect(manager.tabIdOf(views[1].webContentsId)).toBe(id);
  });

  it("finds no tab for an unknown webContents", () => {
    const { manager } = createManager();

    expect(manager.tabIdOf(-1)).toBeUndefined();
  });

  it("sets the state of a connection tab and emits", () => {
    const { manager, onChange } = createManager();
    const id = manager.open("connection", { connectionId: "a" });
    onChange.mockClear();

    manager.setState(id, "connected");

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(manager.list().find((tab) => tab.id === id).state).toBe("connected");
  });

  it("ignores a state change on a tab that is not a connection", () => {
    const { manager, onChange } = createManager();
    onChange.mockClear();

    manager.setState("home", "error");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows the error on Home and closes the failed tab", () => {
    const { manager, views } = createManager();
    const id = manager.open("connection", { connectionId: "a" });

    manager.fail(id, "The broker is unreachable");

    expect(views[0].sent).toEqual([
      ["notify:show", "The broker is unreachable", "error"],
    ]);
    expect(ids(manager)).toEqual(["home"]);
    expect(manager.active().id).toBe("home");
  });

  it("does not fail a tab that is not a connection", () => {
    const { manager } = createManager();
    manager.open("settings");

    manager.fail("settings", "x");

    expect(ids(manager)).toEqual(["home", "settings"]);
  });

  it("focuses the view of the selected tab", () => {
    const { manager, views } = createManager();

    manager.open("settings");

    expect(views[1].focusCount).toBe(1);
  });

  it("cycles through the tabs and wraps around", () => {
    const { manager } = createManager();
    manager.open("settings");
    manager.open("connection", { connectionId: "a" });

    manager.selectNext();
    expect(manager.active().id).toBe("home");

    manager.selectPrevious();
    expect(manager.active().id).toBe("connection-1");
  });

  it("closes the active tab but not Home", () => {
    const { manager } = createManager();
    manager.open("settings");

    expect(manager.closeActive()).toBe(true);
    expect(manager.active().id).toBe("home");
    expect(manager.closeActive()).toBe(false);
  });

  it("focuses the new active view after a close", () => {
    const { manager, views } = createManager();
    manager.open("settings");
    const before = views[0].focusCount;

    manager.closeActive();

    expect(views[0].focusCount).toBe(before + 1);
  });

  it("reloads the active view only", () => {
    const { manager, views } = createManager();
    manager.open("settings");

    manager.reloadActive(true);

    expect(views[1].reloads).toEqual([true]);
    expect(views[0].reloads).toEqual([]);
  });
});
