<template>
  <div class="history-panel">
    <div v-if="!isAvailable" class="history-panel__empty">{{ emptyMessage }}</div>

    <template v-else-if="active">
      <div class="history-panel__toolbar">
        <AppSelect
          v-if="fields.length > 0"
          v-model="selectedField"
          :items="fields"
          class="history-panel__field"
          label="Field"
        />
        <span class="history-panel__count">
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
      <div v-else ref="scrollEl" class="raw-list">
        <div class="raw-canvas" :style="{ height: `${totalSize}px` }">
          <div
            v-for="item in virtualItems"
            :key="item.key"
            class="raw-row"
            :style="{
              height: `${RAW_ROW_HEIGHT}px`,
              transform: `translateY(${item.start}px)`,
            }"
            :title="rawRows[item.index].payload"
          >
            <span class="raw-time">{{ rawRows[item.index].time }}</span>
            <span class="raw-payload">{{ rawRows[item.index].payload }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { useVirtualizer } from "@tanstack/vue-virtual";
import {
  chartableFields,
  extractSeries,
  isChartable as canChart,
} from "../../utils/ValueExtractor";
import { resolveField, toRawRows } from "../../utils/HistoryView";
import HistoryChart from "../HistoryChart.vue";
import AppSelect from "../ui/AppSelect.vue";

const RAW_ROW_HEIGHT = 28;
const OVERSCAN_ROWS = 10;

const props = defineProps({
  /** Selected topic node; the tree is not reactive, see `version`. */
  node: { type: Object, default: undefined },
  /** Tree version: the only reactive signal that the node changed. */
  version: { type: Number, required: true },
  /** `historySize` setting. */
  capacity: { type: Number, required: true },
  /** Work is done only while the panel is shown. */
  active: { type: Boolean, default: false },
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

const scrollEl = ref(null);

const virtualizer = useVirtualizer(
  computed(() => ({
    count: rawRows.value.length,
    getScrollElement: () => scrollEl.value,
    estimateSize: () => RAW_ROW_HEIGHT,
    getItemKey: (index) => rawRows.value[index].key,
    overscan: OVERSCAN_ROWS,
  }))
);

const virtualItems = computed(() => virtualizer.value.getVirtualItems());
const totalSize = computed(() => virtualizer.value.getTotalSize());
</script>

<style scoped>
.history-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.history-panel__empty,
.history-panel__count {
  color: var(--color-text-muted);
}

.history-panel__toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  margin-block-end: var(--space-4);
}

.history-panel__field {
  min-inline-size: 16ch;
}

.history-panel__count {
  margin-inline-start: auto;
  font-size: var(--font-size-sm);
}

.raw-list {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
}

.raw-canvas {
  position: relative;
  width: 100%;
}

.raw-row {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  display: flex;
  align-items: center;
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
}

.raw-time {
  flex: none;
  margin-inline-end: var(--space-5);
  color: var(--color-text-muted);
}

.raw-payload {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
