<template>
  <v-dialog v-model="open" max-width="900" :fullscreen="xs" scrollable>
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

      <v-card-text class="px-4 py-2">
        <div class="settings-section text-medium-emphasis">Appearance</div>
        <SettingsRow title="Theme" description="Colors of the whole app.">
          <v-btn-toggle
            v-model="settings.theme"
            color="primary"
            density="comfortable"
            variant="outlined"
            mandatory
            divided
          >
            <v-btn
              v-for="theme in THEMES"
              :key="theme.value"
              :value="theme.value"
            >
              {{ theme.title }}
            </v-btn>
          </v-btn-toggle>
        </SettingsRow>
        <SettingsRow
          title="Primary color"
          description="Accent color of buttons and highlights."
        >
          <v-select
            v-model="settings.primaryColor"
            class="settings-control"
            :items="COLORS"
            :variant="fieldVariant"
            item-title="text"
            item-value="value"
            hide-details
            return-object
          >
            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps">
                <template #append>
                  <v-icon :color="item.value[themeMode]">
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
        </SettingsRow>
        <SettingsRow
          title="Outlined fields"
          description="Use boxed inputs instead of underlined inputs."
        >
          <v-switch
            v-model="settings.outline"
            color="primary"
            hide-details
            inset
          />
        </SettingsRow>

        <div class="settings-section text-medium-emphasis mt-4">Topic tree</div>
        <SettingsRow
          title="Dense tree"
          description="Smaller rows. More topics fit on the screen."
        >
          <v-switch
            v-model="settings.denseTree"
            color="primary"
            hide-details
            inset
          />
        </SettingsRow>

        <div class="settings-section text-medium-emphasis mt-4">
          Application
        </div>
        <SettingsRow
          title="Close to system tray"
          description="Keep the app running when the window closes."
        >
          <v-switch
            v-model="settings.closeTray"
            color="primary"
            hide-details
            inset
          />
        </SettingsRow>

        <SettingsRow
          title="Values kept per topic (0 to disable)"
          description="History size for each topic. From 0 to 500."
        >
          <v-text-field
            :model-value="settings.historySize"
            class="settings-control"
            :variant="fieldVariant"
            type="number"
            min="0"
            max="500"
            step="1"
            hide-details
            @update:model-value="
              settings.historySize = clampHistorySize($event)
            "
          />
        </SettingsRow>

        <v-expansion-panels class="mt-4" variant="accordion">
          <v-expansion-panel title="MQTT client (advanced)">
            <v-expansion-panel-text>
              <SettingsRow
                title="Client ID"
                description="Name of this client on the broker."
              >
                <v-text-field
                  v-model="settings.clientId"
                  class="settings-control settings-control-id"
                  :variant="fieldVariant"
                  clearable
                  hide-details
                />
                <v-btn
                  class="ms-2"
                  icon
                  variant="text"
                  size="small"
                  aria-label="New random ID"
                  @click="settings.regenerateClientId()"
                >
                  <v-icon>mdi-refresh</v-icon>
                  <v-tooltip activator="parent" location="top">
                    New random ID
                  </v-tooltip>
                </v-btn>
              </SettingsRow>
              <SettingsRow
                title="Keepalive"
                description="Time between pings to the broker, in seconds."
              >
                <v-select
                  v-model="settings.keepalive"
                  class="settings-control settings-control-wide"
                  :items="KEEPALIVE_OPTIONS"
                  :variant="fieldVariant"
                  hide-details
                />
              </SettingsRow>
              <SettingsRow
                title="Connection timeout"
                description="Time to wait for the broker, in seconds."
              >
                <v-select
                  v-model="settings.connectTimeout"
                  class="settings-control settings-control-wide"
                  :items="CONNECT_TIMEOUT_OPTIONS"
                  :variant="fieldVariant"
                  hide-details
                />
              </SettingsRow>
              <SettingsRow
                title="Reconnect period"
                description="Time between reconnect attempts, in seconds."
              >
                <v-select
                  v-model="settings.reconnectPeriod"
                  class="settings-control settings-control-wide"
                  :items="RECONNECT_PERIOD_OPTIONS"
                  :variant="fieldVariant"
                  hide-details
                />
              </SettingsRow>
              <SettingsRow
                title="Max reconnects"
                description="Number of reconnect attempts. 0 turns it off."
              >
                <v-select
                  v-model="settings.maxReconnects"
                  class="settings-control settings-control-wide"
                  :items="MAX_RECONNECTS_OPTIONS"
                  :variant="fieldVariant"
                  hide-details
                />
              </SettingsRow>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel title="Keyboard shortcuts">
            <v-expansion-panel-text>
              <v-list density="compact">
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
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>

      <v-divider />
      <v-card-actions class="px-4">
        <span class="text-caption text-medium-emphasis">v{{ version }}</span>
        <v-btn
          color="error"
          prepend-icon="mdi-restore"
          size="x-small"
          variant="text"
          @click="resetDialog = true"
        >
          Reset to defaults
        </v-btn>
        <v-spacer />
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

    <v-dialog v-model="resetDialog" max-width="50ch" persistent>
      <v-card>
        <v-card-title>Confirm reset</v-card-title>
        <v-card-text>
          Reset all settings to their defaults? The client ID stays the same.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="resetDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="text" @click="confirmReset">
            Reset
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { computed, ref } from "vue";
import { useDisplay } from "vuetify";
import { clampHistorySize, useSettingsStore } from "../stores/settings";
import { isMacOs } from "../utils/platform";
import SettingsRow from "./SettingsRow.vue";

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
const resetDialog = ref(false);

const version = import.meta.env.VITE_APP_VERSION;
const modifierKey = isMacOs ? "Cmd" : "Ctrl";

const fieldVariant = computed(() =>
  settings.outline ? "outlined" : "underlined"
);
const themeMode = computed(() => (settings.isDark ? "dark" : "light"));

function confirmReset() {
  settings.resetToDefaults();
  resetDialog.value = false;
}

function openBugsUrl() {
  window.api.app.openExternal(import.meta.env.VITE_GITHUB_BUGS);
}
</script>

<style scoped>
.settings-control {
  width: 220px;
  max-width: 100%;
}

.settings-control-wide {
  width: 360px;
}

/* Fits "m5-" plus a GUID (40 characters), the clear icon and the padding */
.settings-control-id {
  width: calc(40ch + 80px);
}

.settings-section {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.settings-section::before,
.settings-section::after {
  content: "";
  flex: 1;
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
