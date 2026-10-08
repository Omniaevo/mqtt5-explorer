<template>
  <v-expansion-panel value="publish">
    <v-expansion-panel-title>
      <v-tooltip v-if="canSync" text="Synchronize with new data" location="bottom">
        <template #activator="{ props: tooltipProps }">
          <v-btn
            v-bind="tooltipProps"
            class="me-2"
            icon="mdi-sync"
            size="small"
            variant="text"
            @click.stop="load(selected)"
          />
        </template>
      </v-tooltip>
      <span>Publish</span>
    </v-expansion-panel-title>

    <v-expansion-panel-text v-if="form">
      <v-text-field
        v-model="form.topic"
        :variant="variant"
        label="Topic"
        placeholder="example/topic"
      />
      <v-textarea v-model="form.payload" :variant="variant" label="Value" rows="2" />
      <div class="form-row justify-end align-center">
        <v-switch v-model="form.retain" class="me-4" label="Retain" hide-details inset />
        <v-select
          v-model="form.qos"
          :items="QOS_LEVELS"
          :variant="variant"
          class="qos-input"
          label="QoS"
          hide-details
        />
      </div>

      <template v-if="isV5">
        <v-divider class="mt-4" />
        <div class="text-h6 my-2">Properties</div>
        <v-text-field
          v-model="form.properties.contentType"
          :variant="variant"
          label="Content type"
          hide-details
        />
        <v-switch
          v-model="advancedProperties"
          label="Advanced properties"
          hide-details
          inset
        />
        <template v-if="advancedProperties">
          <div class="form-row">
            <v-text-field
              v-model="form.properties.topicAlias"
              :variant="variant"
              label="Topic alias"
              min="1"
              type="number"
            />
            <v-text-field
              v-model="form.properties.messageExpiryInterval"
              :variant="variant"
              label="Expiring interval (s)"
              min="1"
              type="number"
            />
          </div>
          <div class="form-row">
            <v-text-field
              v-model="form.properties.responseTopic"
              :variant="variant"
              label="Response topic"
            />
            <v-text-field
              v-model="form.properties.correlationData"
              :variant="variant"
              label="Correlation data"
            />
          </div>
        </template>

        <div class="my-2">User properties</div>
        <div
          v-for="(prop, i) in userProperties"
          :key="`user-property-${i}`"
          class="form-row align-center mb-5"
        >
          <v-text-field v-model="prop.key" :variant="variant" label="Key" hide-details />
          <v-text-field v-model="prop.value" :variant="variant" label="Value" hide-details />
          <v-btn icon="mdi-delete" variant="text" @click="userProperties.splice(i, 1)" />
        </div>
        <v-tooltip text="Add new property" location="bottom">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              color="primary"
              icon="mdi-plus"
              rounded="lg"
              variant="tonal"
              block
              @click="userProperties.push({ key: 'key', value: 'value' })"
            />
          </template>
        </v-tooltip>
      </template>

      <div class="d-flex justify-end pt-4">
        <v-btn color="primary" @click="emit('publish', toPacket())">Publish</v-btn>
      </div>
    </v-expansion-panel-text>

    <v-expansion-panel-text v-else>
      <v-tooltip text="Create a new topic" location="bottom">
        <template #activator="{ props: tooltipProps }">
          <v-btn
            v-bind="tooltipProps"
            color="primary"
            icon="mdi-plus"
            rounded="lg"
            block
            @click="loadEmpty"
          />
        </template>
      </v-tooltip>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script setup>
import { computed } from "vue";
import { usePublishForm } from "../../composables/usePublishForm";

const QOS_LEVELS = [0, 1, 2];

const props = defineProps({
  /** Selected topic (`{ topic, value }`), source of the sync button. */
  selected: { type: Object, default: undefined },
  /** True when this panel is open. */
  expanded: { type: Boolean, default: false },
  /** True when MQTT 5 properties are supported. */
  isV5: { type: Boolean, default: false },
  variant: { type: String, default: "outlined" },
});

const emit = defineEmits(["publish"]);

const { form, userProperties, advancedProperties, load, loadEmpty, reset, toPacket } =
  usePublishForm(() => props.isV5);

const canSync = computed(
  () =>
    props.expanded &&
    form.value !== undefined &&
    props.selected?.value?.payload !== undefined
);

defineExpose({ load, reset });
</script>

<style scoped>
.form-row {
  display: flex;
  flex-direction: row;
  gap: 1.5em;
}

.qos-input {
  max-width: 12ch;
}
</style>
