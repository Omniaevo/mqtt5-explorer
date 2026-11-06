import { TabKind, TabState } from "../shared/ipcChannels";

const isLive = (state) =>
  state === TabState.CONNECTED || state === TabState.PENDING;
const isClosedState = (state) =>
  state === TabState.DISCONNECTED || state === TabState.ERROR;

const connectionItems = ({ tab, canPin, actions }) => [
  tab.pinned
    ? { label: "Unpin tab", click: actions.unpin }
    : { label: "Pin tab", enabled: canPin, click: actions.pin },
  { type: "separator" },
  {
    label: "Reconnect",
    enabled: isClosedState(tab.state),
    click: actions.reconnect,
  },
  {
    label: "Disconnect",
    enabled: isLive(tab.state),
    click: actions.disconnect,
  },
  {
    label: "Unload tab",
    enabled: tab.state !== TabState.SLEEPING,
    click: actions.unload,
  },
  { type: "separator" },
];

/**
 * Menu template of the tab context menu. Home has no menu; Settings can only
 * close.
 * @param {object} deps
 * @param {{id: string, kind: string, pinned: boolean, state: string} | undefined} deps.tab
 * @param {boolean} deps.canPin
 * @param {boolean} deps.canCloseOthers
 * @param {{pin: Function, unpin: Function, reconnect: Function, disconnect: Function, unload: Function, close: Function, closeOthers: Function}} deps.actions
 * @returns {Electron.MenuItemConstructorOptions[]}
 */
export function tabMenuTemplate({ tab, canPin, canCloseOthers, actions }) {
  if (tab?.kind === TabKind.SETTINGS) {
    return [{ label: "Close", click: actions.close }];
  }

  if (tab?.kind !== TabKind.CONNECTION) return [];

  return [
    ...connectionItems({ tab, canPin, actions }),
    { label: "Close", click: actions.close },
    { label: "Close others", enabled: canCloseOthers, click: actions.closeOthers },
  ];
}
