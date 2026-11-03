<template>
  <div
    ref="root"
    class="tab-strip-item"
    :class="{
      'tab-strip-item--active': active,
      'tab-strip-item--icon-only': isHome,
    }"
  >
    <button
      class="tab-strip-item__select"
      type="button"
      role="tab"
      :aria-selected="active"
      :aria-label="isHome ? tab.title : undefined"
      :tabindex="active ? 0 : -1"
      :data-testid="`tab-${tab.id}`"
      @click="emit('select')"
      @pointerenter="showTip"
      @pointerleave="hideTip"
      @pointerdown="hideTip"
      @focus="showTipOnKeyboardFocus"
      @blur="hideTip"
    >
      <House v-if="isHome" :size="16" aria-hidden="true" />
      <Settings v-else-if="isSettings" :size="16" aria-hidden="true" />
      <span
        v-else
        class="tab-strip-item__dot"
        :data-state="tab.state"
        role="img"
        :aria-label="tab.state"
      />
      <span v-if="!isHome" class="tab-strip-item__name">{{ tab.title }}</span>
    </button>

    <!-- Mouse only: the keyboard closes the active tab with the menu shortcut -->
    <AppButton
      v-if="!isHome"
      class="tab-strip-item__close"
      variant="icon"
      size="sm"
      tabindex="-1"
      :aria-label="`Close ${tab.title}`"
      @click="emit('close')"
    >
      <X :size="14" aria-hidden="true" />
    </AppButton>
  </div>
</template>

<script setup>
/**
 * One tab of the strip: a select button and, except for Home, a close button.
 * It only draws the tab; the strip and main own the state.
 */
import { computed, useTemplateRef } from "vue";
import { House, Settings, X } from "@lucide/vue";
import AppButton from "../ui/AppButton.vue";
import { useNativeTooltip } from "../../composables/useNativeTooltip";
import { TabKind } from "../../../../shared/ipcChannels";

const props = defineProps({
  tab: { type: Object, required: true },
  active: { type: Boolean, default: false },
});

const emit = defineEmits(["select", "close"]);

const isHome = computed(() => props.tab.kind === TabKind.HOME);
const isSettings = computed(() => props.tab.kind === TabKind.SETTINGS);

const root = useTemplateRef("root");
const nativeTooltip = useNativeTooltip();

const showTip = () =>
  nativeTooltip.show(root.value, { title: props.tab.title, subtitle: props.tab.url });
const hideTip = nativeTooltip.hide;

// A click focuses the tab too: only keyboard focus opens the tooltip
const showTipOnKeyboardFocus = (event) => {
  if (event.target.matches(":focus-visible")) showTip();
};
</script>

<style scoped>
.tab-strip-item {
  --tab-bg: transparent;
  --tab-bg-hover: var(--color-hover);

  display: flex;
  align-items: center;
  flex: 0 1 24ch;
  min-inline-size: 12ch;
  block-size: var(--control-height);
  border-radius: var(--radius-lg);
  background: var(--tab-bg);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-tight);
  transition: background-color var(--duration-fast) var(--easing);
}

.tab-strip-item:hover {
  background: var(--tab-bg-hover);
}

/* Same tonal look as a primary tonal button */
.tab-strip-item--active {
  --tab-bg: color-mix(in oklab, var(--color-primary) 14%, var(--color-surface));
  --tab-bg-hover: color-mix(in oklab, var(--color-primary) 22%, var(--color-surface));

  color: var(--color-primary);
}

.tab-strip-item--icon-only {
  flex: none;
  min-inline-size: 0;
}

.tab-strip-item__select {
  display: flex;
  align-items: center;
  flex: 1;
  gap: var(--space-3);
  min-inline-size: 0;
  block-size: 100%;
  padding-inline: var(--space-4);
  border-radius: inherit;
  color: inherit;
  font: inherit;
  text-align: start;
}

/* Keep the focus ring inside the clipped list */
.tab-strip-item__select:focus-visible {
  outline-offset: -2px;
}

.tab-strip-item__name {
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* The close button always takes its space, so the name does not jump on hover */
.tab-strip-item__close {
  flex: none;
  margin-inline-end: var(--space-2);
  opacity: 0;
}

.tab-strip-item:hover .tab-strip-item__close,
.tab-strip-item:focus-within .tab-strip-item__close,
.tab-strip-item--active .tab-strip-item__close {
  opacity: 1;
}

/* Connection state; sleeping and disconnected are hollow and muted */
.tab-strip-item__dot {
  --dot-color: var(--color-text-muted);

  flex: none;
  inline-size: 0.5rem;
  block-size: 0.5rem;
  border: 1px solid var(--dot-color);
  border-radius: var(--radius-sm);
}

.tab-strip-item__dot[data-state="connected"],
.tab-strip-item__dot[data-state="pending"],
.tab-strip-item__dot[data-state="error"] {
  background: var(--dot-color);
}

.tab-strip-item__dot[data-state="connected"] {
  --dot-color: var(--color-success);
}

.tab-strip-item__dot[data-state="pending"] {
  --dot-color: var(--color-warning);

  animation: tab-strip-item-pulse 1s var(--easing) infinite alternate;
}

.tab-strip-item__dot[data-state="error"] {
  --dot-color: var(--color-danger);
}

@keyframes tab-strip-item-pulse {
  from {
    opacity: 1;
  }

  to {
    opacity: 0.3;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tab-strip-item__dot[data-state="pending"] {
    animation: none;
  }
}
</style>
