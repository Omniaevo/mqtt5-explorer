<template>
  <div class="m-field" :class="{ 'm-field--disabled': disabled }">
    <label v-if="label" :id="labelId" class="m-field__label" :for="id">
      {{ label }}
    </label>
    <SelectRoot v-model="model" :disabled="disabled">
      <SelectTrigger
        :id="id"
        class="m-field__box m-select__trigger"
        :aria-labelledby="label ? labelId : undefined"
        :aria-label="label ? undefined : ariaLabel"
      >
        <span
          class="m-select__value"
          :class="{ 'm-select__value--empty': !selected }"
        >
          {{ selected ? selected.title : placeholder }}
        </span>
        <MIcon class="m-select__chevron" name="chevronDown" :size="16" />
      </SelectTrigger>
      <SelectPortal>
        <SelectContent
          class="m-select__content"
          position="popper"
          :side-offset="0"
          :collision-padding="8"
        >
          <SelectViewport>
            <SelectItem
              v-for="option in options"
              :key="option.key"
              class="m-select__item"
              :value="option.modelValue"
              :text-value="option.title"
            >
              <SelectItemText>
                <slot name="item" :item="option.raw" :title="option.title">
                  {{ option.title }}
                </slot>
              </SelectItemText>
            </SelectItem>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
  </div>
</template>

<script setup>
import { computed, useId } from "vue";
import {
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectViewport,
} from "reka-ui";
import MIcon from "./MIcon.vue";
import "./field.css";

/**
 * Metro combo box (Reka Select): 2 px border, chevron, list as wide as the box.
 * `items` can be primitives or objects. With `returnObject` the model holds the
 * whole item, otherwise only its `itemValue`. The "item" slot customizes a row.
 */
const props = defineProps({
  items: { type: Array, default: () => [] },
  itemTitle: { type: String, default: "title" },
  itemValue: { type: String, default: "value" },
  returnObject: { type: Boolean, default: false },
  label: { type: String, default: "" },
  /** Accessible name when there is no visible `label`. */
  ariaLabel: { type: String, default: undefined },
  placeholder: { type: String, default: "" },
  disabled: { type: Boolean, default: false },
});

const model = defineModel({ type: null, default: undefined });

const id = useId();
const labelId = `${id}-label`;

const isObject = (item) => item !== null && typeof item === "object";

const toOption = (item, index) => {
  const raw = isObject(item);
  const value = raw ? item[props.itemValue] : item;
  return {
    key: index,
    raw: item,
    title: String(raw ? item[props.itemTitle] : item),
    modelValue: props.returnObject ? item : value,
  };
};

const options = computed(() => props.items.map(toOption));

// Reka compares object values deeply, so a stored copy still matches its item.
const selected = computed(() => {
  const current = JSON.stringify(model.value);
  return options.value.find((o) => JSON.stringify(o.modelValue) === current);
});
</script>

<style scoped>
.m-select__trigger {
  justify-content: space-between;
  width: 100%;
  min-height: 32px;
  padding-block: 0;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.m-select__trigger:focus-visible {
  border-color: var(--m-accent);
  outline: 1px dotted currentColor;
  outline-offset: 2px;
}

.m-select__trigger[data-state="open"] {
  border-color: var(--m-accent);
}

.m-select__value {
  overflow: hidden;
  padding: 5px 3px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-select__value--empty {
  color: var(--m-fg-secondary);
}

.m-select__chevron {
  color: var(--m-fg-secondary);
}
</style>

<!-- The list is teleported to <body>, so its styles cannot be scoped -->
<style>
.m-select__content {
  z-index: 3000;
  box-sizing: border-box;
  width: var(--reka-select-trigger-width);
  max-height: min(var(--reka-select-content-available-height), 320px);
  overflow: hidden;
  border: 1px solid var(--m-border);
  border-radius: 0;
  background: var(--m-surface);
  color: var(--m-fg);
  font: var(--m-font-body);
  box-shadow: none;
}

.m-select__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  cursor: pointer;
  outline: none;
  user-select: none;
}

.m-select__item[data-highlighted] {
  background: color-mix(in srgb, var(--m-fg) 12%, transparent);
}

.m-select__item[data-state="checked"] {
  background: var(--m-accent);
  color: var(--m-on-accent);
}

.m-select__item[data-disabled] {
  opacity: 0.4;
  pointer-events: none;
}
</style>
