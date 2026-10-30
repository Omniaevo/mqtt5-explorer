<template>
  <div class="history-panel">
    <div v-if="!isAvailable" class="text-grey">{{ emptyMessage }}</div>

    <template v-else-if="active">
      <div class="d-flex align-center ga-4 mb-2">
        <v-select
          v-if="fields.length > 0"
          v-model="selectedField"
          :items="fields"
          :variant="variant"
          density="compact"
          hide-details
          label="Field"
        />
        <span class="text-caption text-grey ms-auto">
          ({{ storedCount }} of {{ capacity }} values)
        </span>
      </div>
      <HistoryChart
        v-if="isChartable"
        :xs="series.xs"
        :ys="series.ys"
        :is-boolean="series.isBoolean"
        :label="selectedField ?? 'Value'"
      />
      <v-virtual-scroll
        v-else
        :items="rawRows"
        :item-height="RAW_ROW_HEIGHT"
        class="raw-list"
        item-key="key"
      >
        <template #default="{ item }">
          <div class="raw-row d-flex" :title="item.payload">
            <span class="text-grey me-3 flex-shrink-0">{{ item.time }}</span>
            <span class="raw-payload">{{ item.payload }}</span>
          </div>
        </template>
      </v-virtual-scroll>
    </template>
  </div>
</template>

<script setup>
import { computed, reactive } from "vue";
import {
  chartableFields,
  extractSeries,
  isChartable as canChart,
} from "../../utils/ValueExtractor";
import { resolveField, toRawRows } from "../../utils/HistoryView";
import HistoryChart from "../HistoryChart.vue";

const RAW_ROW_HEIGHT = 28;

const props = defineProps({
  /** Selected topic node; the tree is not reactive, see `version`. */
  node: { type: Object, default: undefined },
  /** Tree version: the only reactive signal that the node changed. */
  version: { type: Number, required: true },
  /** `historySize` setting. */
  capacity: { type: Number, required: true },
  /** Work is done only while the panel is shown. */
  active: { type: Boolean, default: false },
  variant: { type: String, default: "underlined" },
});

// Field picked per topic, for the life of this view.
const fieldByTopic = reactive(new Map());

const isAvailable = computed(() => {
  props.version; // Dependency only

  return props.capacity > 0 && Boolean(props.node?.value);
});

const emptyMessage = computed(() =>
  props.capacity > 0
    ? "No values received on this topic"
    : "History is disabled in the settings"
);

const storedCount = computed(() => {
  props.version; // Dependency only

  return props.node?.historyLength ?? 0;
});

/** Copy of the history; empty while the panel is hidden. */
const history = computed(() => {
  props.version; // Dependency only

  return props.active && isAvailable.value ? props.node.history : [];
});

const fields = computed(() => {
  const latest = history.value.at(-1);

  return latest ? chartableFields(latest) : [];
});

const isChartable = computed(() => canChart(history.value));

const selectedField = computed({
  get: () => resolveField(fields.value, fieldByTopic.get(props.node?.topic)),
  set: (field) => fieldByTopic.set(props.node.topic, field),
});

const series = computed(() =>
  isChartable.value
    ? extractSeries(history.value, selectedField.value)
    : undefined
);

const rawRows = computed(() =>
  isChartable.value ? [] : toRawRows(history.value)
);
</script>

<style scoped>
.history-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.raw-list {
  flex: 1 1 0;
  min-height: 0;
}

.raw-row {
  height: 28px;
  line-height: 28px;
  font-family: monospace;
  font-size: 0.85em;
}

.raw-payload {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
