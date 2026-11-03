<template>
  <div class="app">
    <main class="app__main">
      <TooltipProvider :delay-duration="TOOLTIP_DELAY_MS">
        <router-view />
      </TooltipProvider>
    </main>

    <ToastProvider :duration="TOAST_DURATION_MS" swipe-direction="up">
      <ToastRoot
        v-model:open="notify.visible"
        class="app-toast"
        :data-type="notify.color"
        :type="notify.color === 'error' ? 'foreground' : 'background'"
      >
        <ToastDescription class="app-toast__message">{{ notify.message }}</ToastDescription>
        <ToastClose class="app-toast__close" aria-label="Close">
          <X :size="16" aria-hidden="true" />
        </ToastClose>
      </ToastRoot>
      <ToastViewport class="app-toast-viewport" />
    </ToastProvider>
  </div>
</template>

<script setup>
import { onBeforeUnmount, watch } from "vue";
import { setLucideProps, X } from "@lucide/vue";
import {
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastRoot,
  ToastViewport,
  TooltipProvider,
} from "reka-ui";
import { useSettingsStore } from "./stores/settings";
import { useConnectionsStore } from "./stores/connections";
import { useNotifyStore } from "./stores/notify";
import { useThemeSync } from "./composables/useThemeSync";
import { useStoreSync } from "./composables/useStoreSync";

const TOOLTIP_DELAY_MS = 400;
const TOAST_DURATION_MS = 5000;

const settings = useSettingsStore();
const connections = useConnectionsStore();
const notify = useNotifyStore();
const { applyAll } = useThemeSync();

// Fixed stroke on every icon
setLucideProps({ strokeWidth: 2 });

settings.load();
connections.load();
applyAll();
useStoreSync({ applySettings: applyAll });

// Main asks this view to show a toast, e.g. when a connection tab failed
const unsubscribeToast = window.api.notify.onShow((message, color) =>
  notify.show(message, color)
);

onBeforeUnmount(unsubscribeToast);

// Every settings change is saved right away
watch(() => settings.$state, settings.persist, { deep: true });
</script>

<style>
.rounded {
  border-radius: 10vw;
  overflow: hidden;
}

.app {
  display: flex;
  flex-direction: column;
  min-block-size: 100vh;
  background: var(--color-bg);
}

.app__main {
  flex: 1;
  min-block-size: 0;
}

/* Unscoped: the toast is teleported out of the component */
.app-toast-viewport {
  position: fixed;
  inset-block-start: var(--space-6);
  inset-inline: 0;
  z-index: 3000;
  display: flex;
  justify-content: center;
  margin: 0;
  padding: 0;
  list-style: none;
  pointer-events: none;
}

.app-toast {
  /* Severity color: drives the accent border and the background tint */
  --toast-accent: var(--color-primary);
  display: flex;
  align-items: center;
  gap: var(--space-5);
  max-inline-size: min(32rem, calc(100vw - 2 * var(--space-6)));
  padding: var(--space-4) var(--space-5);
  border-inline-start: 4px solid var(--toast-accent);
  border-radius: var(--radius-lg);
  background: color-mix(in oklab, var(--color-surface-raised), var(--toast-accent) 14%);
  color: var(--color-text);
  box-shadow: var(--shadow-2);
  pointer-events: auto;
}

.app-toast[data-type="error"] {
  --toast-accent: var(--color-danger);
}

.app-toast[data-state="open"] {
  animation: app-toast-in var(--duration-normal) var(--easing);
}

.app-toast[data-state="closed"] {
  animation: app-toast-out var(--duration-fast) var(--easing);
}

.app-toast[data-swipe="move"] {
  transform: translateY(var(--reka-toast-swipe-move-y));
}

.app-toast[data-swipe="cancel"] {
  transform: translateY(0);
  transition: transform var(--duration-normal) var(--easing);
}

.app-toast[data-swipe="end"] {
  animation: app-toast-out var(--duration-fast) var(--easing);
}

.app-toast__message {
  flex: 1;
  min-inline-size: 0;
  overflow-wrap: anywhere;
  font-size: var(--font-size-md);
}

.app-toast__close {
  display: inline-grid;
  place-items: center;
  flex: none;
  inline-size: var(--control-height);
  block-size: var(--control-height);
  padding: 0;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}

.app-toast__close:hover {
  background: var(--color-hover);
  color: var(--color-text);
}

@keyframes app-toast-in {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
}

@keyframes app-toast-out {
  to {
    opacity: 0;
    transform: translateY(-100%);
  }
}
</style>
