import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TopicSearchCollector, {
  MAX_TOPICS_PER_TAB,
  parseSearchQuery,
  SEARCH_TIMEOUT_MS,
} from "./TopicSearchCollector";

const TAB_A = { tabId: "connection-1", title: "A", webContentsId: 11 };
const TAB_B = { tabId: "connection-2", title: "B", webContentsId: 12 };

function createCollector(targets = [TAB_A, TAB_B]) {
  const sendRequest = vi.fn();
  const collector = new TopicSearchCollector({
    listTargets: () => targets,
    sendRequest,
  });

  return { collector, sendRequest };
}

const lastRequestId = (sendRequest) =>
  sendRequest.mock.calls.at(-1)[1].requestId;

describe("TopicSearchCollector", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("resolves empty with no searchable tab", async () => {
    const { collector, sendRequest } = createCollector([]);

    expect(await collector.search("temp")).toEqual([]);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it("asks every target with the query", () => {
    const { collector, sendRequest } = createCollector();

    collector.search("temp");

    expect(sendRequest.mock.calls.map(([tabId]) => tabId)).toEqual([
      TAB_A.tabId,
      TAB_B.tabId,
    ]);
  });

  it("merges the answers in tab order and omits tabs without hits", async () => {
    const { collector, sendRequest } = createCollector();
    const result = collector.search("temp");
    const requestId = lastRequestId(sendRequest);

    collector.handleResponse(TAB_B.webContentsId, requestId, ["b/temp"]);
    collector.handleResponse(TAB_A.webContentsId, requestId, []);

    expect(await result).toEqual([
      { tabId: TAB_B.tabId, title: "B", topics: ["b/temp"] },
    ]);
  });

  it("ignores an answer from a view that was not asked", async () => {
    const { collector, sendRequest } = createCollector([TAB_A]);
    const result = collector.search("temp");

    collector.handleResponse(999, lastRequestId(sendRequest), ["spoofed"]);
    vi.advanceTimersByTime(SEARCH_TIMEOUT_MS);

    expect(await result).toEqual([]);
  });

  it("ignores a second answer of the same view", async () => {
    const { collector, sendRequest } = createCollector([TAB_A, TAB_B]);
    const result = collector.search("temp");
    const requestId = lastRequestId(sendRequest);

    collector.handleResponse(TAB_A.webContentsId, requestId, ["first"]);
    collector.handleResponse(TAB_A.webContentsId, requestId, ["second"]);
    vi.advanceTimersByTime(SEARCH_TIMEOUT_MS);

    expect(await result).toEqual([
      { tabId: TAB_A.tabId, title: "A", topics: ["first"] },
    ]);
  });

  it("keeps the answers it got when a view is too slow", async () => {
    const { collector, sendRequest } = createCollector();
    const result = collector.search("temp");

    collector.handleResponse(TAB_A.webContentsId, lastRequestId(sendRequest), [
      "a/temp",
    ]);
    vi.advanceTimersByTime(SEARCH_TIMEOUT_MS);

    expect(await result).toEqual([
      { tabId: TAB_A.tabId, title: "A", topics: ["a/temp"] },
    ]);
  });

  it("does not wait for a tab that closed mid-request", async () => {
    const { collector, sendRequest } = createCollector();
    const result = collector.search("temp");

    collector.handleResponse(TAB_A.webContentsId, lastRequestId(sendRequest), [
      "a/temp",
    ]);
    collector.dropTab(TAB_B.tabId);

    expect(await result).toEqual([
      { tabId: TAB_A.tabId, title: "A", topics: ["a/temp"] },
    ]);
  });

  it("resolves empty when the only tab closes mid-request", async () => {
    const { collector } = createCollector([TAB_A]);
    const result = collector.search("temp");

    collector.dropTab(TAB_A.tabId);

    expect(await result).toEqual([]);
  });

  it("keeps only valid topic strings, capped in count", async () => {
    const { collector, sendRequest } = createCollector([TAB_A]);
    const result = collector.search("t");
    const topics = Array.from({ length: 30 }, (_, i) => `t/${i}`);

    collector.handleResponse(TAB_A.webContentsId, lastRequestId(sendRequest), [
      42,
      "",
      ...topics,
    ]);

    expect((await result)[0].topics).toEqual(topics.slice(0, MAX_TOPICS_PER_TAB));
  });

  it("ignores an answer for an unknown request", () => {
    const { collector } = createCollector();

    expect(() => collector.handleResponse(11, 999, ["x"])).not.toThrow();
  });
});

describe("parseSearchQuery", () => {
  it.each([[undefined], [3], ["a"], ["  a "], ["x".repeat(201)]])(
    "rejects %j",
    (query) => {
      expect(parseSearchQuery(query)).toBeUndefined();
    }
  );

  it("trims a valid query", () => {
    expect(parseSearchQuery("  temp ")).toBe("temp");
  });
});
