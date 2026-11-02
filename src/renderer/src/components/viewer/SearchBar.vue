<template>
  <v-text-field
    v-model="term"
    variant="outlined"
    label="Search"
    density="compact"
    :append-icon="Info"
    autofocus
    hide-details
    @click:append="emit('showInfo')"
  >
    <template #append-inner>
      <SearchModeToggle v-model="mode" />
      <v-btn
        class="ms-2"
        :icon="X"
        size="x-small"
        variant="text"
        @click="emit('close')"
      />
    </template>
  </v-text-field>
</template>

<script setup>
import { Info, X } from "@lucide/vue";
import SearchModeToggle from "./SearchModeToggle.vue";

const emit = defineEmits(["close", "showInfo"]);

const term = defineModel("term", { type: String, default: undefined });
const mode = defineModel("mode", { type: String, default: undefined });
</script>
