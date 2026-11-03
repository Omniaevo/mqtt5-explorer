<template>
  <AppTooltip :text="message">
    <span
      class="connection-error-icon"
      role="img"
      :aria-label="message"
    >
      <TriangleAlert :size="16" aria-hidden="true" />
    </span>
  </AppTooltip>
</template>

<script setup>
/** Error colored alert for a saved connection whose last attempt failed. The tooltip shows why. */
import { TriangleAlert } from "@lucide/vue";
import AppTooltip from "../ui/AppTooltip.vue";

defineProps({
  message: { type: String, required: true },
});
</script>

<style scoped>
.connection-error-icon {
  display: flex;
  flex: none;
  align-items: center;
  color: var(--color-danger);
}

/* An inline svg sits on the text baseline: make it a block to center it */
.connection-error-icon > svg {
  display: block;
}
</style>
