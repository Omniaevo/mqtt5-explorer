<template>
  <AccordionRoot
    v-model="model"
    class="app-accordion"
    :class="$attrs.class"
    :style="$attrs.style"
    :type="type"
    collapsible
  >
    <AccordionItem
      v-for="item in items"
      :key="item.value"
      :value="item.value"
      class="app-accordion__item"
    >
      <AccordionHeader class="app-accordion__header">
        <AccordionTrigger class="app-accordion__trigger">
          <component
            :is="item.icon"
            v-if="item.icon"
            :size="16"
            aria-hidden="true"
            class="app-accordion__icon"
          />
          <span class="app-accordion__title">{{ item.title }}</span>
          <ChevronDown :size="16" aria-hidden="true" class="app-accordion__chevron" />
        </AccordionTrigger>
      </AccordionHeader>
      <AccordionContent class="app-accordion__content">
        <div class="app-accordion__body">
          <slot :name="`item-${item.value}`" />
        </div>
      </AccordionContent>
    </AccordionItem>
  </AccordionRoot>
</template>

<script setup>
/**
 * Accordion (Reka Accordion). Every panel is collapsible.
 * `items` is `{ value, title, icon? }[]`; `icon` is an optional Lucide component.
 * The model holds the open values: `string[]` for `type="multiple"`, `string` for `"single"`.
 * Content goes in one named slot per item: `#item-<value>`. Named slots were picked over a
 * scoped default slot because each section has its own markup and needs no `v-if` chain.
 * `class` and `style` go to the root element.
 */
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from "reka-ui";
import { ChevronDown } from "@lucide/vue";

defineOptions({ inheritAttrs: false });

defineProps({
  items: { type: Array, required: true },
  type: {
    type: String,
    default: "multiple",
    validator: (value) => ["single", "multiple"].includes(value),
  },
});

const model = defineModel({ type: [String, Array], default: undefined });
</script>

<style scoped>
.app-accordion {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-raised);
}

.app-accordion__item + .app-accordion__item {
  border-block-start: 1px solid var(--color-border);
}

.app-accordion__header {
  display: flex;
  margin: 0;
}

.app-accordion__trigger {
  display: flex;
  flex: 1;
  align-items: center;
  gap: var(--space-4);
  min-block-size: calc(var(--control-height) + var(--space-4));
  padding-inline: var(--space-5);
  border: 0;
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  text-align: start;
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--easing);
}

.app-accordion__trigger:hover {
  background: var(--color-hover);
}

.app-accordion__icon {
  flex: none;
  color: var(--color-text-muted);
}

.app-accordion__title {
  flex: 1;
  min-inline-size: 0;
}

.app-accordion__chevron {
  flex: none;
  color: var(--color-text-muted);
  transition: transform var(--duration-normal) var(--easing);
}

.app-accordion__trigger[data-state="open"] .app-accordion__chevron {
  transform: rotate(180deg);
}

.app-accordion__content {
  overflow: hidden;
}

.app-accordion__content[data-state="open"] {
  animation: app-accordion-down var(--duration-normal) var(--easing);
}

.app-accordion__content[data-state="closed"] {
  animation: app-accordion-up var(--duration-normal) var(--easing);
}

.app-accordion__body {
  padding: var(--space-5);
}

@keyframes app-accordion-down {
  from {
    block-size: 0;
  }

  to {
    block-size: var(--reka-accordion-content-height);
  }
}

@keyframes app-accordion-up {
  from {
    block-size: var(--reka-accordion-content-height);
  }

  to {
    block-size: 0;
  }
}
</style>
