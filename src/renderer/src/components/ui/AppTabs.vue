<template>
  <TabsRoot v-model="activeTab" class="app-tabs" :orientation="orientation">
    <div class="app-tabs__header">
      <TabsList ref="listRef" class="app-tabs__list" :aria-label="ariaLabel">
        <TabsTrigger
          v-for="tab in tabs"
          :key="tab.value"
          class="app-tabs__trigger"
          :value="tab.value"
          :disabled="tab.disabled"
          :hidden="tab.hidden"
        >
          <span class="app-tabs__label">{{ tab.label }}</span>
        </TabsTrigger>
        <TabsIndicator class="app-tabs__indicator" />
      </TabsList>
      <slot name="list-end" />
    </div>

    <!-- Every panel stays in the DOM; its content mounts on first visit and is then kept alive -->
    <TabsContent
      v-for="tab in tabs"
      :key="tab.value"
      class="app-tabs__panel"
      :value="tab.value"
      force-mount
    >
      <slot v-if="isMounted(tab)" :name="tab.value" />
    </TabsContent>
  </TabsRoot>
</template>

<script setup>
/**
 * Tabs (Reka Tabs). Active tab: `v-model`.
 * `tabs`: `{ value, label, disabled?, hidden?, eager? }[]`. `hidden` hides the trigger only.
 * Content slots are named after the tab `value`. Content mounts on first visit and stays mounted;
 * `eager: true` mounts it at once. Slot `list-end` renders beside the tab list.
 * Vertical widths: CSS vars `--app-tabs-list-size` and `--app-tabs-panel-size` (grid tracks).
 * `listElement` (exposed) is the scrollable tab list element.
 */
import { computed, reactive, ref, watch } from "vue";
import { TabsContent, TabsIndicator, TabsList, TabsRoot, TabsTrigger } from "reka-ui";

defineProps({
  tabs: { type: Array, required: true },
  orientation: {
    type: String,
    default: "horizontal",
    validator: (value) => ["horizontal", "vertical"].includes(value),
  },
  ariaLabel: { type: String, default: undefined },
});

const activeTab = defineModel({ type: [String, Number] });

const listRef = ref(null);
const visitedTabs = reactive(new Set());

watch(activeTab, (value) => visitedTabs.add(value), { immediate: true });

function isMounted(tab) {
  return tab.eager || visitedTabs.has(tab.value);
}

defineExpose({ listElement: computed(() => listRef.value?.$el) });
</script>

<style scoped>
.app-tabs {
  display: flex;
  flex-direction: column;
  min-block-size: 0;
  min-inline-size: 0;
}

.app-tabs__header {
  display: flex;
  align-items: center;
  flex: none;
  justify-content: space-between;
  min-inline-size: 0;
}

.app-tabs__list {
  position: relative;
  display: flex;
  min-inline-size: 0;
}

.app-tabs__trigger {
  display: flex;
  align-items: center;
  min-inline-size: 0;
  block-size: var(--header-height);
  padding-inline: var(--space-6);
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  text-align: start;
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--easing);
}

/* `display` above would override the `hidden` attribute */
.app-tabs__trigger[hidden] {
  display: none;
}

.app-tabs__trigger:hover:not(:disabled) {
  background: var(--color-hover);
}

.app-tabs__trigger[data-state="active"] {
  color: var(--color-primary);
}

.app-tabs__trigger:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.app-tabs__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-tabs__indicator {
  position: absolute;
  background: var(--color-primary);
  transition:
    translate var(--duration-normal) var(--easing),
    inline-size var(--duration-normal) var(--easing),
    block-size var(--duration-normal) var(--easing);
}

.app-tabs[data-orientation="horizontal"] .app-tabs__indicator {
  inset-block-end: 0;
  inset-inline-start: 0;
  block-size: 2px;
  inline-size: var(--reka-tabs-indicator-size);
  translate: var(--reka-tabs-indicator-position) 0;
}

.app-tabs[data-orientation="vertical"] .app-tabs__indicator {
  inset-block-start: 0;
  inset-inline-start: 0;
  inline-size: 2px;
  block-size: var(--reka-tabs-indicator-size);
  translate: 0 var(--reka-tabs-indicator-position);
}

/* Vertical: list is a scrolling column left of the panels */
.app-tabs[data-orientation="vertical"] {
  display: grid;
  grid-template-columns: var(--app-tabs-list-size, auto) var(--app-tabs-panel-size, 1fr);
  grid-template-rows: minmax(0, 1fr);
  gap: var(--space-6);
}

.app-tabs[data-orientation="vertical"] .app-tabs__header {
  display: block;
  align-self: stretch;
  block-size: 100%;
  overflow: auto;
  min-block-size: 0;
}

.app-tabs[data-orientation="vertical"] .app-tabs__list {
  flex-direction: column;
}

.app-tabs__panel {
  flex: 1 1 auto;
  min-block-size: 0;
  min-inline-size: 0;
}

/* `force-mount` keeps Reka from setting `hidden`, so hide by state */
.app-tabs__panel[data-state="inactive"] {
  display: none;
}

@media (prefers-reduced-motion: reduce) {
  .app-tabs__indicator {
    transition: none;
  }
}
</style>
