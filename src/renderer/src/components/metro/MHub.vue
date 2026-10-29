<template>
  <div class="m-hub">
    <header class="m-hub__header">
      <h1 class="m-hub__title">{{ title }}</h1>
      <slot name="header-end" />
    </header>
    <div class="m-hub__sections" @wheel="scrollHorizontally">
      <slot />
    </div>
  </div>
</template>

<script setup>
/**
 * Metro hub (panorama): title at the top-left, sections side by side, scrolling sideways.
 * The vertical mouse wheel scrolls sideways too (P15). Fill the default slot with `MHubSection`;
 * the `header-end` slot sits at the top-right (e.g. a search box).
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

.m-hub__header {
  display: flex;
  flex: none;
  align-items: flex-end;
  justify-content: space-between;
  gap: calc(var(--m-unit) * 2);
  padding: var(--m-unit) calc(var(--m-unit) * 2) 0;
}

.m-hub__title {
  margin: 0;
  font: var(--m-font-hub-title);
}

.m-hub__sections {
  display: flex;
  flex: 1;
  /* Sections take the full height so their content can fill the rows that fit */
  align-items: stretch;
  gap: calc(var(--m-unit) * 2);
  min-height: 0;
  padding: var(--m-unit) calc(var(--m-unit) * 2);
  overflow: auto hidden;
}
</style>
