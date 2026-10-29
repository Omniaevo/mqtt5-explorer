<template>
  <AlertDialogRoot :open="open" @update:open="onOpenChange">
    <AlertDialogPortal>
      <AlertDialogOverlay class="m-message-dialog__overlay" />
      <AlertDialogContent
        class="m-message-dialog"
        @close-auto-focus="restoreFocus"
      >
        <div class="m-message-dialog__column">
          <AlertDialogTitle class="m-message-dialog__title">
            {{ title }}
          </AlertDialogTitle>
          <AlertDialogDescription class="m-message-dialog__message">
            {{ message }}
          </AlertDialogDescription>
          <div class="m-message-dialog__buttons">
            <MButton
              variant="accent"
              :label="confirmLabel"
              :class="{ 'm-message-dialog__confirm--danger': danger }"
              @click="confirm"
            />
            <AlertDialogCancel v-if="cancelLabel" as-child>
              <MButton :label="cancelLabel" />
            </AlertDialogCancel>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>

<script setup>
import {
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
} from "reka-ui";
import MButton from "./MButton.vue";
import { useOpenerFocus } from "./useOpenerFocus";

/**
 * Metro message dialog (Reka AlertDialog): full-width band centered vertically.
 * The first button confirms. Cancel, Esc and the cancel button emit `cancel`.
 * An empty `cancelLabel` hides the cancel button (Esc still cancels).
 */
defineProps({
  title: { type: String, required: true },
  message: { type: String, default: "" },
  confirmLabel: { type: String, default: "OK" },
  cancelLabel: { type: String, default: "Cancel" },
  /** The confirm button uses the error color. */
  danger: { type: Boolean, default: false },
});

const emit = defineEmits(["confirm", "cancel"]);
const open = defineModel("open", { type: Boolean, default: false });

const { restoreFocus } = useOpenerFocus(open);

function onOpenChange(next) {
  if (!next && open.value) emit("cancel");
  open.value = next;
}

function confirm() {
  emit("confirm");
  open.value = false;
}
</script>

<!-- The dialog is teleported to <body>, so its styles cannot be scoped -->
<style>
.m-message-dialog__overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: color-mix(in srgb, var(--m-bg) 70%, transparent);
  animation: m-message-dialog-fade var(--m-duration-fast) var(--m-ease);
}

.m-message-dialog {
  position: fixed;
  inset: 0;
  z-index: 3001;
  box-sizing: border-box;
  height: fit-content;
  margin-block: auto;
  padding: calc(var(--m-unit) * 2) var(--m-unit);
  border-block: var(--m-border-width) solid var(--m-border);
  border-radius: 0;
  background: var(--m-surface);
  color: var(--m-fg);
  font: var(--m-font-body);
  box-shadow: none;
  animation: m-message-dialog-fade var(--m-duration-fast) var(--m-ease);
}

.m-message-dialog:focus {
  outline: none;
}

.m-message-dialog__overlay[data-state="closed"],
.m-message-dialog[data-state="closed"] {
  animation: m-message-dialog-fade var(--m-duration-fast) var(--m-ease) reverse
    forwards;
}

.m-message-dialog__column {
  max-width: 60%;
  margin-inline: auto;
}

.m-message-dialog__title {
  margin: 0 0 var(--m-unit);
  font: var(--m-font-subheader);
}

.m-message-dialog__message {
  margin: 0 0 calc(var(--m-unit) * 2);
}

.m-message-dialog__buttons {
  display: flex;
  justify-content: flex-end;
  gap: var(--m-subunit);
}

.m-message-dialog__confirm--danger {
  --m-accent: var(--m-error);
  --m-on-accent: var(--m-on-error);
}

@keyframes m-message-dialog-fade {
  from {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .m-message-dialog__overlay,
  .m-message-dialog,
  .m-message-dialog__overlay[data-state="closed"],
  .m-message-dialog[data-state="closed"] {
    animation: none;
  }
}
</style>
