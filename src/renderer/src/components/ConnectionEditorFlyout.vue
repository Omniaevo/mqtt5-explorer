<template>
  <MFlyout v-model:open="open" size="wide" :title="title">
    <!-- Keyed by id so a different connection always starts with a fresh form -->
    <ConnectionForm
      v-if="connection"
      :key="connection.id"
      ref="form"
      :properties="connection"
      @connect="emit('connect', $event)"
      @updated="emit('updated', $event)"
    />

    <template #footer>
      <MButton
        v-if="connection?.saved"
        class="editor-flyout__delete"
        variant="text"
        label="Delete"
        @click="emit('delete')"
      />
      <MButton
        label="Save"
        :disabled="!form?.isValid"
        @click="form.submit('updated')"
      />
      <MButton
        variant="accent"
        label="Connect"
        :disabled="!form?.isValid"
        @click="form.submit('connect')"
      />
    </template>
  </MFlyout>
</template>

<script setup>
import { computed, ref } from "vue";
import ConnectionForm from "./ConnectionForm.vue";
import MButton from "./metro/MButton.vue";
import MFlyout from "./metro/MFlyout.vue";

const NEW_CONNECTION_TITLE = "New connection";

/** Wide flyout that edits one connection. Emits `connect` / `updated` with the form copy. */
const props = defineProps({
  connection: { type: Object, default: null },
});

const emit = defineEmits(["connect", "updated", "delete"]);

const open = defineModel("open", { type: Boolean, default: false });
const form = ref(null);

const title = computed(() =>
  props.connection?.saved ? props.connection.name : NEW_CONNECTION_TITLE
);
</script>

<!-- The flyout is teleported to <body>, so its styles cannot be scoped -->
<style>
.editor-flyout__delete {
  margin-right: auto;
  color: var(--m-error-text);
}
</style>
