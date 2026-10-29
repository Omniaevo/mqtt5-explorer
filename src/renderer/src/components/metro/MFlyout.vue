<template>
  <DialogRoot v-model:open="open" :modal="false">
    <DialogPortal>
      <DialogContent
        class="m-flyout"
        :class="`m-flyout--${size}`"
        aria-describedby="undefined"
        @interact-outside="keepWhenStacked"
        @open-auto-focus="focusFirstField"
        @close-auto-focus="restoreFocus"
      >
        <header ref="header" class="m-flyout__header">
          <DialogClose as-child>
            <MButton variant="round" icon="back" aria-label="Back" />
          </DialogClose>
          <DialogTitle class="m-flyout__title">{{ title }}</DialogTitle>
        </header>
        <div ref="body" class="m-flyout__body">
          <slot />
        </div>
        <footer v-if="$slots.footer" class="m-flyout__footer">
          <slot name="footer" />
        </footer>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup>
import { ref } from "vue";
import {
  DialogClose,
  DialogContent,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "reka-ui";
import MButton from "./MButton.vue";
import { useOpenerFocus } from "./useOpenerFocus";

const FOCUSABLE =
  'input, textarea, select, button, [href], [tabindex]:not([tabindex="-1"])';

/**
 * Metro settings flyout (Reka Dialog, non-modal): full-height panel on the right edge.
 * Closes with the back button, Esc or a click outside. The footer slot stays at the bottom.
 */
defineProps({
  title: { type: String, required: true },
  size: {
    type: String,
    default: "narrow",
    validator: (value) => ["narrow", "wide"].includes(value),
  },
});

const open = defineModel("open", { type: Boolean, default: false });
const header = ref(null);
const body = ref(null);

const { restoreFocus } = useOpenerFocus(open);

/** A flyout stacked on top of this one (e.g. search info) must not dismiss it. */
function keepWhenStacked(event) {
  const target = event.detail.originalEvent.target;
  if (target instanceof Element && target.closest(".m-flyout")) {
    event.preventDefault();
  }
}

/** Focus goes to the first field of the body, or to the back button when the body has none. */
function focusFirstField(event) {
  event.preventDefault();
  const target =
    body.value?.querySelector(FOCUSABLE) ?? header.value?.querySelector("button");
  target?.focus();
}
</script>

<!-- The flyout is teleported to <body>, so its styles cannot be scoped -->
<style>
.m-flyout {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  max-width: 100vw;
  border-left: 1px solid var(--m-border);
  border-radius: 0;
  background: var(--m-bg);
  color: var(--m-fg);
  font: var(--m-font-body);
  box-shadow: none;
  animation: m-flyout-in var(--m-duration-normal) var(--m-ease);
}

.m-flyout[data-state="closed"] {
  animation: m-flyout-out var(--m-duration-normal) var(--m-ease) forwards;
}

.m-flyout--narrow {
  width: 346px;
}

.m-flyout--wide {
  width: 646px;
}

.m-flyout:focus {
  outline: none;
}

/* The header is accent colored: remap the tokens so inner controls follow */
.m-flyout__header {
  --m-fg: var(--m-on-accent);
  --m-bg: var(--m-accent);

  display: flex;
  flex: none;
  align-items: center;
  gap: var(--m-unit);
  padding: var(--m-unit);
  background: var(--m-bg);
  color: var(--m-fg);
}

.m-flyout__title {
  margin: 0;
  font: var(--m-font-subheader);
}

.m-flyout__body {
  flex: 1;
  padding: var(--m-unit);
  overflow: auto;
}

.m-flyout__footer {
  display: flex;
  flex: none;
  justify-content: flex-end;
  gap: var(--m-subunit);
  padding: var(--m-unit);
  border-top: 1px solid var(--m-border);
}

@keyframes m-flyout-in {
  from {
    transform: translateX(100%);
  }
}

@keyframes m-flyout-out {
  to {
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .m-flyout,
  .m-flyout[data-state="closed"] {
    animation: none;
  }
}
</style>
