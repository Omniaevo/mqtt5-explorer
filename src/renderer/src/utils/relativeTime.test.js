import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "./relativeTime";

const NOW = 1_700_000_000_000;
const ago = (seconds) => formatRelativeTime(NOW - seconds * 1000, NOW, "en");

describe("formatRelativeTime", () => {
  it("says now for less than one minute", () => {
    expect(ago(30)).toBe("now");
  });

  it("picks the largest fitting unit", () => {
    expect(ago(5 * 60)).toBe("5 min. ago");
    expect(ago(2 * 3600 + 120)).toBe("2 hr. ago");
    expect(ago(3 * 86400)).toBe("3 days ago");
  });

  it("does not round up to the next unit", () => {
    expect(ago(3599)).toBe("59 min. ago");
  });

  it("uses words for one day", () => {
    expect(ago(86400)).toBe("yesterday");
  });
});
