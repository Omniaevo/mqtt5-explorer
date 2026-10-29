/** Smallest plot height; also the default. */
export const CHART_HEIGHT = 200;

const GRID_ALPHA = 0.12;
const BOOLEAN_TICKS = [0, 1];
const BOOLEAN_LABELS = ["false", "true"];
const BOOLEAN_RANGE_PADDING = 0.1;
const FONT_FAMILY = "Selawik, 'Segoe UI', sans-serif";
const AXIS_FONT = `12px ${FONT_FAMILY}`;
const POINT_SIZE = 6;
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

const pad = (n) => String(n).padStart(2, "0");

/** Local time of a uPlot x value (epoch seconds) as `YYYY-MM-DD HH:mm:ss`. */
export const formatChartTime = (seconds) => {
  if (seconds == null) return "";

  const d = new Date(seconds * 1000);
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  return `${date} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/**
 * Adds an alpha channel to a `#rrggbb` color. Other formats are returned as is.
 * @param {string} color
 * @param {number} alpha Between 0 and 1.
 */
export const withAlpha = (color, alpha) =>
  HEX_COLOR_PATTERN.test(color)
    ? `${color}${Math.round(alpha * 255)
        .toString(16)
        .padStart(2, "0")}`
    : color;

/** uPlot points path that draws squares instead of circles. */
export const squarePoints = (plot, seriesIdx, firstIdx, lastIdx) => {
  const { scale, points } = plot.series[seriesIdx];
  const size = (points.size ?? POINT_SIZE) * devicePixelRatio;
  const squares = new Path2D();

  for (let i = firstIdx; i <= lastIdx; i++) {
    const y = plot.data[seriesIdx][i];

    if (y == null) continue;
    const cx = plot.valToPos(plot.data[0][i], "x", true);
    const cy = plot.valToPos(y, scale, true);

    squares.rect(cx - size / 2, cy - size / 2, size, size);
  }

  return { fill: squares };
};

/** y value of a boolean series as `true` / `false`. */
const formatBoolean = (value) =>
  value == null ? "" : value ? "true" : "false";

const yAxisFor = (isBoolean, axisStyle) =>
  isBoolean
    ? {
        ...axisStyle,
        splits: () => BOOLEAN_TICKS,
        values: () => BOOLEAN_LABELS,
      }
    : axisStyle;

/**
 * uPlot options for a history chart.
 * @param {object} config
 * @param {number} config.width Chart width in pixels.
 * @param {number} [config.height] Plot height in pixels (legend excluded).
 * @param {string} config.label Series name shown in the legend.
 * @param {boolean} config.isBoolean Stepped 0/1 line labelled false/true.
 * @param {{primary: string, text: string}} config.colors Theme colors.
 * @param {Function} config.steppedPaths uPlot stepped path builder
 * (injected so this module stays free of the DOM-bound library).
 */
export const buildChartOptions = ({
  width,
  height = CHART_HEIGHT,
  label,
  isBoolean,
  colors,
  steppedPaths,
}) => {
  const axisStyle = {
    stroke: colors.text,
    font: AXIS_FONT,
    labelFont: AXIS_FONT,
    grid: { stroke: withAlpha(colors.text, GRID_ALPHA), width: 1 },
    ticks: { stroke: withAlpha(colors.text, GRID_ALPHA), width: 1 },
  };

  return {
    width,
    height,
    scales: {
      y: isBoolean
        ? { range: [-BOOLEAN_RANGE_PADDING, 1 + BOOLEAN_RANGE_PADDING] }
        : {},
    },
    axes: [axisStyle, yAxisFor(isBoolean, axisStyle)],
    series: [
      { value: (_plot, seconds) => formatChartTime(seconds) },
      {
        label,
        stroke: colors.primary,
        width: 2,
        points: { size: POINT_SIZE, fill: colors.primary, paths: squarePoints },
        paths: isBoolean ? steppedPaths({ align: 1 }) : undefined,
        value: isBoolean ? (_plot, value) => formatBoolean(value) : undefined,
      },
    ],
  };
};
