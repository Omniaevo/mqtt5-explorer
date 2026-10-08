import { describe, expect, it, vi } from "vitest";
import {
  chartableFields,
  extractSeries,
  isChartable,
  toChartValue,
} from "./ValueExtractor";

const entry = (payload, t = 1000) => ({ t, payload });

describe("toChartValue", () => {
  it.each([
    ["21.5", 21.5],
    [" -3 ", -3],
    ["1e3", 1000],
    [".5", 0.5],
    ["TRUE", 1],
    ["Off", 0],
    [" yes ", 1],
    ["no", 0],
    [true, 1],
    [7, 7],
  ])("%j -> %j", (raw, expected) => {
    expect(toChartValue(raw)).toBe(expected);
  });

  it.each(["", "  ", "abc", "0x10", "Infinity", "NaN", "1,5", null, {}, NaN])(
    "%j -> null",
    (raw) => {
      expect(toChartValue(raw)).toBeNull();
    }
  );
});

describe("chartableFields", () => {
  it("lists numeric and boolean leaves as dot paths", () => {
    const payload =
      '{"temp":21.5,"hum":{"rel":40},"ok":true,"name":"x","list":[3,"a"]}';

    expect(chartableFields(entry(payload))).toEqual([
      "temp",
      "hum.rel",
      "ok",
      "list.0",
    ]);
  });

  it.each(["hello", "42", "true", "null", "{bad", "{}"])(
    "returns [] for %j",
    (payload) => {
      expect(chartableFields(entry(payload))).toEqual([]);
    }
  );
});

describe("isChartable", () => {
  it("accepts a direct value or a JSON with a chartable field", () => {
    expect(isChartable([entry("hello"), entry("12")])).toBe(true);
    expect(isChartable([entry('{"a":1}')])).toBe(true);
  });

  it("rejects text, JSON without leaves and empty history", () => {
    expect(isChartable([entry("12"), entry("hello")])).toBe(false);
    expect(isChartable([entry('{"a":"x"}')])).toBe(false);
    expect(isChartable([])).toBe(false);
  });
});

describe("extractSeries", () => {
  it("plots the payload and turns text into gaps", () => {
    const history = [entry("1", 1000), entry("oops", 2500), entry("3", 4000)];

    expect(extractSeries(history, null)).toEqual({
      xs: [1, 2.5, 4],
      ys: [1, null, 3],
      isBoolean: false,
    });
  });

  it("flags boolean series", () => {
    const series = extractSeries([entry("on"), entry("OFF")], null);

    expect(series.ys).toEqual([1, 0]);
    expect(series.isBoolean).toBe(true);
  });

  it("reads a JSON field; missing or invalid entries are gaps", () => {
    const history = [
      entry('{"hum":{"rel":40},"ok":true}'),
      entry('{"hum":{}}'),
      entry("plain"),
    ];

    expect(extractSeries(history, "hum.rel").ys).toEqual([40, null, null]);
    expect(extractSeries(history, "ok")).toMatchObject({
      ys: [1, null, null],
      isBoolean: true,
    });
  });

  it("parses each payload once", () => {
    const spy = vi.spyOn(JSON, "parse");
    const history = [entry('{"a":1}'), entry('{"a":2}')];

    chartableFields(history[0]);
    extractSeries(history, "a");
    extractSeries(history, "a");

    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });
});
