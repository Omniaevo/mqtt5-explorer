<template>
  <div class="app-textarea" :class="[$attrs.class, { 'app-textarea--invalid': error }]" :style="$attrs.style">
    <label class="app-textarea__label" :for="inputId">{{ label }}</label>
    <textarea
      :id="inputId"
      v-model="model"
      class="app-textarea__input"
      v-bind="inputAttrs"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="messageId"
    />
    <p v-if="error || hint" :id="messageId" class="app-textarea__message">
      {{ error || hint }}
    </p>
  </div>
</template>

<script setup>
/**
 * Labeled native textarea. `class` and `style` go to the root wrapper;
 * every other attr (rows, placeholder, readonly...) goes to the <textarea>.
 * Validation is owned by the parent: pass the message in `error`.
 */
import { computed, useAttrs, useId } from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  label: { type: String, required: true },
  hint: { type: String, default: undefined },
  error: { type: String, default: undefined },
});

const model = defineModel({ type: String, default: undefined });
const attrs = useAttrs();

const inputId = useId();
const messageId = computed(() => (props.error || props.hint ? `${inputId}-message` : undefined));
const ROOT_ATTRS = ["class", "style"];
const inputAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([name]) => !ROOT_ATTRS.includes(name))),
);
</script>

<style scoped>
.app-textarea {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-inline-size: 0;
}

.app-textarea__label {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.app-textarea__input {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-raised);
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: var(--font-size-md);
  line-height: var(--line-height-normal);
  resize: vertical;
  transition: border-color var(--duration-fast) var(--easing);
}

.app-textarea__input:hover {
  border-color: var(--color-text-muted);
}

.app-textarea__input:focus {
  border-color: var(--color-primary);
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 1px;
}

.app-textarea--invalid .app-textarea__input {
  border-color: var(--color-danger);
}

.app-textarea__message {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.app-textarea--invalid .app-textarea__message {
  color: var(--color-danger);
}
</style>
