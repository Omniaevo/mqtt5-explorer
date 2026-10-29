<template>
  <MTextBox
    v-model="model"
    :type="revealed ? 'text' : 'password'"
    :disabled="disabled"
  >
    <template #suffix>
      <MButton
        variant="text"
        :icon="revealed ? 'eyeOff' : 'eye'"
        :disabled="disabled"
        aria-label="Show password"
        :aria-pressed="revealed"
        @click="revealed = !revealed"
      />
    </template>
  </MTextBox>
</template>

<script setup>
import { ref } from "vue";
import MButton from "./MButton.vue";
import MTextBox from "./MTextBox.vue";

/** Metro text box with a toggle that reveals the password. Other props go to MTextBox. */
defineProps({
  disabled: { type: Boolean, default: false },
});

const model = defineModel({ type: String, default: "" });
const revealed = ref(false);
</script>
