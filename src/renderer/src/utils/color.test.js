import { describe, expect, it } from "vitest";
import { COLORS } from "./accentColors";
import { contrastRatio, relativeLuminance, textOnAccent } from "./color";

describe("color", () => {
  it("computes known luminance and contrast values", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1);
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21);
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21);
    expect(contrastRatio("#777777", "#777777")).toBeCloseTo(1);
  });

  it("accepts the short hex form", () => {
    expect(contrastRatio("#fff", "#000")).toBeCloseTo(21);
  });

  it("picks black on light accents and white on dark accents", () => {
    expect(textOnAccent("#FFB300")).toBe("#000000");
    expect(textOnAccent("#C0CA33")).toBe("#000000");
    expect(textOnAccent("#3F51B5")).toBe("#ffffff");
  });

  it.each(
    COLORS.flatMap(({ text, value }) => [
      [text, "light", value.light],
      [text, "dark", value.dark],
    ])
  )("%s (%s) gets a readable text color", (_name, _mode, hex) => {
    const chosen = contrastRatio(hex, textOnAccent(hex));
    const best = Math.max(
      contrastRatio(hex, "#000000"),
      contrastRatio(hex, "#ffffff")
    );

    expect(chosen >= 4.5 || chosen === best).toBe(true);
  });
});
