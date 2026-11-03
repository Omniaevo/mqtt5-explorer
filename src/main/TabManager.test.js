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
  const onPinnedChange = vi.fn();
  const contentSize = { ...CONTENT_SIZE };
  const manager = new TabManager({
    createView: (route) => {
      const view = createFakeView(route);

      views.push(view);
      return view;
    },
    getContentSize: () => contentSize,
    onChange,
    onPinnedChange,
  });

  return { manager, views, onChange, onPinnedChange, contentSize };
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

  it("leaves room for the status bar under the views", () => {
    const { manager, views } = createManager();

    manager.setStripHeight(40);
    manager.setStatusBarHeight(30);

    expect(views[0].bounds).toEqual({ x: 0, y: 40, width: 1000, height: 630 });
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

  it("tells connection views from other views", () => {
    const { manager, views } = createManager();
    manager.open("connection", { connectionId: "a" });

    expect(manager.isConnectionView(views[1].webContentsId)).toBe(true);
    expect(manager.isConnectionView(views[0].webContentsId)).toBe(false);
    expect(manager.isConnectionView(-1)).toBe(false);
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

  it("keeps a tab of an unsaved connection unpinned", () => {
    const { manager } = createManager();
    const id = manager.open("connection", { connection: { name: "quick" } });
    manager.pin(id);

    expect(manager.isPinned(id)).toBe(false);
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

  it("closes the active tab but not Home", async () => {
    const { manager } = createManager();
    manager.open("settings");

    expect(await manager.closeActive()).toBe(true);
    expect(manager.active().id).toBe("home");
    expect(await manager.closeActive()).toBe(false);
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

  describe("pinned tabs", () => {
    const saved = (id, name = id) => ({
      id,
      name,
      protocol: "mqtt",
      host: "broker",
      port: 1883,
    });

    function createPinnable(...savedIds) {
      const context = createManager();

      context.manager.restorePinned([], savedIds.map((id) => saved(id)));
      context.onPinnedChange.mockClear();

      return context;
    }

    const openSaved = (manager, id) =>
      manager.open("connection", { connectionId: id, connection: saved(id) });

    it("restores pinned tabs as sleeping tabs without a view", () => {
      const { manager, views } = createManager();

      manager.restorePinned(["a", "b"], [saved("a"), saved("b")]);

      expect(manager.list().map((tab) => tab.state)).toEqual([
        "connected",
        "sleeping",
        "sleeping",
      ]);
      expect(views).toHaveLength(1);
    });

    it("keeps Home active after a restore", () => {
      const { manager } = createManager();

      manager.restorePinned(["a"], [saved("a")]);

      expect(manager.active().id).toBe("home");
    });

    it("drops a pinned id whose connection was deleted and saves the list", () => {
      const { manager, onPinnedChange } = createManager();

      manager.restorePinned(["gone", "a"], [saved("a")]);

      expect(manager.list().map((tab) => tab.connectionId)).toEqual([undefined, "a"]);
      expect(onPinnedChange).toHaveBeenCalledWith(["a"]);
    });

    it("does not save the list when every pinned id is restored", () => {
      const { manager, onPinnedChange } = createManager();

      manager.restorePinned(["a"], [saved("a")]);

      expect(onPinnedChange).not.toHaveBeenCalled();
    });

    it("creates the view and wakes the tab disconnected on its first select", () => {
      const { manager, views } = createManager();
      manager.restorePinned(["a"], [saved("a")]);

      manager.select(manager.list()[1].id);

      expect(views.at(-1).route).toBe(`/viewer/${manager.active().id}`);
      expect(manager.active().state).toBe("disconnected");
    });

    it("keeps the other sleeping tabs asleep when one wakes", () => {
      const { manager, views } = createManager();
      manager.restorePinned(["a", "b"], [saved("a"), saved("b")]);

      manager.select(manager.list()[2].id);

      expect(views).toHaveLength(2);
      expect(manager.list()[1].state).toBe("sleeping");
    });

    it("wakes a sleeping tab connecting when its connection is opened from Home", () => {
      const { manager } = createManager();
      manager.restorePinned(["a"], [saved("a")]);

      openSaved(manager, "a");

      expect(manager.active()).toMatchObject({ connectionId: "a", state: "pending" });
      expect(manager.list()).toHaveLength(2);
    });

    it("wakes the sleeping neighbour that becomes active after a close", () => {
      const { manager } = createManager();
      manager.restorePinned(["a"], [saved("a")]);
      manager.open("settings");

      manager.close("settings");

      expect(manager.active()).toMatchObject({ connectionId: "a", state: "disconnected" });
    });

    it("pins right after Home and Settings in pin order", () => {
      const { manager } = createPinnable("a", "b", "c");
      const a = openSaved(manager, "a");
      const b = openSaved(manager, "b");
      const c = openSaved(manager, "c");
      manager.open("settings");

      manager.pin(c);
      manager.pin(a);

      expect(ids(manager)).toEqual(["home", "settings", c, a, b]);
    });

    it("saves the ordered connection ids on pin", () => {
      const { manager, onPinnedChange } = createPinnable("a", "b");
      const a = openSaved(manager, "a");
      const b = openSaved(manager, "b");

      manager.pin(b);
      manager.pin(a);

      expect(onPinnedChange).toHaveBeenLastCalledWith(["b", "a"]);
    });

    it("does not pin a tab whose connection is not saved", () => {
      const { manager, onPinnedChange } = createPinnable();
      const id = openSaved(manager, "unsaved");

      expect(manager.pin(id)).toBe(false);
      expect(onPinnedChange).not.toHaveBeenCalled();
    });

    it("does not pin Home or Settings", () => {
      const { manager } = createPinnable();
      manager.open("settings");

      expect(manager.pin("home")).toBe(false);
      expect(manager.pin("settings")).toBe(false);
    });

    it("moves an unpinned tab after the pinned ones and saves the list", () => {
      const { manager, onPinnedChange } = createPinnable("a", "b");
      const a = openSaved(manager, "a");
      const b = openSaved(manager, "b");
      manager.pin(a);
      manager.pin(b);

      manager.unpin(a);

      expect(ids(manager)).toEqual(["home", b, a]);
      expect(onPinnedChange).toHaveBeenLastCalledWith(["b"]);
    });

    it("unpins a tab when it closes", () => {
      const { manager, onPinnedChange } = createPinnable("a");
      const a = openSaved(manager, "a");
      manager.pin(a);

      manager.close(a);

      expect(onPinnedChange).toHaveBeenLastCalledWith([]);
    });

    it("does not save the list when an unpinned tab closes", () => {
      const { manager, onPinnedChange } = createPinnable("a");
      const a = openSaved(manager, "a");

      manager.close(a);

      expect(onPinnedChange).not.toHaveBeenCalled();
    });

    it("tells that a saved unpinned tab can be pinned", () => {
      const { manager } = createPinnable("a");
      const a = openSaved(manager, "a");

      expect(manager.canPin(a)).toBe(true);
      manager.pin(a);
      expect(manager.canPin(a)).toBe(false);
    });

    it("renames a tab when the saved connection is renamed", () => {
      const { manager, onChange } = createPinnable("a");
      const a = openSaved(manager, "a");
      onChange.mockClear();

      manager.syncSavedConnections([saved("a", "Renamed")]);

      expect(manager.list().find((tab) => tab.id === a).title).toBe("Renamed");
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("gives a sleeping tab the latest connection properties", () => {
      const { manager } = createManager();
      manager.restorePinned(["a"], [saved("a")]);

      manager.syncSavedConnections([{ ...saved("a"), host: "other" }]);

      expect(manager.getConnection(manager.list()[1].id).host).toBe("other");
    });

    it("closes and unpins the tab of a deleted connection", () => {
      const { manager, onPinnedChange } = createManager();
      manager.restorePinned(["a", "b"], [saved("a"), saved("b")]);
      onPinnedChange.mockClear();

      manager.syncSavedConnections([saved("b")]);

      expect(manager.list().map((tab) => tab.connectionId)).toEqual([undefined, "b"]);
      expect(onPinnedChange).toHaveBeenLastCalledWith(["b"]);
    });

    it("keeps an unpinned tab open when its connection is deleted", () => {
      const { manager } = createPinnable("a");
      openSaved(manager, "a");

      manager.syncSavedConnections([]);

      expect(manager.list()).toHaveLength(2);
    });
  });

  describe("closing and reordering", () => {
    const saved = (id) => ({
      id,
      name: id,
      protocol: "mqtt",
      host: "broker",
      port: 1883,
    });
    const openSaved = (manager, id) =>
      manager.open("connection", { connectionId: id, connection: saved(id) });

    function createWithConfirm(answer) {
      const confirmLoggingClose = vi.fn(async () => answer);
      const manager = new TabManager({
        createView: createFakeView,
        getContentSize: () => CONTENT_SIZE,
        onChange: vi.fn(),
        onPinnedChange: onPinned,
        confirmLoggingClose,
      });

      manager.restorePinned([], ["a", "b", "c", "d"].map(saved));
      return { manager, confirmLoggingClose };
    }
    const onPinned = vi.fn();

    it("closes a logging tab after the user confirms", async () => {
      const { manager, confirmLoggingClose } = createWithConfirm(true);
      const id = openSaved(manager, "a");
      manager.setLogging(id, true);

      await manager.requestClose([id]);

      expect(confirmLoggingClose).toHaveBeenCalledWith(["a"]);
      expect(ids(manager)).not.toContain(id);
    });

    it("keeps a logging tab when the user cancels", async () => {
      const { manager } = createWithConfirm(false);
      const id = openSaved(manager, "a");
      manager.setLogging(id, true);

      expect(await manager.requestClose([id])).toBe(false);
      expect(ids(manager)).toContain(id);
    });

    it("does not ask when no tab logs", async () => {
      const { manager, confirmLoggingClose } = createWithConfirm(true);
      const id = openSaved(manager, "a");

      await manager.requestClose([id]);

      expect(confirmLoggingClose).not.toHaveBeenCalled();
    });

    it("asks once for all the logging tabs of a close others", async () => {
      const { manager, confirmLoggingClose } = createWithConfirm(true);
      const first = openSaved(manager, "a");
      const second = openSaved(manager, "b");
      const keep = openSaved(manager, "c");
      manager.setLogging(first, true);
      manager.setLogging(second, true);

      await manager.closeOthers(keep);

      expect(confirmLoggingClose).toHaveBeenCalledTimes(1);
    });

    it("closes others but keeps Home, itself and pinned tabs", async () => {
      const { manager } = createWithConfirm(true);
      const pinned = openSaved(manager, "a");
      manager.pin(pinned);
      openSaved(manager, "b");
      const keep = openSaved(manager, "c");

      await manager.closeOthers(keep);

      expect(ids(manager)).toEqual(["home", pinned, keep]);
    });

    it("moves a tab to the place of another tab of the same group", () => {
      const { manager } = createWithConfirm(true);
      const first = openSaved(manager, "a");
      const second = openSaved(manager, "b");
      const third = openSaved(manager, "c");

      manager.move(third, first);

      expect(ids(manager)).toEqual(["home", third, first, second]);
    });

    it("does not move a tab across the pinned group", () => {
      const { manager } = createWithConfirm(true);
      const pinned = openSaved(manager, "a");
      manager.pin(pinned);
      const normal = openSaved(manager, "b");

      manager.move(normal, pinned);

      expect(ids(manager)).toEqual(["home", pinned, normal]);
    });

    it("does not move Settings", () => {
      const { manager } = createWithConfirm(true);
      manager.open("settings");
      const id = openSaved(manager, "a");

      manager.move("settings", id);

      expect(ids(manager)[1]).toBe("settings");
    });

    it("reports the new pinned order after a pinned move", () => {
      onPinned.mockClear();
      const { manager } = createWithConfirm(true);
      const first = openSaved(manager, "a");
      const second = openSaved(manager, "b");
      manager.pin(first);
      manager.pin(second);
      onPinned.mockClear();

      manager.move(second, first);

      expect(onPinned).toHaveBeenLastCalledWith(["b", "a"]);
    });
  });

  describe("activity", () => {
    const activityOf = (manager, id) =>
      manager.list().find((tab) => tab.id === id).activity;

    it("counts the messages of a background connection tab", () => {
      const { manager, onChange } = createManager();
      const id = manager.open("connection", { connectionId: "a" });
      manager.select("home");
      onChange.mockClear();

      manager.addActivity(id, 3);
      manager.addActivity(id, 4);

      expect(activityOf(manager, id)).toBe(7);
      expect(onChange).toHaveBeenCalledTimes(2);
    });

    it("ignores an empty or negative count", () => {
      const { manager } = createManager();
      const id = manager.open("connection", { connectionId: "a" });
      manager.select("home");

      manager.addActivity(id, 0);
      manager.addActivity(id, -5);

      expect(activityOf(manager, id)).toBe(0);
    });

    it("does not count for the active tab", () => {
      const { manager } = createManager();
      const id = manager.open("connection", { connectionId: "a" });

      manager.addActivity(id, 5);

      expect(activityOf(manager, id)).toBe(0);
    });

    it("clears the counter when the tab is selected", () => {
      const { manager } = createManager();
      const id = manager.open("connection", { connectionId: "a" });
      manager.select("home");
      manager.addActivity(id, 5);

      manager.select(id);

      expect(activityOf(manager, id)).toBe(0);
    });
  });

  describe("logging", () => {
    it("marks a connection tab as logging and emits", () => {
      const { manager, onChange } = createManager();
      const id = manager.open("connection", { connectionId: "a" });
      onChange.mockClear();

      manager.setLogging(id, true);

      expect(manager.list().find((tab) => tab.id === id).logging).toBe(true);
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("does not emit when the logging flag is unchanged", () => {
      const { manager, onChange } = createManager();
      const id = manager.open("connection", { connectionId: "a" });
      onChange.mockClear();

      manager.setLogging(id, false);

      expect(onChange).not.toHaveBeenCalled();
    });

    it("ignores logging on a tab that is not a connection", () => {
      const { manager, onChange } = createManager();
      onChange.mockClear();

      manager.setLogging("home", true);

      expect(onChange).not.toHaveBeenCalled();
    });

    it("clears the logging flag when the active tab reloads", () => {
      const { manager } = createManager();
      const id = manager.open("connection", { connectionId: "a" });
      manager.setLogging(id, true);

      manager.reloadActive();

      expect(manager.list().find((tab) => tab.id === id).logging).toBe(false);
    });
  });

  describe("connection states for Home", () => {
    const saved = (id) => ({
      id,
      name: id,
      protocol: "mqtt",
      host: "broker",
      port: 1883,
    });

    it("lists only connection tabs with a reduced state", () => {
      const { manager } = createManager();

      manager.restorePinned(["a"], [saved("a")]);

      expect(manager.connectionStates()).toEqual([
        { connectionId: "a", state: "sleeping", pinned: true },
      ]);
    });

    it("pins the open tab of a saved connection", () => {
      const { manager } = createManager();

      manager.syncSavedConnections([saved("a")]);
      manager.open("connection", { connectionId: "a", connection: saved("a") });
      manager.pinConnection("a");

      expect(manager.connectionStates()[0].pinned).toBe(true);
    });
  });

  describe("topic search support", () => {
    const connection = { id: "c1", name: "Broker" };

    it("lists only connected connection tabs as search targets", () => {
      const { manager, views } = createManager();
      const connected = manager.open("connection", { connectionId: "c1", connection });

      manager.open("connection", { connectionId: "c2", connection: { ...connection, id: "c2" } });
      manager.setState(connected, "connected");

      expect(manager.connectedTargets()).toEqual([
        { tabId: connected, title: "Broker", webContentsId: views[1].webContentsId },
      ]);
    });

    it("selects a connected tab and sends the topic to its view", () => {
      const { manager, views } = createManager();
      const tabId = manager.open("connection", { connectionId: "c1", connection });

      manager.setState(tabId, "connected");
      manager.select("home");
      manager.selectTopic(tabId, "a/b");

      expect(manager.active().id).toBe(tabId);
      expect(views[1].sent.at(-1)).toEqual(["notify:selectTopic", "a/b"]);
    });

    it("ignores a topic for a tab that is not connected", () => {
      const { manager, views } = createManager();
      const tabId = manager.open("connection", { connectionId: "c1", connection });

      manager.select("home");
      manager.selectTopic(tabId, "a/b");

      expect(manager.active().id).toBe("home");
      expect(views[1].sent).toEqual([]);
    });

    it("reports a closed tab", () => {
      const onTabClosed = vi.fn();
      const manager = new TabManager({
        createView: createFakeView,
        getContentSize: () => CONTENT_SIZE,
        onChange: vi.fn(),
        onTabClosed,
      });
      const tabId = manager.open("connection", { connectionId: "c1", connection });

      manager.close(tabId);

      expect(onTabClosed).toHaveBeenCalledWith(tabId);
    });
  });
});
