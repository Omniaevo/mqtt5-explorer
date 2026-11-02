<template>
  <label class="app-switch" :class="$attrs.class" :style="$attrs.style">
    <SwitchRoot :id="switchId" v-model="model" class="app-switch__root" v-bind="switchAttrs">
      <SwitchThumb class="app-switch__thumb" />
    </SwitchRoot>
    <span class="app-switch__label">{{ label }}</span>
  </label>
</template>

<script setup>
/**
 * Labeled switch (Reka Switch). The label wraps the control, so a click on the text toggles it.
 * `class` and `style` go to the root label; other attrs (disabled...) go to the switch.
 */
import { computed, useAttrs, useId } from "vue";
import { SwitchRoot, SwitchThumb } from "reka-ui";

defineOptions({ inheritAttrs: false });

defineProps({
  label: { type: String, required: true },
});

const model = defineModel({ type: Boolean, default: false });
const attrs = useAttrs();

const switchId = useId();
const ROOT_ATTRS = ["class", "style"];
const switchAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([name]) => !ROOT_ATTRS.includes(name))),
);
</script>

<style scoped>
.app-switch {
  --switch-width: 2rem;
  --switch-padding: 2px;

  display: inline-flex;
  align-items: center;
  gap: var(--space-4);
  cursor: pointer;
}

.app-switch__root {
  flex: none;
  inline-size: var(--switch-width);
  block-size: 1.125rem;
  padding: var(--switch-padding);
  border: 0;
  border-radius: 999px;
  background: var(--color-border);
  cursor: inherit;
  transition: background-color var(--duration-fast) var(--easing);
}

.app-switch__root:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 1px;
}

.app-switch__root[data-state="checked"] {
  background: var(--color-primary);
}

.app-switch__root:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.app-switch__thumb {
  display: block;
  inline-size: calc(1.125rem - 2 * var(--switch-padding));
  block-size: calc(1.125rem - 2 * var(--switch-padding));
  border-radius: 50%;
  background: var(--color-on-primary);
  transition: translate var(--duration-fast) var(--easing);
}

.app-switch__thumb[data-state="checked"] {
  translate: calc(var(--switch-width) - 1.125rem) 0;
}

.app-switch__label {
  font-size: var(--font-size-md);
}
</style>
