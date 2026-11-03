import { EventEmitter } from "events";
import { describe, expect, it, vi } from "vitest";
import SessionRegistry from "./SessionRegistry";

function createWebContents(id) {
  return Object.assign(new EventEmitter(), { id });
}

const NEW_DOCUMENT = { isMainFrame: true, isSameDocument: false };

function createRegistry() {
  const createSession = vi.fn(() => ({
    dispose: vi.fn(() => Promise.resolve()),
  }));

  return { registry: new SessionRegistry(createSession), createSession };
}

describe("SessionRegistry", () => {
  it("creates a session on first use", () => {
    const { registry, createSession } = createRegistry();
    const webContents = createWebContents(1);

    const session = registry.get(webContents);

    expect(createSession).toHaveBeenCalledWith(webContents);
    expect(session).toBe(createSession.mock.results[0].value);
  });

  it("returns the same session for the same webContents id", () => {
    const { registry, createSession } = createRegistry();

    const first = registry.get(createWebContents(1));
    const second = registry.get(createWebContents(1));

    expect(second).toBe(first);
    expect(createSession).toHaveBeenCalledTimes(1);
  });

  it("keeps a separate session for each webContents", () => {
    const { registry } = createRegistry();

    const first = registry.get(createWebContents(1));
    const second = registry.get(createWebContents(2));

    expect(second).not.toBe(first);
  });

  it("disposes and forgets the session when the webContents is destroyed", () => {
    const { registry } = createRegistry();
    const webContents = createWebContents(1);
    const session = registry.get(webContents);

    webContents.emit("destroyed");

    expect(session.dispose).toHaveBeenCalledTimes(1);
    expect(registry.size).toBe(0);
  });

  it("disposes the session when the webContents loads a new document", () => {
    const { registry } = createRegistry();
    const webContents = createWebContents(1);
    const session = registry.get(webContents);

    webContents.emit("did-start-navigation", NEW_DOCUMENT);

    expect(session.dispose).toHaveBeenCalledTimes(1);
    expect(registry.size).toBe(0);
  });

  it("keeps the session on a same-page navigation", () => {
    const { registry } = createRegistry();
    const webContents = createWebContents(1);
    const session = registry.get(webContents);

    webContents.emit("did-start-navigation", {
      isMainFrame: true,
      isSameDocument: true,
    });

    expect(session.dispose).not.toHaveBeenCalled();
  });

  it("keeps the session when a subframe navigates", () => {
    const { registry } = createRegistry();
    const webContents = createWebContents(1);
    const session = registry.get(webContents);

    webContents.emit("did-start-navigation", {
      isMainFrame: false,
      isSameDocument: false,
    });

    expect(session.dispose).not.toHaveBeenCalled();
  });

  it("keeps the session when only the loading state changes", () => {
    const { registry } = createRegistry();
    const webContents = createWebContents(1);
    const session = registry.get(webContents);

    webContents.emit("did-start-loading");

    expect(session.dispose).not.toHaveBeenCalled();
  });

  it("creates a fresh session after a reload", () => {
    const { registry } = createRegistry();
    const webContents = createWebContents(1);
    const before = registry.get(webContents);

    webContents.emit("did-start-navigation", NEW_DOCUMENT);

    expect(registry.get(webContents)).not.toBe(before);
  });

  it("disposes a session only once", () => {
    const { registry } = createRegistry();
    const webContents = createWebContents(1);
    const session = registry.get(webContents);

    webContents.emit("did-start-navigation", NEW_DOCUMENT);
    webContents.emit("destroyed");

    expect(session.dispose).toHaveBeenCalledTimes(1);
  });

  it("disposes every session on shutdown", async () => {
    const { registry } = createRegistry();
    const first = registry.get(createWebContents(1));
    const second = registry.get(createWebContents(2));

    await registry.shutdown();

    expect(first.dispose).toHaveBeenCalledTimes(1);
    expect(second.dispose).toHaveBeenCalledTimes(1);
    expect(registry.size).toBe(0);
  });
});
