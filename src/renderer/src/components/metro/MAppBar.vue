<template>
  <div
    ref="bar"
    class="m-app-bar"
    :class="{
      'm-app-bar--expanded': expanded,
      'm-app-bar--with-secondary': $slots.secondary,
    }"
    role="toolbar"
    aria-orientation="horizontal"
    :aria-label="ariaLabel"
    @contextmenu.prevent="toggle"
    @keydown.esc="collapse"
    @keydown="moveFocus"
    @focusin="rememberFocus"
  >
    <div class="m-app-bar__primary">
      <div class="m-app-bar__group">
        <slot name="context" />
      </div>
      <div class="m-app-bar__group">
        <slot name="global" />
        <MButton
          v-if="collapsible"
          variant="round"
          icon="more"
          aria-label="More commands"
          :aria-expanded="expanded"
          @click="toggle"
        />
      </div>
    </div>
    <div
      v-if="$slots.secondary"
      class="m-app-bar__secondary"
      :inert="!expanded"
    >
      <slot name="secondary" />
    </div>
  </div>
</template>

<script setup>
import { onUpdated, ref } from "vue";
import MButton from "./MButton.vue";

const ARROW_STEPS = { ArrowLeft: -1, ArrowRight: 1 };
const ENABLED_BUTTONS = "button:not(:disabled)";

/**
 * Metro app bar, pinned to the bottom of its (positioned) parent.
 * Collapsed: round icon buttons only. Expanded: captions plus the `secondary` text commands.
 * Toggled by "…", right-click on the bar, or the `expanded` model. Esc collapses.
 * With `collapsible` off, the bar keeps its `expanded` state.
 */
const props = defineProps({
  ariaLabel: { type: String, default: "Commands" },
  /** False: no "…" button and no toggling; the bar stays as set by `expanded`. */
  collapsible: { type: Boolean, default: true },
});

const expanded = defineModel("expanded", { type: Boolean, default: false });
const bar = ref(null);
let lastFocused = null;

const reachableButtons = () =>
  [...bar.value.querySelectorAll(ENABLED_BUTTONS)].filter(
    (button) => !button.closest("[inert]")
  );

function toggle() {
  if (!props.collapsible) return;
  expanded.value = !expanded.value;
}

/** Esc collapses the bar. Focus in the secondary row (about to go inert) moves to the first button. */
function collapse() {
  if (!props.collapsible) return;
  expanded.value = false;

  const secondary = bar.value.querySelector(".m-app-bar__secondary");
  if (secondary?.contains(document.activeElement))
    reachableButtons()[0]?.focus();
}

function rememberFocus(event) {
  lastFocused = event.target;
}

// A command that was just removed (e.g. "Edit" after the selection ends) must not strand the focus
onUpdated(() => {
  if (!lastFocused || lastFocused.isConnected) return;

  lastFocused = null;
  if (document.activeElement === document.body) reachableButtons()[0]?.focus();
});

/** Arrow keys, Home and End move focus between the enabled, reachable buttons. */
function moveFocus(event) {
  const buttons = reachableButtons();
  const current = buttons.indexOf(document.activeElement);
  if (current === -1) return;

  const target =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? buttons.length - 1
        : current + (ARROW_STEPS[event.key] ?? 0);
  if (target === current || !buttons[target]) {
    if (event.key in ARROW_STEPS) event.preventDefault();
    return;
  }
  event.preventDefault();
  buttons[target].focus();
}
</script>

<style scoped>
.m-app-bar {
  --app-bar-collapsed-height: 56px;
  --app-bar-primary-expanded-height: 76px;

  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
  box-sizing: border-box;
  height: var(--app-bar-collapsed-height);
  overflow: hidden;
  border-top: 1px solid var(--m-border);
  background: var(--m-surface);
  color: var(--m-fg);
  font: var(--m-font-body);
  transition: height var(--m-duration-fast) var(--m-ease);
}

.m-app-bar--expanded {
  height: var(--app-bar-primary-expanded-height);
}

.m-app-bar--expanded.m-app-bar--with-secondary {
  height: calc(var(--app-bar-primary-expanded-height) + 40px);
}

.m-app-bar__primary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 4px var(--m-unit);
}

/* Collapsed: even space above and below the 40 px buttons */
.m-app-bar:not(.m-app-bar--expanded) .m-app-bar__primary {
  padding-block: 8px;
}

.m-app-bar__group {
  display: flex;
  align-items: flex-start;
  gap: var(--m-unit);
}

.m-app-bar__secondary {
  display: flex;
  justify-content: flex-end;
  gap: var(--m-subunit);
  padding: 0 var(--m-unit);
}

/* Collapsed: captions stay in the accessibility tree but leave the layout */
.m-app-bar:not(.m-app-bar--expanded) :deep(.m-button__caption) {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .m-app-bar {
    transition: none;
  }
}
</style>
