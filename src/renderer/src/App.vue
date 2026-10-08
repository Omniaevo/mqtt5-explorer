<template>
  <v-app>
    <v-main :class="{ 'bg-blue-grey-lighten-5': !settings.isDark }">
      <router-view />
    </v-main>

    <v-snackbar
      v-model="notify.visible"
      :timeout="5000"
      :color="notify.color"
      location="top"
      elevation="4"
    >
      {{ notify.message }}

      <template #actions>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="notify.visible = false"
        />
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { watch } from "vue";
import { useSettingsStore } from "./stores/settings";
import { useConnectionsStore } from "./stores/connections";
import { useNotifyStore } from "./stores/notify";
import { useThemeSync } from "./composables/useThemeSync";

const settings = useSettingsStore();
const connections = useConnectionsStore();
const notify = useNotifyStore();
const { applyAll } = useThemeSync();

settings.load();
connections.load();
applyAll();

// Every settings change is saved right away
watch(() => settings.$state, settings.persist, { deep: true });
</script>

<style>
.rounded {
  border-radius: 10vw;
  overflow: hidden;
}
</style>
