import { ipcMain } from "electron";
import { Channel, FixedTabId } from "../shared/ipcChannels";
import { MAX_TOPIC_LENGTH, parseSearchQuery } from "./TopicSearchCollector";

const CHANNELS = [Channel.SEARCH_RESPONSE, Channel.SEARCH_OPEN_TOPIC];

/**
 * Registers the topic search channels. Only Home may search and open a
 * result. A view may only answer a request it got.
 *
 * @param {object} deps
 * @param {import("./TabManager").default} deps.tabs
 * @param {import("./TopicSearchCollector").default} deps.collector
 * @returns {() => void} Removes the handlers.
 */
export function registerSearchIpc({ tabs, collector }) {
  const fromHome = (event) => tabs.tabIdOf(event.sender.id) === FixedTabId.HOME;

  ipcMain.handle(Channel.SEARCH_TOPICS, (event, query) => {
    const parsed = parseSearchQuery(query);

    return fromHome(event) && parsed ? collector.search(parsed) : [];
  });
  ipcMain.on(Channel.SEARCH_RESPONSE, (event, requestId, topics) => {
    collector.handleResponse(event.sender.id, requestId, topics);
  });
  ipcMain.on(Channel.SEARCH_OPEN_TOPIC, (event, tabId, topic) => {
    const valid =
      typeof tabId === "string" &&
      typeof topic === "string" &&
      topic.length > 0 &&
      topic.length <= MAX_TOPIC_LENGTH;

    if (fromHome(event) && valid) tabs.selectTopic(tabId, topic);
  });

  return () => {
    ipcMain.removeHandler(Channel.SEARCH_TOPICS);
    CHANNELS.forEach((channel) => ipcMain.removeAllListeners(channel));
  };
}
