export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 200;
export const MAX_TOPICS_PER_TAB = 20;
export const MAX_TOPIC_LENGTH = 65535;
export const SEARCH_TIMEOUT_MS = 500;

/** Returns the trimmed query, or undefined when it is not a valid one. */
export function parseSearchQuery(query) {
  if (typeof query !== "string") return undefined;

  const trimmed = query.trim();
  const valid =
    trimmed.length >= MIN_QUERY_LENGTH && trimmed.length <= MAX_QUERY_LENGTH;

  return valid ? trimmed : undefined;
}

/** Keeps only the topic strings a view may report, capped in count. */
function sanitizeTopics(topics) {
  if (!Array.isArray(topics)) return [];

  return topics
    .filter(
      (topic) =>
        typeof topic === "string" &&
        topic !== "" &&
        topic.length <= MAX_TOPIC_LENGTH
    )
    .slice(0, MAX_TOPICS_PER_TAB);
}

/**
 * Asks every connected tab for the topics that match a query and merges the
 * answers. A reply counts only when it comes from the view that was asked.
 * Views that do not answer in time, or that close, add nothing.
 */
class TopicSearchCollector {
  #listTargets;
  #sendRequest;
  #timeoutMs;
  #nextRequestId = 1;
  #pending = new Map();

  /**
   * @param {object} deps
   * @param {() => {tabId: string, title: string, webContentsId: number}[]} deps.listTargets Tabs that can be searched.
   * @param {(tabId: string, request: {requestId: number, query: string}) => void} deps.sendRequest
   * @param {number} [deps.timeoutMs]
   */
  constructor({ listTargets, sendRequest, timeoutMs = SEARCH_TIMEOUT_MS }) {
    this.#listTargets = listTargets;
    this.#sendRequest = sendRequest;
    this.#timeoutMs = timeoutMs;
  }

  /**
   * @param {string} query A valid query, see `parseSearchQuery`.
   * @returns {Promise<{tabId: string, title: string, topics: string[]}[]>}
   * Tabs with at least one match, in tab order.
   */
  search(query) {
    const targets = this.#listTargets();

    if (targets.length === 0) return Promise.resolve([]);

    const requestId = this.#nextRequestId++;

    return new Promise((resolve) => {
      const request = {
        slots: new Map(targets.map((target) => [target.tabId, { ...target }])),
        resolve,
        timer: setTimeout(() => this.#finish(requestId), this.#timeoutMs),
      };

      this.#pending.set(requestId, request);
      targets.forEach(({ tabId }) =>
        this.#sendRequest(tabId, { requestId, query })
      );
    });
  }

  /**
   * Takes the answer of a view. Unknown request ids, wrong senders and
   * repeated answers are ignored.
   * @param {number} senderId Id of the webContents that answered.
   */
  handleResponse(senderId, requestId, topics) {
    const request = this.#pending.get(requestId);
    const slot = [...(request?.slots.values() ?? [])].find(
      (candidate) =>
        candidate.webContentsId === senderId && candidate.topics === undefined
    );

    if (!slot) return;

    slot.topics = sanitizeTopics(topics);
    this.#finishWhenComplete(requestId);
  }

  /** A tab closed: its pending answers are dropped. */
  dropTab(tabId) {
    this.#pending.forEach((request, requestId) => {
      request.slots.delete(tabId);
      this.#finishWhenComplete(requestId);
    });
  }

  #finishWhenComplete(requestId) {
    const { slots } = this.#pending.get(requestId);

    if ([...slots.values()].every((slot) => slot.topics !== undefined)) {
      this.#finish(requestId);
    }
  }

  #finish(requestId) {
    const request = this.#pending.get(requestId);

    if (!request) return;

    clearTimeout(request.timer);
    this.#pending.delete(requestId);
    request.resolve(
      [...request.slots.values()]
        .filter((slot) => slot.topics?.length > 0)
        .map(({ tabId, title, topics }) => ({ tabId, title, topics }))
    );
  }
}

export default TopicSearchCollector;
