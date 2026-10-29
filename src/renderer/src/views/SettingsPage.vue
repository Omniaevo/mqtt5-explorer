<template>
  <div class="settings-page">
    <MPageHeader
      class="settings-page__header"
      title="Settings"
      show-back
      @back="goBack"
    />

    <div class="settings-page__body" @wheel="scrollHorizontally">
      <div class="settings-page__columns">
        <div class="settings-page__column">
          <section aria-labelledby="settings-appearance">
            <h2 id="settings-appearance" class="settings-page__section">
              appearance
            </h2>
            <SettingsRow title="Theme" description="Colors of the whole app.">
              <MToggleGroup
                v-model="settings.theme"
                :options="THEMES"
                aria-label="Theme"
                mandatory
              />
            </SettingsRow>
            <SettingsRow
              title="Accent color"
              description="Color of buttons and highlights."
            >
              <MSelect
                v-model="settings.primaryColor"
                class="settings-page__control"
                :items="COLORS"
                item-title="text"
                return-object
              >
                <template #item="{ item }">
                  <span class="settings-page__swatch-item">
                    <span
                      class="settings-page__swatch"
                      :style="{ background: item.value[themeMode] }"
                    />
                    {{ item.text }}
                  </span>
                </template>
              </MSelect>
            </SettingsRow>
          </section>

          <section aria-labelledby="settings-tree">
            <h2 id="settings-tree" class="settings-page__section">
              topic tree
            </h2>
            <SettingsRow
              title="Dense tree"
              description="Smaller rows. More topics fit on the screen."
            >
              <MToggleSwitch v-model="settings.denseTree" />
            </SettingsRow>
            <SettingsRow
              title="Close to system tray"
              description="Keep the app running when the window closes."
            >
              <MToggleSwitch v-model="settings.closeTray" />
            </SettingsRow>
          </section>

          <section aria-labelledby="settings-history">
            <h2 id="settings-history" class="settings-page__section">
              history
            </h2>
            <SettingsRow
              title="Values kept per topic (0 to disable)"
              description="History size for each topic. From 0 to 500."
            >
              <MTextBox
                :model-value="String(settings.historySize)"
                class="settings-page__control"
                type="number"
                min="0"
                max="500"
                step="1"
                aria-label="Values kept per topic"
                @update:model-value="
                  settings.historySize = clampHistorySize($event)
                "
              />
            </SettingsRow>
          </section>
        </div>

        <div class="settings-page__column">
          <section aria-labelledby="settings-mqtt">
            <h2 id="settings-mqtt" class="settings-page__section">
              mqtt client
            </h2>
            <SettingsRow
              title="Client ID"
              description="Name of this client on the broker."
            >
              <MTextBox
                v-model="settings.clientId"
                class="settings-page__control-id"
                aria-label="Client ID"
              />
              <MButton
                icon="sync"
                aria-label="New random ID"
                @click="settings.regenerateClientId()"
              />
            </SettingsRow>
            <SettingsRow
              v-for="field in MQTT_SELECTS"
              :key="field.key"
              :title="field.title"
              :description="field.description"
            >
              <MSelect
                v-model="settings[field.key]"
                class="settings-page__control"
                :items="field.options"
              />
            </SettingsRow>
          </section>
        </div>

        <div class="settings-page__column">
          <section aria-labelledby="settings-shortcuts">
            <h2 id="settings-shortcuts" class="settings-page__section">
              keyboard shortcuts
            </h2>
            <SettingsRow
              v-for="shortcut in SHORTCUTS"
              :key="shortcut.label"
              :title="shortcut.label"
            >
              <span class="settings-page__keys">
                {{ modifierKey }} + {{ shortcut.keys }}
              </span>
            </SettingsRow>
          </section>
        </div>
      </div>
    </div>

    <MAppBar :collapsible="false" aria-label="Settings commands">
      <template #context>
        <span class="settings-page__version">v{{ version }}</span>
      </template>
      <template #global>
        <MTooltip text="Reset to defaults" side="top">
          <MButton
            variant="round"
            icon="reset"
            aria-label="Reset to defaults"
            @click="resetOpen = true"
          />
        </MTooltip>
        <MTooltip text="Report a bug" side="top">
          <MButton
            variant="round"
            icon="bug"
            aria-label="Report a bug"
            @click="openBugsUrl"
          />
        </MTooltip>
      </template>
    </MAppBar>

    <MMessageDialog
      v-model:open="resetOpen"
      title="Reset settings"
      message="Reset all settings to their defaults? The client ID stays the same."
      confirm-label="Reset"
      danger
      @confirm="settings.resetToDefaults()"
    />
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import SettingsRow from "../components/SettingsRow.vue";
import MAppBar from "../components/metro/MAppBar.vue";
import MButton from "../components/metro/MButton.vue";
import MMessageDialog from "../components/metro/MMessageDialog.vue";
import MPageHeader from "../components/metro/MPageHeader.vue";
import MSelect from "../components/metro/MSelect.vue";
import MTooltip from "../components/metro/MTooltip.vue";
import MTextBox from "../components/metro/MTextBox.vue";
import MToggleGroup from "../components/metro/MToggleGroup.vue";
import MToggleSwitch from "../components/metro/MToggleSwitch.vue";
import { clampHistorySize, useSettingsStore } from "../stores/settings";
import { COLORS } from "../utils/accentColors";
import { isMacOs } from "../utils/platform";

const THEMES = [
  { value: "light", ariaLabel: "Light", text: "light" },
  { value: "dark", ariaLabel: "Dark", text: "dark" },
  { value: "system", ariaLabel: "System", text: "system" },
];

const MQTT_SELECTS = [
  {
    key: "keepalive",
    title: "Keepalive",
    description: "Time between pings to the broker, in seconds.",
    options: [60, 120, 180, 240, 300],
  },
  {
    key: "connectTimeout",
    title: "Connection timeout",
    description: "Time to wait for the broker, in seconds.",
    options: [10, 20, 30, 40, 50, 60, 120, 180, 240, 300],
  },
  {
    key: "reconnectPeriod",
    title: "Reconnect period",
    description: "Time between reconnect attempts, in seconds.",
    options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },
  {
    key: "maxReconnects",
    title: "Max reconnects",
    description: "Number of reconnect attempts. 0 turns it off.",
    options: [0, 5, 10, 15, 20],
  },
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

const router = useRouter();
const settings = useSettingsStore();
const resetOpen = ref(false);

const version = import.meta.env.VITE_APP_VERSION;
const modifierKey = isMacOs ? "Cmd" : "Ctrl";
const themeMode = computed(() => settings.resolvedTheme);

const goBack = () => router.push({ name: "Home" });

/** Like the hub (P15): the vertical wheel scrolls sideways, unless the page can scroll vertically. */
function scrollHorizontally(event) {
  const body = event.currentTarget;

  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
  if (body.scrollHeight > body.clientHeight) return;
  event.preventDefault();
  body.scrollLeft += event.deltaY;
}

function openBugsUrl() {
  window.api.app.openExternal(import.meta.env.VITE_GITHUB_BUGS);
}
</script>

<style scoped>
.settings-page {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  color: var(--m-fg);
}

/* The header stays in place; only the body scrolls */
.settings-page__header {
  flex: none;
  padding: var(--m-unit) 40px 0;
}

/* Ends above the app bar so the scrollbar stays visible */
.settings-page__body {
  margin-bottom: 56px;
  flex: 1;
  min-height: 0;
  padding: 0 40px;
  overflow: auto;
}

/* Hub-like columns from the 40 px margin (P4); one column on narrow windows */
.settings-page__columns {
  display: flex;
  /* Grows with the columns so the end margin scrolls with them */
  width: max-content;
  padding-right: 40px;
  gap: calc(var(--m-unit) * 4);
  padding-block: var(--m-unit);
}

.settings-page__column {
  flex: none;
  width: 440px;
}

@media (max-width: 900px) {
  .settings-page__columns {
    flex-direction: column;
    width: auto;
    padding-right: 0;
  }

  .settings-page__column {
    width: auto;
    max-width: 720px;
  }
}

.settings-page__section {
  margin: calc(var(--m-unit) * 1.5) 0 var(--m-subunit);
  font: var(--m-font-subheader);
}

.settings-page__control {
  width: 220px;
  max-width: 100%;
}

/* Fits "m5-" plus a GUID (40 characters) */
.settings-page__control-id {
  width: calc(40ch + 24px);
  max-width: 100%;
}

.settings-page__swatch-item {
  display: inline-flex;
  align-items: center;
  gap: var(--m-subunit);
}

.settings-page__swatch {
  width: 14px;
  height: 14px;
}

.settings-page__keys {
  color: var(--m-fg-secondary);
  font: var(--m-font-caption);
}

.settings-page__version {
  display: flex;
  align-items: center;
  height: 40px; /* same as the round buttons */
  color: var(--m-fg-secondary);
  font: var(--m-font-caption);
}
</style>
