<template>
  <span>
    <template v-for="(part, index) in parts" :key="index">
      <mark v-if="part.match" class="highlighted-text__match">{{ part.text }}</mark>
      <template v-else>{{ part.text }}</template>
    </template>
  </span>
</template>

<script setup>
/** Text with every case-insensitive occurrence of `query` marked (search highlight). */
import { computed } from "vue";

const props = defineProps({
  text: { type: String, required: true },
  query: { type: String, default: "" },
});

const parts = computed(() => {
  const needle = props.query.trim().toLowerCase();

  if (!needle) return [{ text: props.text, match: false }];

  const haystack = props.text.toLowerCase();
  const result = [];
  let cursor = 0;
  let found = haystack.indexOf(needle);

  while (found !== -1) {
    if (found > cursor) result.push({ text: props.text.slice(cursor, found), match: false });
    result.push({ text: props.text.slice(found, found + needle.length), match: true });
    cursor = found + needle.length;
    found = haystack.indexOf(needle, cursor);
  }
  if (cursor < props.text.length) result.push({ text: props.text.slice(cursor), match: false });

  return result;
});
</script>

<style scoped>
.highlighted-text__match {
  border-radius: var(--radius-sm);
  background: color-mix(in oklab, var(--color-warning) 35%, transparent);
  color: inherit;
}
</style>
