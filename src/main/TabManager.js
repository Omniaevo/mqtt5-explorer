import { Channel, FixedTabId, TabKind, TabState } from "../shared/ipcChannels";

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
  #getCornerRadius;
  #onChange;
  #tabs = [];
  #views = new Map();
  #activeId = HOME_ID;
  #stripHeight = 0;
  #nextConnectionTabId = 1;

  /**
   * @param {object} deps
   * @param {(route: string) => {webContentsId: number, setBounds: Function, setBorderRadius: Function, setVisible: Function, send: Function, focus: Function, reload: Function, destroy: Function}} deps.createView
   * @param {() => {width: number, height: number}} deps.getContentSize
   * @param {() => number} deps.getCornerRadius Radius of the view corners in pixels.
   * @param {(snapshot: {tabs: object[], activeId: string}) => void} deps.onChange
   */
  constructor({ createView, getContentSize, getCornerRadius, onChange }) {
    this.#createView = createView;
    this.#getContentSize = getContentSize;
    this.#getCornerRadius = getCornerRadius;
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

  /** Shows the view of the tab, hides all the others and focuses the view. */
  select(id) {
    if (!this.#find(id)) return;

    this.#activeId = id;
    this.#syncVisibility();
    this.#views.get(id).focus();
    this.#emit();
  }

  /** Gives the keyboard focus back to the view of the active tab. */
  focusActive() {
    this.#views.get(this.#activeId).focus();
  }

  /** Selects the next tab, wrapping around. */
  selectNext() {
    this.#selectRelative(1);
  }

  /** Selects the previous tab, wrapping around. */
  selectPrevious() {
    this.#selectRelative(-1);
  }

  /**
   * Closes the active tab.
   * @returns {boolean} False when the active tab is Home.
   */
  closeActive() {
    return this.close(this.#activeId);
  }

  /**
   * Reloads the view of the active tab. The renderer state is lost.
   * @param {boolean} [ignoreCache]
   */
  reloadActive(ignoreCache = false) {
    this.#views.get(this.#activeId).reload(ignoreCache);
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
    this.#views.get(this.#activeId).focus();
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
    this.sendTo(this.#activeId, channel, ...args);
  }

  /** Sends an IPC message to the view of one tab. */
  sendTo(id, channel, ...args) {
    this.#views.get(id)?.send(channel, ...args);
  }

  /**
   * Finds the tab that owns a webContents.
   * @returns {string | undefined} Id of the tab.
   */
  tabIdOf(webContentsId) {
    return [...this.#views].find(
      ([, view]) => view.webContentsId === webContentsId
    )?.[0];
  }

  /** Sets the connection state of a connection tab. */
  setState(id, state) {
    const tab = this.#find(id);

    if (tab?.kind !== TabKind.CONNECTION || tab.state === state) return;

    tab.state = state;
    this.#emit();
  }

  /**
   * A connection failed: Home is selected and shows the error, then the tab
   * closes. The toast lives in Home because the tab is about to go away.
   */
  fail(id, message) {
    if (this.#find(id)?.kind !== TabKind.CONNECTION) return;

    this.select(HOME_ID);
    this.sendTo(HOME_ID, Channel.NOTIFY_SHOW, message, "error");
    this.close(id);
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

  #selectRelative(step) {
    const index = this.#tabs.findIndex((tab) => tab.id === this.#activeId);
    const count = this.#tabs.length;

    this.select(this.#tabs[(index + step + count) % count].id);
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
      state: TabState.PENDING,
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

    const radius = this.#getCornerRadius();

    this.#views.forEach((view) => {
      view.setBounds(bounds);
      view.setBorderRadius(radius);
    });
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
