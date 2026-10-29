<template>
  <div class="settings-row">
    <div class="settings-row__text">
      <div class="settings-row__title">{{ title }}</div>
      <div v-if="description" class="settings-row__description">
        {{ description }}
      </div>
    </div>
    <div class="settings-row__control">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: "" },
});
</script>

<style scoped>
.settings-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--m-subunit) var(--m-unit);
  padding-block: calc(var(--m-subunit) * 2);
}

.settings-row__text {
  flex: 1 1 240px;
}

.settings-row__title {
  font: var(--m-font-body);
}

.settings-row__description {
  color: var(--m-fg-secondary);
  font: var(--m-font-caption);
}

.settings-row__control {
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--m-subunit);
  max-width: 100%;
}
</style>
