<template>
  <section class="topic-results" aria-label="Topics in open tabs">
    <h2 class="topic-results__caption">Topics in open tabs</h2>
    <div class="topic-results__panel">
      <div v-for="group in groups" :key="group.tabId" class="topic-results__group">
        <h3 class="topic-results__tab">{{ group.title }}</h3>
        <ul class="topic-results__list">
          <li v-for="topic in group.topics" :key="topic">
            <button
              class="topic-results__topic"
              type="button"
              @click="emit('open', group.tabId, topic)"
            >
              <HighlightedText :text="topic" :query="query" />
            </button>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup>
/**
 * Topics that match the search, grouped by the tab that holds them.
 * Emits `open` with the tab id and the topic of the clicked row.
 */
import HighlightedText from "../ui/HighlightedText.vue";

defineProps({
  /** @type {import("vue").PropType<{tabId: string, title: string, topics: string[]}[]>} */
  groups: { type: Array, required: true },
  /** Search text to highlight in the topics. */
  query: { type: String, default: "" },
});

const emit = defineEmits(["open"]);
</script>

<style scoped>
.topic-results {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.topic-results__caption {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

/* Solid surface so the list stays readable over a wallpaper */
.topic-results__panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.topic-results__tab {
  margin: 0 0 var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.topic-results__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.topic-results__topic {
  display: block;
  inline-size: 100%;
  min-block-size: var(--control-height);
  padding-inline: var(--space-4);
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  text-align: start;
  overflow-wrap: anywhere;
  background: transparent;
  border: 0;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--easing);
}

.topic-results__topic:hover {
  background: var(--color-hover);
}
</style>
