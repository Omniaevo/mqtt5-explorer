import { describe, expect, it } from "vitest";
import {
  CHART_HEIGHT,
  buildChartOptions,
  formatChartTime,
  withAlpha,
} from "./ChartOptions";

const colors = { primary: "#1976d2", text: "#000000" };
const steppedPaths = (opts) => ({ stepped: opts });
const build = (isBoolean) =>
  buildChartOptions({
    width: 300,
    label: "temp",
    isBoolean,
    colors,
    steppedPaths,
  });

describe("withAlpha", () => {
  it("appends the alpha channel to a hex color", () => {
    expect(withAlpha("#000000", 0.5)).toBe("#00000080");
  });

  it("pads low alpha values to two digits", () => {
    expect(withAlpha("#000000", 0.02)).toBe("#00000005");
  });

  it("returns non-hex colors unchanged", () => {
    expect(withAlpha("rgb(0,0,0)", 0.5)).toBe("rgb(0,0,0)");
  });
});

describe("formatChartTime", () => {
  it("formats epoch seconds as local date and time", () => {
    const local = new Date(2026, 0, 2, 3, 4, 5);

    expect(formatChartTime(local.getTime() / 1000)).toBe("2026-01-02 03:04:05");
  });

  it("returns an empty string for a missing value", () => {
    expect(formatChartTime(null)).toBe("");
  });
});

describe("buildChartOptions", () => {
  it("uses the primary color for the series", () => {
    expect(build(false).series[1].stroke).toBe(colors.primary);
  });

  it("sets size from width and the fixed height", () => {
    expect(build(false)).toMatchObject({ width: 300, height: CHART_HEIGHT });
  });

  it("keeps a plain line for numbers", () => {
    expect(build(false).series[1].paths).toBeUndefined();
  });

  it("steps the line for booleans", () => {
    expect(build(true).series[1].paths).toEqual({ stepped: { align: 1 } });
  });

  it("labels boolean y ticks false and true", () => {
    const axis = build(true).axes[1];

    expect(axis.values()).toEqual(["false", "true"]);
    expect(axis.splits()).toEqual([0, 1]);
  });

  it("formats boolean legend values", () => {
    expect(build(true).series[1].value(null, 1)).toBe("true");
  });
});
