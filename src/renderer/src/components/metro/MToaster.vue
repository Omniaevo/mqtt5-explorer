<template>
  <ToastProvider
    :duration="TOAST_DURATION_MS"
    swipe-direction="right"
    label="Notification"
  >
    <!-- The key restarts the timer and the slide when a toast shows while another is open -->
    <ToastRoot
      :key="showCount"
      v-model:open="notify.visible"
      :type="isError ? 'foreground' : 'background'"
      class="m-toast"
      :class="{ 'm-toast--error': isError }"
    >
      <ToastDescription class="m-toast__message">
        {{ notify.message }}
      </ToastDescription>
      <ToastClose as-child>
        <MButton variant="text" icon="dismiss" aria-label="Close" />
      </ToastClose>
    </ToastRoot>
    <ToastViewport class="m-toast-viewport" />
  </ToastProvider>
</template>

<script setup>
import { computed, ref } from "vue";
import {
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastRoot,
  ToastViewport,
} from "reka-ui";
import { useNotifyStore } from "../../stores/notify";
import MButton from "./MButton.vue";

const TOAST_DURATION_MS = 5000;

/** The one global toaster. Shows the state of the notify store (top-right, 364 px). */
const notify = useNotifyStore();
const showCount = ref(0);
const isError = computed(() => notify.color === "error");

notify.$onAction(() => {
  showCount.value++;
});
</script>

<!-- Toasts are teleported into the viewport, so these styles cannot be scoped -->
<style>
.m-toast-viewport {
  position: fixed;
  top: var(--m-unit);
  right: var(--m-unit);
  z-index: 3300;
  box-sizing: border-box;
  width: 364px;
  max-width: calc(100vw - var(--m-unit) * 2);
  margin: 0;
  padding: 0;
  list-style: none;
  outline: none;
}

/* Accent colored: remap the tokens so the close button follows */
.m-toast {
  --m-fg: var(--m-on-accent);
  --m-bg: var(--m-accent);

  display: flex;
  align-items: flex-start;
  gap: var(--m-subunit);
  box-sizing: border-box;
  padding: var(--m-unit);
  border-radius: 0;
  background: var(--m-bg);
  color: var(--m-fg);
  font: var(--m-font-body);
  box-shadow: none;
}

.m-toast--error {
  --m-fg: var(--m-on-error);
  --m-bg: var(--m-error);
}

.m-toast__message {
  flex: 1;
  margin: 0;
  overflow-wrap: anywhere;
}

.m-toast[data-state="open"] {
  animation: m-toast-in var(--m-duration-normal) var(--m-ease);
}

.m-toast[data-state="closed"] {
  animation: m-toast-out var(--m-duration-fast) var(--m-ease) forwards;
}

.m-toast[data-swipe="move"] {
  transform: translateX(var(--reka-toast-swipe-move-x));
}

.m-toast[data-swipe="end"] {
  animation: m-toast-out var(--m-duration-fast) var(--m-ease) forwards;
}

@keyframes m-toast-in {
  from {
    transform: translateX(calc(100% + var(--m-unit)));
  }
}

@keyframes m-toast-out {
  to {
    transform: translateX(calc(100% + var(--m-unit)));
  }
}

@media (prefers-reduced-motion: reduce) {
  .m-toast[data-state="open"],
  .m-toast[data-state="closed"],
  .m-toast[data-swipe="end"] {
    animation: none;
  }
}
</style>
