import { watch } from "vue";

/**
 * Remembers the element focused when a dialog opens and gives it back on close.
 * Reka only restores focus to its own trigger, and our dialogs are driven by v-model.
 * Bind `restoreFocus` to the `close-auto-focus` event of the dialog content.
 * When the opener left the page meanwhile (e.g. a command hidden by the dialog action),
 * focus goes to the first button of the toolbar that held it.
 */
export function useOpenerFocus(isOpen) {
  let opener = null;
  let toolbar = null;

  // Sync flush: capture the opener before the dialog moves focus
  watch(
    isOpen,
    (open) => {
      if (!open) return;

      opener = document.activeElement;
      toolbar = opener?.closest?.('[role="toolbar"]') ?? null;
    },
    { flush: "sync", immediate: true }
  );

  const restoreFocus = (event) => {
    event.preventDefault();
    (opener?.isConnected
      ? opener
      : toolbar?.querySelector("button:not(:disabled)")
    )?.focus();
    opener = null;
    toolbar = null;
  };

  return { restoreFocus };
}
