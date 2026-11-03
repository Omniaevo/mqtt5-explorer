import { describe, expect, it, vi } from "vitest";
import TabManager from "./TabManager";

const CONTENT_SIZE = { width: 1000, height: 700 };

function createFakeView(route) {
  return {
    route,
    visible: undefined,
    bounds: undefined,
    destroyed: false,
    sent: [],
    send(...message) {
      this.sent.push(message);
    },
    setBounds(bounds) {
      this.bounds = bounds;
    },
    setVisible(visible) {
      this.visible = visible;
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
  const manager = new TabManager({
    createView: (route) => {
      const view = createFakeView(route);

      views.push(view);
      return view;
    },
    getContentSize: () => contentSize,
    onChange,
  });

  return { manager, views, onChange, contentSize };
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
});
