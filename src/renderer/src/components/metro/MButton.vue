<template>
  <button
    class="m-button"
    :class="`m-button--${variant}`"
    :type="type"
    :disabled="disabled"
    :aria-label="ariaLabel"
  >
    <template v-if="variant === 'round'">
      <span class="m-button__circle">
        <MIcon v-if="icon" :name="icon" :size="24" />
      </span>
      <span v-if="hasText" class="m-button__caption">
        <slot>{{ label }}</slot>
      </span>
    </template>
    <template v-else>
      <MIcon v-if="icon" :name="icon" />
      <span v-if="hasText"
        ><slot>{{ label }}</slot></span
      >
    </template>
  </button>
</template>

<script setup>
import { computed, useSlots } from "vue";
import MIcon from "./MIcon.vue";

/**
 * Metro button.
 * Variants: standard (2 px border), accent (filled), text (no border),
 * round (app bar: 40 px circle with icon and optional caption).
 * Pressed state inverts foreground and background.
 */
const props = defineProps({
  variant: {
    type: String,
    default: "standard",
    validator: (value) =>
      ["standard", "accent", "text", "round"].includes(value),
  },
  icon: { type: String, default: "" },
  label: { type: String, default: "" },
  disabled: { type: Boolean, default: false },
  type: { type: String, default: "button" },
  /** Required when the button has an icon and no visible text. */
  ariaLabel: { type: String, default: undefined },
});

const slots = useSlots();
const hasText = computed(() => Boolean(props.label || slots.default));

if (import.meta.env.DEV && !hasText.value && !props.ariaLabel) {
  console.warn("[MButton] Icon-only button needs an ariaLabel");
}
</script>

<style scoped>
.m-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--m-subunit);
  box-sizing: border-box;
  min-width: 32px;
  min-height: 32px;
  padding: 4px 12px;
  border: var(--m-border-width) solid var(--m-fg);
  border-radius: 0;
  background: transparent;
  color: var(--m-fg);
  font: var(--m-font-body);
  cursor: pointer;
  user-select: none;
  box-shadow: none;
}

.m-button:hover:not(:disabled) {
  background: color-mix(in srgb, var(--m-fg) 12%, transparent);
}

.m-button:active:not(:disabled) {
  background: var(--m-fg);
  border-color: var(--m-fg);
  color: var(--m-bg);
}

.m-button:focus-visible {
  outline: 1px dotted currentColor;
  outline-offset: 2px;
}

.m-button:disabled {
  opacity: 0.4;
  cursor: default;
}

.m-button--accent {
  background: var(--m-accent);
  border-color: var(--m-accent);
  color: var(--m-on-accent);
}

.m-button--accent:hover:not(:disabled) {
  background: color-mix(in srgb, var(--m-accent) 85%, var(--m-fg));
}

.m-button--text {
  border-color: transparent;
}

/* Round: the circle carries the border and the pressed colors */
.m-button--round {
  flex-direction: column;
  gap: var(--m-subunit);
  padding: 0;
  border: 0;
  background: transparent;
  font: var(--m-font-caption);
}

.m-button--round:hover:not(:disabled),
.m-button--round:active:not(:disabled) {
  background: transparent;
  color: var(--m-fg);
}

.m-button__circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 40px;
  height: 40px;
  border: var(--m-border-width) solid currentColor;
  border-radius: 50%;
}

.m-button--round:hover:not(:disabled) .m-button__circle {
  background: color-mix(in srgb, var(--m-fg) 12%, transparent);
}

.m-button--round:active:not(:disabled) .m-button__circle {
  background: var(--m-fg);
  border-color: var(--m-fg);
  color: var(--m-bg);
}

.m-button--round:focus-visible {
  outline-offset: 4px;
}
</style>
