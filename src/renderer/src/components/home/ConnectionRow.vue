<template>
  <li class="connection-row" @contextmenu.prevent="menuOpen = true">
    <button class="connection-row__main" type="button" @click="emit('connect')">
      <ConnectionStateDot v-if="tabState" :state="tabState" />
      <span class="connection-row__name"><HighlightedText :text="connection.name" :query="query" /></span>
      <span class="connection-row__url"><HighlightedText :text="connectionUrl(connection)" :query="query" /></span>
      <ConnectionErrorIcon v-if="connection.lastError" :message="connection.lastError" />
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
import ConnectionErrorIcon from "./ConnectionErrorIcon.vue";
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
  min-block-size: var(--control-height);
  padding-inline-end: var(--space-2);
  border-radius: var(--radius-md);
  transition: background-color var(--duration-fast) var(--easing);
}

/* Hairline between rows, instead of a heavier box per row */
.connection-row + .connection-row {
  border-block-start: 1px solid var(--color-border);
  border-start-start-radius: 0;
  border-start-end-radius: 0;
}

/* Actions menu button: shown on hover, keyboard focus or while its menu is open */
.connection-row > :not(.connection-row__main) {
  opacity: 0;
  transition: opacity var(--duration-fast) var(--easing);
}

.connection-row:hover > :not(.connection-row__main),
.connection-row:focus-within > :not(.connection-row__main),
.connection-row > [aria-expanded="true"] {
  opacity: 1;
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

/* Fixed name column so the URLs line up */
.connection-row__name {
  flex: none;
  inline-size: 14rem;
  max-inline-size: 45%;
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
