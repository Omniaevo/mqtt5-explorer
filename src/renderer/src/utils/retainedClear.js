/** @returns {object[]} The node and all its descendants that hold a value. */
const collectValueNodes = (node) => {
  const own = node.value ? [node] : [];

  return node.children.reduce(
    (all, child) => all.concat(collectValueNodes(child)),
    own
  );
};

/**
 * Packets that clear the retained message of a topic and its children.
 * @param {object} node Topic node.
 * @returns {object[]} One empty retained packet per node holding a value.
 */
export const retainedClearPackets = (node) =>
  collectValueNodes(node).map((valueNode) => ({
    ...valueNode.value,
    topic: valueNode.topic,
    payload: "",
    retain: true,
  }));
