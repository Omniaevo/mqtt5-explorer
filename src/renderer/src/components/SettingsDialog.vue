<template>
  <AppDialog
    v-model:open="open"
    title="Settings"
    max-width="900px"
    fullscreen-on-small
  >
    <div class="settings-body">
      <section class="settings-group">
        <h3 class="settings-section">Appearance</h3>
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
        <h3 class="settings-section">Topic tree</h3>
        <SettingsRow
          title="Dense tree"
          description="Smaller rows. More topics fit on the screen."
        >
          <AppSwitch v-model="settings.denseTree" :label="switchLabel(settings.denseTree)" />
        </SettingsRow>
      </section>

      <section class="settings-group">
        <h3 class="settings-section">Application</h3>
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

      <AppAccordion v-model="openPanel" :items="PANELS" type="single">
        <template #item-mqtt>
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
              class="settings-control settings-control-wide"
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
              class="settings-control settings-control-wide"
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
              class="settings-control settings-control-wide"
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
              class="settings-control settings-control-wide"
              label="Max reconnects"
              label-hidden
              :items="MAX_RECONNECTS_OPTIONS"
            />
          </SettingsRow>
        </template>

        <template #item-shortcuts>
          <ul class="shortcut-list">
            <li
              v-for="shortcut in SHORTCUTS"
              :key="shortcut.label"
              class="shortcut-list__item"
            >
              <span>{{ shortcut.label }}</span>
              <span class="shortcut-list__keys">
                {{ modifierKey }} + {{ shortcut.keys }}
              </span>
            </li>
          </ul>
        </template>
      </AppAccordion>
    </div>

    <template #actions>
      <div class="settings-footer">
        <span class="settings-footer__version">v{{ version }}</span>
        <AppButton
          variant="text"
          color="danger"
          size="sm"
          @click="resetDialog = true"
        >
          <RotateCcw :size="14" aria-hidden="true" />
          Reset to defaults
        </AppButton>
        <span class="settings-footer__spacer" />
        <AppButton
          variant="text"
          color="primary"
          size="sm"
          @click="openBugsUrl"
        >
          <Bug :size="14" aria-hidden="true" />
          Report a bug
        </AppButton>
      </div>
    </template>
  </AppDialog>

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
</template>

<script setup>
import { computed, ref } from "vue";
import { Bug, Moon, RotateCcw, RotateCw, Sun, X } from "@lucide/vue";
import { clampHistorySize, FONT_SCALES, useSettingsStore } from "../stores/settings";
import { isMacOs } from "../utils/platform";
import SettingsRow from "./SettingsRow.vue";
import AppAccordion from "./ui/AppAccordion.vue";
import AppButton from "./ui/AppButton.vue";
import AppDialog from "./ui/AppDialog.vue";
import AppSelect from "./ui/AppSelect.vue";
import AppSwitch from "./ui/AppSwitch.vue";
import AppTextField from "./ui/AppTextField.vue";
import AppToggleGroup from "./ui/AppToggleGroup.vue";
import AppTooltip from "./ui/AppTooltip.vue";

const THEME_ITEMS = [
  { value: "light", label: "Light", icon: Sun, showLabel: true },
  { value: "dark", label: "Dark", icon: Moon, showLabel: true },
];
const FONT_SIZE_ITEMS = FONT_SCALES.map((value) => ({
  value,
  text: `${value}%`,
}));
const PANELS = [
  { value: "mqtt", title: "MQTT client (advanced)" },
  { value: "shortcuts", title: "Keyboard shortcuts" },
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
const resetDialog = ref(false);
const openPanel = ref("");

const version = import.meta.env.VITE_APP_VERSION;
const modifierKey = isMacOs ? "Cmd" : "Ctrl";

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
.settings-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.settings-control {
  inline-size: 220px;
  max-inline-size: 100%;
}

.settings-control-wide {
  inline-size: 360px;
}

/* Fits "m5-" plus a GUID (40 characters), the clear button and the padding */
.settings-control-id {
  inline-size: calc(40ch + var(--space-8) * 2);
}

.settings-section {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  margin: 0;
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

.shortcut-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.shortcut-list__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-5);
  min-block-size: var(--row-height);
}

.shortcut-list__keys {
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
}

.settings-footer {
  display: flex;
  flex: 1;
  align-items: center;
  gap: var(--space-4);
}

.settings-footer__version {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.settings-footer__spacer {
  flex: 1;
}
</style>
