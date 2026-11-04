<template>
  <AppTextField ref="field" v-model="term" label="Search" label-hidden>
    <template #append-inner>
      <SearchModeToggle v-model="mode" />
      <AppButton variant="icon" size="sm" aria-label="Close search" @click="emit('close')">
        <X :size="16" aria-hidden="true" />
      </AppButton>
      <AppButton variant="icon" size="sm" aria-label="Search help" @click="emit('showInfo')">
        <Info :size="16" aria-hidden="true" />
      </AppButton>
    </template>
  </AppTextField>
</template>

<script setup>
import { onMounted, useTemplateRef } from "vue";
import { Info, X } from "@lucide/vue";
import AppButton from "../ui/AppButton.vue";
import AppTextField from "../ui/AppTextField.vue";
import SearchModeToggle from "./SearchModeToggle.vue";

const emit = defineEmits(["close", "showInfo"]);

const term = defineModel("term", { type: String, default: undefined });
const mode = defineModel("mode", { type: String, default: undefined });

// The `autofocus` attribute works only once per document, so focus on each open
const field = useTemplateRef("field");
onMounted(() => field.value.focus());
</script>
