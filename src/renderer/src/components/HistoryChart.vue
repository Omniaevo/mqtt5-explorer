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
import { buildChartOptions } from "../utils/ChartOptions";

const MIN_CHART_HEIGHT = 100;

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

/** Height left for the plot once the legend below it is placed. */
const plotHeight = (containerHeight) => {
  const legendHeight = plot?.root.querySelector(".u-legend")?.offsetHeight ?? 0;

  return Math.max(MIN_CHART_HEIGHT, containerHeight - legendHeight);
};

const createPlot = () => {
  // Measured before destroy: a rebuild keeps the old legend height.
  const height = plotHeight(container.value.clientHeight);

  plot?.destroy();
  plot = new uPlot(
    buildChartOptions({
      width: container.value.clientWidth,
      height,
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
  // Fires once on observe too: corrects the first height for the legend.
  resizeObserver = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;

    plot.setSize({ width, height: plotHeight(height) });
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
/* Size comes from the parent only, so the plot cannot grow it in a loop. */
.history-chart {
  flex: 1 1 0;
  width: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
</style>
