
<template>
  <div class="tile-back">
    <div class="tile-back__header">
      <span class="tile-back__name">{{ connection.name }}</span>
      <MIcon v-if="connection.pinned" name="pin" />
    </div>
    <span class="tile-back__line">{{ connection.host }}:{{ connection.port }}</span>
    <span class="tile-back__line">
      {{ connection.protocol }} · MQTT {{ connection.version }}
    </span>
    <span class="tile-back__line tile-back__line--secondary">
      {{ lastConnected }}
    </span>
  </div>
</template>

<script setup>
import { computed } from "vue";
import MIcon from "./metro/MIcon.vue";
import { formatRelativeTime } from "../utils/relativeTime";

/** Back face of a live hub tile: name, pin glyph when pinned, address, protocol with MQTT version, last connection time. */
const props = defineProps({
  connection: { type: Object, required: true },
});

const lastConnected = computed(() =>
  props.connection.lastConnectedAt
    ? `last connected ${formatRelativeTime(props.connection.lastConnectedAt)}`
    : "never connected"
);
</script>

<style scoped>
.tile-back {
  display: flex;
  flex-direction: column;
  gap: var(--m-subunit);
  height: 100%;
}

.tile-back__header {
  display: flex;
  flex: 1;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--m-subunit);
  min-height: 0;
}

.tile-back__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tile-back__line {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tile-back__line--secondary {
  opacity: 0.8;
}
</style>
