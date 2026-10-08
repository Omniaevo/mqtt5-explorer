<template>
  <v-virtual-scroll
    ref="scroller"
    :items="rows"
    :item-height="rowHeight"
    item-key="id"
    class="h-100"
  >
    <template #default="{ item: row }">
      <div
        :key="blinkKey(row.node)"
        :class="{
          'bg-primary text-white': selected?.id === row.id,
          blink: isBlinking(row.node),
        }"
        :style="{
          height: `${rowHeight}px`,
          paddingLeft: `${row.depth * INDENT_PX}px`,
        }"
        class="tree-row d-flex align-center px-2 rounded"
        @click="onRowClick(row)"
      >
        <v-icon
          :icon="row.expanded ? 'mdi-chevron-down' : 'mdi-chevron-right'"
          :class="{ invisible: !row.hasChildren }"
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
const ROW_HEIGHT = { default: 32, dense: 24 };

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

// A new key re-creates the row, which restarts the CSS animation
const blinkKey = (node) => (props.isBlinking(node) ? node.lastUpdate : 0);

function onRowClick(row) {
  if (row.hasChildren) toggle(row.id);

  emit("select", row.node);
}

function toggle(id) {
  const next = new Set(expandedIds.value);

  if (!next.delete(id)) next.add(id);

  expandedIds.value = next;
}

// Keeps the first visible row in place when rows appear above it
watch(rows, (newRows, oldRows) => {
  const element = scroller.value?.$el;

  if (!element || element.scrollTop === 0) return;

  const firstVisible = Math.floor(element.scrollTop / rowHeight.value);
  const shift = anchorShift(oldRows, newRows, firstVisible);

  if (shift !== 0) {
    nextTick(() => (element.scrollTop += shift * rowHeight.value));
  }
});
</script>

<style scoped>
.tree-row {
  cursor: pointer;
  white-space: nowrap;
}

.tree-row:hover:not(.bg-primary) {
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.invisible {
  visibility: hidden;
}

.blink {
  animation: blink 120ms ease-out;
}

@keyframes blink {
  from,
  to {
    background: rgb(var(--v-theme-primary));
    color: #fff;
  }
}
</style>
