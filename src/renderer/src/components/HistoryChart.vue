<template>
  <div ref="container" class="history-chart" />
</template>

<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  useTemplateRef,
  watch,
} from "vue";
import { useTheme } from "vuetify";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import { CHART_HEIGHT, buildChartOptions } from "../utils/ChartOptions";

const props = defineProps({
  xs: { type: Array, required: true }, // Epoch seconds
  ys: { type: Array, required: true }, // Numbers or null gaps
  isBoolean: { type: Boolean, default: false },
  label: { type: String, default: "" },
});

const container = useTemplateRef("container");
const theme = useTheme();

// Plain variable on purpose: uPlot must not be proxied by Vue.
let plot = null;
let resizeObserver = null;

const colors = computed(() => {
  const { primary, "on-surface": text } = theme.current.value.colors;

  return { primary, text };
});

const createPlot = () => {
  plot?.destroy();
  plot = new uPlot(
    buildChartOptions({
      width: container.value.clientWidth,
      label: props.label,
      isBoolean: props.isBoolean,
      colors: colors.value,
      steppedPaths: uPlot.paths.stepped,
    }),
    [props.xs, props.ys],
    container.value
  );
};

onMounted(() => {
  createPlot();
  resizeObserver = new ResizeObserver(([entry]) => {
    plot.setSize({ width: entry.contentRect.width, height: CHART_HEIGHT });
  });
  resizeObserver.observe(container.value);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  plot?.destroy();
  plot = null;
});

// Data change: update in place.
watch(
  () => [props.xs, props.ys],
  ([xs, ys]) => plot?.setData([xs, ys])
);

// uPlot cannot restyle axes or series after creation: rebuild instead.
watch(() => [colors.value, props.isBoolean, props.label], createPlot, {
  deep: true,
});
</script>

<style scoped>
.history-chart {
  width: 100%;
  min-width: 0;
}
</style>
