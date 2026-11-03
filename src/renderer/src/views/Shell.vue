<template>
  <header
    ref="strip"
    class="shell"
    data-testid="shell-strip"
    @dblclick.self="toggleMaximizeOnLinux"
  >
    <AppButton
      v-if="!isMacOs"
      ref="menuButton"
      variant="icon"
      class="shell__menu"
      aria-label="Menu"
      data-testid="shell-menu"
      @click="openMenu"
      @pointerenter="showMenuTip"
      @pointerleave="menuTip.hide"
      @pointerdown="menuTip.hide"
      @focus="showMenuTipOnKeyboardFocus"
      @blur="menuTip.hide"
    >
      <Menu :size="16" aria-hidden="true" />
    </AppButton>

    <TabStrip
      :tabs="tabs"
      :active-id="activeId"
      @select="select"
      @close="close"
      @context-menu="openTabMenu"
    />

    <WindowControls class="shell__controls" />
  </header>

  <!-- Below the tab views: the part of the window the shell page paints itself -->
  <footer ref="statusBar" class="status-bar" data-testid="status-bar">
    <div class="status-bar__client-id">
      <span>Client ID:</span>
      <span class="status-bar__client-id-value">{{ settings.clientId }}</span>
    </div>

    <div class="status-bar__version">v{{ version }}</div>
  </footer>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref, useTemplateRef } from "vue";
import { Menu } from "@lucide/vue";
import AppButton from "../components/ui/AppButton.vue";
import TabStrip from "../components/shell/TabStrip.vue";
import WindowControls from "../components/WindowControls.vue";
import { useNativeTooltip } from "../composables/useNativeTooltip";
import { useStoreThemeSync } from "../composables/useStoreThemeSync";
import { useSettingsStore } from "../stores/settings";
import { isLinux, isMacOs } from "../utils/platform";

const strip = useTemplateRef("strip");
const statusBar = useTemplateRef("statusBar");
const menuButton = useTemplateRef("menuButton");
const tabs = ref([]);
const activeId = ref("");

const version = import.meta.env.VITE_APP_VERSION;
const { tabs: tabsApi, window: windowApi } = window.api;

const select = (id) => tabsApi.select(id);
const close = (id) => tabsApi.close(id);
const openTabMenu = (id) => tabsApi.openContextMenu(id);

const menuTip = useNativeTooltip();
const showMenuTip = () => menuTip.show(menuButton.value.$el, { title: "Menu" });

// A click focuses the button too: only keyboard focus opens the tooltip
const showMenuTipOnKeyboardFocus = (event) => {
  if (event.target.matches(":focus-visible")) showMenuTip();
};

const openMenu = () => {
  const { left, bottom } = menuButton.value.$el.getBoundingClientRect();

  windowApi.openMenu({ x: left, y: bottom });
};

// Windows and macOS maximize on a double click of the drag region; Linux does not
const toggleMaximizeOnLinux = () => {
  if (isLinux) windowApi.toggleMaximize();
};

// The shell only follows the theme: it never loads connections or saves settings
useStoreThemeSync();
const settings = useSettingsStore();

const applyState = (state) => {
  tabs.value = state.tabs;
  activeId.value = state.activeId;
};

// Main needs the bar heights to place the views between them (they change with
// font scale). A view covering the shell hides it, and a hidden page never fires
// the ResizeObserver: the first heights are sent by hand, the observer keeps them up to date.
const reportHeights = () => {
  tabsApi.setStripHeight(strip.value.getBoundingClientRect().height);
  tabsApi.setStatusBarHeight(statusBar.value.getBoundingClientRect().height);
};

const resizeObserver = new ResizeObserver(reportHeights);
const unsubscribeState = tabsApi.onState(applyState);

onMounted(async () => {
  resizeObserver.observe(strip.value);
  resizeObserver.observe(statusBar.value);
  applyState(await tabsApi.getState());
  await nextTick();
  reportHeights();
});

onUnmounted(() => {
  resizeObserver.disconnect();
  unsubscribeState();
});
</script>

<style scoped>
.shell {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  block-size: var(--header-height);
  padding-inline: var(--space-4);
  background: var(--color-surface);
  border-block-end: 1px solid var(--color-border);
  /* The empty strip drags the window (D24); interactive children opt out */
  -webkit-app-region: drag;
}

.shell__menu {
  align-self: center;
  -webkit-app-region: no-drag;
}

/* Fixed to the window bottom, like the strip is at the top */
.status-bar {
  position: fixed;
  inset-inline: 0;
  inset-block-end: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-4);
  background: var(--color-surface);
  border-block-start: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.status-bar__client-id {
  display: flex;
  gap: var(--space-4);
  align-items: center;
}

.status-bar__client-id-value {
  font-family: var(--font-mono);
  color: var(--color-primary);
  font-weight: var(--font-weight-bold);
}

/* Always on the right, after the drag space */
.shell__controls {
  align-self: center;
  margin-inline-start: auto;
}
</style>
