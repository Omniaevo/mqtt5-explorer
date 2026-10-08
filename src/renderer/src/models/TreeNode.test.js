import { describe, expect, it } from "vitest";
import TreeNode from "./TreeNode";

// Mirrors Connection.#onMessage: builds a chain, then adds or merges it.
const makeIdGenerator = () => {
  let next = 0;
  return () => next++;
};

const packet = (topic, payload = "x") => ({ topic, payload });

const chain = (nextId, topic, payload) =>
  new TreeNode(nextId, topic.split("/"), packet(topic, payload));

const newRoot = (nextId, topic, payload) => {
  const root = chain(nextId, topic, payload);
  root.initObject();
  return root;
};

/** Follows `names` down the children and returns the last node. */
const find = (node, ...names) =>
  names.reduce((n, name) => n.children.find((c) => c.name === name), node);

describe("TreeNode", () => {
  describe("creation", () => {
    it("builds a single node for a one-level topic", () => {
      const root = newRoot(makeIdGenerator(), "a", "hi");

      expect(root.name).toBe("a");
      expect(root.topic).toBe("a");
      expect(root.value.payload).toBe("hi");
      expect(root.counter).toBe(1);
      expect(root.size).toBe(0);
    });

    it("builds the nested chain and assigns unique ids", () => {
      const root = newRoot(makeIdGenerator(), "a/b/c", "hi");
      const b = find(root, "b");
      const c = find(root, "b", "c");

      expect(root.value).toBeUndefined();
      expect(b.topic).toBe("a/b");
      expect(c.topic).toBe("a/b/c");
      expect(c.value.payload).toBe("hi");
      expect(new Set([root.id, b.id, c.id]).size).toBe(3);
    });
  });

  describe("merge", () => {
    it("adds a new branch, newest child first", () => {
      const nextId = makeIdGenerator();
      const root = newRoot(nextId, "a/b");

      root.merge(chain(nextId, "a/c"));

      expect(root.children.map((c) => c.name)).toEqual(["c", "b"]);
    });

    it("updates a leaf: counter grows and old keeps the previous value", () => {
      const nextId = makeIdGenerator();
      const root = newRoot(nextId, "a/b", "one");

      root.merge(chain(nextId, "a/b", "two"));
      const leaf = find(root, "b");

      expect(leaf.value.payload).toBe("two");
      expect(leaf.old.payload).toBe("one");
      expect(leaf.counter).toBe(2);
    });

    it("keeps a parent value and its children together", () => {
      const nextId = makeIdGenerator();
      const root = newRoot(nextId, "a", "parent");

      root.merge(chain(nextId, "a/b", "child"));

      expect(root.value.payload).toBe("parent");
      expect(find(root, "b").value.payload).toBe("child");
    });

    it("blinks on merge and stops after a short delay", async () => {
      const nextId = makeIdGenerator();
      const root = newRoot(nextId, "a/b");

      root.merge(chain(nextId, "a/b", "two"));
      expect(root.blink).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(root.blink).toBe(false);
    });
  });

  describe("delete by empty payload", () => {
    it("reports a branch with no value and no children as removable", () => {
      const nextId = makeIdGenerator();
      const root = newRoot(nextId, "a/b", "one");

      const isEmpty = root.merge(chain(nextId, "a/b", ""));

      expect(isEmpty).toBe(true); // `a` has no value and its only child is gone
      expect(root.size).toBe(0);
    });

    it("removes only the emptied leaf when siblings remain", () => {
      const nextId = makeIdGenerator();
      const root = newRoot(nextId, "a/b", "one");
      root.merge(chain(nextId, "a/c", "two"));

      const isEmpty = root.merge(chain(nextId, "a/b", ""));

      expect(isEmpty).toBe(false);
      expect(root.children.map((c) => c.name)).toEqual(["c"]);
    });

    it("keeps a node whose own value is set after a child is removed", () => {
      const nextId = makeIdGenerator();
      const root = newRoot(nextId, "a", "parent");
      root.merge(chain(nextId, "a/b", "child"));

      const isEmpty = root.merge(chain(nextId, "a/b", ""));

      expect(isEmpty).toBe(false);
      expect(root.size).toBe(0);
      expect(root.value.payload).toBe("parent");
    });

    it("reports a root with an empty payload as removable", () => {
      const nextId = makeIdGenerator();
      const root = newRoot(nextId, "a", "one");

      expect(root.merge(chain(nextId, "a", ""))).toBe(true);
      expect(root.value).toBeUndefined();
    });

    it("does not bump the counter on delete", () => {
      const nextId = makeIdGenerator();
      const root = newRoot(nextId, "a", "one");

      root.merge(chain(nextId, "a", ""));

      expect(root.counter).toBe(1);
    });
  });

  describe("known bugs (flip to passing in R2-02)", () => {
    // B2: topic built with `topic.split(name)[0] + name`
    it.fails("B2: builds the full topic when a level name repeats", () => {
      const root = newRoot(makeIdGenerator(), "a/b/a");

      expect(find(root, "b", "a").topic).toBe("a/b/a");
    });

    it.fails("B2: builds the full topic when a name is a substring", () => {
      const root = newRoot(makeIdGenerator(), "ab/b");

      expect(find(root, "b").topic).toBe("ab/b");
    });

    // B1 lives in Connection#map (array indexes shift after a root splice)
    it.todo("B1: messages keep landing in the right root after a root delete");
  });
});
