const MAX_TILT_DEG = 6;
const PRESS_SCALE = 0.97;
const PERSPECTIVE_PX = 600;

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const cleanups = new WeakMap();

/**
 * Win8 press tilt: while the primary pointer is down, the element leans away from
 * the pointer and shrinks a little. Only `transform` changes, so layout never moves.
 * No effect under reduced motion.
 */
export const vTilt = {
  mounted(el) {
    const press = (event) => {
      if (event.button !== 0 || reducedMotion()) return;
      const rect = el.getBoundingClientRect();
      // Pointer offset from the center, -1..1
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      el.style.transition = "none";
      el.style.transform =
        `perspective(${PERSPECTIVE_PX}px) ` +
        `rotateX(${(-y * MAX_TILT_DEG).toFixed(2)}deg) ` +
        `rotateY(${(x * MAX_TILT_DEG).toFixed(2)}deg) scale(${PRESS_SCALE})`;
    };
    const release = () => {
      el.style.transition = "transform var(--m-duration-fast) var(--m-ease)";
      el.style.transform = "";
    };

    el.addEventListener("pointerdown", press);
    for (const type of ["pointerup", "pointerleave", "pointercancel"]) {
      el.addEventListener(type, release);
    }
    cleanups.set(el, () => {
      el.removeEventListener("pointerdown", press);
      for (const type of ["pointerup", "pointerleave", "pointercancel"]) {
        el.removeEventListener(type, release);
      }
    });
  },
  unmounted(el) {
    cleanups.get(el)?.();
    cleanups.delete(el);
  },
};
