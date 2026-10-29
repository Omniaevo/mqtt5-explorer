import { describe, expect, it } from "vitest";
import { ICONS } from "./icons";

const entries = Object.entries(ICONS).flatMap(([name, variants]) =>
  Object.entries(variants).map(([size, svg]) => [name, Number(size), svg]),
);

describe("ICONS", () => {
  it.each(entries)("%s has a valid %ipx svg", (_name, size, svg) => {
    expect(svg).toContain(`width="${size}" height="${size}"`);
  });

  it("provides a 20px variant for every icon", () => {
    expect(Object.values(ICONS).every((variants) => variants[20])).toBe(true);
  });
});
