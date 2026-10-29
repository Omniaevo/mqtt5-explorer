<template>
  <MToggleGroup
    v-model="mode"
    :options="SEARCH_MODE_OPTIONS"
    aria-label="Search mode"
  />
</template>

<script setup>
import MToggleGroup from "../metro/MToggleGroup.vue";
import { SEARCH_MODE_OPTIONS } from "../../utils/searchModes";

/** Selected search mode, `undefined` when none is selected. */
const mode = defineModel({ type: String, default: undefined });
</script>
