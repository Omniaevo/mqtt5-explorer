<template>
  <div class="app-text-field" :class="[$attrs.class, { 'app-text-field--invalid': error }]" :style="$attrs.style">
    <label class="app-text-field__label" :class="{ 'visually-hidden': labelHidden }" :for="inputId">
      {{ label }}
    </label>
    <div class="app-text-field__control">
      <slot name="prepend-inner" />
      <input
        :id="inputId"
        ref="input"
        v-model="model"
        class="app-text-field__input"
        :class="{ 'app-text-field__input--mono': mono }"
        v-bind="inputAttrs"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="messageId"
      />
      <AppButton
        v-if="canClear"
        variant="icon"
        size="sm"
        :aria-label="`Clear ${label}`"
        @click="clear"
      >
        <X :size="16" aria-hidden="true" />
      </AppButton>
      <slot name="append-inner" />
    </div>
    <p v-if="error || hint" :id="messageId" class="app-text-field__message">
      {{ error || hint }}
    </p>
  </div>
</template>

<script setup>
/**
 * Labeled native input. `class` and `style` go to the root wrapper;
 * every other attr (type, readonly, disabled, autofocus, placeholder...) goes to the <input>.
 * Validation is owned by the parent: pass the message in `error`.
 */
import { computed, useAttrs, useId, useTemplateRef } from "vue";
import { X } from "@lucide/vue";
import AppButton from "./AppButton.vue";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  label: { type: String, required: true },
  hint: { type: String, default: undefined },
  error: { type: String, default: undefined },
  /** Keep the label for screen readers only (compact layouts). */
  labelHidden: { type: Boolean, default: false },
  /** Show a clear button while the field has a value (hidden when readonly or disabled). */
  clearable: { type: Boolean, default: false },
  /** Use the monospace font for the value (topics, IDs, paths). */
  mono: { type: Boolean, default: false },
});

const model = defineModel({ type: [String, Number], default: undefined });
const attrs = useAttrs();

const inputId = useId();
const messageId = computed(() => (props.error || props.hint ? `${inputId}-message` : undefined));
const input = useTemplateRef("input");

const hasValue = computed(() => model.value !== undefined && model.value !== null && model.value !== "");
const isEditable = computed(() => !("readonly" in attrs) && !("disabled" in attrs));
const canClear = computed(() => props.clearable && hasValue.value && isEditable.value);

/** Empties the field and keeps the focus in it, ready to type. */
function clear() {
  model.value = "";
  input.value.focus();
}

const ROOT_ATTRS = ["class", "style"];
const inputAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([name]) => !ROOT_ATTRS.includes(name))),
);
</script>

<style scoped>
.app-text-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-inline-size: 0;
}

.app-text-field__label {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.app-text-field__control {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-block-size: var(--control-height);
  padding-inline: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-raised);
  transition: border-color var(--duration-fast) var(--easing);
}

.app-text-field__control:hover {
  border-color: var(--color-text-muted);
}

/* The wrapper shows the focus border, not the bare input */
.app-text-field__control:focus-within {
  border-color: var(--color-primary);
  outline: 0;
}

.app-text-field--invalid .app-text-field__control {
  border-color: var(--color-danger);
}

.app-text-field__input {
  flex: 1;
  min-inline-size: 0;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: var(--font-size-md);
}

.app-text-field__input--mono {
  font-family: var(--font-mono);
}

.app-text-field__input::placeholder {
  color: var(--color-text-muted);
}

.app-text-field__input:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.app-text-field__message {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.app-text-field--invalid .app-text-field__message {
  color: var(--color-danger);
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
