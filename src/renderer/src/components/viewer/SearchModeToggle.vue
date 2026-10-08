<template>
  <v-btn-toggle
    v-model="mode"
    class="mode-toggle"
    color="primary"
    density="compact"
    variant="outlined"
    divided
  >
    <v-btn
      v-for="option in SEARCH_MODE_OPTIONS"
      :key="option.value"
      :value="option.value"
      :title="option.title"
      class="mode-button px-2"
      @click.stop
    >
      <v-icon :icon="option.icon" size="small" />
    </v-btn>
  </v-btn-toggle>
</template>

<script setup>
import { SEARCH_MODE_OPTIONS } from "../../utils/searchModes";

/** Selected search mode, `undefined` when none is selected. */
const mode = defineModel({ type: String, default: undefined });
</script>

<style scoped>
.mode-toggle {
  height: 32px;
}

.mode-button {
  min-width: 0;
}
</style>
