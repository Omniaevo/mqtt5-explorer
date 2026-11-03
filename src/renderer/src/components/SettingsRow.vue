<template>
  <div class="settings-row" :class="{ 'settings-row--stacked': stacked }">
    <div class="settings-row__text">
      <div class="settings-row__title">{{ title }}</div>
      <div v-if="description" class="settings-row__description">
        {{ description }}
      </div>
    </div>
    <div class="settings-row__control">
      <slot />
    </div>
  </div>
</template>

<script setup>
/**
 * One setting: title and description on the left, the control (default slot) on the right.
 * `stacked` keeps the control below the text at any width, for wide controls.
 */
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  stacked: { type: Boolean, default: false },
});
</script>

<style scoped>
.settings-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-block: var(--space-4);
}

.settings-row__text {
  flex: 1;
  min-inline-size: 0;
}

.settings-row__title {
  font-size: var(--font-size-md);
}

.settings-row__description {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.settings-row__control {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  min-inline-size: 0;
  max-inline-size: 100%;
}

/* Side by side from 600px, same limit as the fullscreen dialog (D17) */
@media (min-width: 600px) {
  .settings-row:not(.settings-row--stacked) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .settings-row:not(.settings-row--stacked) .settings-row__control {
    flex: none;
  }
}
</style>
