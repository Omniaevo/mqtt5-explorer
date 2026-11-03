import { TabKind, TabState } from "../shared/ipcChannels";

/**
 * Menu template of the tab context menu. Home and Settings have no menu.
 * @param {object} deps
 * @param {{id: string, kind: string, pinned: boolean, state: string} | undefined} deps.tab
 * @param {boolean} deps.canPin
 * @param {{pin: () => void, unpin: () => void, unload: () => void}} deps.actions
 * @returns {Electron.MenuItemConstructorOptions[]}
 */
export function tabMenuTemplate({ tab, canPin, actions }) {
  if (tab?.kind !== TabKind.CONNECTION) return [];

  return [
    tab.pinned
      ? { label: "Unpin tab", click: actions.unpin }
      : { label: "Pin tab", enabled: canPin, click: actions.pin },
    {
      label: "Unload tab",
      enabled: tab.state !== TabState.SLEEPING,
      click: actions.unload,
    },
  ];
}
