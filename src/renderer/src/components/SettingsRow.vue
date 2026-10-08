<template>
  <div
    class="d-flex flex-column flex-sm-row align-sm-center justify-space-between ga-2 py-2"
  >
    <div class="flex-grow-1">
      <div class="text-body-1">{{ title }}</div>
      <div v-if="description" class="text-caption text-medium-emphasis">
        {{ description }}
      </div>
    </div>
    <div class="d-flex align-center flex-shrink-0">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: "" },
});
</script>
