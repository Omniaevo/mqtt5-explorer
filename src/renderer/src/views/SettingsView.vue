<template>
  <div class="settings-page">
    <div class="settings-scroll">
      <div class="settings-body">
        <section class="settings-group">
          <h2 class="settings-section">Appearance</h2>
          <SettingsRow title="Theme" description="Colors of the whole app.">
            <AppToggleGroup v-model="theme" :items="THEME_ITEMS" aria-label="Theme" />
          </SettingsRow>
          <SettingsRow
            title="Font size"
            description="Size of all text and controls."
          >
            <AppSelect
              v-model="settings.fontScale"
              class="settings-control"
              label="Font size"
              label-hidden
              :items="FONT_SIZE_ITEMS"
              item-title="text"
              item-value="value"
            />
          </SettingsRow>
          <SettingsRow
            title="Primary color"
            description="Accent color of buttons and highlights."
          >
            <div class="color-picker">
              <AppSelect
                v-model="primaryColorName"
                class="settings-control"
                label="Primary color"
                label-hidden
                :items="COLORS"
                item-title="text"
                item-value="text"
              >
                <template #item="{ item }">
                  <span class="color-option">
                    <span
                      class="color-swatch"
                      :style="{ background: item.value[themeMode] }"
                    />
                    {{ item.text }}
                  </span>
                </template>
              </AppSelect>
              <span
                class="color-swatch color-swatch--preview"
                :style="{ background: settings.primaryColor.value[themeMode] }"
                aria-hidden="true"
              />
            </div>
          </SettingsRow>
        </section>

        <section class="settings-group">
          <h2 class="settings-section">Home</h2>
          <SettingsRow
            title="Recent connections rows"
            description="Rows of recent connections on Home, 4 per row."
          >
            <AppSelect
              v-model="settings.recentRows"
              class="settings-control"
              label="Recent connections rows"
              label-hidden
              :items="RECENT_ROWS_ITEMS"
              item-title="text"
              item-value="value"
            />
          </SettingsRow>
          <SettingsRow
            title="Wallpaper"
            description="Background pattern of the start page."
            stacked
          >
            <WallpaperPicker v-model="settings.wallpaper" />
          </SettingsRow>
        </section>

        <section class="settings-group">
          <h2 class="settings-section">Application</h2>
          <SettingsRow
            title="Close to system tray"
            description="Keep the app running when the window closes."
          >
            <AppSwitch v-model="settings.closeTray" :label="switchLabel(settings.closeTray)" />
          </SettingsRow>
          <SettingsRow
            title="Values kept per topic (0 to disable)"
            description="History size for each topic. From 0 to 500."
          >
            <AppTextField
              :model-value="settings.historySize"
              class="settings-control"
              label="Values kept per topic"
              label-hidden
              type="number"
              min="0"
              max="500"
              step="1"
              @update:model-value="settings.historySize = clampHistorySize($event)"
            />
          </SettingsRow>
        </section>
        <section class="settings-group">
          <h2 class="settings-section">MQTT client (advanced)</h2>
          <SettingsRow
            title="Client ID"
            description="Name of this client on the broker."
          >
            <AppTextField
              v-model="settings.clientId"
              mono
              class="settings-control settings-control-id"
              label="Client ID"
              label-hidden
            >
              <template #append-inner>
                <AppButton
                  v-if="settings.clientId"
                  variant="icon"
                  size="sm"
                  aria-label="Clear client ID"
                  @click="settings.clientId = ''"
                >
                  <X :size="14" aria-hidden="true" />
                </AppButton>
              </template>
            </AppTextField>
            <AppTooltip text="New random ID" side="top">
              <AppButton
                variant="icon"
                aria-label="New random ID"
                @click="settings.regenerateClientId()"
              >
                <RotateCw :size="16" aria-hidden="true" />
              </AppButton>
            </AppTooltip>
          </SettingsRow>
          <SettingsRow
            title="Keepalive"
            description="Time between pings to the broker, in seconds."
          >
            <AppSelect
              v-model="settings.keepalive"
              class="settings-control"
              label="Keepalive"
              label-hidden
              :items="KEEPALIVE_OPTIONS"
            />
          </SettingsRow>
          <SettingsRow
            title="Connection timeout"
            description="Time to wait for the broker, in seconds."
          >
            <AppSelect
              v-model="settings.connectTimeout"
              class="settings-control"
              label="Connection timeout"
              label-hidden
              :items="CONNECT_TIMEOUT_OPTIONS"
            />
          </SettingsRow>
          <SettingsRow
            title="Reconnect period"
            description="Time between reconnect attempts, in seconds."
          >
            <AppSelect
              v-model="settings.reconnectPeriod"
              class="settings-control"
              label="Reconnect period"
              label-hidden
              :items="RECONNECT_PERIOD_OPTIONS"
            />
          </SettingsRow>
          <SettingsRow
            title="Max reconnects"
            description="Number of reconnect attempts. 0 turns it off."
          >
            <AppSelect
              v-model="settings.maxReconnects"
              class="settings-control"
              label="Max reconnects"
              label-hidden
              :items="MAX_RECONNECTS_OPTIONS"
            />
          </SettingsRow>
        </section>

        <section class="settings-group">
          <h2 class="settings-section">Keyboard shortcuts</h2>
          <SettingsRow
            v-for="shortcut in SHORTCUTS"
            :key="shortcut.label"
            :title="shortcut.label"
          >
            <kbd class="shortcut-keys">{{ shortcut.keys }}</kbd>
          </SettingsRow>
        </section>

        <section class="settings-group">
          <h2 class="settings-section">About</h2>
          <SettingsRow title="Version">
            <span class="settings-version">v{{ version }}</span>
          </SettingsRow>
          <SettingsRow
            title="Report a bug"
            description="Open the issue page of the project."
          >
            <AppButton variant="text" color="primary" size="sm" @click="openBugsUrl">
              <Bug :size="14" aria-hidden="true" />
              Report a bug
            </AppButton>
          </SettingsRow>
          <SettingsRow
            title="Reset to defaults"
            description="Restore all settings. The client ID stays the same."
          >
            <AppButton
              variant="text"
              color="danger"
              size="sm"
              @click="resetDialog = true"
            >
              <RotateCcw :size="14" aria-hidden="true" />
              Reset to defaults
            </AppButton>
          </SettingsRow>
        </section>
      </div>
    </div>

    <AppDialog
      v-model:open="resetDialog"
      title="Confirm reset"
      persistent
      hide-close
    >
      Reset all settings to their defaults? The client ID stays the same.
      <template #actions>
        <AppButton variant="text" @click="resetDialog = false">Cancel</AppButton>
        <AppButton variant="text" color="danger" @click="confirmReset">
          Reset
        </AppButton>
      </template>
    </AppDialog>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { Bug, Moon, RotateCcw, RotateCw, Sun, X } from "@lucide/vue";
import { isMacOs } from "../utils/platform";
import {
  clampHistorySize,
  FONT_SCALES,
  RECENT_ROWS_OPTIONS,
  useSettingsStore,
} from "../stores/settings";
import SettingsRow from "../components/SettingsRow.vue";
import WallpaperPicker from "../components/WallpaperPicker.vue";
import AppButton from "../components/ui/AppButton.vue";
import AppDialog from "../components/ui/AppDialog.vue";
import AppSelect from "../components/ui/AppSelect.vue";
import AppSwitch from "../components/ui/AppSwitch.vue";
import AppTextField from "../components/ui/AppTextField.vue";
import AppToggleGroup from "../components/ui/AppToggleGroup.vue";
import AppTooltip from "../components/ui/AppTooltip.vue";

const THEME_ITEMS = [
  { value: "light", label: "Light", icon: Sun, showLabel: true },
  { value: "dark", label: "Dark", icon: Moon, showLabel: true },
];
const FONT_SIZE_ITEMS = FONT_SCALES.map((value) => ({
  value,
  text: `${value}%`,
}));
const RECENT_ROWS_ITEMS = RECENT_ROWS_OPTIONS.map((value) => ({
  value,
  text: value === 1 ? "1 row" : `${value} rows`,
}));
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

const MODIFIER_KEY = isMacOs ? "Cmd" : "Ctrl";
// Same list as the "Keyboard shortcuts" dialog of the app menu
const SHORTCUTS = [
  { label: "Open settings", keys: `${MODIFIER_KEY} + ,` },
  { label: "Toggle search", keys: `${MODIFIER_KEY} + F` },
  { label: "Notifications and logging", keys: `${MODIFIER_KEY} + Shift + N` },
  { label: "Reload the tab", keys: `${MODIFIER_KEY} + R` },
  { label: "Force reload the tab", keys: `${MODIFIER_KEY} + Shift + R` },
  { label: "Close the tab", keys: `${MODIFIER_KEY} + W` },
  ...(isMacOs ? [{ label: "Close the window", keys: "Cmd + Shift + W" }] : []),
  { label: "Focus the Home search", keys: `${MODIFIER_KEY} + L or /` },
  { label: "Next tab", keys: "Ctrl + Tab" },
  { label: "Previous tab", keys: "Ctrl + Shift + Tab" },
  { label: "Quit the app", keys: `${MODIFIER_KEY} + Q` },
  { label: "Show shortcuts", keys: `${MODIFIER_KEY} + K` },
  { label: "About the app", keys: `${MODIFIER_KEY} + I` },
];

const settings = useSettingsStore();
const resetDialog = ref(false);

const version = import.meta.env.VITE_APP_VERSION;

const themeMode = computed(() => (settings.isDark ? "dark" : "light"));

// The toggle group clears its value when the selected item is clicked again: ignore that
const theme = computed({
  get: () => settings.theme,
  set: (value) => {
    if (value) settings.theme = value;
  },
});

// The store keeps the whole color object; the select works with its name
const primaryColorName = computed({
  get: () => settings.primaryColor.text,
  set: (name) => {
    settings.primaryColor = COLORS.find((color) => color.text === name);
  },
});

function switchLabel(isOn) {
  return isOn ? "Enabled" : "Disabled";
}

function confirmReset() {
  settings.resetToDefaults();
  resetDialog.value = false;
}

function openBugsUrl() {
  window.api.app.openExternal(import.meta.env.VITE_GITHUB_BUGS);
}
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  block-size: 100vh;
}

/* The whole page scrolls */
.settings-scroll {
  flex: 1;
  min-block-size: 0;
  overflow-y: auto;
}

.settings-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  box-sizing: content-box;
  max-inline-size: 80ch;
  margin-inline: auto;
  padding: var(--space-7) var(--space-6);
}

.settings-control {
  inline-size: 220px;
  max-inline-size: 100%;
}

/* Fits "m5-" plus a GUID (40 characters), the clear button and the padding */
.settings-control-id {
  inline-size: calc(40ch + var(--space-8) * 2);
}

.settings-section {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  margin: 0 0 var(--space-5);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

/* Title, then a divider line filling the rest of the row */
.settings-section::after {
  content: "";
  flex: 1;
  border-block-start: 1px solid var(--color-border);
}

.shortcut-keys {
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
}

.settings-version {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.color-option {
  display: inline-flex;
  align-items: center;
  gap: var(--space-4);
}

.color-picker {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

/* Square color chip: in the options and, larger, as the preview next to the select */
.color-swatch {
  flex: none;
  inline-size: 0.875rem;
  block-size: 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.color-swatch--preview {
  inline-size: var(--control-height);
  block-size: var(--control-height);
  border-radius: var(--radius-md);
}
</style>
