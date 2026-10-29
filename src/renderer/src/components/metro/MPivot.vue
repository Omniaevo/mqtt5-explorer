<template>
  <TabsRoot v-model="model" class="m-pivot">
    <TabsList class="m-pivot__list" :aria-label="ariaLabel">
      <TabsTrigger
        v-for="item in items"
        :key="item.value"
        class="m-pivot__header"
        :value="item.value"
      >
        {{ item.label }}
      </TabsTrigger>
    </TabsList>
    <TabsContent
      v-for="item in items"
      :key="item.value"
      class="m-pivot__content"
      :style="{ '--m-pivot-dir': direction }"
      :value="item.value"
    >
      <slot :name="item.value" />
    </TabsContent>
  </TabsRoot>
</template>

<script setup>
import { ref, watch } from "vue";
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from "reka-ui";

/**
 * Metro pivot (Reka Tabs): lowercase headers in a row, one named slot per item value.
 * Arrow keys and clicks change the item; the content slides in from the side of the move.
 * Items are `{ value, label }`; the parent filters out hidden ones.
 */
const props = defineProps({
  items: { type: Array, required: true },
  /** Names the pivot for screen readers. */
  ariaLabel: { type: String, default: undefined },
});

const model = defineModel({ type: String, default: undefined });

/** 1 = moved to a later item, -1 = moved to an earlier one. */
const direction = ref(1);

const indexOf = (value) =>
  props.items.findIndex((item) => item.value === value);

watch(model, (next, previous) => {
  direction.value = indexOf(next) >= indexOf(previous) ? 1 : -1;
});
</script>

<style scoped>
.m-pivot {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.m-pivot__list {
  display: flex;
  flex: none;
  gap: var(--m-unit);
  overflow-x: auto;
}

.m-pivot__header {
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--m-fg-secondary);
  font: var(--m-font-subheader);
  text-transform: lowercase;
  white-space: nowrap;
  cursor: pointer;
}

.m-pivot__header:hover,
.m-pivot__header[data-state="active"] {
  color: var(--m-fg);
}

.m-pivot__content {
  flex: 1;
  min-height: 0;
  padding-top: var(--m-unit);
  overflow: auto;
  animation: m-pivot-in var(--m-duration-normal) var(--m-ease) backwards;
}
</style>
