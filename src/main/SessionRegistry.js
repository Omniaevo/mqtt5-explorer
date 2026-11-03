/**
 * Keeps one session per webContents. A session lives until its webContents
 * is destroyed or loads a new document (a reload drops the renderer state).
 * Same-page navigations and loading events of subframes keep the session.
 */
class SessionRegistry {
  #createSession;
  #sessions = new Map();

  /** @param {(webContents: Electron.WebContents) => object} createSession */
  constructor(createSession) {
    this.#createSession = createSession;
  }

  get size() {
    return this.#sessions.size;
  }

  /** Returns the session of the webContents. It is created on first use. */
  get(webContents) {
    const known = this.#sessions.get(webContents.id);

    if (known) return known;

    const session = this.#createSession(webContents);

    this.#sessions.set(webContents.id, session);
    this.#disposeWhenGone(webContents, session);

    return session;
  }

  /** Disposes every session, e.g. on quit. */
  async shutdown() {
    const sessions = [...this.#sessions.values()];

    this.#sessions.clear();
    await Promise.all(sessions.map((session) => session.dispose()));
  }

  #disposeWhenGone(webContents, session) {
    const releaseOnNewDocument = (details) => {
      if (details.isMainFrame && !details.isSameDocument) release();
    };
    const release = () => {
      webContents.off("destroyed", release);
      webContents.off("did-start-navigation", releaseOnNewDocument);

      if (this.#sessions.get(webContents.id) === session) {
        this.#sessions.delete(webContents.id);
      }

      session.dispose();
    };

    webContents.on("destroyed", release);
    webContents.on("did-start-navigation", releaseOnNewDocument);
  }
}

export default SessionRegistry;
