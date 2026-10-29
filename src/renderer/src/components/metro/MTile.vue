<template>
  <div
    v-tilt
    class="m-tile"
    :class="`m-tile--${size}`"
    :style="animationDelay ? { animationDelay } : undefined"
    role="button"
    tabindex="0"
    :aria-pressed="selected"
    @click="emit('activate')"
    @keydown.enter.self.prevent="emit('activate')"
    @keydown.space.self.prevent="emit('select')"
    @contextmenu.prevent="emit('select')"
  >
    <div class="m-tile__flipper" :class="flipClass">
      <div class="m-tile__face">
        <slot name="front" />
      </div>
      <div
        v-if="$slots.back"
        class="m-tile__face m-tile__face--back"
        aria-hidden="true"
      >
        <slot name="back" />
      </div>
    </div>
    <span v-if="selected" class="m-tile__marker">
      <MIcon name="check" />
    </span>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import MIcon from "./MIcon.vue";
import { vTilt } from "./vTilt";

/**
 * Metro tile (P12): accent square, `medium` 150x150 or `wide` 310x150.
 * Slots `front` and `back`; `flipped` turns the tile to its back. Click or Enter emits
 * `activate`; right-click or Space emits `select`. `selected` shows the Win8 marker.
 * `animationDelay` (CSS time, e.g. "120ms") staggers the entrance animation.
 */
const props = defineProps({
  size: {
    type: String,
    default: "medium",
    validator: (value) => ["medium", "wide"].includes(value),
  },
  flipped: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
  animationDelay: { type: String, default: undefined },
});

const emit = defineEmits(["activate", "select"]);

// The flip-back animation must not run on first render
const hasFlipped = ref(false);
watch(
  () => props.flipped,
  () => (hasFlipped.value = true)
);

const flipClass = computed(() => ({
  "m-tile__flipper--flipped": props.flipped,
  "m-tile__flipper--unflipped": hasFlipped.value && !props.flipped,
}));
</script>

<style scoped>
.m-tile {
  position: relative;
  flex: none;
  box-sizing: border-box;
  height: 150px;
  color: var(--m-on-accent);
  font: var(--m-font-body);
  cursor: pointer;
  user-select: none;
  perspective: 800px;
  animation: m-entrance var(--m-duration-slow) var(--m-ease) backwards;
}

.m-tile--medium {
  width: 150px;
}

.m-tile--wide {
  width: 310px;
}

.m-tile:focus-visible {
  outline: 1px dotted var(--m-fg);
  outline-offset: 2px;
}

.m-tile__flipper {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
}

.m-tile__flipper--flipped {
  transform: rotateX(180deg);
  animation: m-flip var(--m-duration-slow) var(--m-ease);
}

.m-tile__flipper--unflipped {
  animation: m-unflip var(--m-duration-slow) var(--m-ease);
}

.m-tile__face {
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  padding: calc(var(--m-subunit) * 2);
  overflow: hidden;
  /* The color lives on the faces so the whole tile turns. A section sets --m-tile-bg to tone it. */
  background: var(--m-tile-bg, var(--m-accent));
  backface-visibility: hidden;
}

/* The back is tinted lighter on the light theme and darker on the dark theme */
.m-tile__face--back {
  background: color-mix(in srgb, var(--m-tile-bg, var(--m-accent)), white 14%);
  transform: rotateX(180deg);
}

:global(:root[data-theme="dark"]) .m-tile__face--back {
  background: color-mix(in srgb, var(--m-tile-bg, var(--m-accent)), black 22%);
}

/* Win8 selection: border around the tile and a check in its top-right corner.
   Both use the page colors (--m-fg on --m-bg), so they contrast with any accent. */
.m-tile__marker {
  position: absolute;
  inset: -3px;
  border: var(--m-border-width-strong) solid var(--m-fg);
  pointer-events: none;
  /* Keep the marker above the 3D flipper */
  transform: translateZ(1px);
}

.m-tile__marker .m-icon {
  position: absolute;
  top: 0;
  right: 0;
  padding: var(--m-subunit);
  background: var(--m-fg);
  color: var(--m-bg);
}
</style>
