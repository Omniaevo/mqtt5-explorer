import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MessageBatcher, { FLUSH_INTERVAL_MS } from "./MessageBatcher";

describe("MessageBatcher", () => {
  let onFlush;
  let batcher;

  beforeEach(() => {
    vi.useFakeTimers();
    onFlush = vi.fn();
    batcher = new MessageBatcher(onFlush);
    batcher.start();
  });

  afterEach(() => {
    batcher.stop();
    vi.useRealTimers();
  });

  it("should flush all messages in one call per interval", () => {
    batcher.add({ topic: "a" });
    batcher.add({ topic: "b" });

    vi.advanceTimersByTime(FLUSH_INTERVAL_MS);

    expect(onFlush).toHaveBeenCalledExactlyOnceWith([
      { topic: "a" },
      { topic: "b" },
    ]);
  });

  it("should keep repeated messages of the same topic", () => {
    batcher.add({ topic: "a", payload: "1" });
    batcher.add({ topic: "a", payload: "2" });

    vi.advanceTimersByTime(FLUSH_INTERVAL_MS);

    expect(onFlush.mock.calls[0][0]).toHaveLength(2);
  });

  it("should not flush when there are no messages", () => {
    vi.advanceTimersByTime(FLUSH_INTERVAL_MS * 5);

    expect(onFlush).not.toHaveBeenCalled();
  });

  it("should not flush the same message twice", () => {
    batcher.add({ topic: "a" });

    vi.advanceTimersByTime(FLUSH_INTERVAL_MS * 3);

    expect(onFlush).toHaveBeenCalledTimes(1);
  });

  it("should drop pending messages and stop flushing after stop", () => {
    batcher.add({ topic: "a" });
    batcher.stop();
    batcher.add({ topic: "b" });

    vi.advanceTimersByTime(FLUSH_INTERVAL_MS * 2);

    expect(onFlush).not.toHaveBeenCalled();
  });
});
