<template>
  <v-dialog
    v-model="open"
    max-width="720"
    :fullscreen="xs"
    scrollable
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <span>Settings</span>
        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          aria-label="Close settings"
          @click="open = false"
        />
      </v-card-title>
      <v-divider />

      <v-card-text class="pa-0">
        <v-list>
          <v-list-item>
            <v-select
              v-model="settings.theme"
              :items="THEMES"
              :variant="fieldVariant"
              label="Theme"
              hide-details
            />
          </v-list-item>

          <v-list-item>
            <v-select
              v-model="settings.primaryColor"
              :items="COLORS"
              :variant="fieldVariant"
              item-title="text"
              item-value="value"
              label="Primary color"
              hide-details
              return-object
            >
              <template #item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps">
                  <template #append>
                    <v-icon :color="item.raw.value[themeMode]">
                      {{
                        settings.isDark
                          ? "mdi-moon-waning-crescent"
                          : "mdi-white-balance-sunny"
                      }}
                    </v-icon>
                  </template>
                </v-list-item>
              </template>
            </v-select>
          </v-list-item>

          <v-list-item>
            <div class="settings-switches">
              <v-switch
                v-model="settings.outline"
                label="Outlined fields"
                color="primary"
                hide-details
                inset
              />
              <v-switch
                v-model="settings.denseTree"
                label="Dense topics tree"
                color="primary"
                hide-details
                inset
              />
              <v-switch
                v-model="settings.closeTray"
                label="Close to system tray"
                color="primary"
                hide-details
                inset
              />
            </div>
          </v-list-item>

          <v-divider class="mx-3" />

          <v-list-item>
            <v-text-field
              v-model="settings.clientId"
              :variant="fieldVariant"
              label="MQTT Client ID"
              clearable
              hide-details
            />
          </v-list-item>

          <v-list-item>
            <v-select
              v-model="settings.keepalive"
              :items="KEEPALIVE_OPTIONS"
              :variant="fieldVariant"
              label="MQTT Keepalive (in seconds)"
              hide-details
            />
          </v-list-item>

          <v-list-item>
            <div class="d-flex" style="gap: 1em">
              <v-select
                v-model="settings.reconnectPeriod"
                :items="RECONNECT_PERIOD_OPTIONS"
                :variant="fieldVariant"
                label="MQTT Reconnect period (in seconds)"
                hide-details
              />
              <v-select
                v-model="settings.maxReconnects"
                :items="MAX_RECONNECTS_OPTIONS"
                :variant="fieldVariant"
                label="Max number of reconnects (0 for disabling)"
                hide-details
              />
            </div>
          </v-list-item>

          <v-list-item>
            <v-select
              v-model="settings.connectTimeout"
              :items="CONNECT_TIMEOUT_OPTIONS"
              :variant="fieldVariant"
              label="MQTT Connection timeout (in seconds)"
              hide-details
            />
          </v-list-item>

          <v-divider class="mx-3" />

          <v-list density="compact">
            <v-list-subheader>Keyboard shortcuts</v-list-subheader>
            <v-list-item
              v-for="shortcut in SHORTCUTS"
              :key="shortcut.label"
              :title="shortcut.label"
            >
              <template #append>
                <span class="text-caption"
                  >{{ modifierKey }} + {{ shortcut.keys }}</span
                >
              </template>
            </v-list-item>
          </v-list>
        </v-list>
      </v-card-text>

      <v-divider />
      <v-card-actions class="justify-center">
        <v-btn
          color="primary"
          prepend-icon="mdi-bug"
          size="x-small"
          variant="text"
          @click="openBugsUrl"
        >
          Report a bug
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from "vue";
import { useDisplay } from "vuetify";
import { useSettingsStore } from "../stores/settings";
import { isMacOs } from "../utils/platform";

const THEMES = [
  { title: "Light", value: "light" },
  { title: "Dark", value: "dark" },
];
const KEEPALIVE_OPTIONS = [60, 120, 180, 240, 300];
const RECONNECT_PERIOD_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const MAX_RECONNECTS_OPTIONS = [0, 5, 10, 15, 20];
const CONNECT_TIMEOUT_OPTIONS = [10, 20, 30, 40, 50, 60, 120, 180, 240, 300];

const COLORS = [
  { text: "Punchy Pink", value: { light: "#E91E63", dark: "#EC407A" } },
  { text: "Hipster Purple", value: { light: "#9C27B0", dark: "#AB47BC" } },
  { text: "Sober Purple", value: { light: "#673AB7", dark: "#7E57C2" } },
  { text: "Indie Indigo", value: { light: "#3F51B5", dark: "#5C6BC0" } },
  { text: "Usual Blue", value: { light: "#2196F3", dark: "#42A5F5" } },
  { text: "Delicate Cyan", value: { light: "#00BCD4", dark: "#00BCD4" } },
  { text: "Tasty Teal", value: { light: "#009688", dark: "#26A69A" } },
  { text: "Envy Green", value: { light: "#4CAF50", dark: "#66BB6A" } },
  { text: "Juicy Lime", value: { light: "#C0CA33", dark: "#C0CA33" } },
  { text: "Precious Amber", value: { light: "#FFB300", dark: "#FFB300" } },
  { text: "Original Orange", value: { light: "#FF5722", dark: "#FF7043" } },
  { text: "Boring Brown", value: { light: "#795548", dark: "#8D6E63" } },
  { text: "Metallic Grey", value: { light: "#607D8B", dark: "#78909C" } },
];

const SHORTCUTS = [
  { label: "Edit settings", keys: "COMMA" },
  { label: "Toggle search", keys: "F" },
  { label: "Notifications and logging", keys: "Shift + N" },
  { label: "Reload the page", keys: "R" },
  { label: "Force reload the page", keys: "Shift + R" },
  { label: "Quit the app", keys: "Q" },
  { label: "Show shortcuts dialog", keys: "K" },
  { label: "About the app", keys: "I" },
];

const open = defineModel({ type: Boolean, default: false });

const settings = useSettingsStore();
const { xs } = useDisplay();

const modifierKey = isMacOs ? "Cmd" : "Ctrl";

const fieldVariant = computed(() =>
  settings.outline ? "outlined" : "underlined"
);
const themeMode = computed(() => (settings.isDark ? "dark" : "light"));

function openBugsUrl() {
  window.api.app.openExternal(import.meta.env.VITE_GITHUB_BUGS);
}
</script>

<style scoped>
.settings-switches {
  display: flex;
  flex-wrap: wrap;
  gap: 0 1em;
}
</style>
