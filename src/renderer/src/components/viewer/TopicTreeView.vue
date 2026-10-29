<template>
  <div ref="scrollElement" class="tree-scroll">
    <div
      role="tree"
      aria-label="Topics"
      class="tree"
      :style="{ height: `${virtualizer.getTotalSize()}px` }"
      @keydown="onKeydown"
    >
      <div
        v-for="item in virtualizer.getVirtualItems()"
        :key="item.key"
        role="treeitem"
        class="tree-row"
        :class="{ 'tree-row--selected': selected?.id === rows[item.index].id }"
        :data-index="item.index"
        :aria-level="rows[item.index].depth + 1"
        :aria-expanded="ariaExpanded(rows[item.index])"
        :aria-selected="selected?.id === rows[item.index].id"
        :tabindex="item.index === tabbableIndex ? 0 : -1"
        :style="{
          height: `${rowHeight}px`,
          transform: `translateY(${item.start}px)`,
          paddingLeft: `calc(${rows[item.index].depth * INDENT_SUBUNITS} * var(--m-subunit))`,
        }"
        @click="onRowClick(rows[item.index])"
        @focus="focusedId = rows[item.index].id"
      >
        <!-- Re-created on every update to restart the animation. The row
             itself must keep its element, or a click in progress is lost. -->
        <span
          v-if="isBlinking(rows[item.index].node)"
          :key="rows[item.index].node.lastUpdate"
          class="tree-blink"
        />
        <MIcon
          name="chevronRight"
          :size="16"
          class="tree-chevron"
          :class="{
            'tree-chevron--open': rows[item.index].expanded,
            'tree-chevron--hidden': !rows[item.index].hasChildren,
          }"
        />
        <span class="tree-label">
          {{ rows[item.index].node.name }}
          <template v-if="rows[item.index].node.value !== undefined">
            = <strong>{{ rows[item.index].node.value.payload }}</strong>
          </template>
        </span>
        <span
          v-if="rows[item.index].hasChildren && !rows[item.index].expanded"
          class="tree-count"
        >
          ({{ rows[item.index].node.size }} elements inside)
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useVirtualizer } from "@tanstack/vue-virtual";
import {
  computed,
  nextTick,
  onUpdated,
  ref,
  shallowRef,
  watch,
} from "vue";
import { anchorShift, flattenVisible } from "../../utils/flattenTree";
import { resolveTreeKey } from "../../utils/treeKeyboard";
import MIcon from "../metro/MIcon.vue";

const INDENT_SUBUNITS = 3;
const ROW_HEIGHT = { default: 30, dense: 22 };
const OVERSCAN_ROWS = 8;

const props = defineProps({
  tree: { type: Object, required: true },
  /** Changes whenever the (non-reactive) tree changes. */
  version: { type: Number, required: true },
  selected: { type: Object, default: undefined },
  dense: { type: Boolean, default: false },
  isBlinking: { type: Function, required: true },
  /** Optional node filter; matching branches are shown expanded. */
  matches: { type: Function, default: undefined },
});

const emit = defineEmits(["select"]);

const scrollElement = ref(null);
const expandedIds = shallowRef(new Set());
const focusedId = ref(undefined);
// Row to focus once the virtualizer has rendered it
const pendingFocusIndex = ref(-1);

const rowHeight = computed(() =>
  props.dense ? ROW_HEIGHT.dense : ROW_HEIGHT.default
);

const rows = computed(() => {
  props.version; // Dependency only

  return flattenVisible(props.tree.roots, expandedIds.value, props.matches);
});

const virtualizer = useVirtualizer(
  computed(() => ({
    count: rows.value.length,
    getScrollElement: () => scrollElement.value,
    estimateSize: () => rowHeight.value,
    overscan: OVERSCAN_ROWS,
    getItemKey: (index) => rows.value[index].id,
  }))
);

// Roving tabindex: the focused row, else the first one, is the tab stop
const tabbableIndex = computed(() =>
  Math.max(
    rows.value.findIndex((row) => row.id === focusedId.value),
    0
  )
);

const ariaExpanded = (row) => (row.hasChildren ? row.expanded : undefined);

function onRowClick(row) {
  if (row.hasChildren) toggle(row.id);

  emit("select", row.node);
}

function toggle(id) {
  const next = new Set(expandedIds.value);

  if (!next.delete(id)) next.add(id);

  expandedIds.value = next;
}

function setExpanded(id, expanded) {
  const next = new Set(expandedIds.value);

  if (expanded) next.add(id);
  else next.delete(id);

  expandedIds.value = next;
}

function onKeydown(event) {
  const rowElement = event.target.closest("[data-index]");
  const index = Number(rowElement?.dataset.index);
  const action = resolveTreeKey(event.key, rows.value, index);

  if (!action) return;

  event.preventDefault();
  runAction(action);
}

function runAction({ type, index }) {
  const row = rows.value[index];

  if (type === "focus") focusRow(index);
  else if (type === "expand") setExpanded(row.id, true);
  else if (type === "collapse") setExpanded(row.id, false);
  else emit("select", row.node);
}

function focusRow(index) {
  focusedId.value = rows.value[index].id;
  pendingFocusIndex.value = index;
  virtualizer.value.scrollToIndex(index);
}

// A scrolled-to row only exists after the next render
onUpdated(() => {
  if (pendingFocusIndex.value < 0) return;

  const element = scrollElement.value.querySelector(
    `[data-index="${pendingFocusIndex.value}"]`
  );

  if (!element) return;

  pendingFocusIndex.value = -1;
  element.focus({ preventScroll: true });
});

/**
 * Expands the ancestors of the last node of `path` and scrolls to it.
 * @param {object[]} path Nodes from the root level down to the target.
 */
async function reveal(path) {
  const next = new Set(expandedIds.value);

  path.slice(0, -1).forEach((node) => next.add(node.id));
  expandedIds.value = next;

  await nextTick();

  const index = rows.value.findIndex((row) => row.id === path.at(-1).id);

  if (index >= 0) virtualizer.value.scrollToIndex(index);
}

defineExpose({ reveal });

// Keeps the first visible row in place when rows appear above it
watch(rows, (newRows, oldRows) => {
  const element = scrollElement.value;

  if (!element || element.scrollTop === 0) return;

  const firstVisible = Math.floor(element.scrollTop / rowHeight.value);
  const shift = anchorShift(oldRows, newRows, firstVisible);

  if (shift !== 0) {
    nextTick(() => (element.scrollTop += shift * rowHeight.value));
  }
});
</script>

<style scoped>
.tree-scroll {
  height: 100%;
  overflow: auto;
}

.tree {
  position: relative;
  min-width: 100%;
}

.tree-row {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  padding-right: calc(2 * var(--m-subunit));
  font: var(--m-font-body);
  white-space: nowrap;
  cursor: pointer;
}

.tree-row:hover:not(.tree-row--selected) {
  background-color: color-mix(in srgb, var(--m-fg) 10%, transparent);
}

.tree-row:focus-visible {
  outline: var(--m-border-width) solid var(--m-fg);
  outline-offset: -2px;
}

.tree-row--selected {
  background-color: var(--m-accent);
  color: var(--m-on-accent);
}

.tree-row--selected:focus-visible {
  outline-color: var(--m-on-accent);
}

.tree-chevron {
  margin-right: var(--m-subunit);
}

.tree-chevron--open {
  transform: rotate(90deg);
}

.tree-chevron--hidden {
  visibility: hidden;
}

.tree-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.tree-label strong {
  font-weight: 600;
}

.tree-count {
  flex: none;
  margin-left: calc(3 * var(--m-subunit));
  font: var(--m-font-caption);
  opacity: 0.7;
}

/* No "m-" prefix on purpose: the blink shows a new message, so it stays under
   reduced motion. It only changes opacity, nothing moves. */
.tree-blink {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-color: var(--m-accent);
  animation: tree-blink 120ms ease-out forwards;
}

@keyframes tree-blink {
  from {
    opacity: 0.4;
  }
  to {
    opacity: 0;
  }
}
</style>
