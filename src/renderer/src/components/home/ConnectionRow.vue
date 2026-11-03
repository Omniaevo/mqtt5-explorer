<template>
  <li class="connection-row" @contextmenu.prevent="menuOpen = true">
    <button class="connection-row__main" type="button" @click="emit('connect')">
      <ConnectionStateDot v-if="tabState" :state="tabState" />
      <span class="connection-row__name"><HighlightedText :text="connection.name" :query="query" /></span>
      <span class="connection-row__url"><HighlightedText :text="connectionUrl(connection)" :query="query" /></span>
    </button>
    <AppMenu
      v-model:open="menuOpen"
      :label="`Actions for ${connection.name}`"
      :items="menuItems"
      @select="emit('action', $event)"
    />
  </li>
</template>

<script setup>
/**
 * Row of the "All connections" list. Click or Enter connects; right click or the button opens the menu; the menu emits `action` with the item id.
 * `tabState` is the state of the open tab of this connection, if any.
 */
import { ref } from "vue";
import AppMenu from "../ui/AppMenu.vue";
import HighlightedText from "../ui/HighlightedText.vue";
import ConnectionStateDot from "./ConnectionStateDot.vue";
import { connectionUrl } from "../../../../shared/connectionUrl";

defineProps({
  connection: { type: Object, required: true },
  menuItems: { type: Array, required: true },
  tabState: { type: String, default: undefined },
  /** Search text to highlight in the name and URL. */
  query: { type: String, default: "" },
});

const emit = defineEmits(["connect", "action"]);

const menuOpen = ref(false);
</script>

<style scoped>
.connection-row {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  min-block-size: var(--row-height);
  padding-inline-end: var(--space-2);
  border-radius: var(--radius-md);
  transition: background-color var(--duration-fast) var(--easing);
}

.connection-row:hover {
  background: var(--color-hover);
}

.connection-row__main {
  display: flex;
  flex: 1;
  align-items: center;
  gap: var(--space-4);
  min-inline-size: 0;
  min-block-size: var(--row-height);
  padding-inline: var(--space-4);
  border-radius: inherit;
  text-align: start;
}

.connection-row__main:focus-visible {
  outline-offset: -2px;
}

.connection-row__name {
  overflow: hidden;
  font-weight: var(--font-weight-medium);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.connection-row__url {
  flex: 1;
  min-inline-size: 0;
  overflow: hidden;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
