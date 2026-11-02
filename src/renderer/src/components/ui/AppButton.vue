<template>
  <button
    class="app-button"
    :class="[`app-button--${variant}`, `app-button--${color}`, `app-button--${size}`]"
    type="button"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<script setup>
/**
 * Native button. Extra attrs (type, aria-*, events, class) fall through to the root <button>.
 * Icon-only buttons (`variant="icon"`) MUST get an `aria-label`.
 */
defineProps({
  variant: {
    type: String,
    default: "filled",
    validator: (value) => ["filled", "tonal", "text", "icon"].includes(value),
  },
  color: {
    type: String,
    default: "neutral",
    validator: (value) => ["neutral", "primary", "danger"].includes(value),
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md"].includes(value),
  },
  disabled: { type: Boolean, default: false },
});
</script>

<style scoped>
.app-button {
  --button-size: var(--control-height);
  --button-fg: var(--color-text);
  --button-bg: transparent;
  --button-bg-hover: var(--color-hover);
  --button-bg-active: color-mix(in oklab, var(--color-text) 12%, transparent);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  block-size: var(--button-size);
  padding-inline: var(--space-5);
  border: 0;
  border-radius: var(--radius-lg);
  background: var(--button-bg);
  color: var(--button-fg);
  font: inherit;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-tight);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--easing);
}

.app-button:hover:not(:disabled) {
  background: var(--button-bg-hover);
}

.app-button:active:not(:disabled) {
  background: var(--button-bg-active);
}

.app-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* Sizes */
.app-button--sm {
  --button-size: 1.5rem;
  padding-inline: var(--space-4);
  font-size: var(--font-size-sm);
}

/* Colors: text/icon variants use the color as foreground */
.app-button--primary {
  --button-fg: var(--color-primary);
}

.app-button--danger {
  --button-fg: var(--color-danger);
}

/* Variants */
.app-button--icon {
  inline-size: var(--button-size);
  padding-inline: 0;
}

.app-button--filled {
  --button-fg: var(--color-bg);
  --button-bg: var(--color-text);
  --button-bg-hover: color-mix(in oklab, var(--color-text) 85%, var(--color-bg));
  --button-bg-active: color-mix(in oklab, var(--color-text) 70%, var(--color-bg));
}

.app-button--filled.app-button--primary {
  --button-fg: var(--color-on-primary);
  --button-bg: var(--color-primary);
  --button-bg-hover: color-mix(in oklab, var(--color-primary) 85%, var(--color-text));
  --button-bg-active: color-mix(in oklab, var(--color-primary) 70%, var(--color-text));
}

.app-button--filled.app-button--danger {
  --button-fg: var(--color-on-primary);
  --button-bg: var(--color-danger);
  --button-bg-hover: color-mix(in oklab, var(--color-danger) 85%, var(--color-text));
  --button-bg-active: color-mix(in oklab, var(--color-danger) 70%, var(--color-text));
}

.app-button--tonal {
  --button-bg: color-mix(in oklab, var(--button-fg) 14%, var(--color-surface));
  --button-bg-hover: color-mix(in oklab, var(--button-fg) 22%, var(--color-surface));
  --button-bg-active: color-mix(in oklab, var(--button-fg) 30%, var(--color-surface));
}
</style>
