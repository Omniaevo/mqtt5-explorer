import { describe, expect, it } from "vitest";
import TopicTree from "../models/TopicTree";
import { flattenVisible } from "./flattenTree";
import { resolveTreeKey } from "./treeKeyboard";

const buildRows = (expandedTopics = []) => {
  const tree = new TopicTree();

  ["a/b/c", "a/d", "e"].forEach((topic) =>
    tree.apply({ topic, payload: "x" })
  );

  const expanded = new Set(expandedTopics.map((topic) => tree.find(topic).id));

  // Collapsed: a, e. Expanded a: a, a/b, a/d, e
  return flattenVisible(tree.roots, expanded);
};

describe("resolveTreeKey", () => {
  it("moves focus to the next row on ArrowDown", () => {
    expect(resolveTreeKey("ArrowDown", buildRows(), 0)).toEqual({
      type: "focus",
      index: 1,
    });
  });

  it("stays on the last row on ArrowDown", () => {
    expect(resolveTreeKey("ArrowDown", buildRows(), 1)).toEqual({
      type: "focus",
      index: 1,
    });
  });

  it("stays on the first row on ArrowUp", () => {
    expect(resolveTreeKey("ArrowUp", buildRows(), 0)).toEqual({
      type: "focus",
      index: 0,
    });
  });

  it("jumps to the first and last row on Home and End", () => {
    const rows = buildRows(["a"]);

    expect(resolveTreeKey("Home", rows, 2)).toEqual({ type: "focus", index: 0 });
    expect(resolveTreeKey("End", rows, 0)).toEqual({ type: "focus", index: 3 });
  });

  it("expands a collapsed branch on ArrowRight", () => {
    expect(resolveTreeKey("ArrowRight", buildRows(), 0)).toEqual({
      type: "expand",
      index: 0,
    });
  });

  it("goes to the first child on ArrowRight when expanded", () => {
    expect(resolveTreeKey("ArrowRight", buildRows(["a"]), 0)).toEqual({
      type: "focus",
      index: 1,
    });
  });

  it("does nothing on ArrowRight for a leaf", () => {
    expect(resolveTreeKey("ArrowRight", buildRows(), 1)).toBeNull();
  });

  it("collapses an expanded branch on ArrowLeft", () => {
    expect(resolveTreeKey("ArrowLeft", buildRows(["a"]), 0)).toEqual({
      type: "collapse",
      index: 0,
    });
  });

  it("goes to the parent on ArrowLeft from a collapsed row", () => {
    expect(resolveTreeKey("ArrowLeft", buildRows(["a"]), 2)).toEqual({
      type: "focus",
      index: 0,
    });
  });

  it("does nothing on ArrowLeft for a root without children open", () => {
    expect(resolveTreeKey("ArrowLeft", buildRows(), 1)).toBeNull();
  });

  it("selects the row on Enter and Space", () => {
    const rows = buildRows();

    expect(resolveTreeKey("Enter", rows, 1)).toEqual({ type: "select", index: 1 });
    expect(resolveTreeKey(" ", rows, 1)).toEqual({ type: "select", index: 1 });
  });

  it("ignores other keys", () => {
    expect(resolveTreeKey("x", buildRows(), 0)).toBeNull();
  });

  it("ignores any key when there are no rows", () => {
    expect(resolveTreeKey("ArrowDown", [], 0)).toBeNull();
  });
});
