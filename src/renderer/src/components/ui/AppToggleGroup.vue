<template>
  <ToggleGroupRoot v-model="model" class="app-toggle-group" :type="type">
    <ToggleGroupItem
      v-for="item in items"
      :key="item.value"
      class="app-toggle-group__item"
      :value="item.value"
      :title="item.tooltip"
      :aria-label="item.icon ? item.label : undefined"
    >
      <component :is="item.icon" v-if="item.icon" :size="16" aria-hidden="true" />
      <template v-else>{{ item.label }}</template>
    </ToggleGroupItem>
  </ToggleGroupRoot>
</template>

<script setup>
/**
 * Group of toggle buttons. Extra attrs (class, events) fall through to the root element.
 * Single mode: clicking the selected item clears the model (`undefined`).
 * `items`: `{ value, label, icon?, tooltip? }[]`. An item with an `icon` is icon-only,
 * and its `label` becomes the accessible name. `tooltip` is shown as native `title` (AppTooltip: T09).
 */
import { ToggleGroupItem, ToggleGroupRoot } from "reka-ui";

defineProps({
  items: { type: Array, required: true },
  type: {
    type: String,
    default: "single",
    validator: (value) => ["single", "multiple"].includes(value),
  },
});

const model = defineModel({ type: [String, Array], default: undefined });
</script>

<style scoped>
.app-toggle-group {
  display: inline-flex;
  block-size: var(--control-height);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.app-toggle-group__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-inline-size: var(--control-height);
  padding-inline: var(--space-3);
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--easing);
}

.app-toggle-group__item + .app-toggle-group__item {
  border-inline-start: 1px solid var(--color-border);
}

.app-toggle-group__item:hover {
  background: var(--color-hover);
}

.app-toggle-group__item[data-state="on"] {
  background: var(--color-primary-subtle);
  color: var(--color-primary);
}

.app-toggle-group__item:focus-visible {
  outline-offset: -2px;
}

.app-toggle-group__item:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
