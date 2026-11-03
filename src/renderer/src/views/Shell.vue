<template>
  <header
    ref="strip"
    class="shell"
    data-testid="shell-strip"
    @dblclick.self="toggleMaximizeOnLinux"
  >
    <!-- The shell is mounted without App.vue, so it hosts its own provider -->
    <TooltipProvider v-if="!isMacOs" :delay-duration="TOOLTIP_DELAY_MS">
      <AppTooltip text="Menu" side="right">
        <AppButton
          ref="menuButton"
          variant="icon"
          class="shell__menu"
          aria-label="Menu"
          data-testid="shell-menu"
          @click="openMenu"
        >
          <Menu :size="16" aria-hidden="true" />
        </AppButton>
      </AppTooltip>
    </TooltipProvider>

    <div
      v-for="tab in tabs"
      :key="tab.id"
      class="shell__tab"
      :class="{ 'shell__tab--closable': tab.kind !== TabKind.HOME }"
    >
      <AppButton
        class="shell__select"
        :variant="tab.id === activeId ? 'tonal' : 'text'"
        :color="tab.id === activeId ? 'primary' : 'neutral'"
        :data-testid="`tab-${tab.id}`"
        @click="select(tab.id)"
      >
        <span
          v-if="tab.kind === TabKind.CONNECTION"
          class="shell__dot"
          :data-state="tab.state"
          role="img"
          :aria-label="tab.state"
        />
        {{ tab.title }}
      </AppButton>

      <AppButton
        v-if="tab.kind !== TabKind.HOME"
        class="shell__close"
        variant="icon"
        size="sm"
        :aria-label="`Close ${tab.title}`"
        @click="close(tab.id)"
      >
        <X :size="14" aria-hidden="true" />
      </AppButton>
    </div>

    <WindowControls class="shell__controls" />
  </header>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref, useTemplateRef } from "vue";
import { Menu, X } from "@lucide/vue";
import { TooltipProvider } from "reka-ui";
import AppButton from "../components/ui/AppButton.vue";
import AppTooltip from "../components/ui/AppTooltip.vue";
import WindowControls from "../components/WindowControls.vue";
import { useSettingsStore } from "../stores/settings";
import { useThemeSync } from "../composables/useThemeSync";
import { isLinux, isMacOs } from "../utils/platform";
import { TabKind } from "../../../shared/ipcChannels";

const SETTINGS_KEY = "saved_app_settings";
const TOOLTIP_DELAY_MS = 400;

const strip = useTemplateRef("strip");
const menuButton = useTemplateRef("menuButton");
const tabs = ref([]);
const activeId = ref("");

const settings = useSettingsStore();
const { applyAll } = useThemeSync();
const { tabs: tabsApi, store, window: windowApi } = window.api;

const select = (id) => tabsApi.select(id);
const close = (id) => tabsApi.close(id);

const openMenu = () => {
  const { left, bottom } = menuButton.value.$el.getBoundingClientRect();

  windowApi.openMenu({ x: left, y: bottom });
};

// Windows and macOS maximize on a double click of the drag region; Linux does not
const toggleMaximizeOnLinux = () => {
  if (isLinux) windowApi.toggleMaximize();
};

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
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
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

/* Tab buttons look like any other button; the strip keeps room above and below */
.shell__tab {
  position: relative;
  display: flex;
  align-items: center;
  -webkit-app-region: no-drag;
}

/* Room for the close button, so the tab keeps its width on hover */
.shell__tab--closable .shell__select {
  padding-inline-end: calc(var(--space-3) + 1.5rem);
}

/* Inside the tab, at its end; shown only while the tab is hovered or focused */
.shell__close {
  position: absolute;
  inset-inline-end: var(--space-2);
  opacity: 0;
}

.shell__tab:hover .shell__close,
.shell__tab:focus-within .shell__close {
  opacity: 1;
}

/* Connection state; sleeping and disconnected stay muted */
.shell__dot {
  --dot-color: var(--color-text-muted);

  flex: none;
  inline-size: 0.5rem;
  block-size: 0.5rem;
  border-radius: 50%;
  background: var(--dot-color);
}

.shell__dot[data-state="connected"] {
  --dot-color: var(--color-success);
}

.shell__dot[data-state="pending"] {
  --dot-color: var(--color-warning);
}

.shell__dot[data-state="error"] {
  --dot-color: var(--color-danger);
}
</style>
