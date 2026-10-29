<template>
  <div class="publish">
    <div class="publish__form">
      <div class="publish__row publish__row--end">
        <MTextBox
          v-model="form.topic"
          label="Topic"
          placeholder="example/topic"
        />
        <MTooltip v-if="canSync" text="Synchronize with new data">
          <MButton
            icon="sync"
            aria-label="Synchronize with new data"
            @click="load(selected)"
          />
        </MTooltip>
      </div>
      <MTextArea v-model="form.payload" label="Value" :rows="2" />
      <div class="publish__row">
        <MSelect v-model="form.qos" :items="QOS_LEVELS" label="QoS" />
        <MToggleSwitch v-model="form.retain" label="Retain" />
      </div>
      <MTextBox
        v-if="isV5"
        v-model="form.properties.contentType"
        label="Content type"
      />

      <section v-if="isV5" class="publish__section">
        <h3 class="publish__subheader">advanced properties</h3>
        <MToggleSwitch v-model="advancedProperties" label="Show advanced" />
        <template v-if="advancedProperties">
          <div class="publish__row">
            <MTextBox
              v-model="form.properties.topicAlias"
              label="Topic alias"
              min="1"
              type="number"
            />
            <MTextBox
              v-model="form.properties.messageExpiryInterval"
              label="Expiring interval (s)"
              min="1"
              type="number"
            />
          </div>
          <div class="publish__row">
            <MTextBox
              v-model="form.properties.responseTopic"
              label="Response topic"
            />
            <MTextBox
              v-model="form.properties.correlationData"
              label="Correlation data"
            />
          </div>
        </template>

        <h3 class="publish__subheader">user properties</h3>
        <div
          v-for="(prop, i) in userProperties"
          :key="`user-property-${i}`"
          class="publish__row publish__row--end"
        >
          <MTextBox v-model="prop.key" label="Key" />
          <MTextBox v-model="prop.value" label="Value" />
          <MButton
            variant="round"
            icon="delete"
            aria-label="Remove property"
            @click="userProperties.splice(i, 1)"
          />
        </div>
        <MTooltip text="Add new property">
          <MButton
            icon="add"
            aria-label="Add new property"
            @click="userProperties.push({ key: 'key', value: 'value' })"
          />
        </MTooltip>
      </section>

      <div class="publish__actions">
        <MButton
          variant="accent"
          label="Publish"
          @click="emit('publish', toPacket())"
        />
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from "vue";
import MButton from "../metro/MButton.vue";
import MSelect from "../metro/MSelect.vue";
import MTextArea from "../metro/MTextArea.vue";
import MTextBox from "../metro/MTextBox.vue";
import MToggleSwitch from "../metro/MToggleSwitch.vue";
import MTooltip from "../metro/MTooltip.vue";
import { usePublishForm } from "../../composables/usePublishForm";

const QOS_LEVELS = [0, 1, 2];

const props = defineProps({
  /** Selected topic (`{ topic, value }`), source of the sync button. */
  selected: { type: Object, default: undefined },
  /** True when the publish pivot item is shown. */
  expanded: { type: Boolean, default: false },
  /** True when MQTT 5 properties are supported. */
  isV5: { type: Boolean, default: false },
});

const emit = defineEmits(["publish"]);

const {
  form,
  userProperties,
  advancedProperties,
  load,
  reset,
  toPacket,
} = usePublishForm(() => props.isV5);

const canSync = computed(
  () =>
    props.expanded &&
    props.selected?.value?.payload !== undefined
);

defineExpose({ load, reset });
</script>

<style scoped>
.publish {
  padding-inline-end: var(--m-unit);
}

.publish__form,
.publish__section {
  display: flex;
  flex-direction: column;
  gap: var(--m-unit);
}

.publish__row {
  display: flex;
  flex-direction: row;
  gap: var(--m-unit);
}

.publish__row > :not(button) {
  flex: 1;
}

.publish__row--end {
  align-items: flex-end;
}

.publish__subheader {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 300;
}

.publish__actions {
  display: flex;
  justify-content: flex-end;
}
</style>
