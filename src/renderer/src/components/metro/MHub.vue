<template>
  <div class="m-hub">
    <h1 class="m-hub__title">{{ title }}</h1>
    <div class="m-hub__sections" @wheel="scrollHorizontally">
      <slot />
    </div>
  </div>
</template>

<script setup>
/**
 * Metro hub (panorama): title at the top-left, sections side by side, scrolling sideways.
 * The vertical mouse wheel scrolls sideways too (P15). Fill the default slot with `MHubSection`.
 */
defineProps({
  title: { type: String, required: true },
});

/** Maps a mostly vertical wheel gesture to horizontal scroll. */
function scrollHorizontally(event) {
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
  event.preventDefault();
  event.currentTarget.scrollLeft += event.deltaY;
}
</script>

<style scoped>
.m-hub {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  color: var(--m-fg);
}

.m-hub__title {
  flex: none;
  margin: 0;
  padding: var(--m-unit) calc(var(--m-unit) * 2) 0;
  font: var(--m-font-hub-title);
}

.m-hub__sections {
  display: flex;
  flex: 1;
  align-items: flex-start;
  gap: calc(var(--m-unit) * 2);
  min-height: 0;
  padding: var(--m-unit) calc(var(--m-unit) * 2);
  overflow: auto hidden;
}
</style>
