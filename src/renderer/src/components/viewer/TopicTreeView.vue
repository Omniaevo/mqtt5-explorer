<template>
  <div ref="scrollEl" class="tree-scroll">
    <div class="tree-canvas" :style="{ height: `${totalSize}px` }">
      <div
        v-for="item in virtualItems"
        :key="item.key"
        :class="{ selected: selected?.id === rows[item.index].id }"
        :style="{
          height: `${ROW_HEIGHT_PX}px`,
          transform: `translateY(${item.start + ROW_GAP_PX}px)`,
          paddingLeft: `calc(${rows[item.index].depth * INDENT_PX}px + var(--space-4))`,
        }"
        class="tree-row"
        @click="onRowClick(rows[item.index])"
      >
        <!-- Re-created on every update to restart the animation. The row
             itself must keep its element, or a click in progress is lost. -->
        <span
          v-if="isBlinking(rows[item.index].node)"
          :key="rows[item.index].node.lastUpdate"
          class="blink"
        />
        <component
          :is="rows[item.index].expanded ? ChevronDown : ChevronRight"
          :class="{ invisible: !rows[item.index].hasChildren }"
          :size="14"
          class="chevron"
        />
        <span class="label">
          {{ rows[item.index].node.name }}
          {{ rows[item.index].node.value !== undefined ? "=" : "" }}
          <span class="payload">
            {{
              rows[item.index].node.value !== undefined
                ? rows[item.index].node.value.payload
                : ""
            }}
          </span>
        </span>
        <span
          v-if="rows[item.index].hasChildren && !rows[item.index].expanded"
          class="hint"
        >
          ({{ rows[item.index].node.size }} elements inside)
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, shallowRef, watch } from "vue";
import { useVirtualizer } from "@tanstack/vue-virtual";
import { ChevronDown, ChevronRight } from "@lucide/vue";
import { anchorShift, flattenVisible } from "../../utils/flattenTree";

const INDENT_PX = 16;
const ROW_GAP_PX = 4; // Vertical space above and below each row
const OVERSCAN_ROWS = 10;

/** Resolves the `--row-height` token (rem) to pixels. */
function readRowHeightPx() {
  const probe = document.createElement("div");

  probe.style.cssText =
    "position:absolute;visibility:hidden;height:var(--row-height)";
  document.documentElement.appendChild(probe);

  const height = probe.getBoundingClientRect().height;

  probe.remove();

  return Math.round(height);
}

const ROW_HEIGHT_PX = readRowHeightPx();
// Slot height the virtualizer reserves per row: row plus its gaps
const ITEM_HEIGHT_PX = ROW_HEIGHT_PX + 2 * ROW_GAP_PX;

const props = defineProps({
  tree: { type: Object, required: true },
  /** Changes whenever the (non-reactive) tree changes. */
  version: { type: Number, required: true },
  selected: { type: Object, default: undefined },
  isBlinking: { type: Function, required: true },
  /** Optional node filter; matching branches are shown expanded. */
  matches: { type: Function, default: undefined },
});

const emit = defineEmits(["select"]);

const scrollEl = ref(null);
const expandedIds = shallowRef(new Set());

const rows = computed(() => {
  props.version; // Dependency only

  return flattenVisible(props.tree.roots, expandedIds.value, props.matches);
});

const virtualizer = useVirtualizer(
  computed(() => ({
    count: rows.value.length,
    getScrollElement: () => scrollEl.value,
    estimateSize: () => ITEM_HEIGHT_PX,
    getItemKey: (index) => rows.value[index].id,
    overscan: OVERSCAN_ROWS,
  }))
);

const virtualItems = computed(() => virtualizer.value.getVirtualItems());
const totalSize = computed(() => virtualizer.value.getTotalSize());

function onRowClick(row) {
  if (row.hasChildren) toggle(row.id);

  emit("select", row.node);
}

function toggle(id) {
  const next = new Set(expandedIds.value);

  if (!next.delete(id)) next.add(id);

  expandedIds.value = next;
}

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
  const element = scrollEl.value;

  if (!element || element.scrollTop === 0) return;

  const firstVisible = Math.floor(element.scrollTop / ITEM_HEIGHT_PX);
  const shift = anchorShift(oldRows, newRows, firstVisible);

  if (shift !== 0) {
    nextTick(() => (element.scrollTop += shift * ITEM_HEIGHT_PX));
  }
});
</script>

<style scoped>
.tree-scroll {
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
}

.tree-canvas {
  position: relative;
  width: 100%;
}

.tree-row {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  display: flex;
  align-items: center;
  padding-right: var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  white-space: nowrap;
  cursor: pointer;
}

.tree-row:hover:not(.selected) {
  background-color: var(--color-hover);
}

.tree-row.selected {
  background-color: var(--color-primary);
  color: var(--color-on-primary);
}

.chevron {
  flex-shrink: 0;
  margin-right: var(--space-4);
}

.invisible {
  visibility: hidden;
}

.label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.payload {
  font-weight: var(--font-weight-bold);
}

.hint {
  flex-shrink: 0;
  margin-left: var(--space-6);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.tree-row.selected .hint {
  color: inherit;
  opacity: 0.8;
}

.blink {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background-color: var(--color-primary);
  animation: blink 120ms ease-out forwards;
}

@keyframes blink {
  from {
    opacity: 0.5;
  }
  to {
    opacity: 0;
  }
}
</style>
