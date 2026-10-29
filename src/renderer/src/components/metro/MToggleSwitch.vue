<template>
  <div class="m-switch" :class="{ 'm-switch--disabled': disabled }">
    <label v-if="label" class="m-switch__label" :for="id">{{ label }}</label>
    <div class="m-switch__row">
      <SwitchRoot
        :id="id"
        v-model="model"
        class="m-switch__track"
        :disabled="disabled"
        :aria-label="label ? undefined : ariaLabel"
      >
        <SwitchThumb class="m-switch__thumb" />
      </SwitchRoot>
      <span class="m-switch__state" aria-hidden="true">
        {{ model ? onText : offText }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { useId } from "vue";
import { SwitchRoot, SwitchThumb } from "reka-ui";

/** Metro toggle switch (Reka Switch): rectangular track, square thumb, on/off text. */
defineProps({
  label: { type: String, default: "" },
  /** Accessible name when there is no visible `label`. */
  ariaLabel: { type: String, default: undefined },
  onText: { type: String, default: "On" },
  offText: { type: String, default: "Off" },
  disabled: { type: Boolean, default: false },
});

const model = defineModel({ type: Boolean, default: false });
const id = useId();
</script>

<style scoped>
.m-switch {
  display: flex;
  flex-direction: column;
  gap: var(--m-subunit);
  font: var(--m-font-body);
  color: var(--m-fg);
}

.m-switch--disabled {
  opacity: 0.4;
}

.m-switch__row {
  display: flex;
  align-items: center;
  gap: calc(var(--m-subunit) * 2);
}

.m-switch__track {
  position: relative;
  box-sizing: border-box;
  width: 44px;
  height: 20px;
  padding: 0;
  border: var(--m-border-width) solid var(--m-fg);
  border-radius: 0;
  background: transparent;
  cursor: pointer;
}

.m-switch__track[data-state="checked"] {
  background: var(--m-accent);
  border-color: var(--m-accent);
}

.m-switch__track:hover:not([data-disabled]):not([data-state="checked"]) {
  background: color-mix(in srgb, var(--m-fg) 12%, transparent);
}

.m-switch__track:focus-visible {
  outline: 1px dotted currentColor;
  outline-offset: 2px;
}

.m-switch__track[data-disabled] {
  cursor: default;
}

.m-switch__thumb {
  position: absolute;
  top: 0;
  left: 0;
  width: 10px;
  height: 100%;
  background: var(--m-fg);
  transition: transform var(--m-duration-fast) var(--m-ease);
}

.m-switch__track[data-state="checked"] .m-switch__thumb {
  background: var(--m-on-accent);
  transform: translateX(30px);
}

@media (prefers-reduced-motion: reduce) {
  .m-switch__thumb {
    transition: none;
  }
}
</style>
