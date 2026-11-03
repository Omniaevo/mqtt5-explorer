<template>
  <header ref="strip" class="shell" data-testid="shell-strip">
    <div
      v-for="tab in tabs"
      :key="tab.id"
      class="shell__tab"
      :class="{ 'shell__tab--active': tab.id === activeId }"
    >
      <button
        class="shell__select"
        type="button"
        :data-testid="`tab-${tab.id}`"
        @click="select(tab.id)"
      >
        {{ tab.title }}
        <span v-if="tab.kind === TabKind.CONNECTION" class="shell__state">
          ({{ tab.state }})
        </span>
      </button>

      <button
        v-if="tab.kind !== TabKind.HOME"
        class="shell__close"
        type="button"
        :aria-label="`Close ${tab.title}`"
        @click="close(tab.id)"
      >
        <X :size="14" aria-hidden="true" />
      </button>
    </div>
  </header>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref, useTemplateRef } from "vue";
import { X } from "@lucide/vue";
import { useSettingsStore } from "../stores/settings";
import { useThemeSync } from "../composables/useThemeSync";
import { TabKind } from "../../../shared/ipcChannels";

const SETTINGS_KEY = "saved_app_settings";

const strip = useTemplateRef("strip");
const tabs = ref([]);
const activeId = ref("");

const settings = useSettingsStore();
const { applyAll } = useThemeSync();
const { tabs: tabsApi, store } = window.api;

const select = (id) => tabsApi.select(id);
const close = (id) => tabsApi.close(id);

// The shell only follows the theme: it never loads connections or saves settings
settings.load();
applyAll();

const applyState = (state) => {
  tabs.value = state.tabs;
  activeId.value = state.activeId;
};

// Main needs the strip height to place the views (it changes with font scale).
// A view covering the shell hides it, and a hidden page never fires the
// ResizeObserver: the first height is sent by hand, the observer keeps it up to date.
const reportHeight = () => {
  tabsApi.setStripHeight(strip.value.getBoundingClientRect().height);
};

const resizeObserver = new ResizeObserver(reportHeight);
const unsubscribeState = tabsApi.onState(applyState);
const unsubscribeStore = store.onChanged((key) => {
  if (key !== SETTINGS_KEY) return;

  settings.load();
  applyAll();
});

onMounted(async () => {
  resizeObserver.observe(strip.value);
  applyState(await tabsApi.getState());
  await nextTick();
  reportHeight();
});

onUnmounted(() => {
  resizeObserver.disconnect();
  unsubscribeState();
  unsubscribeStore();
});
</script>

<style scoped>
.shell {
  display: flex;
  align-items: stretch;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4) 0;
  background: var(--color-surface);
  border-block-end: 1px solid var(--color-border);
}

.shell__tab {
  display: flex;
  align-items: center;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  color: var(--color-text-muted);
}

.shell__tab--active {
  background: var(--color-bg);
  color: var(--color-text);
}

.shell__select,
.shell__close {
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.shell__select {
  padding: var(--space-3) var(--space-4);
}

.shell__close {
  display: inline-grid;
  place-items: center;
  margin-inline-end: var(--space-2);
  padding: var(--space-1);
  border-radius: var(--radius-md);
}

.shell__state {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.shell__select:hover,
.shell__close:hover {
  background: var(--color-hover);
}
</style>
