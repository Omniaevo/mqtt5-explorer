<template>
  <div class="window-controls" role="group" aria-label="Window controls">
    <AppButton
      variant="icon"
      aria-label="Minimize"
      data-testid="window-minimize"
      @click="windowApi.minimize"
    >
      <Minus :size="14" aria-hidden="true" />
    </AppButton>

    <AppButton
      variant="icon"
      :aria-label="maximized ? 'Restore' : 'Maximize'"
      data-testid="window-maximize"
      @click="windowApi.toggleMaximize"
    >
      <component :is="maximized ? Copy : Square" :size="14" aria-hidden="true" />
    </AppButton>

    <AppButton
      variant="icon"
      color="danger"
      aria-label="Close"
      data-testid="window-close"
      @click="windowApi.close"
    >
      <X :size="14" aria-hidden="true" />
    </AppButton>
  </div>
</template>

<script setup>
/** Minimize, maximize and close for the frameless window. Main owns the state. */
import { onMounted, onUnmounted, ref } from "vue";
import { Copy, Minus, Square, X } from "@lucide/vue";
import AppButton from "./ui/AppButton.vue";

const { window: windowApi } = window.api;

const maximized = ref(false);

const unsubscribe = windowApi.onState((state) => {
  maximized.value = state.maximized;
});

onMounted(async () => {
  maximized.value = (await windowApi.getState()).maximized;
});

onUnmounted(unsubscribe);
</script>

<style scoped>
.window-controls {
  display: flex;
  gap: var(--space-2);
  /* The strip is a drag region; the controls must stay clickable */
  -webkit-app-region: no-drag;
}
</style>
