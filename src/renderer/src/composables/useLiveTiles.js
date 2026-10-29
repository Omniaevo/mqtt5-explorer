import { onBeforeUnmount, reactive, watch } from "vue";

const MIN_INTERVAL_MS = 6000;
const MAX_INTERVAL_MS = 10000;

const randomInterval = () =>
  MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS);

/**
 * Owns the flip timers of the live tiles (P18). Each id flips on its own random 6-10 s timer.
 * Timers stop while the document is hidden or reduced motion is on, and are cleared on unmount.
 * An id in `heldIds` never shows its back.
 *
 * @param {() => string[]} getIds ids of the tiles that may flip
 * @param {() => string[]} getHeldIds ids of tiles that must stay on the front (selected, focused)
 * @returns {{ isFlipped: (id: string) => boolean }}
 */
export function useLiveTiles(getIds, getHeldIds = () => []) {
  const flipped = reactive(new Set());
  const timers = new Map();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const isHeld = (id) => getHeldIds().includes(id);
  const canRun = () => !document.hidden && !reducedMotion.matches;

  function schedule(id) {
    timers.set(
      id,
      setTimeout(() => {
        if (isHeld(id)) flipped.delete(id);
        else if (flipped.has(id)) flipped.delete(id);
        else flipped.add(id);
        schedule(id);
      }, randomInterval())
    );
  }

  function stopAll() {
    timers.forEach(clearTimeout);
    timers.clear();
  }

  /** Starts a timer for every id that has none; drops timers of ids that left. */
  function sync() {
    const ids = new Set(getIds());

    timers.forEach((timer, id) => {
      if (ids.has(id)) return;
      clearTimeout(timer);
      timers.delete(id);
      flipped.delete(id);
    });
    if (!canRun()) return;
    ids.forEach((id) => timers.has(id) || schedule(id));
  }

  function onEnvironmentChange() {
    stopAll();
    // Reduced motion shows the front only; a hidden page keeps its state
    if (reducedMotion.matches) flipped.clear();
    sync();
  }

  watch(getIds, sync);
  watch(getHeldIds, (held) => held.forEach((id) => flipped.delete(id)));
  document.addEventListener("visibilitychange", onEnvironmentChange);
  reducedMotion.addEventListener("change", onEnvironmentChange);
  sync();

  onBeforeUnmount(() => {
    stopAll();
    document.removeEventListener("visibilitychange", onEnvironmentChange);
    reducedMotion.removeEventListener("change", onEnvironmentChange);
  });

  return { isFlipped: (id) => flipped.has(id) && !isHeld(id) };
}
