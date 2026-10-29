<template>
  <div class="tile-front">
    <MIcon name="connect" :size="24" />
    <MIcon v-if="connection.pinned" class="tile-front__pin" name="pin" />
    <span class="tile-front__name">{{ connection.name }}</span>
  </div>
</template>

<script setup>
import MIcon from "./metro/MIcon.vue";

/** Front face of a hub tile: protocol glyph, pin glyph when pinned, and the name. */
defineProps({
  connection: { type: Object, required: true },
});
</script>

<style scoped>
.tile-front {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  height: 100%;
}

.tile-front__pin {
  position: absolute;
  top: 0;
  right: 0;
}

.tile-front__name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
