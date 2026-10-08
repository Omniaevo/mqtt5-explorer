<template>
  <v-text-field
    v-model="term"
    :variant="variant"
    label="Search"
    density="compact"
    append-icon="mdi-information-outline"
    autofocus
    hide-details
    @click:append="emit('showInfo')"
  >
    <template #append-inner>
      <SearchModeToggle v-model="mode" />
      <v-btn
        class="ms-2"
        icon="mdi-close"
        size="x-small"
        variant="text"
        @click="emit('close')"
      />
    </template>
  </v-text-field>
</template>

<script setup>
import SearchModeToggle from "./SearchModeToggle.vue";

defineProps({
  variant: { type: String, default: "outlined" },
});

const emit = defineEmits(["close", "showInfo"]);

const term = defineModel("term", { type: String, default: undefined });
const mode = defineModel("mode", { type: String, default: undefined });
</script>
