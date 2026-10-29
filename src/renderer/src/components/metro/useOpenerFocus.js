import { watch } from "vue";

/**
 * Remembers the element focused when a dialog opens and gives it back on close.
 * Reka only restores focus to its own trigger, and our dialogs are driven by v-model.
 * Bind `restoreFocus` to the `close-auto-focus` event of the dialog content.
 */
export function useOpenerFocus(isOpen) {
  let opener = null;

  // Sync flush: capture the opener before the dialog moves focus
  watch(
    isOpen,
    (open) => {
      if (open) opener = document.activeElement;
    },
    { flush: "sync", immediate: true }
  );

  const restoreFocus = (event) => {
    event.preventDefault();
    opener?.focus();
    opener = null;
  };

  return { restoreFocus };
}
