/**
 * @typedef {object} TreeKeyAction
 * @property {"focus" | "expand" | "collapse" | "select"} type
 * @property {number} index Index of the row the action applies to.
 */

const SELECT_KEYS = ["Enter", " "];

const focus = (index) => ({ type: "focus", index });

const moveBy = (offset) => (rows, index) =>
  focus(Math.min(Math.max(index + offset, 0), rows.length - 1));

function onArrowRight(rows, index) {
  const row = rows[index];

  if (!row.hasChildren) return null;
  // The first child always follows its expanded parent
  if (row.expanded) return focus(index + 1);

  return { type: "expand", index };
}

function onArrowLeft(rows, index) {
  const row = rows[index];

  if (row.expanded) return { type: "collapse", index };

  const parentIndex = findParentIndex(rows, index);

  return parentIndex < 0 ? null : focus(parentIndex);
}

function findParentIndex(rows, index) {
  for (let i = index - 1; i >= 0; i--) {
    if (rows[i].depth < rows[index].depth) return i;
  }

  return -1;
}

const KEY_HANDLERS = {
  ArrowDown: moveBy(1),
  ArrowUp: moveBy(-1),
  Home: () => focus(0),
  End: (rows) => focus(rows.length - 1),
  ArrowRight: onArrowRight,
  ArrowLeft: onArrowLeft,
};

/**
 * Maps a key press on a tree row to the action the tree must run.
 * @param {string} key Value of `KeyboardEvent.key`.
 * @param {import("./flattenTree").TreeRow[]} rows Visible rows.
 * @param {number} index Index of the focused row.
 * @returns {TreeKeyAction | null} `null` when the key has no effect.
 */
export function resolveTreeKey(key, rows, index) {
  if (!rows[index]) return null;
  if (SELECT_KEYS.includes(key)) return { type: "select", index };

  return KEY_HANDLERS[key]?.(rows, index) ?? null;
}
