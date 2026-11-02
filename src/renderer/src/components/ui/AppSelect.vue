<template>
  <div class="app-select" :class="$attrs.class" :style="$attrs.style">
    <label
      class="app-select__label"
      :class="{ 'visually-hidden': labelHidden }"
      :for="triggerId"
    >
      {{ label }}
    </label>
    <SelectRoot v-model="model">
      <SelectTrigger
        :id="triggerId"
        class="app-select__trigger"
        :class="{ 'app-select__trigger--invalid': error }"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="messageId"
      >
        <SelectValue class="app-select__value" />
        <ChevronDown :size="16" aria-hidden="true" class="app-select__chevron" />
      </SelectTrigger>
      <SelectPortal>
        <SelectContent
          class="app-select__content"
          position="popper"
          :side-offset="SIDE_OFFSET_PX"
        >
          <SelectViewport class="app-select__viewport">
            <SelectItem
              v-for="option in options"
              :key="option.value"
              :value="option.value"
              class="app-select__item"
            >
              <SelectItemText>
                <slot name="item" :item="option.source" :title="option.title" :value="option.value">
                  {{ option.title }}
                </slot>
              </SelectItemText>
              <SelectItemIndicator class="app-select__indicator">
                <Check :size="14" aria-hidden="true" />
              </SelectItemIndicator>
            </SelectItem>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
    <p v-if="error" :id="messageId" class="app-select__message">{{ error }}</p>
  </div>
</template>

<script setup>
/**
 * Labeled select (Reka Select). The model holds the item value (string or number).
 * `items` accepts plain values or objects read with `itemTitle` / `itemValue`.
 * `class` and `style` go to the root wrapper. Validation is owned by the parent: pass `error`.
 * Slot `item` ({ item, title, value }) replaces the text of an option.
 */
import { computed, useId } from "vue";
import {
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from "reka-ui";
import { Check, ChevronDown } from "@lucide/vue";

defineOptions({ inheritAttrs: false });

const SIDE_OFFSET_PX = 4;

const props = defineProps({
  label: { type: String, required: true },
  items: { type: Array, required: true },
  itemTitle: { type: String, default: "title" },
  itemValue: { type: String, default: "value" },
  error: { type: String, default: undefined },
  /** Keep the label for screen readers only (compact layouts). */
  labelHidden: { type: Boolean, default: false },
});

const model = defineModel({ type: [String, Number], default: undefined });

const triggerId = useId();
const messageId = computed(() => (props.error ? `${triggerId}-message` : undefined));

const options = computed(() =>
  props.items.map((item) =>
    typeof item === "object"
      ? { title: String(item[props.itemTitle]), value: item[props.itemValue], source: item }
      : { title: String(item), value: item, source: item },
  ),
);
</script>

<style scoped>
.app-select {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-inline-size: 0;
}

.app-select__label {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.app-select__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  min-block-size: var(--control-height);
  padding-inline: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-raised);
  color: var(--color-text);
  font: inherit;
  font-size: var(--font-size-md);
  text-align: start;
  cursor: pointer;
  transition: border-color var(--duration-fast) var(--easing);
}

.app-select__trigger:hover {
  border-color: var(--color-text-muted);
}

.app-select__trigger:focus-visible,
.app-select__trigger[data-state="open"] {
  border-color: var(--color-primary);
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 1px;
}

.app-select__trigger--invalid {
  border-color: var(--color-danger);
}

.app-select__trigger[data-disabled] {
  opacity: 0.45;
  cursor: not-allowed;
}

.app-select__value {
  min-inline-size: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.app-select__chevron {
  flex: none;
  color: var(--color-text-muted);
}

.app-select__message {
  margin: 0;
  color: var(--color-danger);
  font-size: var(--font-size-xs);
}

.visually-hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>

<style>
/* Unscoped: the list is teleported out of the component, so scoped rules never match it.
   Above dialogs (2001), because selects live inside them.
   `position` is needed: Reka copies the computed z-index to its wrapper, and it is `auto` when static */
.app-select__content {
  position: relative;
  z-index: 2100;
  min-inline-size: var(--reka-select-trigger-width);
  max-block-size: min(20rem, var(--reka-select-content-available-height));
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: var(--color-surface-raised);
  color: var(--color-text);
  box-shadow: var(--shadow-2);
}

.app-select__viewport {
  padding: var(--space-2);
}

.app-select__item {
  position: relative;
  display: flex;
  align-items: center;
  min-block-size: var(--row-height);
  padding-block: var(--space-2);
  padding-inline: var(--space-4) var(--space-8);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  cursor: pointer;
  user-select: none;
  outline: 0;
}

.app-select__item[data-highlighted] {
  background: var(--color-hover);
}

.app-select__item[data-state="checked"] {
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}

.app-select__indicator {
  position: absolute;
  inset-inline-end: var(--space-4);
  display: inline-flex;
}
</style>
