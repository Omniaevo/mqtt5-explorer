<template>
  <!-- eslint-disable vue/no-v-html -- bundled SVG, never user input -->
  <span
    v-if="svg"
    class="m-icon"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
    v-html="svg"
  />
  <!-- eslint-enable vue/no-v-html -->
</template>

<script setup>
import { computed } from "vue";
import { ICONS } from "./icons";

const LARGE_VARIANT_MIN_SIZE = 24;

const props = defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 20 },
});

const svg = computed(() => {
  const variants = ICONS[props.name];
  if (!variants) {
    if (import.meta.env.DEV) console.warn(`[MIcon] Unknown icon "${props.name}"`);
    return "";
  }
  const wantsLarge = props.size >= LARGE_VARIANT_MIN_SIZE;
  return (wantsLarge && variants[24]) || variants[20];
});
</script>

<style scoped>
.m-icon {
  display: inline-flex;
  flex: none;
  fill: currentColor;
}

.m-icon :deep(svg) {
  width: 100%;
  height: 100%;
}
</style>
