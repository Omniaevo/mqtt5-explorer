<template>
  <ToggleGroupRoot v-model="model" class="app-toggle-group" :type="type">
    <component
      :is="item.tooltip ? AppTooltip : Passthrough"
      v-for="item in items"
      :key="item.value"
      v-bind="item.tooltip ? { text: item.tooltip } : {}"
    >
      <ToggleGroupItem
        class="app-toggle-group__item"
        :value="item.value"
        :aria-label="isIconOnly(item) ? item.label : undefined"
      >
        <component :is="item.icon" v-if="item.icon" :size="16" aria-hidden="true" />
        <template v-if="!isIconOnly(item)">{{ item.label }}</template>
      </ToggleGroupItem>
    </component>
  </ToggleGroupRoot>
</template>

<script setup>
/**
 * Group of toggle buttons. Extra attrs (class, events) fall through to the root element.
 * Single mode: clicking the selected item clears the model (`undefined`).
 * `items`: `{ value, label, icon?, showLabel?, tooltip? }[]`. An item with an `icon` is icon-only,
 * and its `label` becomes the accessible name. With `showLabel` the icon and the label are both shown.
 * `tooltip` is shown with AppTooltip.
 */
import { ToggleGroupItem, ToggleGroupRoot } from "reka-ui";
import AppTooltip from "./AppTooltip.vue";

defineProps({
  items: { type: Array, required: true },
  type: {
    type: String,
    default: "single",
    validator: (value) => ["single", "multiple"].includes(value),
  },
});

const model = defineModel({ type: [String, Array], default: undefined });

// A real component: a `Fragment` given as `:is` breaks the slot validation of the parent
const Passthrough = (_props, { slots }) => slots.default?.();

const isIconOnly = (item) => Boolean(item.icon) && !item.showLabel;
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
  gap: var(--space-3);
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

/* aria-pressed, not data-state: AppTooltip overrides data-state on its trigger */
.app-toggle-group__item[aria-pressed="true"] {
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
