import { describe, expect, it } from "vitest";
import {
  allConnections,
  filterConnections,
  pinnedConnections,
  recentConnections,
} from "./hubSections";

const legacy = { id: "1", name: "beta", host: "b.local" };
const list = [
  legacy,
  { id: "2", name: "Alpha", host: "a.example.com", pinned: true },
  { id: "3", name: "gamma", host: "g.local", lastConnectedAt: 100 },
  { id: "4", name: "delta", host: "d.local", lastConnectedAt: 300 },
  { id: "5", name: "eps", host: "e.local", lastConnectedAt: 200 },
];

describe("hubSections", () => {
  it("returns only pinned; old data counts as not pinned", () => {
    expect(pinnedConnections(list).map((c) => c.id)).toEqual(["2"]);
  });

  it("returns recent newest first, skipping never connected", () => {
    expect(recentConnections(list).map((c) => c.id)).toEqual(["4", "5", "3"]);
  });

  it("limits recent and does not mutate the input", () => {
    const copy = [...list];

    expect(recentConnections(list, 2).map((c) => c.id)).toEqual(["4", "5"]);
    expect(list).toEqual(copy);
  });

  it("sorts all A-Z ignoring case", () => {
    expect(allConnections(list).map((c) => c.name)).toEqual([
      "Alpha",
      "beta",
      "delta",
      "eps",
      "gamma",
    ]);
  });

  it("filters by name or host, case-insensitive", () => {
    expect(filterConnections(list, "ALPHA").map((c) => c.id)).toEqual(["2"]);
    expect(filterConnections(list, "example").map((c) => c.id)).toEqual(["2"]);
  });

  it("keeps everything for an empty query", () => {
    expect(filterConnections(list, "")).toHaveLength(list.length);
    expect(filterConnections(list, undefined)).toHaveLength(list.length);
  });
});
