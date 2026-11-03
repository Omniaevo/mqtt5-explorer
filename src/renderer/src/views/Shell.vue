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
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref, useTemplateRef } from "vue";
import { Menu } from "@lucide/vue";
import AppButton from "../components/ui/AppButton.vue";
import TabStrip from "../components/shell/TabStrip.vue";
import WindowControls from "../components/WindowControls.vue";
import { useNativeTooltip } from "../composables/useNativeTooltip";
import { useStoreThemeSync } from "../composables/useStoreThemeSync";
import { isLinux, isMacOs } from "../utils/platform";

const strip = useTemplateRef("strip");
const menuButton = useTemplateRef("menuButton");
const tabs = ref([]);
const activeId = ref("");

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

onMounted(async () => {
  resizeObserver.observe(strip.value);
  applyState(await tabsApi.getState());
  await nextTick();
  reportHeight();
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

/* Always on the right, after the drag space */
.shell__controls {
  align-self: center;
  margin-inline-start: auto;
}
</style>
