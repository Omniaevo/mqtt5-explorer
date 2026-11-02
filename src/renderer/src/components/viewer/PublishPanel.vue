<template>
  <div class="publish-panel">
    <AppTextField v-model="form.topic" label="Topic" placeholder="example/topic" />
    <AppTextarea v-model="form.payload" label="Value" rows="2" />
    <div class="form-row form-row--end form-row--right">
      <AppSwitch v-model="form.retain" label="Retain" />
      <AppSelect v-model="form.qos" :items="QOS_LEVELS" label="QoS" class="qos-input" />
    </div>

    <template v-if="isV5">
      <hr class="separator" />
      <h3 class="section-title">Properties</h3>
      <AppTextField v-model="form.properties.contentType" label="Content type" />
      <AppSwitch v-model="advancedProperties" label="Advanced properties" />
      <template v-if="advancedProperties">
        <div class="form-row">
          <AppTextField
            v-model="form.properties.topicAlias"
            label="Topic alias"
            min="1"
            type="number"
          />
          <AppTextField
            v-model="form.properties.messageExpiryInterval"
            label="Expiring interval (s)"
            min="1"
            type="number"
          />
        </div>
        <div class="form-row">
          <AppTextField v-model="form.properties.responseTopic" label="Response topic" />
          <AppTextField v-model="form.properties.correlationData" label="Correlation data" />
        </div>
      </template>

      <h4 class="subsection-title">User properties</h4>
      <div
        v-for="(prop, i) in userProperties"
        :key="`user-property-${i}`"
        class="form-row form-row--end"
      >
        <AppTextField v-model="prop.key" label="Key" class="grow" />
        <AppTextField v-model="prop.value" label="Value" class="grow" />
        <AppButton
          variant="icon"
          class="fixed"
          aria-label="Delete property"
          @click="userProperties.splice(i, 1)"
        >
          <Trash2 :size="16" aria-hidden="true" />
        </AppButton>
      </div>
      <AppTooltip text="Add new property">
        <AppButton
          variant="tonal"
          color="primary"
          aria-label="Add new property"
          @click="userProperties.push({ key: 'key', value: 'value' })"
        >
          <Plus :size="16" aria-hidden="true" />
        </AppButton>
      </AppTooltip>
    </template>

  </div>
</template>

<script setup>
import { computed } from "vue";
import { Plus, Trash2 } from "@lucide/vue";
import { usePublishForm } from "../../composables/usePublishForm";
import AppButton from "../ui/AppButton.vue";
import AppSelect from "../ui/AppSelect.vue";
import AppSwitch from "../ui/AppSwitch.vue";
import AppTextarea from "../ui/AppTextarea.vue";
import AppTextField from "../ui/AppTextField.vue";
import AppTooltip from "../ui/AppTooltip.vue";

const QOS_LEVELS = [0, 1, 2];

const props = defineProps({
  /** Selected topic (`{ topic, value }`), source of the sync button. */
  selected: { type: Object, default: undefined },
  /** True when MQTT 5 properties are supported. */
  isV5: { type: Boolean, default: false },
});

const emit = defineEmits(["publish"]);

const {
  form,
  userProperties,
  advancedProperties,
  load,
  loadEmpty,
  reset,
  toPacket,
} = usePublishForm(() => props.isV5);

const canSync = computed(() => props.selected?.value?.payload !== undefined);

/** Clears the form back to an empty topic, ready to fill. */
function clear() {
  reset();
  loadEmpty();
}

// The form is always shown: it starts empty.
loadEmpty();

/** Reloads the form from the selected topic. */
function sync() {
  load(props.selected);
}

/** Emits the current form as a packet. Called by the parent's publish button. */
function submit() {
  emit("publish", toPacket());
}

defineExpose({ load, reset: clear, submit, sync, canSync });
</script>

<style scoped>
.publish-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.form-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: var(--space-6);
}

.form-row > * {
  flex: 1;
}

/* Rows of compact controls: aligned to the bottom, natural width */
.form-row--end {
  align-items: flex-end;
}

.form-row--right {
  justify-content: flex-end;
}

.form-row > .fixed {
  flex: none;
}

.qos-input {
  flex: none;
  max-inline-size: 12ch;
}

.separator {
  inline-size: 100%;
  margin-block: var(--space-4) 0;
  border: 0;
  border-block-start: 1px solid var(--color-border);
}

.section-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
}

.subsection-title {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-regular);
}
</style>
