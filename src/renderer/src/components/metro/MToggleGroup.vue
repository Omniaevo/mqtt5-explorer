<template>
  <ToggleGroupRoot
    v-model="model"
    class="m-toggle-group"
    type="single"
    :aria-label="ariaLabel"
    :disabled="disabled"
  >
    <MTooltip
      v-for="option in options"
      :key="option.value"
      :text="option.ariaLabel"
    >
      <ToggleGroupItem
        class="m-toggle-group__item"
        :value="option.value"
        :aria-label="option.ariaLabel"
      >
        <MIcon v-if="option.icon" :name="option.icon" />
        <span v-if="option.text">{{ option.text }}</span>
      </ToggleGroupItem>
    </MTooltip>
  </ToggleGroupRoot>
</template>

<script setup>
import { computed } from "vue";
import { ToggleGroupItem, ToggleGroupRoot } from "reka-ui";
import MIcon from "./MIcon.vue";
import MTooltip from "./MTooltip.vue";

/**
 * Metro single-select button group (Reka ToggleGroup). Selected = accent fill.
 * Each option is `{ value, ariaLabel, icon?, text? }`; `ariaLabel` is required
 * and doubles as the tooltip. Clicking the selected option clears the model
 * (`undefined`) unless `mandatory` is set.
 */
const props = defineProps({
  options: { type: Array, required: true },
  /** Names the whole group for screen readers. */
  ariaLabel: { type: String, default: undefined },
  mandatory: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

const selection = defineModel({ type: String, default: undefined });

const model = computed({
  get: () => selection.value,
  set: (value) => {
    if (value === undefined && props.mandatory) return;
    selection.value = value;
  },
});

if (import.meta.env.DEV && props.options.some((o) => !o.ariaLabel)) {
  console.warn("[MToggleGroup] Every option needs an ariaLabel");
}
</script>

<style scoped>
.m-toggle-group {
  display: inline-flex;
}

.m-toggle-group__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--m-subunit);
  box-sizing: border-box;
  min-width: 32px;
  min-height: 32px;
  padding: 4px 12px;
  border: 2px solid var(--m-fg);
  border-radius: 0;
  background: transparent;
  color: var(--m-fg);
  font: var(--m-font-body);
  cursor: pointer;
  user-select: none;
}

/* Neighbours share one border */
.m-toggle-group__item:not(:first-child) {
  margin-left: -2px;
}

.m-toggle-group__item:hover:not(:disabled) {
  background: color-mix(in srgb, var(--m-fg) 12%, transparent);
}

.m-toggle-group__item[data-state="on"] {
  border-color: var(--m-accent);
  background: var(--m-accent);
  color: var(--m-on-accent);
}

.m-toggle-group__item:focus-visible {
  position: relative;
  outline: 1px dotted currentColor;
  outline-offset: 2px;
}

.m-toggle-group__item:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
