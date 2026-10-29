<template>
  <div class="search-bar">
    <MTextBox
      ref="field"
      v-model="term"
      class="search-bar__field"
      placeholder="Search"
      prefix-icon="search"
      aria-label="Search topics"
    >
      <template #suffix>
        <MButton
          variant="text"
          icon="dismiss"
          aria-label="Close search"
          @click="emit('close')"
        />
      </template>
    </MTextBox>
    <SearchModeToggle v-model="mode" />
    <MButton
      variant="text"
      icon="info"
      aria-label="How to search"
      @click="emit('showInfo')"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import MButton from "../metro/MButton.vue";
import MTextBox from "../metro/MTextBox.vue";
import SearchModeToggle from "./SearchModeToggle.vue";

const emit = defineEmits(["close", "showInfo"]);

const term = defineModel("term", { type: String, default: undefined });
const mode = defineModel("mode", { type: String, default: undefined });

const field = ref(null);

onMounted(() => field.value?.focus());
</script>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: var(--m-subunit);
}

.search-bar__field {
  flex: 1;
  min-width: 0;
}
</style>
