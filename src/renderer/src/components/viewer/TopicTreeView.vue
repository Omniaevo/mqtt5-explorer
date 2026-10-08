<template>
  <v-virtual-scroll
    ref="scroller"
    :items="rows"
    :item-height="itemHeight"
    item-key="id"
    class="h-100"
  >
    <template #default="{ item: row }">
      <div
        :class="{ 'bg-primary text-white': selected?.id === row.id }"
        :style="{
          height: `${rowHeight}px`,
          marginBlock: `${ROW_GAP_PX}px`,
          paddingLeft: `${row.depth * INDENT_PX}px`,
        }"
        class="tree-row d-flex align-center px-2 rounded"
        @click="onRowClick(row)"
      >
        <!-- Re-created on every update to restart the animation. The row
             itself must keep its element, or a click in progress is lost. -->
        <span
          v-if="isBlinking(row.node)"
          :key="row.node.lastUpdate"
          class="blink"
        />
        <v-icon
          :icon="row.expanded ? 'mdi-chevron-down' : 'mdi-chevron-right'"
          :class="{ invisible: !row.hasChildren }"
          class="me-2"
          size="small"
        />
        <span class="text-truncate">
          {{ row.node.name }}
          {{ row.node.value !== undefined ? "=" : "" }}
          <span class="font-weight-black">
            {{ row.node.value !== undefined ? row.node.value.payload : "" }}
          </span>
        </span>
        <span
          v-if="row.hasChildren && !row.expanded"
          class="text-caption text-grey ms-4 flex-shrink-0"
        >
          ({{ row.node.size }} elements inside)
        </span>
      </div>
    </template>
  </v-virtual-scroll>
</template>

<script setup>
import { computed, nextTick, ref, shallowRef, watch } from "vue";
import { anchorShift, flattenVisible } from "../../utils/flattenTree";

const INDENT_PX = 16;
const ROW_HEIGHT = { default: 38, dense: 26 };
const ROW_GAP_PX = 4; // Vertical margin above and below each row

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

const scroller = ref(null);
const expandedIds = shallowRef(new Set());

const rowHeight = computed(() =>
  props.dense ? ROW_HEIGHT.dense : ROW_HEIGHT.default
);

const rows = computed(() => {
  props.version; // Dependency only

  return flattenVisible(props.tree.roots, expandedIds.value, props.matches);
});

// Slot height the virtual scroll reserves per row: row plus its margins
const itemHeight = computed(() => rowHeight.value + 2 * ROW_GAP_PX);

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

  if (index >= 0) scroller.value?.scrollToIndex(index);
}

defineExpose({ reveal });

// Keeps the first visible row in place when rows appear above it
watch(rows, (newRows, oldRows) => {
  const element = scroller.value?.$el;

  if (!element || element.scrollTop === 0) return;

  const firstVisible = Math.floor(element.scrollTop / itemHeight.value);
  const shift = anchorShift(oldRows, newRows, firstVisible);

  if (shift !== 0) {
    nextTick(() => (element.scrollTop += shift * itemHeight.value));
  }
});
</script>

<style scoped>
.tree-row {
  position: relative;
  cursor: pointer;
  white-space: nowrap;
}

.tree-row:hover:not(.bg-primary) {
  background-color: rgba(var(--v-theme-on-surface), 0.08);
}

.invisible {
  visibility: hidden;
}

.blink {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background-color: rgb(var(--v-theme-primary));
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
