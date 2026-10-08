import { describe, expect, it } from "vitest";
import SearchEngine from "../utils/SearchEngine";
import TopicTree from "./TopicTree";

const message = (topic, payload = "x") => ({ topic, payload });

const names = (nodes) => nodes.map((node) => node.name);

describe("TopicTree", () => {
  describe("creation", () => {
    it("builds a single node for a one-level topic", () => {
      const tree = new TopicTree();

      const node = tree.apply(message("a", "hi"));

      expect(node.name).toBe("a");
      expect(node.topic).toBe("a");
      expect(node.value.payload).toBe("hi");
      expect(node.counter).toBe(1);
      expect(node.size).toBe(0);
    });

    it("builds the nested path without values on the parents", () => {
      const tree = new TopicTree();

      tree.apply(message("a/b/c"));

      const a = tree.find("a");
      expect(a.value).toBeUndefined();
      expect(tree.find("a/b").topic).toBe("a/b");
      expect(tree.find("a/b/c").topic).toBe("a/b/c");
    });

    it("assigns unique incrementing ids", () => {
      const tree = new TopicTree();

      tree.apply(message("a/b/c"));
      const ids = ["a", "a/b", "a/b/c"].map((topic) => tree.find(topic).id);

      expect(ids).toEqual([1, 2, 3]);
    });

    it("keeps the message as the node value", () => {
      const tree = new TopicTree();
      const packet = { ...message("a"), qos: 1, retain: true };

      expect(tree.apply(packet).value).toBe(packet);
    });
  });

  describe("full topic (B2)", () => {
    it("builds the full topic when a level name repeats", () => {
      const tree = new TopicTree();

      tree.apply(message("a/b/a"));

      expect(tree.find("a/b/a").topic).toBe("a/b/a");
    });

    it("builds the full topic when a name is a substring", () => {
      const tree = new TopicTree();

      tree.apply(message("ab/b"));

      expect(tree.find("ab/b").topic).toBe("ab/b");
    });

    it("keeps empty levels of a topic that starts with a slash", () => {
      const tree = new TopicTree();

      tree.apply(message("/a"));

      expect(tree.find("/a").topic).toBe("/a");
    });
  });

  describe("update", () => {
    it("updates a leaf: counter grows and old keeps the previous value", () => {
      const tree = new TopicTree();
      const first = message("a/b", "one");
      tree.apply(first);

      const leaf = tree.apply(message("a/b", "two"));

      expect(leaf.value.payload).toBe("two");
      expect(leaf.old).toBe(first);
      expect(leaf.counter).toBe(2);
    });

    it("keeps a parent value and its children together", () => {
      const tree = new TopicTree();
      tree.apply(message("a", "parent"));

      tree.apply(message("a/b", "child"));

      expect(tree.find("a").value.payload).toBe("parent");
      expect(tree.find("a/b").value.payload).toBe("child");
    });

    it("stamps the batch time on the node and its ancestors", () => {
      const tree = new TopicTree();
      tree.apply(message("a/b/c"), 100);
      tree.apply(message("a/x"), 200);

      expect(
        ["a", "a/b", "a/b/c", "a/x"].map((t) => tree.find(t).lastUpdate)
      ).toEqual([200, 100, 100, 200]);
    });

    it("stamps the batch time on the path of a removed value", () => {
      const tree = new TopicTree();
      tree.apply(message("a/b"), 100);
      tree.apply(message("a/c"), 100);

      tree.apply(message("a/b", ""), 300);

      expect(tree.find("a").lastUpdate).toBe(300);
    });
  });

  describe("children order", () => {
    it("lists children in insertion order", () => {
      const tree = new TopicTree();
      ["a/z", "a/b", "a/m"].forEach((topic) => tree.apply(message(topic)));

      expect(names(tree.find("a").children)).toEqual(["z", "b", "m"]);
    });

    it("keeps the position of a child that is updated", () => {
      const tree = new TopicTree();
      ["a/z", "a/b"].forEach((topic) => tree.apply(message(topic)));

      tree.apply(message("a/z", "again"));

      expect(names(tree.find("a").children)).toEqual(["z", "b"]);
    });

    it("looks a child up by name", () => {
      const tree = new TopicTree();
      tree.apply(message("a/b"));

      expect(tree.find("a").child("b").topic).toBe("a/b");
    });

    it("lists the roots in insertion order", () => {
      const tree = new TopicTree();
      ["r2", "r1", "r3"].forEach((topic) => tree.apply(message(topic)));

      expect(names(tree.roots)).toEqual(["r2", "r1", "r3"]);
    });
  });

  describe("delete by empty payload", () => {
    it("returns no node and prunes a branch left empty", () => {
      const tree = new TopicTree();
      tree.apply(message("a/b", "one"));

      const result = tree.apply(message("a/b", ""));

      expect(result).toBeUndefined();
      expect(tree.roots).toEqual([]);
    });

    it("removes only the emptied leaf when siblings remain", () => {
      const tree = new TopicTree();
      tree.apply(message("a/b", "one"));
      tree.apply(message("a/c", "two"));

      tree.apply(message("a/b", ""));

      expect(names(tree.find("a").children)).toEqual(["c"]);
    });

    it("keeps a node whose own value is set after a child is removed", () => {
      const tree = new TopicTree();
      tree.apply(message("a", "parent"));
      tree.apply(message("a/b", "child"));

      tree.apply(message("a/b", ""));

      expect(tree.find("a").size).toBe(0);
      expect(tree.find("a").value.payload).toBe("parent");
    });

    it("keeps a node that still has children after its value is removed", () => {
      const tree = new TopicTree();
      tree.apply(message("a", "parent"));
      tree.apply(message("a/b", "child"));

      tree.apply(message("a", ""));

      expect(tree.find("a").value).toBeUndefined();
      expect(tree.find("a/b")).toBeDefined();
    });

    it("prunes every empty ancestor up to the first one in use", () => {
      const tree = new TopicTree();
      tree.apply(message("a", "keep"));
      tree.apply(message("a/b/c/d", "deep"));

      tree.apply(message("a/b/c/d", ""));

      expect(tree.find("a").size).toBe(0);
    });

    it("keeps the removed value as old", () => {
      const tree = new TopicTree();
      const stored = message("a", "one");
      tree.apply(stored);
      tree.apply(message("a/b", "child"));

      tree.apply(message("a", ""));

      expect(tree.find("a").old).toBe(stored);
    });

    it("does not bump the counter on delete", () => {
      const tree = new TopicTree();
      tree.apply(message("a", "one"));
      tree.apply(message("a/b", "child"));

      tree.apply(message("a", ""));

      expect(tree.find("a").counter).toBe(1);
    });

    it("ignores an empty payload on an unknown topic", () => {
      const tree = new TopicTree();

      tree.apply(message("a/b", ""));

      expect(tree.roots).toEqual([]);
    });
  });

  describe("roots (B1)", () => {
    it("keeps updating the right roots after another root is deleted", () => {
      const tree = new TopicTree();
      ["r1", "r2", "r3"].forEach((topic) => tree.apply(message(topic, "v1")));

      tree.apply(message("r1", ""));
      tree.apply(message("r3", "v2"));
      tree.apply(message("r2", "v2"));

      expect(tree.find("r2").value.payload).toBe("v2");
      expect(tree.find("r3").value.payload).toBe("v2");
      expect(names(tree.roots)).toEqual(["r2", "r3"]);
    });

    it("creates a root again after it was deleted", () => {
      const tree = new TopicTree();
      tree.apply(message("r1", "v1"));
      tree.apply(message("r1", ""));

      tree.apply(message("r1", "v2"));

      expect(tree.find("r1").counter).toBe(1);
    });
  });

  describe("find", () => {
    it("returns undefined for an unknown topic", () => {
      const tree = new TopicTree();
      tree.apply(message("a/b"));

      expect(tree.find("a/x")).toBeUndefined();
    });
  });

  describe("search", () => {
    const { ALL, CASES, WORDS, REG_EXP } = SearchEngine.modes;

    const treeWithSensor = () => {
      const tree = new TopicTree();
      tree.apply(message("home/Sensor/temp", "21.5"));
      return tree;
    };

    it("matches the full topic", () => {
      const node = treeWithSensor().find("home/Sensor/temp");

      expect(node.search("home/sensor", ALL)).toBe(true);
    });

    it("matches the node name", () => {
      const node = treeWithSensor().find("home/Sensor/temp");

      expect(node.search("temp", WORDS)).toBe(true);
    });

    it("respects case in case-sensitive mode", () => {
      const node = treeWithSensor().find("home/Sensor/temp");

      expect(node.search("sensor", CASES)).toBe(false);
    });

    it("supports regular expressions", () => {
      const node = treeWithSensor().find("home/Sensor/temp");

      expect(node.search("^home/.+/temp$", REG_EXP)).toBe(true);
    });

    it("matches a field of the value with a query", () => {
      const node = treeWithSensor().find("home/Sensor/temp");

      expect(node.search("query::payload=21", ALL)).toBe(true);
    });

    it("does not match an unrelated term", () => {
      const node = treeWithSensor().find("home/Sensor/temp");

      expect(node.search("garage", ALL)).toBe(false);
    });
  });
});
