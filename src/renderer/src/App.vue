<template>
  <v-app class="app-shell">
    <!-- v-main stays: it offsets the content below the Vuetify app bars (until M3-01) -->
    <v-main>
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
    </v-main>

    <MToaster />
  </v-app>
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

<style scoped>
.app-shell {
  background: var(--m-bg);
}
</style>

<style>
/* Still used by MqttViewer and TopicTreeView; overrides the Vuetify utility */
.rounded {
  border-radius: 10vw;
  overflow: hidden;
}
</style>
