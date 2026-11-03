import { ipcMain } from "electron";
import { Channel } from "../shared/ipcChannels";

const LISTENER_CHANNELS = [
  Channel.WINDOW_MINIMIZE,
  Channel.WINDOW_TOGGLE_MAXIMIZE,
  Channel.WINDOW_CLOSE,
  Channel.SHELL_OPEN_MENU,
];

/** Window state the shell needs to draw the controls. */
export const windowState = (win) => ({
  maximized: win.isMaximized() || win.isFullScreen(),
});

/** Returns a safe menu position, or undefined when invalid. */
export function parseMenuAnchor(anchor) {
  if (typeof anchor !== "object" || anchor === null) return undefined;

  const { x, y } = anchor;

  if (![x, y].every(Number.isFinite)) return undefined;

  return { x: Math.round(x), y: Math.round(y) };
}

/**
 * Registers the window channels. Only the shell may use them: the window has
 * no native frame, so the shell draws minimize, maximize and close.
 *
 * @param {object} deps
 * @param {() => Electron.BrowserWindow} deps.getWindow
 * @param {() => Electron.WebContents} deps.getShellContents
 * @param {(anchor: {x: number, y: number}) => void} deps.onOpenMenu
 * @returns {() => void} Removes the handlers.
 */
export function registerWindowIpc({ getWindow, getShellContents, onOpenMenu }) {
  const fromShell = (event) => event.sender === getShellContents();
  const onShell = (channel, handler) =>
    ipcMain.on(channel, (event, ...args) => {
      if (fromShell(event)) handler(...args);
    });

  onShell(Channel.WINDOW_MINIMIZE, () => getWindow().minimize());
  onShell(Channel.WINDOW_TOGGLE_MAXIMIZE, () => {
    const win = getWindow();

    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });
  // The window "close" handler decides between closing and hiding to tray
  onShell(Channel.WINDOW_CLOSE, () => getWindow().close());
  onShell(Channel.SHELL_OPEN_MENU, (payload) => {
    const anchor = parseMenuAnchor(payload);

    if (anchor) onOpenMenu(anchor);
  });
  ipcMain.handle(Channel.WINDOW_GET_STATE, (event) =>
    fromShell(event) ? windowState(getWindow()) : undefined
  );

  return () => {
    LISTENER_CHANNELS.forEach((channel) => ipcMain.removeAllListeners(channel));
    ipcMain.removeHandler(Channel.WINDOW_GET_STATE);
  };
}
