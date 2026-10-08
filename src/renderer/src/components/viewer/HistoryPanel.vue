<template>
  <v-expansion-panel v-if="isAvailable" value="history">
    <v-expansion-panel-title>
      <span>History</span>
      <span class="text-caption ms-2 text-grey">
        ({{ storedCount }} of {{ capacity }} values)
      </span>
    </v-expansion-panel-title>

    <v-expansion-panel-text>
      <template v-if="expanded">
        <v-select
          v-if="fields.length > 0"
          v-model="selectedField"
          :items="fields"
          :variant="variant"
          class="mb-2"
          density="compact"
          hide-details
          label="Field"
        />
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
          :height="RAW_LIST_HEIGHT"
          :item-height="RAW_ROW_HEIGHT"
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
    </v-expansion-panel-text>
  </v-expansion-panel>
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

const RAW_LIST_HEIGHT = 240;
const RAW_ROW_HEIGHT = 28;

const props = defineProps({
  /** Selected topic node; the tree is not reactive, see `version`. */
  node: { type: Object, default: undefined },
  /** Tree version: the only reactive signal that the node changed. */
  version: { type: Number, required: true },
  /** `historySize` setting. */
  capacity: { type: Number, required: true },
  /** Work is done only while the panel is open. */
  expanded: { type: Boolean, default: false },
  variant: { type: String, default: "underlined" },
});

// Field picked per topic, for the life of this view.
const fieldByTopic = reactive(new Map());

const isAvailable = computed(() => {
  props.version; // Dependency only

  return props.capacity > 0 && Boolean(props.node?.value);
});

const storedCount = computed(() => {
  props.version; // Dependency only

  return props.node?.historyLength ?? 0;
});

/** Copy of the history; empty while the panel is closed. */
const history = computed(() => {
  props.version; // Dependency only

  return props.expanded && isAvailable.value ? props.node.history : [];
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
