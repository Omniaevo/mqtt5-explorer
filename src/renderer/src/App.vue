<template>
  <router-view v-slot="{ Component }">
    <Transition
      name="m-turnstile"
      mode="out-in"
      appear
      appear-active-class="m-entrance"
    >
      <component :is="Component" />
    </Transition>
  </router-view>

  <MToaster />
</template>

<script setup>
import { watch } from "vue";
import MToaster from "./components/metro/MToaster.vue";
import { useSettingsStore } from "./stores/settings";
import { useConnectionsStore } from "./stores/connections";
import { useThemeSync } from "./composables/useThemeSync";

const settings = useSettingsStore();
const connections = useConnectionsStore();
const { applyAll } = useThemeSync();

settings.load();
connections.load();
applyAll();

// Every settings change is saved right away
watch(() => settings.$state, settings.persist, { deep: true });
</script>
