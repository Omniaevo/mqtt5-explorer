<template>
  <div>
    <p v-if="history.length === 0" class="history-empty">
      No history yet for this topic.
    </p>
    <template v-else>
      <div class="history-count">{{ storedCount }} of {{ capacity }} values</div>
      <MSelect
        v-if="fields.length > 0"
        v-model="selectedField"
        class="history-field"
        label="Field"
        :items="fields"
      />
      <HistoryChart
        v-if="isChartable"
        :xs="series.xs"
        :ys="series.ys"
        :is-boolean="series.isBoolean"
        :label="selectedField ?? 'Value'"
      />
      <div v-else ref="rawScroll" class="raw-scroll">
        <div
          class="raw-list"
          :style="{ height: `${virtualizer.getTotalSize()}px` }"
        >
          <div
            v-for="item in virtualizer.getVirtualItems()"
            :key="item.key"
            class="raw-row"
            :title="rawRows[item.index].payload"
            :style="{ transform: `translateY(${item.start}px)` }"
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
import { computed, reactive, useTemplateRef } from "vue";
import { useVirtualizer } from "@tanstack/vue-virtual";
import {
  chartableFields,
  extractSeries,
  isChartable as canChart,
} from "../../utils/ValueExtractor";
import { resolveField, toRawRows } from "../../utils/HistoryView";
import HistoryChart from "../HistoryChart.vue";
import MSelect from "../metro/MSelect.vue";

const RAW_OVERSCAN_ROWS = 10;
const RAW_ROW_HEIGHT = 28;

const props = defineProps({
  /** Selected topic node; the tree is not reactive, see `version`. */
  node: { type: Object, default: undefined },
  /** Tree version: the only reactive signal that the node changed. */
  version: { type: Number, required: true },
  /** `historySize` setting. */
  capacity: { type: Number, required: true },
  /** Work is done only while the pivot item is shown. */
  expanded: { type: Boolean, default: false },
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

const rawScroll = useTemplateRef("rawScroll");

const virtualizer = useVirtualizer(
  computed(() => ({
    count: rawRows.value.length,
    getScrollElement: () => rawScroll.value,
    estimateSize: () => RAW_ROW_HEIGHT,
    overscan: RAW_OVERSCAN_ROWS,
    getItemKey: (index) => rawRows.value[index].key,
  }))
);
</script>

<style scoped>
.history-count {
  margin-bottom: var(--m-subunit);
  color: var(--m-fg-secondary);
  font: var(--m-font-caption);
}

.history-empty {
  margin: 0;
  color: var(--m-fg-secondary);
  font: var(--m-font-body);
}

.history-field {
  margin-bottom: var(--m-subunit);
}

.raw-scroll {
  height: 240px;
  overflow-y: auto;
}

.raw-list {
  position: relative;
}

.raw-row {
  position: absolute;
  top: 0;
  display: flex;
  gap: var(--m-subunit);
  width: 100%;
  height: 28px;
  align-items: center;
  font: var(--m-font-body);
}

.raw-time {
  flex-shrink: 0;
  color: var(--m-fg-secondary);
  font: var(--m-font-caption);
}

.raw-payload {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
