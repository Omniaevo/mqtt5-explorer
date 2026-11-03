<template>
  <span class="state-dot" :data-state="state" role="img" :aria-label="`Tab ${state}`" />
</template>

<script setup>
/** Small square for the state of an open connection tab. Sleeping and disconnected are hollow. */
defineProps({
  state: { type: String, required: true },
});
</script>

<style scoped>
.state-dot {
  --dot-color: var(--color-text-muted);

  flex: none;
  inline-size: 0.5rem;
  block-size: 0.5rem;
  border: 1px solid var(--dot-color);
  border-radius: var(--radius-sm);
}

.state-dot[data-state="connected"],
.state-dot[data-state="pending"],
.state-dot[data-state="error"] {
  background: var(--dot-color);
}

.state-dot[data-state="connected"] {
  --dot-color: var(--color-success);
}

.state-dot[data-state="pending"] {
  --dot-color: var(--color-warning);

  animation: state-dot-pulse 1s var(--easing) infinite alternate;
}

.state-dot[data-state="error"] {
  --dot-color: var(--color-danger);
}

@keyframes state-dot-pulse {
  from {
    opacity: 1;
  }

  to {
    opacity: 0.3;
  }
}

@media (prefers-reduced-motion: reduce) {
  .state-dot[data-state="pending"] {
    animation: none;
  }
}
</style>
