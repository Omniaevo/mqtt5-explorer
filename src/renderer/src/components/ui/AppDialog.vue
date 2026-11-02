<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="app-dialog__overlay" />
      <DialogContent
        class="app-dialog"
        :class="{ 'app-dialog--fullscreen-small': fullscreenOnSmall }"
        :style="{ '--dialog-max-width': maxWidth }"
        aria-describedby="undefined"
        @escape-key-down="blockWhenPersistent"
        @interact-outside="blockWhenPersistent"
      >
        <header class="app-dialog__header">
          <DialogTitle class="app-dialog__title">{{ title }}</DialogTitle>
          <slot name="header-actions" />
          <DialogClose v-if="!hideClose" as-child>
            <AppButton variant="icon" aria-label="Close">
              <X :size="16" aria-hidden="true" />
            </AppButton>
          </DialogClose>
        </header>

        <div class="app-dialog__body">
          <slot />
        </div>

        <footer v-if="$slots.actions" class="app-dialog__actions">
          <slot name="actions" />
        </footer>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup>
/**
 * Modal dialog (Reka Dialog). Open state: `v-model:open`.
 * `persistent` blocks Esc and outside click, so only explicit actions close it.
 * `fullscreenOnSmall` makes the dialog fill the window below 600px (D17, CSS only).
 * Slots: default (body, scrolls when tall), `actions` (footer), `header-actions` (before the close button).
 */
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "reka-ui";
import { X } from "@lucide/vue";
import AppButton from "./AppButton.vue";

const props = defineProps({
  title: { type: String, required: true },
  maxWidth: { type: String, default: "50ch" },
  persistent: { type: Boolean, default: false },
  hideClose: { type: Boolean, default: false },
  fullscreenOnSmall: { type: Boolean, default: false },
});

const open = defineModel("open", { type: Boolean, default: false });

function blockWhenPersistent(event) {
  if (props.persistent) event.preventDefault();
}
</script>

<style scoped>
.app-dialog__overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: color-mix(in oklab, black 45%, transparent);
}

.app-dialog {
  position: fixed;
  inset: 0;
  z-index: 2001;
  display: flex;
  flex-direction: column;
  margin: auto;
  inline-size: min(var(--dialog-max-width), 100% - 2 * var(--space-6));
  block-size: fit-content;
  max-block-size: calc(100dvh - 2 * var(--space-6));
  border-radius: var(--radius-lg);
  background: var(--color-surface-raised);
  color: var(--color-text);
  box-shadow: var(--shadow-2);
}

.app-dialog__header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: none;
  min-block-size: var(--header-height);
  padding-inline: var(--space-6) var(--space-4);
  border-block-end: 1px solid var(--color-border);
}

.app-dialog__title {
  flex: 1;
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
}

.app-dialog__body {
  flex: 1 1 auto;
  min-block-size: 0;
  padding: var(--space-6);
  overflow-y: auto;
}

.app-dialog__actions {
  display: flex;
  flex: none;
  justify-content: flex-end;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-6);
  border-block-start: 1px solid var(--color-border);
}

/* Fullscreen on small windows (D17) */
@media (max-width: 599px) {
  .app-dialog--fullscreen-small {
    inline-size: 100%;
    block-size: 100dvh;
    max-block-size: none;
    border-radius: 0;
  }
}

/* Open and close animation */
.app-dialog__overlay[data-state="open"],
.app-dialog[data-state="open"] {
  animation: app-dialog-in var(--duration-normal) var(--easing);
}

.app-dialog__overlay[data-state="closed"],
.app-dialog[data-state="closed"] {
  animation: app-dialog-out var(--duration-normal) var(--easing);
}

.app-dialog[data-state="open"] {
  animation-name: app-dialog-scale-in;
}

.app-dialog[data-state="closed"] {
  animation-name: app-dialog-scale-out;
}

@keyframes app-dialog-in {
  from { opacity: 0; }
}

@keyframes app-dialog-out {
  to { opacity: 0; }
}

@keyframes app-dialog-scale-in {
  from { opacity: 0; transform: scale(0.96); }
}

@keyframes app-dialog-scale-out {
  to { opacity: 0; transform: scale(0.96); }
}

@media (prefers-reduced-motion: reduce) {
  .app-dialog__overlay,
  .app-dialog {
    animation: none !important;
  }
}
</style>
