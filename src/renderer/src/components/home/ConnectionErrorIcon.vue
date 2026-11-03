<template>
  <span
    ref="root"
    class="connection-error-icon"
    role="img"
    :aria-label="`Last connection failed: ${message}`"
    @pointerenter="showTip"
    @pointerleave="tooltip.hide"
  >
    <TriangleAlert :size="14" aria-hidden="true" />
  </span>
</template>

<script setup>
/** Error colored alert for a saved connection whose last attempt failed. The tooltip shows why. */
import { useTemplateRef } from "vue";
import { TriangleAlert } from "@lucide/vue";
import { useNativeTooltip } from "../../composables/useNativeTooltip";

const props = defineProps({
  message: { type: String, required: true },
});

const root = useTemplateRef("root");
const tooltip = useNativeTooltip();

const showTip = () =>
  tooltip.show(root.value, { title: "Last connection failed", subtitle: props.message });
</script>

<style scoped>
.connection-error-icon {
  display: inline-flex;
  flex: none;
  color: var(--color-danger);
}
</style>
