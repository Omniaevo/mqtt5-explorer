import { computed, shallowRef } from "vue";

/**
 * Selected topic node of the viewer and the views that follow it.
 * @param {object} deps
 * @param {object} deps.tree Topic tree (path lookup).
 * @param {import("vue").Ref<number>} deps.treeVersion Bumped on tree changes.
 * @param {import("vue").Ref<string>} deps.activeTab Detail tab id.
 * @param {import("vue").Ref<object|null>} deps.publishPanel Publish panel instance.
 * @param {import("vue").Ref<object|null>} deps.treeView Tree view instance.
 */
export function useTopicSelection({
  tree,
  treeVersion,
  activeTab,
  publishPanel,
  treeView,
}) {
  const selectedNode = shallowRef(undefined);

  /** Plain copy of the selected node that follows tree updates. */
  const selectedView = computed(() => {
    treeVersion.value; // Dependency only
    const node = selectedNode.value;

    return (
      node && {
        topic: node.topic,
        value: node.value,
        old: node.old,
        counter: node.counter,
      }
    );
  });

  const topicSegments = computed(() => selectedView.value?.topic.split("/"));

  /** Selects a node; the first selection shows its payload. */
  function selectNode(node) {
    if (!selectedNode.value) activeTab.value = "payload";

    selectedNode.value = node;
    publishPanel.value?.load(node);
  }

  /** Selects a topic by name and shows it in the tree. */
  function selectTopic(topic) {
    const path = tree.path(topic);

    if (path.length === 0) return;

    selectNode(path.at(-1));
    treeView.value?.reveal(path);
  }

  function resetSelection() {
    selectedNode.value = undefined;
    publishPanel.value?.reset();
    activeTab.value = "publish";
  }

  return {
    selectedNode,
    selectedView,
    topicSegments,
    selectNode,
    selectTopic,
    resetSelection,
  };
}
