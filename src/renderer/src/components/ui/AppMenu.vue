<template>
  <DropdownMenuRoot v-model:open="open">
    <DropdownMenuTrigger as-child>
      <AppButton variant="icon" size="sm" :aria-label="label" :title="label">
        <Ellipsis :size="16" aria-hidden="true" />
      </AppButton>
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent class="app-menu__content" align="end" :side-offset="SIDE_OFFSET_PX">
        <template v-for="item in items" :key="item.id">
          <DropdownMenuSeparator v-if="item.separatorBefore" class="app-menu__separator" />
          <DropdownMenuItem
            class="app-menu__item"
            :class="{ 'app-menu__item--danger': item.danger }"
            @select="emit('select', item.id)"
          >
            <component :is="item.icon" v-if="item.icon" :size="14" aria-hidden="true" />
            {{ item.label }}
          </DropdownMenuItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

<script setup>
/**
 * Icon button that opens an actions menu (Reka DropdownMenu).
 * `items`: `{ id, label, icon?, danger?, separatorBefore? }`. Emits `select` with the item id.
 * `label` names the button for screen readers and the tooltip.
 * `v-model:open` lets the parent open the menu (e.g. on right click); it opens next to the button.
 */
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "reka-ui";
import { Ellipsis } from "@lucide/vue";
import AppButton from "./AppButton.vue";

const SIDE_OFFSET_PX = 4;

defineProps({
  label: { type: String, required: true },
  items: { type: Array, required: true },
});

const open = defineModel("open", { type: Boolean, default: false });

const emit = defineEmits(["select"]);
</script>

<style>
/* Unscoped: the menu is teleported out of the component. Mirrors the select menu.
   `position` is needed: Reka copies the computed z-index to its wrapper, and it is `auto` when static */
.app-menu__content {
  position: relative;
  z-index: 2100;
  min-inline-size: 16ch;
  padding: var(--space-2);
  border-radius: var(--radius-lg);
  background: var(--color-surface-raised);
  color: var(--color-text);
  box-shadow: var(--shadow-2);
}

.app-menu__item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  min-block-size: var(--row-height);
  padding-block: var(--space-2);
  padding-inline: var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  cursor: pointer;
  user-select: none;
  outline: 0;
}

.app-menu__item svg {
  flex: none;
  color: var(--color-text-muted);
}

.app-menu__item[data-highlighted] {
  background: var(--color-hover);
}

.app-menu__item--danger,
.app-menu__item--danger svg {
  color: var(--color-danger);
}

.app-menu__separator {
  block-size: 1px;
  margin-block: var(--space-2);
  background: var(--color-border);
}
</style>
