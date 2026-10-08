/**
 * @typedef {object} TreeRow
 * @property {number} id Id of the node; stable key of the row.
 * @property {object} node
 * @property {number} depth
 * @property {boolean} hasChildren
 * @property {boolean} expanded
 */

const toRow = (node, depth, expanded) => ({
  id: node.id,
  node,
  depth,
  hasChildren: node.size > 0,
  expanded: node.size > 0 && expanded,
});

/**
 * Flat list of the rows a tree shows, in display order.
 * @param {object[]} roots Root nodes.
 * @param {Set<number>} expandedIds Ids of the expanded nodes.
 * @param {(node: object) => boolean} [matches] Optional filter. A node stays
 * when it, or one of its descendants, matches. Kept branches are expanded.
 * @returns {TreeRow[]}
 */
export function flattenVisible(roots, expandedIds, matches) {
  const rows = [];

  if (matches) {
    roots.forEach((root) => collectMatching(root, 0, matches, rows));
  } else {
    roots.forEach((root) => collectExpanded(root, 0, expandedIds, rows));
  }

  return rows;
}

function collectExpanded(node, depth, expandedIds, rows) {
  const expanded = expandedIds.has(node.id);

  rows.push(toRow(node, depth, expanded));

  if (!expanded) return;

  node.children.forEach((child) =>
    collectExpanded(child, depth + 1, expandedIds, rows)
  );
}

function collectMatching(node, depth, matches, rows) {
  const childRows = [];

  node.children.forEach((child) =>
    collectMatching(child, depth + 1, matches, childRows)
  );

  if (!matches(node) && childRows.length === 0) return;

  rows.push(toRow(node, depth, childRows.length > 0));
  childRows.forEach((row) => rows.push(row)); // No spread: lists can be huge
}

/**
 * How many rows the anchor row moved when the list changed.
 * Used to keep the scroll position on the same row.
 * @param {TreeRow[]} oldRows
 * @param {TreeRow[]} newRows
 * @param {number} anchorIndex Index of the anchor row in `oldRows`.
 * @returns {number} Row offset, 0 when the anchor is gone.
 */
export function anchorShift(oldRows, newRows, anchorIndex) {
  const anchor = oldRows[anchorIndex];

  if (!anchor) return 0;

  const newIndex = newRows.findIndex((row) => row.id === anchor.id);

  return newIndex < 0 ? 0 : newIndex - anchorIndex;
}
