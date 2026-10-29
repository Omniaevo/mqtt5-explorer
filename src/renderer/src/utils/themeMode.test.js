import { describe, expect, it } from "vitest";
import { resolveTheme } from "./themeMode";

describe("resolveTheme", () => {
  it("keeps an explicit light or dark choice", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("follows the OS preference for system", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  it("falls back to the OS preference for unknown values", () => {
    expect(resolveTheme(undefined, true)).toBe("dark");
    expect(resolveTheme("sepia", false)).toBe("light");
  });
});
