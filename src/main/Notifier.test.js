import { describe, expect, it, vi } from "vitest";
import Notifier, { THROTTLE_MS } from "./Notifier";

function createNotifier() {
  const clock = { time: 10_000 };
  const created = [];
  const onClick = vi.fn();
  const createNotification = vi.fn((title, body) => {
    const notification = { title, body, on: vi.fn(), show: vi.fn() };

    created.push(notification);

    return notification;
  });
  const notifier = new Notifier({
    createNotification,
    onClick,
    now: () => clock.time,
  });

  return { notifier, clock, created, onClick };
}

describe("Notifier", () => {
  it("shows the topic as title and the payload as body", () => {
    const { notifier, created } = createNotifier();

    notifier.notify({ topic: "a/b", payload: "42" });

    expect(created[0]).toMatchObject({ title: "a/b", body: "42" });
    expect(created[0].show).toHaveBeenCalledTimes(1);
  });

  it("drops a second notification of the same topic in the window", () => {
    const { notifier, clock, created } = createNotifier();

    notifier.notify({ topic: "a", payload: "1" });
    clock.time += THROTTLE_MS - 1;
    notifier.notify({ topic: "a", payload: "2" });

    expect(created).toHaveLength(1);
  });

  it("shows the topic again after the window", () => {
    const { notifier, clock, created } = createNotifier();

    notifier.notify({ topic: "a", payload: "1" });
    clock.time += THROTTLE_MS;
    notifier.notify({ topic: "a", payload: "2" });

    expect(created).toHaveLength(2);
  });

  it("throttles each topic on its own", () => {
    const { notifier, created } = createNotifier();

    notifier.notify({ topic: "a", payload: "1" });
    notifier.notify({ topic: "b", payload: "1" });

    expect(created).toHaveLength(2);
  });

  it("sends the topic to the click callback", () => {
    const { notifier, created, onClick } = createNotifier();

    notifier.notify({ topic: "a/b", payload: "1" });
    const [event, handler] = created[0].on.mock.calls[0];
    handler();

    expect(event).toBe("click");
    expect(onClick).toHaveBeenCalledWith("a/b");
  });

  it("forgets the throttle state on reset", () => {
    const { notifier, created } = createNotifier();

    notifier.notify({ topic: "a", payload: "1" });
    notifier.reset();
    notifier.notify({ topic: "a", payload: "1" });

    expect(created).toHaveLength(2);
  });
});
