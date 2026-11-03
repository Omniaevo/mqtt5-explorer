import { describe, expect, it } from "vitest";
import { themeBackground } from "./themeBackground";

const settings = (theme) => JSON.stringify({ theme });

describe("themeBackground", () => {
  it("returns the dark background for the dark theme", () => {
    expect(themeBackground(settings("dark"))).toBe("#0e0f12");
  });

  it("returns the light background for the light theme", () => {
    expect(themeBackground(settings("light"))).toBe("#eff1f4");
  });

  it.each([undefined, "", "not json", settings("neon")])(
    "falls back to light for %j",
    (stored) => {
      expect(themeBackground(stored)).toBe("#eff1f4");
    }
  );
});
