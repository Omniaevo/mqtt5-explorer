import { describe, expect, it } from "vitest";
import { onPrimaryColor } from "./onPrimaryColor";

describe("onPrimaryColor", () => {
  it("returns white on a dark color", () => {
    expect(onPrimaryColor("#3f51b5")).toBe("#ffffff");
  });

  it("returns near-black on a light color", () => {
    expect(onPrimaryColor("#ffeb3b")).toBe("#111111");
  });

  it("accepts the short hex form", () => {
    expect(onPrimaryColor("#fff")).toBe("#111111");
  });

  it("falls back to white on invalid input", () => {
    expect(onPrimaryColor("not-a-color")).toBe("#ffffff");
  });
});
