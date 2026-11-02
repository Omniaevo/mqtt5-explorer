<template>
  <header class="app-header">
    <div class="app-header__start"><slot name="start" /></div>
    <div class="app-header__title"><slot /></div>
    <div class="app-header__end"><slot name="end" /></div>
  </header>
</template>

<script setup>
/**
 * Page header bar of height `--header-height`.
 * Slots: `start` (left), default (title, grows), `end` (right).
 * Not a window drag region: the app uses the native frame.
 */
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  flex: none;
  gap: var(--space-4);
  min-block-size: var(--header-height);
  padding-inline: var(--space-4);
  border-block-end: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
}

.app-header__start,
.app-header__end {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.app-header__start:empty,
.app-header__end:empty {
  display: none;
}

.app-header__title {
  display: flex;
  align-items: center;
  flex: 1;
  min-inline-size: 0;
}
</style>
