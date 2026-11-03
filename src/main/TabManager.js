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
  #onTabClosed;
  #confirmLoggingClose;
  #savedConnections = new Map();

  /**
   * @param {object} deps
   * @param {(route: string) => {webContentsId: number, setBounds: Function, setVisible: Function, send: Function, focus: Function, reload: Function, destroy: Function}} deps.createView
   * @param {() => {width: number, height: number}} deps.getContentSize
   * @param {(snapshot: {tabs: object[], activeId: string}) => void} deps.onChange
   * @param {(connectionIds: string[]) => void} [deps.onPinnedChange] Called with the ordered ids of the pinned tabs.
   * @param {(tabId: string) => void} [deps.onTabClosed] Called after a tab closed.
   * @param {(titles: string[]) => Promise<boolean>} [deps.confirmLoggingClose] Asks the user before tabs that log to a file close.
   */
  constructor({
    createView,
    getContentSize,
    onChange,
    onPinnedChange = () => {},
    onTabClosed = () => {},
    confirmLoggingClose = async () => true,
  }) {
    this.#createView = createView;
    this.#getContentSize = getContentSize;
    this.#onChange = onChange;
    this.#onPinnedChange = onPinnedChange;
    this.#onTabClosed = onTabClosed;
    this.#confirmLoggingClose = confirmLoggingClose;

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

    // Opening a connection on purpose: a sleeping tab connects right away
    if (existing) {
      this.#activate(existing.id, TabState.PENDING);
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
    this.#activate(id, TabState.DISCONNECTED);
  }

  /** `wakeState` is the state of a sleeping tab that gets its view now. */
  #activate(id, wakeState) {
    const tab = this.#find(id);

    if (!tab) return;

    tab.activity = 0;
    this.#activeId = id;
    this.#showActive(wakeState);
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
   * Closes the active tab, after the user confirms if it logs to a file.
   * @returns {Promise<boolean>} False when nothing closed.
   */
  closeActive() {
    return this.requestClose([this.#activeId]);
  }

  /**
   * Closes tabs on the user's request. One confirmation covers all the tabs
   * that log to a file. Home and unknown ids are skipped.
   * @param {string[]} ids
   * @returns {Promise<boolean>} False when nothing closed.
   */
  async requestClose(ids) {
    const targets = ids
      .filter((id) => id !== HOME_ID)
      .map((id) => this.#find(id))
      .filter(Boolean);

    if (targets.length === 0) return false;

    const loggingTitles = targets.filter((tab) => tab.logging).map((tab) => tab.title);

    if (loggingTitles.length > 0 && !(await this.#confirmLoggingClose(loggingTitles))) {
      return false;
    }

    targets.forEach((tab) => this.close(tab.id));
    return true;
  }

  /** Closes every tab except Home, the given one and the pinned ones. */
  closeOthers(id) {
    const others = this.#tabs
      .filter((tab) => tab.id !== id && tab.id !== HOME_ID && !tab.pinned)
      .map((tab) => tab.id);

    return this.requestClose(others);
  }

  /** True when a close-others call on this tab would close something. */
  hasClosableOthers(id) {
    return this.#tabs.some(
      (tab) => tab.id !== id && tab.id !== HOME_ID && !tab.pinned
    );
  }

  /** Titles of the tabs that log to a file now. */
  loggingTitles() {
    return this.#tabs.filter((tab) => tab.logging).map((tab) => tab.title);
  }

  /**
   * Moves a connection tab to the place of another one of the same group
   * (pinned or not). Home and Settings stay fixed. A new pinned order is
   * reported for saving.
   */
  move(id, targetId) {
    const tab = this.#find(id);
    const target = this.#find(targetId);

    if (!tab || !target || tab === target) return;
    if (tab.kind !== TabKind.CONNECTION || target.kind !== TabKind.CONNECTION) return;
    if (tab.pinned !== target.pinned) return;

    this.#tabs.splice(this.#tabs.indexOf(tab), 1);
    this.#tabs.splice(this.#tabs.indexOf(target), 0, tab);

    if (tab.pinned) this.#notifyPinned();
    this.#emit();
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
    this.#onTabClosed(id);
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

  /** True when the tab is pinned. */
  isPinned(id) {
    return this.#find(id)?.pinned === true;
  }

  /** True when the tab is a saved connection tab that is not pinned yet. */
  canPin(id) {
    const tab = this.#find(id);

    return this.#isPinnable(tab) && !tab.pinned;
  }

  /** Connection state of a tab. Only for the view of that tab. */
  stateOf(id) {
    return this.#find(id)?.state;
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

  /** Connection tabs that are connected now, with the view that owns each one. */
  connectedTargets() {
    return this.#tabs
      .filter(
        (tab) =>
          tab.kind === TabKind.CONNECTION &&
          tab.state === TabState.CONNECTED &&
          this.#views.has(tab.id)
      )
      .map((tab) => ({
        tabId: tab.id,
        title: tab.title,
        webContentsId: this.#views.get(tab.id).webContentsId,
      }));
  }

  /** Selects a connected tab and asks its view to select a topic. */
  selectTopic(id, topic) {
    if (!this.connectedTargets().some((target) => target.tabId === id)) return;

    this.select(id);
    this.sendTo(id, Channel.NOTIFY_SELECT_TOPIC, topic);
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

  /** Tells whether the webContents is the view of a connection tab. */
  isConnectionView(webContentsId) {
    return this.#find(this.tabIdOf(webContentsId))?.kind === TabKind.CONNECTION;
  }

  /** Marks whether the view of a connection tab is logging to a file. */
  setLogging(id, enabled) {
    const tab = this.#find(id);

    if (tab?.kind !== TabKind.CONNECTION || tab.logging === enabled) return;

    tab.logging = enabled;
    this.#emit();
  }

  /**
   * Counts the messages a background connection tab got since the last
   * visit. The active tab has no count.
   */
  addActivity(id, messageCount) {
    const tab = this.#find(id);

    if (tab?.kind !== TabKind.CONNECTION || id === this.#activeId) return;
    if (!(messageCount > 0)) return;

    tab.activity += messageCount;
    this.#emit();
  }

  /** Sets the connection state of a connection tab. */
  setState(id, state) {
    const tab = this.#find(id);

    if (tab?.kind !== TabKind.CONNECTION || tab.state === state) return;

    tab.state = state;
    this.#emit();
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
      activity: 0,
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

  /**
   * Gives a sleeping tab its view. The viewer starts in `state`: pending
   * connects at once, disconnected waits for the user.
   */
  #wake(tab, state) {
    if (this.#views.has(tab.id)) return;

    tab.state = state;
    this.#createViewOf(tab);
    this.#layout();
  }

  #showActive(wakeState = TabState.DISCONNECTED) {
    this.#wake(this.#find(this.#activeId), wakeState);
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
