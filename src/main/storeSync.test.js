import { describe, expect, it, vi } from "vitest";
import { applyStoreSet } from "./storeSync";
import { Channel } from "../shared/ipcChannels";

const KEY = "saved_app_settings";

function createWebContents({ destroyed = false } = {}) {
  return { send: vi.fn(), isDestroyed: () => destroyed };
}

function createContext(stored, others) {
  const sender = createWebContents();
  const values = new Map(stored ? [[KEY, stored]] : []);
  const store = {
    get: vi.fn((key) => values.get(key)),
    set: vi.fn((key, value) => values.set(key, value)),
  };

  return {
    sender,
    store,
    deps: { store, sender, getAllWebContents: () => [sender, ...others] },
  };
}

describe("applyStoreSet", () => {
  it("sends the change to every other webContents", () => {
    const other = createWebContents();
    const { deps } = createContext(undefined, [other]);

    applyStoreSet(deps, KEY, "{}");

    expect(other.send).toHaveBeenCalledWith(Channel.STORE_CHANGED, KEY);
  });

  it("skips the sender", () => {
    const { deps, sender } = createContext(undefined, [createWebContents()]);

    applyStoreSet(deps, KEY, "{}");

    expect(sender.send).not.toHaveBeenCalled();
  });

  it("skips destroyed webContents", () => {
    const destroyed = createWebContents({ destroyed: true });
    const { deps } = createContext(undefined, [destroyed]);

    applyStoreSet(deps, KEY, "{}");

    expect(destroyed.send).not.toHaveBeenCalled();
  });

  it("ignores an unchanged value", () => {
    const other = createWebContents();
    const { deps, store } = createContext("{}", [other]);

    applyStoreSet(deps, KEY, "{}");

    expect(store.set).not.toHaveBeenCalled();
    expect(other.send).not.toHaveBeenCalled();
  });

  it("ignores a key the renderer may not write", () => {
    const { deps, store } = createContext(undefined, []);

    applyStoreSet(deps, "pinned_tabs", "[]");

    expect(store.set).not.toHaveBeenCalled();
  });
});
