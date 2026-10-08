import { describe, expect, it } from "vitest";
import TopicTree from "../models/TopicTree";
import { anchorShift, flattenVisible } from "./flattenTree";

const buildTree = (...topics) => {
  const tree = new TopicTree();

  topics.forEach((topic) => tree.apply({ topic, payload: "x" }));

  return tree;
};

const topicsOf = (rows) => rows.map((row) => row.node.topic);

describe("flattenVisible", () => {
  it("shows only the roots when nothing is expanded", () => {
    const tree = buildTree("a/b", "c");

    const rows = flattenVisible(tree.roots, new Set());

    expect(topicsOf(rows)).toEqual(["a", "c"]);
    expect(rows[0]).toMatchObject({ depth: 0, hasChildren: true });
    expect(rows[0].expanded).toBe(false);
    expect(rows[1].hasChildren).toBe(false);
  });

  it("lists the children of expanded nodes with their depth", () => {
    const tree = buildTree("a/b/c", "a/d", "e");
    const expanded = new Set([tree.find("a").id, tree.find("a/b").id]);

    const rows = flattenVisible(tree.roots, expanded);

    expect(topicsOf(rows)).toEqual(["a", "a/b", "a/b/c", "a/d", "e"]);
    expect(rows.map((row) => row.depth)).toEqual([0, 1, 2, 1, 0]);
  });

  it("hides the children of a collapsed node inside an expanded one", () => {
    const tree = buildTree("a/b/c");

    const rows = flattenVisible(tree.roots, new Set([tree.find("a").id]));

    expect(topicsOf(rows)).toEqual(["a", "a/b"]);
  });

  it("never marks a leaf as expanded", () => {
    const tree = buildTree("a");

    const rows = flattenVisible(tree.roots, new Set([tree.find("a").id]));

    expect(rows[0].expanded).toBe(false);
  });

  describe("with a filter", () => {
    it("keeps matches and their ancestors, expanded", () => {
      const tree = buildTree("a/b/c", "a/d", "e");

      const rows = flattenVisible(
        tree.roots,
        new Set(),
        (node) => node.name === "c"
      );

      expect(topicsOf(rows)).toEqual(["a", "a/b", "a/b/c"]);
      expect(rows.every((row) => row.expanded || !row.hasChildren)).toBe(true);
    });

    it("returns nothing when no node matches", () => {
      const tree = buildTree("a/b");

      expect(flattenVisible(tree.roots, new Set(), () => false)).toEqual([]);
    });
  });
});

describe("anchorShift", () => {
  const rowsOf = (...ids) => ids.map((id) => ({ id }));

  it("is 0 when the rows did not move", () => {
    expect(anchorShift(rowsOf(1, 2, 3), rowsOf(1, 2, 3), 1)).toBe(0);
  });

  it("is positive when rows were added above the anchor", () => {
    expect(anchorShift(rowsOf(1, 2, 3), rowsOf(9, 8, 1, 2, 3), 1)).toBe(2);
  });

  it("is 0 when the anchor is gone or missing", () => {
    expect(anchorShift(rowsOf(1, 2), rowsOf(1), 1)).toBe(0);
    expect(anchorShift(rowsOf(1), rowsOf(1), 5)).toBe(0);
  });
});
