import { onBeforeUnmount } from "vue";
import SearchEngine from "../../../shared/SearchEngine";

const MAX_TOPICS = 20;

/**
 * Answers the topic searches that Home sends to this viewer.
 * @param {import("../models/TopicTree").default} tree
 */
export function useTopicSearchResponder(tree) {
  const unsubscribe = window.api.search.onRequest(({ requestId, query }) => {
    const matches = SearchEngine.matcher(query);

    window.api.search.respond(requestId, tree.search(matches, MAX_TOPICS));
  });

  onBeforeUnmount(unsubscribe);
}
