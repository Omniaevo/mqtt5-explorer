<template>
  <div ref="container" class="history-chart" />
</template>

<script setup>
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from "vue";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import { CHART_HEIGHT, buildChartOptions } from "../utils/ChartOptions";
import { useSettingsStore } from "../stores/settings";

const props = defineProps({
  xs: { type: Array, required: true }, // Epoch seconds
  ys: { type: Array, required: true }, // Numbers or null gaps
  isBoolean: { type: Boolean, default: false },
  label: { type: String, default: "" },
});

const container = useTemplateRef("container");
const settings = useSettingsStore();

// Plain variable on purpose: uPlot must not be proxied by Vue.
let plot = null;
let resizeObserver = null;

/** Metro colors in effect now; read at build time, uPlot cannot use CSS vars. */
const readColors = () => {
  const style = getComputedStyle(document.documentElement);

  return {
    primary: style.getPropertyValue("--m-accent").trim(),
    text: style.getPropertyValue("--m-fg").trim(),
  };
};

const createPlot = () => {
  plot?.destroy();
  plot = new uPlot(
    buildChartOptions({
      width: container.value.clientWidth,
      label: props.label,
      isBoolean: props.isBoolean,
      colors: readColors(),
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
watch(() => [props.isBoolean, props.label], createPlot);

// "post" runs after useThemeSync has written the CSS variables.
watch(
  () => [settings.resolvedTheme, settings.primaryColor],
  createPlot,
  { deep: true, flush: "post" }
);
</script>

<style scoped>
.history-chart {
  width: 100%;
  min-width: 0;
}
</style>
