<template>
  <AppToggleGroup v-model="mode" :items="TOGGLE_ITEMS" @click.stop />
</template>

<script setup>
import { SEARCH_MODE_OPTIONS } from "../../utils/searchModes";
import AppToggleGroup from "../ui/AppToggleGroup.vue";

const TOGGLE_ITEMS = SEARCH_MODE_OPTIONS.map(({ value, icon, title }) => ({
  value,
  icon,
  label: title,
  tooltip: title,
}));

/** Selected search mode, `undefined` when none is selected. */
const mode = defineModel({ type: String, default: undefined });
</script>
