<template>
  <header class="m-page-header">
    <MButton
      v-if="showBack"
      variant="round"
      icon="back"
      aria-label="Back"
      @click="emit('back')"
    />
    <div class="m-page-header__text">
      <h1 class="m-page-header__title" :class="`m-page-header__title--${size}`">
        {{ title }}
      </h1>
      <p v-if="caption" class="m-page-header__caption">{{ caption }}</p>
    </div>
    <div v-if="$slots.actions" class="m-page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup>
import MButton from "./MButton.vue";

/** Metro page header: optional round back button, title with caption, actions at the right. */
defineProps({
  title: { type: String, required: true },
  caption: { type: String, default: "" },
  size: {
    type: String,
    default: "header",
    validator: (value) => ["hub", "header", "subheader"].includes(value),
  },
  showBack: { type: Boolean, default: false },
});

const emit = defineEmits(["back"]);
</script>

<style scoped>
.m-page-header {
  display: flex;
  align-items: center;
  gap: var(--m-unit);
  color: var(--m-fg);
}

.m-page-header__text {
  flex: 1;
  min-width: 0;
}

.m-page-header__title {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-page-header__title--hub {
  font: var(--m-font-hub-title);
}

.m-page-header__title--header {
  font: var(--m-font-header);
}

.m-page-header__title--subheader {
  font: var(--m-font-subheader);
}

.m-page-header__caption {
  margin: 0;
  color: var(--m-fg-secondary);
  font: var(--m-font-caption);
}

.m-page-header__actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--m-subunit);
}
</style>
