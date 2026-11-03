import { Channel, RendererStoreKeys } from "../shared/ipcChannels";

/** Sends the changed key to every live webContents except the sender. */
function broadcastStoreChange(key, sender, allWebContents) {
  allWebContents
    .filter((target) => target !== sender && !target.isDestroyed())
    .forEach((target) => target.send(Channel.STORE_CHANGED, key));
}

/**
 * Writes a renderer store key and tells the other renderers.
 * An unchanged value is ignored: this stops the reload -> persist -> broadcast loop.
 *
 * @param {object} deps
 * @param {{get: Function, set: Function}} deps.store
 * @param {Electron.WebContents} deps.sender
 * @param {() => Electron.WebContents[]} deps.getAllWebContents
 */
export function applyStoreSet(
  { store, sender, getAllWebContents },
  key,
  value
) {
  if (!RendererStoreKeys.includes(key)) return;
  if (store.get(key) === value) return;

  store.set(key, value);
  broadcastStoreChange(key, sender, getAllWebContents());
}
