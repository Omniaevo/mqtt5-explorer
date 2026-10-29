<template>
  <div class="m-check" :class="{ 'm-check--disabled': disabled }">
    <CheckboxRoot
      :id="id"
      v-model="model"
      class="m-check__box"
      :disabled="disabled"
    >
      <CheckboxIndicator class="m-check__indicator">
        <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
          <path
            d="M1.5 6.5 4.5 9.5 10.5 2.5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          />
        </svg>
      </CheckboxIndicator>
    </CheckboxRoot>
    <label v-if="label" class="m-check__label" :for="id">{{ label }}</label>
  </div>
</template>

<script setup>
import { useId } from "vue";
import { CheckboxIndicator, CheckboxRoot } from "reka-ui";

/** Metro check box (Reka Checkbox): square box, accent fill when checked. */
defineProps({
  label: { type: String, default: "" },
  disabled: { type: Boolean, default: false },
});

const model = defineModel({ type: Boolean, default: false });
const id = useId();
</script>

<style scoped>
.m-check {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--m-subunit) * 2);
  font: var(--m-font-body);
  color: var(--m-fg);
}

.m-check--disabled {
  opacity: 0.4;
}

.m-check__box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 2px solid var(--m-fg);
  border-radius: 0;
  background: transparent;
  color: var(--m-on-accent);
  cursor: pointer;
}

.m-check__box[data-state="checked"] {
  background: var(--m-accent);
  border-color: var(--m-accent);
}

.m-check__box:hover:not([data-disabled]):not([data-state="checked"]) {
  background: color-mix(in srgb, var(--m-fg) 12%, transparent);
}

.m-check__box:focus-visible {
  outline: 1px dotted currentColor;
  outline-offset: 2px;
}

.m-check__box[data-disabled] {
  cursor: default;
}

.m-check__indicator {
  display: inline-flex;
}
</style>
