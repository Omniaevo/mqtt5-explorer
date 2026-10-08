import { describe, expect, it } from "vitest";
import RingBuffer from "./RingBuffer";

const filled = (capacity, count) => {
  const buffer = new RingBuffer(capacity);

  for (let i = 1; i <= count; i++) buffer.push(i);

  return buffer;
};

describe("RingBuffer", () => {
  it("rejects an invalid capacity", () => {
    expect(() => new RingBuffer(0)).toThrow(RangeError);
    expect(() => new RingBuffer(1.5)).toThrow(RangeError);
  });

  it("keeps insertion order while not full", () => {
    expect(filled(5, 3).toArray()).toEqual([1, 2, 3]);
  });

  it("drops the oldest items when full", () => {
    const buffer = filled(3, 5);

    expect(buffer.toArray()).toEqual([3, 4, 5]);
    expect(buffer.length).toBe(3);
  });

  it("keeps the newest items when it shrinks", () => {
    const buffer = filled(5, 7);

    buffer.resize(2);

    expect(buffer.toArray()).toEqual([6, 7]);
    expect(buffer.capacity).toBe(2);
  });

  it("keeps all items and accepts more when it grows", () => {
    const buffer = filled(3, 5);

    buffer.resize(5);
    buffer.push(6);

    expect(buffer.toArray()).toEqual([3, 4, 5, 6]);
  });

  it("rejects a resize to an invalid capacity", () => {
    expect(() => filled(3, 3).resize(0)).toThrow(RangeError);
  });

  it("empties on clear and works again", () => {
    const buffer = filled(3, 5);

    buffer.clear();
    expect(buffer.toArray()).toEqual([]);

    buffer.push(9);
    expect(buffer.toArray()).toEqual([9]);
  });
});
