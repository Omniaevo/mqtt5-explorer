<template>
  <section
    class="m-hub-section"
    :style="width ? { width: `${width}px` } : undefined"
    :aria-label="title"
  >
    <h2 class="m-hub-section__title">
      {{ title }}
      <MIcon name="chevronRight" :size="20" />
    </h2>
    <div class="m-hub-section__content">
      <slot />
    </div>
  </section>
</template>

<script setup>
import MIcon from "./MIcon.vue";

/** One hub section: lowercase header with a chevron and free content below. */
defineProps({
  title: { type: String, required: true },
  /** Fixed width in px. Omit to fit the content. */
  width: { type: Number, default: undefined },
});
</script>

<style scoped>
.m-hub-section {
  flex: none;
  /* Each section enters a little after the previous one */
  animation: m-entrance var(--m-duration-slow) var(--m-ease) backwards;
  animation-delay: calc((sibling-index() - 1) * 80ms);
}

.m-hub-section__title {
  display: flex;
  align-items: center;
  gap: var(--m-subunit);
  margin: 0 0 var(--m-unit);
  color: var(--m-fg);
  font: var(--m-font-subheader);
  text-transform: lowercase;
}

.m-hub-section__title .m-icon {
  color: var(--m-fg-secondary);
}
</style>
