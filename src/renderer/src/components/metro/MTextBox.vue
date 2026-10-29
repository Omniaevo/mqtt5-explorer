<template>
  <div
    class="m-field"
    :class="[
      $attrs.class,
      { 'm-field--error': error, 'm-field--disabled': disabled },
    ]"
    :style="$attrs.style"
  >
    <label v-if="label" class="m-field__label" :for="id">{{ label }}</label>
    <div class="m-field__box">
      <MIcon v-if="prefixIcon" class="m-field__prefix" :name="prefixIcon" />
      <input
        :id="id"
        ref="inputRef"
        v-model="model"
        class="m-field__input"
        v-bind="inputAttrs()"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? errorId : undefined"
      />
      <button
        v-if="showClear"
        class="m-text-box__clear"
        type="button"
        tabindex="-1"
        aria-label="Clear"
        @click="clear"
      >
        <MIcon name="dismiss" :size="16" />
      </button>
      <slot name="suffix" />
    </div>
    <p v-if="error" :id="errorId" class="m-field__error">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed, ref, useAttrs, useId } from "vue";
import MIcon from "./MIcon.vue";
import { withoutClassAndStyle } from "./forwardAttrs";
import "./field.css";

/**
 * Metro text box: label above, 2 px border, accent border on focus.
 * Extra attributes (autocomplete, maxlength, ...) go to the input element.
 * The "suffix" slot sits inside the border, after the clear button.
 */
defineOptions({ inheritAttrs: false });

const props = defineProps({
  label: { type: String, default: "" },
  type: { type: String, default: "text" },
  placeholder: { type: String, default: "" },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  clearable: { type: Boolean, default: false },
  /** Error text below the box. Also switches the border to the error color. */
  error: { type: String, default: "" },
  prefixIcon: { type: String, default: "" },
});

const model = defineModel({ type: String, default: "" });

const attrs = useAttrs();
const id = useId();
const errorId = `${id}-error`;
const inputRef = ref(null);

const showClear = computed(
  () => props.clearable && model.value && !props.disabled && !props.readonly
);

const inputAttrs = () => withoutClassAndStyle(attrs);

const clear = () => {
  model.value = "";
  inputRef.value?.focus();
};

defineExpose({ focus: () => inputRef.value?.focus() });
</script>

<style scoped>
.m-text-box__clear {
  display: inline-flex;
  padding: 2px;
  border: 0;
  background: transparent;
  color: var(--m-fg-secondary);
  cursor: pointer;
}

.m-text-box__clear:hover {
  color: var(--m-fg);
}
</style>
