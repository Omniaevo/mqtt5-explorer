<template>
  <div
    ref="list"
    class="tab-strip"
    role="tablist"
    aria-label="Tabs"
    @keydown="moveFocus"
    @wheel="scrollHorizontally"
    @dragstart="startDrag"
    @dragover="overDrag"
    @drop="dropDrag"
    @dragend="endDrag"
  >
    <TabStripItem
      v-for="tab in tabs"
      :key="tab.id"
      :tab="tab"
      :active="tab.id === activeId"
      :dragging="tab.id === dragId"
      :drop-target="tab.id === dropId"
      @select="emit('select', tab.id)"
      @close="emit('close', tab.id)"
      @context-menu="emit('context-menu', tab.id)"
    />
  </div>
</template>

<script setup>
/**
 * Tab list of the shell. Tabs shrink to their minimum width, then the list
 * scrolls. Plain tab roles are used: the panels live in other processes.
 */
import { nextTick, ref, useTemplateRef, watch } from "vue";
import TabStripItem from "./TabStripItem.vue";
import { TabKind } from "../../../../shared/ipcChannels";

const props = defineProps({
  tabs: { type: Array, required: true },
  activeId: { type: String, required: true },
});

const emit = defineEmits(["select", "close", "context-menu", "reorder"]);

const list = useTemplateRef("list");

const tabButtons = () => [...list.value.querySelectorAll('[role="tab"]')];

// ponytail: arrows are not mirrored for right-to-left layouts
const TARGET_INDEX = Object.freeze({
  ArrowLeft: (index, count) => (index - 1 + count) % count,
  ArrowRight: (index, count) => (index + 1) % count,
  Home: () => 0,
  End: (index, count) => count - 1,
});

// Arrows only move the focus; Enter or Space on the focused tab selects it
const moveFocus = (event) => {
  const targetOf = TARGET_INDEX[event.key];
  const buttons = tabButtons();
  const index = buttons.indexOf(event.target);

  if (!targetOf || index < 0) return;

  event.preventDefault();
  buttons[targetOf(index, buttons.length)].focus();
};

// A mouse wheel only scrolls vertically: turn it into a horizontal scroll
const scrollHorizontally = (event) => {
  if (event.deltaX !== 0) return;

  list.value.scrollLeft += event.deltaY;
};

// Drag to reorder: main checks the rules too, this only draws the drop mark
const dragId = ref("");
const dropId = ref("");

const tabOf = (event) =>
  props.tabs.find(
    (tab) => tab.id === event.target.closest?.("[data-tab-id]")?.dataset.tabId
  );

const isReorderable = (tab) => tab?.kind === TabKind.CONNECTION;
const canDrop = (dragged, over) =>
  isReorderable(dragged) &&
  isReorderable(over) &&
  dragged.id !== over.id &&
  dragged.pinned === over.pinned;

const startDrag = (event) => {
  const tab = tabOf(event);

  if (!isReorderable(tab)) return;

  dragId.value = tab.id;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", tab.id);
};

const overDrag = (event) => {
  const over = tabOf(event);
  const dragged = props.tabs.find((tab) => tab.id === dragId.value);

  dropId.value = canDrop(dragged, over) ? over.id : "";

  if (!dropId.value) return;

  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
};

const dropDrag = (event) => {
  if (!dropId.value) return;

  event.preventDefault();
  emit("reorder", dragId.value, dropId.value);
  endDrag();
};

const endDrag = () => {
  dragId.value = "";
  dropId.value = "";
};

watch(
  () => [props.activeId, props.tabs.length],
  async () => {
    await nextTick();
    list.value
      .querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ inline: "nearest", block: "nearest" });
  },
  { immediate: true, flush: "post" }
);
</script>

<style scoped>
.tab-strip {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-inline-size: 0;
  overflow-x: auto;
  scrollbar-width: none;
  /* The strip is a drag region; the tabs must stay clickable */
  -webkit-app-region: no-drag;
}
</style>
