<template>
  <RadioGroupRoot
    v-model="name"
    class="m-swatch-picker"
    orientation="horizontal"
    :aria-label="ariaLabel"
  >
    <MTooltip v-for="item in items" :key="item.text" :text="item.text">
      <RadioGroupItem
        class="m-swatch-picker__item"
        :value="item.text"
        :aria-label="item.text"
        :style="{ background: item.value[theme] }"
      />
    </MTooltip>
  </RadioGroupRoot>
</template>

<script setup>
import { computed } from "vue";
import { RadioGroupItem, RadioGroupRoot } from "reka-ui";
import MTooltip from "./MTooltip.vue";

/**
 * Metro color picker: a row of small squares (Reka RadioGroup).
 * Each item is `{ text, value: { light, dark } }`; the model is the selected item.
 */
const props = defineProps({
  items: { type: Array, required: true },
  /** Theme variant of the colors to show. */
  theme: { type: String, required: true },
  ariaLabel: { type: String, default: undefined },
});

const selected = defineModel({ type: Object, required: true });

const name = computed({
  get: () => selected.value.text,
  set: (text) => {
    selected.value = props.items.find((item) => item.text === text);
  },
});
</script>

<style scoped>
.m-swatch-picker {
  display: flex;
  flex-wrap: wrap;
  gap: var(--m-subunit);
}

.m-swatch-picker__item {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  cursor: pointer;
}

/* Selected: a ring in the text color, separated from the fill.
   aria-checked, because the tooltip trigger overwrites data-state. */
.m-swatch-picker__item[aria-checked="true"] {
  outline: var(--m-border-width-strong) solid var(--m-fg);
  outline-offset: 2px;
}

.m-swatch-picker__item:focus-visible {
  outline: 1px dotted currentColor;
  outline-offset: 4px;
}
</style>
