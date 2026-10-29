<template>
  <TooltipProvider :delay-duration="SHOW_DELAY_MS">
    <TooltipRoot v-if="text">
      <TooltipTrigger as-child>
        <slot />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent class="m-tooltip" :side="side" :side-offset="6">
          {{ text }}
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
    <slot v-else />
  </TooltipProvider>
</template>

<script setup>
import {
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from "reka-ui";

const SHOW_DELAY_MS = 500;

/**
 * Metro tooltip (Reka Tooltip). Wraps one element: `<MTooltip text="..."><MButton /></MTooltip>`.
 * An empty `text` renders the slot alone.
 */
defineProps({
  text: { type: String, default: "" },
  side: {
    type: String,
    default: "bottom",
    validator: (value) => ["top", "right", "bottom", "left"].includes(value),
  },
});
</script>

<!-- The tooltip is teleported to <body>, so its styles cannot be scoped -->
<style>
.m-tooltip {
  z-index: 3100;
  box-sizing: border-box;
  max-width: 320px;
  padding: 4px 8px;
  border: var(--m-border-width) solid var(--m-fg-secondary);
  border-radius: 0;
  background: var(--m-surface);
  color: var(--m-fg);
  font: var(--m-font-caption);
  box-shadow: none;
  pointer-events: none;
}
</style>
