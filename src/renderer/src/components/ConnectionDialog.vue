<template>
  <AppDialog
    v-model:open="open"
    :title="mode === 'new' ? 'New connection' : 'Edit connection'"
    fullscreen-on-small
    max-width="80ch"
  >
    <ConnectionForm
      :properties="connection"
      :mode="mode"
      @save="finish('save', $event)"
      @connect="finish('connect', $event)"
      @connect-temp="finish('connect-temp', $event)"
      @cancel="open = false"
    />
  </AppDialog>
</template>

<script setup>
/**
 * Dialog around `ConnectionForm`. Closes itself after any action.
 * The form is built when the dialog opens, so set `connection` before opening.
 */
import AppDialog from "./ui/AppDialog.vue";
import ConnectionForm from "./ConnectionForm.vue";

defineProps({
  connection: { type: Object, required: true },
  mode: { type: String, default: "edit" },
});

const emit = defineEmits(["save", "connect", "connect-temp"]);

const open = defineModel("open", { type: Boolean, default: false });

function finish(event, data) {
  emit(event, data);
  open.value = false;
}
</script>
