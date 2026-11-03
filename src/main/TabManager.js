import { FixedTabId, TabKind, TabState } from "../shared/ipcChannels";

const HOME_ID = FixedTabId.HOME;
const SETTINGS_ID = FixedTabId.SETTINGS;

const ROUTES = Object.freeze({
  [TabKind.HOME]: () => "/home",
  [TabKind.SETTINGS]: () => "/settings",
  [TabKind.CONNECTION]: (tab) => `/viewer/${tab.id}`,
});

/**
 * Owns the tab list and the one view of each tab. Only the active view is
 * visible. The view factory and the window size are injected, so the logic
 * runs without Electron.
 */
class TabManager {
  #createView;
  #getContentSize;
  #onChange;
  #tabs = [];
  #views = new Map();
  #activeId = HOME_ID;
  #stripHeight = 0;
  #nextConnectionTabId = 1;

  /**
   * @param {object} deps
   * @param {(route: string) => {setBounds: Function, setVisible: Function, send: Function, destroy: Function}} deps.createView
   * @param {() => {width: number, height: number}} deps.getContentSize
   * @param {(snapshot: {tabs: object[], activeId: string}) => void} deps.onChange
   */
  constructor({ createView, getContentSize, onChange }) {
    this.#createView = createView;
    this.#getContentSize = getContentSize;
    this.#onChange = onChange;

    this.#add({ id: HOME_ID, kind: TabKind.HOME, title: "Home" });
    this.#layout();
  }

  /**
   * Opens a tab, or selects the existing one: Settings is a single instance
   * and a saved connection has at most one tab.
   * @param {"settings" | "connection"} kind
   * @param {{connectionId?: string, connection?: object}} [payload]
   * @returns {string} Id of the tab.
   */
  open(kind, payload = {}) {
    const existing = this.#findExisting(kind, payload);

    if (existing) {
      this.select(existing.id);
      return existing.id;
    }

    const tab =
      kind === TabKind.SETTINGS
        ? this.#openSettings()
        : this.#openConnection(payload);

    this.select(tab.id);
    return tab.id;
  }

  /** Shows the view of the tab and hides all the others. */
  select(id) {
    if (!this.#find(id)) return;

    this.#activeId = id;
    this.#syncVisibility();
    this.#emit();
  }

  /**
   * Closes a tab. The right neighbour becomes active, else the left one.
   * @returns {boolean} False when the tab is unknown or is Home.
   */
  close(id) {
    const index = this.#tabs.findIndex((tab) => tab.id === id);

    if (index < 0 || id === HOME_ID) return false;

    this.#tabs.splice(index, 1);
    this.#views.get(id).destroy();
    this.#views.delete(id);

    if (this.#activeId === id) {
      this.#activeId = (this.#tabs[index] ?? this.#tabs[index - 1]).id;
    }

    this.#syncVisibility();
    this.#emit();
    return true;
  }

  /** Tabs in display order, without the connection properties. */
  list() {
    return this.#tabs.map((tab) => ({ ...tab, connection: undefined }));
  }

  active() {
    return this.list().find((tab) => tab.id === this.#activeId);
  }

  snapshot() {
    return { tabs: this.list(), activeId: this.#activeId };
  }

  /** Sends an IPC message to the view of the active tab. */
  sendToActive(channel, ...args) {
    this.#views.get(this.#activeId)?.send(channel, ...args);
  }

  /** Connection properties of a tab. Only for the view of that tab. */
  getConnection(id) {
    return this.#find(id)?.connection;
  }

  /** Called when the shell reports its strip height in pixels. */
  setStripHeight(height) {
    if (height === this.#stripHeight) return;

    this.#stripHeight = height;
    this.#layout();
  }

  /** Fits every view to the content area. Call it on window resize. */
  resize() {
    this.#layout();
  }

  #openSettings() {
    // Settings sits right after Home
    return this.#add(
      { id: SETTINGS_ID, kind: TabKind.SETTINGS, title: "Settings" },
      1
    );
  }

  #openConnection({ connectionId, connection }) {
    return this.#add({
      id: `connection-${this.#nextConnectionTabId++}`,
      kind: TabKind.CONNECTION,
      title: connection?.name ?? "Connection",
      connectionId,
      connection,
    });
  }

  #add(fields, position = this.#tabs.length) {
    const tab = { pinned: false, state: TabState.CONNECTED, ...fields };
    const view = this.#createView(ROUTES[tab.kind](tab));

    this.#tabs.splice(position, 0, tab);
    this.#views.set(tab.id, view);
    this.#layout();

    return tab;
  }

  #findExisting(kind, { connectionId }) {
    if (kind === TabKind.SETTINGS) return this.#find(SETTINGS_ID);

    return connectionId === undefined
      ? undefined
      : this.#tabs.find(
          (tab) =>
            tab.kind === TabKind.CONNECTION && tab.connectionId === connectionId
        );
  }

  #find(id) {
    return this.#tabs.find((tab) => tab.id === id);
  }

  #layout() {
    const { width, height } = this.#getContentSize();
    const bounds = {
      x: 0,
      y: this.#stripHeight,
      width,
      height: Math.max(height - this.#stripHeight, 0),
    };

    this.#views.forEach((view) => view.setBounds(bounds));
    this.#syncVisibility();
  }

  #syncVisibility() {
    this.#views.forEach((view, id) => view.setVisible(id === this.#activeId));
  }

  #emit() {
    this.#onChange(this.snapshot());
  }
}

export default TabManager;
