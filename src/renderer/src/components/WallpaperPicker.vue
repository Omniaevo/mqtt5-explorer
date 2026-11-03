<template>
  <RadioGroupRoot v-model="model" class="wallpaper-picker" aria-label="Wallpaper">
    <RadioGroupItem
      v-for="wallpaper in WALLPAPERS"
      :key="wallpaper.id"
      :value="wallpaper.id"
      class="wallpaper-picker__item"
    >
      <span
        class="wallpaper-picker__swatch"
        :class="wallpaperClasses(wallpaper.id)"
        aria-hidden="true"
      />
      <span class="wallpaper-picker__label">{{ wallpaper.label }}</span>
    </RadioGroupItem>
  </RadioGroupRoot>
</template>

<script setup>
/** Radio group of wallpaper previews. The v-model is a wallpaper id. */
import { RadioGroupItem, RadioGroupRoot } from "reka-ui";
import { WALLPAPERS, wallpaperClasses } from "../utils/wallpapers";

const model = defineModel({ type: String, required: true });
</script>

<style scoped>
.wallpaper-picker {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
  gap: var(--space-5);
  inline-size: 100%;
}

.wallpaper-picker__item {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: 0;
  text-align: start;
}

.wallpaper-picker__swatch {
  display: block;
  block-size: 4rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

/* Checked: 2px primary ring */
.wallpaper-picker__item[data-state="checked"] .wallpaper-picker__swatch {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.wallpaper-picker__item:focus-visible {
  outline: none;
}

.wallpaper-picker__item:focus-visible .wallpaper-picker__swatch {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 1px;
}

.wallpaper-picker__label {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.wallpaper-picker__item[data-state="checked"] .wallpaper-picker__label {
  color: var(--color-text);
  font-weight: var(--font-weight-medium);
}
</style>
