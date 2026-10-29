<template>
  <div class="m-field" :class="{ 'm-field--disabled': disabled }">
    <label v-if="label" class="m-field__label" :for="id">{{ label }}</label>
    <TagsInputRoot
      v-model="model"
      class="m-field__box m-combobox__box"
      :disabled="disabled"
      add-on-blur
    >
      <TagsInputItem
        v-for="tag in model"
        :key="tag"
        class="m-combobox__tag"
        :value="tag"
      >
        <TagsInputItemText />
        <TagsInputItemDelete
          class="m-combobox__remove"
          :aria-label="`Remove ${tag}`"
        >
          <MIcon name="dismiss" :size="12" />
        </TagsInputItemDelete>
      </TagsInputItem>
      <TagsInputInput
        :id="id"
        class="m-field__input m-combobox__input"
        :placeholder="placeholder"
      />
    </TagsInputRoot>
  </div>
</template>

<script setup>
import { useId } from "vue";
import {
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
  TagsInputRoot,
} from "reka-ui";
import MIcon from "./MIcon.vue";
import "./field.css";

/**
 * Metro multi-value free-text box (Reka TagsInput) with square tags.
 * Model is an array of strings. Enter or blur adds, Backspace selects then
 * removes the last tag, the x button removes one.
 */
defineProps({
  label: { type: String, default: "" },
  placeholder: { type: String, default: "" },
  disabled: { type: Boolean, default: false },
});

const model = defineModel({ type: Array, default: () => [] });

const id = useId();
</script>

<style scoped>
.m-combobox__box {
  flex-wrap: wrap;
  align-items: center;
  gap: var(--m-subunit);
  padding-block: var(--m-subunit);
}

.m-combobox__input {
  flex: 1 1 80px;
  padding-block: 2px;
}

.m-combobox__tag {
  display: inline-flex;
  align-items: center;
  gap: var(--m-subunit);
  padding: 2px 4px 2px 8px;
  border: 0;
  border-radius: 0;
  background: var(--m-surface);
  outline: 1px solid var(--m-fg-secondary);
  outline-offset: -1px;
}

.m-combobox__tag[data-state="active"] {
  background: var(--m-accent);
  color: var(--m-on-accent);
  outline-color: var(--m-accent);
}

.m-combobox__remove {
  display: inline-flex;
  padding: 2px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.m-combobox__remove:hover {
  background: color-mix(in srgb, currentColor 20%, transparent);
}

.m-combobox__remove:focus-visible {
  outline: 1px dotted currentColor;
}
</style>
