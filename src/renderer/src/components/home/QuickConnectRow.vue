<template>
  <button class="quick-connect" type="button" @click="emit('connect')">
    <span class="quick-connect__label">Connect to</span>
    <span class="quick-connect__url">{{ url }}</span>
    <ArrowRight :size="16" aria-hidden="true" class="quick-connect__icon" />
  </button>
</template>

<script setup>
/** First row of the Home search when the text is a broker URL: opens a temporary tab. */
import { ArrowRight } from "@lucide/vue";

defineProps({
  url: { type: String, required: true },
});

const emit = defineEmits(["connect"]);
</script>

<style scoped>
.quick-connect {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  inline-size: 100%;
  min-block-size: var(--row-height);
  padding-inline: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface-raised);
  text-align: start;
  transition: background-color var(--duration-fast) var(--easing);
}

.quick-connect:hover {
  background-image: linear-gradient(var(--color-hover), var(--color-hover));
}

.quick-connect__label {
  color: var(--color-text-muted);
}

.quick-connect__url {
  flex: 1;
  min-inline-size: 0;
  overflow: hidden;
  font-family: var(--font-mono);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-connect__icon {
  flex: none;
  color: var(--color-primary);
}
</style>
