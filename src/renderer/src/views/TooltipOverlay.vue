<template>
  <div v-if="content" ref="chip" class="tooltip-overlay" role="tooltip">
    <span class="tooltip-overlay__title">{{ content.title }}</span>
    <span v-if="content.subtitle" class="tooltip-overlay__subtitle">
      {{ content.subtitle }}
    </span>
  </div>
</template>

<script setup>
/**
 * Content of the native tooltip view (route #/tooltip). The view is
 * transparent and main sizes it to the chip, so it never blocks the tabs below.
 */
import { nextTick, onMounted, onUnmounted, ref, useTemplateRef } from "vue";
import { useStoreThemeSync } from "../composables/useStoreThemeSync";

const { tooltip } = window.api;

const chip = useTemplateRef("chip");
const content = ref(null);

useStoreThemeSync();

// Main places the view from the size of the chip, so report it after each draw
const reportSize = async (id) => {
  await nextTick();
  await document.fonts.ready;

  const { width, height } = chip.value.getBoundingClientRect();

  tooltip.reportSize({ id, width: Math.ceil(width), height: Math.ceil(height) });
};

const unsubscribe = tooltip.onContent((next) => {
  content.value = next;
  reportSize(next.id);
});

onMounted(tooltip.ready);
onUnmounted(unsubscribe);
</script>

<style>
/* Unscoped: the page itself must be transparent */
:root body {
  background: transparent;
}
</style>

<style scoped>
.tooltip-overlay {
  display: inline-flex;
  flex-direction: column;
  inline-size: max-content;
  max-inline-size: 60ch;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--color-text);
  color: var(--color-bg);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-tight);
  user-select: none;
}

.tooltip-overlay__title,
.tooltip-overlay__subtitle {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tooltip-overlay__subtitle {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
}
</style>
