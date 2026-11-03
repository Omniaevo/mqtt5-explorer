import { beforeEach, describe, expect, it, vi } from "vitest";

const listeners = new Map();

vi.mock("electron", () => ({
  ipcMain: {
    on: (channel, listener) => listeners.set(channel, listener),
    handle: (channel, listener) => listeners.set(channel, listener),
    removeAllListeners: vi.fn(),
    removeHandler: vi.fn(),
  },
}));

const { parseMenuAnchor, registerWindowIpc, windowState } = await import(
  "./windowIpc"
);
const { Channel } = await import("../shared/ipcChannels");

const shellContents = {};
const createWin = (maximized = false) => ({
  isMaximized: () => maximized,
  isFullScreen: () => false,
  maximize: vi.fn(),
  unmaximize: vi.fn(),
  minimize: vi.fn(),
  close: vi.fn(),
});

describe("parseMenuAnchor", () => {
  it("rounds the position", () => {
    expect(parseMenuAnchor({ x: 4.4, y: 36.6 })).toEqual({ x: 4, y: 37 });
  });

  it("rejects a position that is not a number", () => {
    expect(parseMenuAnchor({ x: "4", y: 36 })).toBeUndefined();
  });

  it("rejects null", () => {
    expect(parseMenuAnchor(null)).toBeUndefined();
  });
});

describe("windowState", () => {
  it("reports a full screen window as maximized", () => {
    const win = { isMaximized: () => false, isFullScreen: () => true };

    expect(windowState(win)).toEqual({ maximized: true });
  });
});

describe("registerWindowIpc", () => {
  let win;

  beforeEach(() => {
    listeners.clear();
  });

  const register = (maximized) => {
    win = createWin(maximized);
    registerWindowIpc({
      getWindow: () => win,
      getShellContents: () => shellContents,
      onOpenMenu: vi.fn(),
    });
  };

  it("maximizes a window that is not maximized", () => {
    register(false);

    listeners.get(Channel.WINDOW_TOGGLE_MAXIMIZE)({ sender: shellContents });

    expect(win.maximize).toHaveBeenCalled();
  });

  it("restores a maximized window", () => {
    register(true);

    listeners.get(Channel.WINDOW_TOGGLE_MAXIMIZE)({ sender: shellContents });

    expect(win.unmaximize).toHaveBeenCalled();
  });

  it("ignores a sender that is not the shell", () => {
    register(false);

    listeners.get(Channel.WINDOW_CLOSE)({ sender: {} });

    expect(win.close).not.toHaveBeenCalled();
  });
});
