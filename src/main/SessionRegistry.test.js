import { EventEmitter } from "events";
import { describe, expect, it, vi } from "vitest";
import SessionRegistry from "./SessionRegistry";

function createWebContents(id) {
  return Object.assign(new EventEmitter(), { id });
}

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

  it("disposes the session when the webContents starts loading", () => {
    const { registry } = createRegistry();
    const webContents = createWebContents(1);
    const session = registry.get(webContents);

    webContents.emit("did-start-loading");

    expect(session.dispose).toHaveBeenCalledTimes(1);
    expect(registry.size).toBe(0);
  });

  it("creates a fresh session after a reload", () => {
    const { registry } = createRegistry();
    const webContents = createWebContents(1);
    const before = registry.get(webContents);

    webContents.emit("did-start-loading");

    expect(registry.get(webContents)).not.toBe(before);
  });

  it("disposes a session only once", () => {
    const { registry } = createRegistry();
    const webContents = createWebContents(1);
    const session = registry.get(webContents);

    webContents.emit("did-start-loading");
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
