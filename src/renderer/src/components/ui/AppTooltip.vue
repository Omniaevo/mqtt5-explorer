<template>
  <TooltipRoot>
    <TooltipTrigger as-child>
      <slot />
    </TooltipTrigger>
    <TooltipPortal>
      <TooltipContent class="app-tooltip" :side="side" :side-offset="SIDE_OFFSET_PX">
        {{ text }}
        <TooltipArrow class="app-tooltip__arrow" />
      </TooltipContent>
    </TooltipPortal>
  </TooltipRoot>
</template>

<script setup>
/**
 * Tooltip around its single default-slot element (the trigger, via `as-child`).
 * Needs one `TooltipProvider` above it (see App.vue).
 */
import { TooltipArrow, TooltipContent, TooltipPortal, TooltipRoot, TooltipTrigger } from "reka-ui";

const SIDE_OFFSET_PX = 4;

defineProps({
  text: { type: String, required: true },
  side: {
    type: String,
    default: "bottom",
    validator: (value) => ["top", "right", "bottom", "left"].includes(value),
  },
});
</script>

<style>
/* Unscoped: the content is teleported out of the component */
.app-tooltip {
  /* `position` is needed: Reka copies the computed z-index to its wrapper, and it is `auto` when static */
  position: relative;
  z-index: 3000;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--color-text);
  color: var(--color-bg);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-tight);
  user-select: none;
}

.app-tooltip__arrow {
  fill: var(--color-text);
}
</style>
