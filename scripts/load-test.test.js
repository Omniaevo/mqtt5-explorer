import { describe, it, expect } from "vitest";
import { parseOptions, buildTopic, buildPayload } from "./load-test.mjs";

describe("parseOptions", () => {
  it("applies defaults", () => {
    expect(parseOptions([])).toEqual({
      url: "mqtt://localhost:1883",
      rate: 1000,
      topics: 5000,
      depth: 4,
      retained: 0,
      duration: 120,
    });
  });

  it("caps retained at topic count", () => {
    expect(parseOptions(["--topics", "10", "--retained", "50"]).retained).toBe(10);
  });

  it("rejects non-positive rate", () => {
    expect(() => parseOptions(["--rate", "0"])).toThrow("--rate");
  });
});

describe("buildTopic", () => {
  it("produces unique topics with the requested depth", () => {
    const topics = new Set(Array.from({ length: 5000 }, (_, i) => buildTopic(i, 5000, 4)));
    expect(topics.size).toBe(5000);
    for (const topic of topics) expect(topic.split("/")).toHaveLength(5); // root + 4
  });
});

describe("buildPayload", () => {
  it("covers every payload kind", () => {
    expect(Number.isFinite(Number(buildPayload(0)))).toBe(true);
    expect(["true", "false"]).toContain(buildPayload(1));
    expect(["on", "off"]).toContain(buildPayload(2));
    expect(typeof JSON.parse(buildPayload(3)).stats.max).toBe("number");
    expect(buildPayload(4)).toMatch(/^status \d+ ok$/);
  });
});
