import { describe, expect, it } from "vitest";
import { retainedClearPackets } from "./retainedClear";

const node = (topic, value, children = []) => ({ topic, value, children });

describe("retainedClearPackets", () => {
  it("should clear the node and its descendants with a value", () => {
    const tree = node("a", { qos: 1 }, [
      node("a/b", undefined, [node("a/b/c", { qos: 0 })]),
    ]);

    expect(retainedClearPackets(tree).map((p) => p.topic)).toEqual([
      "a",
      "a/b/c",
    ]);
  });

  it("should send an empty retained payload", () => {
    const [packet] = retainedClearPackets(node("a", { qos: 1, payload: "x" }));

    expect(packet).toEqual({ qos: 1, topic: "a", payload: "", retain: true });
  });

  it("should return nothing when no node holds a value", () => {
    expect(retainedClearPackets(node("a", undefined))).toEqual([]);
  });
});
