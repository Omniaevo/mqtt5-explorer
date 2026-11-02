<template>
  <div class="publish-panel">
    <AppTextField v-model="form.topic" label="Topic" placeholder="example/topic" clearable />
    <AppTextarea v-model="form.payload" label="Value" rows="2" />
    <div class="form-row form-row--end form-row--right">
      <AppSwitch v-model="form.retain" label="Retain" />
      <AppSelect v-model="form.qos" :items="QOS_LEVELS" label="QoS" class="qos-input" />
    </div>

    <template v-if="isV5">
      <h3 class="section-title">Properties</h3>
      <AppTextField v-model="form.properties.contentType" label="Content type" clearable />
      <AppAccordion v-model="openPanels" :items="PANELS">
        <template #item-advanced>
          <div class="panel-body">
            <div class="form-row">
              <AppTextField
                v-model="form.properties.topicAlias"
                label="Topic alias"
                min="1"
                type="number"
                clearable
              />
              <AppTextField
                v-model="form.properties.messageExpiryInterval"
                label="Expiring interval (s)"
                min="1"
                type="number"
                clearable
              />
            </div>
            <div class="form-row">
              <AppTextField v-model="form.properties.responseTopic" label="Response topic" clearable />
              <AppTextField v-model="form.properties.correlationData" label="Correlation data" clearable />
            </div>
          </div>
        </template>
      </AppAccordion>

      <h4 class="subsection-title">User properties</h4>
      <div
        v-for="(prop, i) in userProperties"
        :key="`user-property-${i}`"
        class="form-row form-row--end"
      >
        <AppTextField v-model="prop.key" label="Key" class="grow" clearable />
        <AppTextField v-model="prop.value" label="Value" class="grow" clearable />
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
import { Plus, SlidersHorizontal, Trash2 } from "@lucide/vue";
import { usePublishForm } from "../../composables/usePublishForm";
import AppAccordion from "../ui/AppAccordion.vue";
import AppButton from "../ui/AppButton.vue";
import AppSelect from "../ui/AppSelect.vue";
import AppSwitch from "../ui/AppSwitch.vue";
import AppTextarea from "../ui/AppTextarea.vue";
import AppTextField from "../ui/AppTextField.vue";
import AppTooltip from "../ui/AppTooltip.vue";

const QOS_LEVELS = [0, 1, 2];
const ADVANCED_PANEL = "advanced";
const PANELS = [{ value: ADVANCED_PANEL, title: "Advanced properties", icon: SlidersHorizontal }];

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

// The accordion model is a list of open panels; the form keeps a single flag
const openPanels = computed({
  get: () => (advancedProperties.value ? [ADVANCED_PANEL] : []),
  set: (open) => {
    advancedProperties.value = open.includes(ADVANCED_PANEL);
  },
});

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

.panel-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

/* Title, then a divider line filling the rest of the row (same as the payload tab) */
.section-title,
.subsection-title {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.section-title::after,
.subsection-title::after {
  content: "";
  flex: 1;
  border-block-start: 1px solid var(--color-border);
}
</style>
