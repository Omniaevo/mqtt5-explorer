<template>
  <li class="connection-tile" @contextmenu.prevent="menuOpen = true">
    <button class="connection-tile__main" type="button" @click="emit('connect')">
      <span class="connection-tile__head">
        <ConnectionStateDot v-if="tabState" :state="tabState" />
        <span class="connection-tile__name"><HighlightedText :text="connection.name" :query="query" /></span>
        <ConnectionErrorIcon v-if="connection.lastError" :message="connection.lastError" />
      </span>
      <span class="connection-tile__url"><HighlightedText :text="connectionUrl(connection)" :query="query" /></span>
    </button>
    <div class="connection-tile__menu">
      <AppMenu
      v-model:open="menuOpen"
        :label="`Actions for ${connection.name}`"
        :items="menuItems"
        @select="emit('action', $event)"
      />
    </div>
  </li>
</template>

<script setup>
/**
 * Recent-connection tile. Click or Enter connects; right click or the button opens the menu; the menu emits `action` with the item id.
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
.connection-tile {
  position: relative;
  min-inline-size: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface-raised);
  transition: background-color var(--duration-fast) var(--easing);
}

/* Hover overlay on top of the raised surface */
.connection-tile:hover {
  background-image: linear-gradient(var(--color-hover), var(--color-hover));
}

.connection-tile__main {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  inline-size: 100%;
  padding: var(--space-5);
  padding-inline-end: calc(var(--space-5) + var(--control-height));
  border-radius: inherit;
  text-align: start;
}

.connection-tile__main:focus-visible {
  outline-offset: -2px;
}

.connection-tile__head {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  min-inline-size: 0;
}

.connection-tile__name {
  min-inline-size: 0;
  overflow: hidden;
  font-weight: var(--font-weight-bold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.connection-tile__url {
  overflow: hidden;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.connection-tile__menu {
  position: absolute;
  inset-block-start: var(--space-4);
  inset-inline-end: var(--space-4);
}
</style>
