import { connectionUrl } from "../shared/connectionUrl";
import { Channel, FixedTabId, TabKind, TabState } from "../shared/ipcChannels";

const HOME_ID = FixedTabId.HOME;
const SETTINGS_ID = FixedTabId.SETTINGS;

const ROUTES = Object.freeze({
  [TabKind.HOME]: () => "/home",
  [TabKind.SETTINGS]: () => "/settings",
  [TabKind.CONNECTION]: (tab) => `/viewer/${tab.id}`,
});

const indexById = (connections) =>
  new Map(connections.map((connection) => [connection.id, connection]));

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
  #statusBarHeight = 0;
  #nextConnectionTabId = 1;
  #onPinnedChange;
  #savedConnections = new Map();

  /**
   * @param {object} deps
   * @param {(route: string) => {webContentsId: number, setBounds: Function, setVisible: Function, send: Function, focus: Function, reload: Function, destroy: Function}} deps.createView
   * @param {() => {width: number, height: number}} deps.getContentSize
   * @param {(snapshot: {tabs: object[], activeId: string}) => void} deps.onChange
   * @param {(connectionIds: string[]) => void} [deps.onPinnedChange] Called with the ordered ids of the pinned tabs.
   */
  constructor({
    createView,
    getContentSize,
    onChange,
    onPinnedChange = () => {},
  }) {
    this.#createView = createView;
    this.#getContentSize = getContentSize;
    this.#onChange = onChange;
    this.#onPinnedChange = onPinnedChange;

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
    this.#showActive();
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
    // The reload drops the renderer state, and the logger with it
    this.setLogging(this.#activeId, false);
    this.#views.get(this.#activeId).reload(ignoreCache);
  }

  /**
   * Closes a tab. The right neighbour becomes active, else the left one.
   * @returns {boolean} False when the tab is unknown or is Home.
   */
  close(id) {
    const index = this.#tabs.findIndex((tab) => tab.id === id);

    if (index < 0 || id === HOME_ID) return false;

    const [tab] = this.#tabs.splice(index, 1);

    this.#views.get(id)?.destroy();
    this.#views.delete(id);

    // Closing a pinned tab unpins it
    if (tab.pinned) this.#notifyPinned();

    if (this.#activeId === id) {
      this.#activeId = (this.#tabs[index] ?? this.#tabs[index - 1]).id;
    }

    this.#showActive();
    this.#emit();
    return true;
  }

  /**
   * Pins a connection tab. Only a saved connection can be pinned.
   * @returns {boolean} True when the tab is pinned after the call.
   */
  pin(id) {
    const tab = this.#find(id);

    if (!this.#isPinnable(tab)) return false;
    if (!tab.pinned) this.#setPinned(tab, true);

    return true;
  }

  /** Unpins a tab. The tab stays open, right after the pinned tabs. */
  unpin(id) {
    const tab = this.#find(id);

    if (tab?.pinned) this.#setPinned(tab, false);
  }

  /** True when the tab is a saved connection tab that is not pinned yet. */
  canPin(id) {
    const tab = this.#find(id);

    return this.#isPinnable(tab) && !tab.pinned;
  }

  /**
   * Disconnects a connection tab without closing it: the view is destroyed,
   * so its session ends, and the tab sleeps until the next select. When the
   * tab is active, Home becomes active.
   * @returns {boolean} False when the tab is not an awake connection tab.
   */
  unload(id) {
    const tab = this.#find(id);

    if (tab?.kind !== TabKind.CONNECTION || tab.state === TabState.SLEEPING) {
      return false;
    }

    this.#views.get(id)?.destroy();
    this.#views.delete(id);
    tab.state = TabState.SLEEPING;
    tab.logging = false;

    if (this.#activeId === id) this.#activeId = HOME_ID;

    this.#showActive();
    this.#emit();
    return true;
  }

  /**
   * Creates the sleeping tabs of the pinned connections, in order. Pinned ids
   * with no saved connection are dropped. Home stays active.
   * @param {string[]} pinnedIds
   * @param {object[]} savedConnections Valid saved connections.
   */
  restorePinned(pinnedIds, savedConnections) {
    this.#savedConnections = indexById(savedConnections);

    const restorableIds = [...new Set(pinnedIds)].filter((id) =>
      this.#savedConnections.has(id)
    );

    restorableIds.forEach((id) =>
      this.#add(
        this.#connectionFields(this.#savedConnections.get(id), TabState.SLEEPING, true),
        this.#firstUnpinnedIndex()
      )
    );

    if (restorableIds.length !== pinnedIds.length) this.#notifyPinned();
    this.#emit();
  }

  /**
   * Follows the saved connections: tabs take the new name and a pinned tab
   * of a deleted connection closes (and so unpins).
   * @param {object[]} savedConnections Valid saved connections.
   */
  syncSavedConnections(savedConnections) {
    this.#savedConnections = indexById(savedConnections);

    const connectionTabs = this.#tabs.filter(
      (tab) => tab.kind === TabKind.CONNECTION && tab.connectionId !== undefined
    );
    const renamed = connectionTabs
      .map((tab) => this.#refreshFromSaved(tab))
      .some(Boolean);

    connectionTabs
      .filter((tab) => tab.pinned && !this.#savedConnections.has(tab.connectionId))
      .forEach((tab) => this.close(tab.id));

    if (renamed) this.#emit();
  }

  /** Reduced state of the connection tabs, for the Home view. */
  connectionStates() {
    return this.#tabs
      .filter((tab) => tab.kind === TabKind.CONNECTION && tab.connectionId)
      .map(({ connectionId, state, pinned }) => ({ connectionId, state, pinned }));
  }

  /** Pins the open tab of a saved connection. */
  pinConnection(connectionId) {
    const tab = this.#tabs.find((t) => t.connectionId === connectionId);

    if (tab) this.pin(tab.id);
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

  /** Marks whether the view of a connection tab is logging to a file. */
  setLogging(id, enabled) {
    const tab = this.#find(id);

    if (tab?.kind !== TabKind.CONNECTION || tab.logging === enabled) return;

    tab.logging = enabled;
    this.#emit();
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

  /** Called when the shell reports its status bar height in pixels. */
  setStatusBarHeight(height) {
    if (height === this.#statusBarHeight) return;

    this.#statusBarHeight = height;
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
      ...this.#connectionFields(connection, TabState.PENDING),
      connectionId,
    });
  }

  #connectionFields(connection, state, pinned = false) {
    return {
      id: `connection-${this.#nextConnectionTabId++}`,
      kind: TabKind.CONNECTION,
      title: connection?.name ?? "Connection",
      state,
      pinned,
      logging: false,
      url: connection && connectionUrl(connection),
      connectionId: connection?.id,
      connection,
    };
  }

  /** A sleeping tab gets its view later, on its first select. */
  #add(fields, position = this.#tabs.length) {
    const tab = { pinned: false, state: TabState.CONNECTED, ...fields };

    this.#tabs.splice(position, 0, tab);
    if (tab.state !== TabState.SLEEPING) this.#createViewOf(tab);
    this.#layout();

    return tab;
  }

  #createViewOf(tab) {
    this.#views.set(tab.id, this.#createView(ROUTES[tab.kind](tab)));
  }

  /** Gives a sleeping tab its view: the viewer loads and connects. */
  #wake(tab) {
    if (this.#views.has(tab.id)) return;

    tab.state = TabState.PENDING;
    this.#createViewOf(tab);
    this.#layout();
  }

  #showActive() {
    this.#wake(this.#find(this.#activeId));
    this.#syncVisibility();
    this.#views.get(this.#activeId).focus();
  }

  #isPinnable(tab) {
    return (
      tab?.kind === TabKind.CONNECTION &&
      this.#savedConnections.has(tab.connectionId)
    );
  }

  /** Pinned tabs follow Home and Settings; this is where the next one goes. */
  #firstUnpinnedIndex() {
    return (
      this.#tabs.findLastIndex(
        (tab) => tab.kind !== TabKind.CONNECTION || tab.pinned
      ) + 1
    );
  }

  #setPinned(tab, pinned) {
    this.#tabs.splice(this.#tabs.indexOf(tab), 1);
    tab.pinned = pinned;
    this.#tabs.splice(this.#firstUnpinnedIndex(), 0, tab);

    this.#notifyPinned();
    this.#emit();
  }

  /**
   * Takes the saved name. A sleeping tab takes the whole connection, so it
   * connects with the latest properties.
   * @returns {boolean} True when the title changed.
   */
  #refreshFromSaved(tab) {
    const saved = this.#savedConnections.get(tab.connectionId);

    if (!saved) return false;

    const renamed = tab.title !== saved.name;

    tab.title = saved.name;

    if (tab.state === TabState.SLEEPING) {
      tab.connection = saved;
      tab.url = connectionUrl(saved);
    }

    return renamed;
  }

  #notifyPinned() {
    this.#onPinnedChange(
      this.#tabs.filter((tab) => tab.pinned).map((tab) => tab.connectionId)
    );
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
      height: Math.max(height - this.#stripHeight - this.#statusBarHeight, 0),
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
