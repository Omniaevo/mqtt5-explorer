<template>
  <div class="gallery">
    <h1 class="gallery__title">Metro gallery</h1>

    <section class="gallery__section">
      <h2>Theme</h2>
      <div class="gallery__row">
        <MButton
          v-for="mode in THEME_MODES"
          :key="mode"
          :variant="settings.theme === mode ? 'accent' : 'standard'"
          :label="mode"
          :aria-pressed="settings.theme === mode"
          @click="settings.theme = mode"
        />
      </div>
      <h2>Accent</h2>
      <div class="gallery__row">
        <button
          v-for="color in COLORS"
          :key="color.text"
          type="button"
          class="gallery__swatch"
          :class="{ 'gallery__swatch--active': isActiveAccent(color) }"
          :style="{ background: color.value[settings.resolvedTheme] }"
          :aria-label="color.text"
          :aria-pressed="isActiveAccent(color)"
          :title="color.text"
          @click="settings.primaryColor = color"
        />
      </div>
    </section>

    <section class="gallery__section">
      <h2>MButton</h2>
      <div
        v-for="state in BUTTON_STATES"
        :key="state.name"
        class="gallery__row"
      >
        <span class="gallery__state">{{ state.name }}</span>
        <MButton label="Standard" :disabled="state.disabled" />
        <MButton variant="accent" label="Accent" :disabled="state.disabled" />
        <MButton variant="text" label="Text" :disabled="state.disabled" />
        <MButton
          variant="standard"
          icon="add"
          label="With icon"
          :disabled="state.disabled"
        />
        <MButton
          variant="standard"
          icon="settings"
          aria-label="Settings"
          :disabled="state.disabled"
        />
        <MButton
          variant="round"
          icon="add"
          label="Add"
          :disabled="state.disabled"
        />
        <MButton
          variant="round"
          icon="delete"
          aria-label="Delete"
          :disabled="state.disabled"
        />
      </div>
      <p class="gallery__hint">
        Press and hold a button to see the inverted pressed state. Tab for
        focus.
      </p>
    </section>

    <section class="gallery__section">
      <h2>MTextBox</h2>
      <div class="gallery__grid">
        <MTextBox v-model="text" label="Default" placeholder="Type here" />
        <MTextBox v-model="text" label="Clearable" clearable />
        <MTextBox
          v-model="text"
          label="Prefix icon and suffix"
          prefix-icon="search"
        >
          <template #suffix>
            <MButton variant="text" icon="folderOpen" aria-label="Browse" />
          </template>
        </MTextBox>
        <MTextBox
          v-model="text"
          label="Error"
          error="This value is not valid"
        />
        <MTextBox v-model="text" label="Disabled" disabled />
        <MTextBox model-value="Read only" label="Read only" readonly />
      </div>
    </section>

    <section class="gallery__section">
      <h2>MPasswordBox</h2>
      <div class="gallery__grid">
        <MPasswordBox v-model="password" label="Default" />
        <MPasswordBox
          v-model="password"
          label="Error"
          error="Password is required"
        />
        <MPasswordBox v-model="password" label="Disabled" disabled />
      </div>
    </section>

    <section class="gallery__section">
      <h2>MTextArea</h2>
      <div class="gallery__grid">
        <MTextArea v-model="area" label="Default" :rows="3" />
        <MTextArea v-model="area" label="Auto grow" auto-grow :rows="2" />
        <MTextArea
          v-model="area"
          label="Error"
          error="Payload is not valid JSON"
        />
        <MTextArea v-model="area" label="Disabled" disabled />
      </div>
    </section>

    <section class="gallery__section">
      <h2>MToggleSwitch</h2>
      <div class="gallery__grid">
        <MToggleSwitch v-model="toggle" label="Default" />
        <MToggleSwitch
          v-model="toggle"
          label="Custom text"
          on-text="Enabled"
          off-text="Disabled"
        />
        <MToggleSwitch :model-value="false" label="Disabled off" disabled />
        <MToggleSwitch :model-value="true" label="Disabled on" disabled />
      </div>
    </section>

    <section class="gallery__section">
      <h2>MCheckBox</h2>
      <div class="gallery__row">
        <MCheckBox v-model="checked" label="Default" />
        <MCheckBox :model-value="true" label="Checked" />
        <MCheckBox :model-value="false" label="Disabled" disabled />
        <MCheckBox :model-value="true" label="Disabled checked" disabled />
      </div>
    </section>

    <section class="gallery__section">
      <h2>MIcon</h2>
      <div class="gallery__icons">
        <figure v-for="name in ICON_NAMES" :key="name" class="gallery__icon">
          <MIcon :name="name" :size="24" />
          <figcaption>{{ name }}</figcaption>
        </figure>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useSettingsStore } from "../stores/settings";
import { COLORS } from "../utils/accentColors";
import { ICONS } from "../components/metro/icons";
import MButton from "../components/metro/MButton.vue";
import MCheckBox from "../components/metro/MCheckBox.vue";
import MIcon from "../components/metro/MIcon.vue";
import MPasswordBox from "../components/metro/MPasswordBox.vue";
import MTextArea from "../components/metro/MTextArea.vue";
import MTextBox from "../components/metro/MTextBox.vue";
import MToggleSwitch from "../components/metro/MToggleSwitch.vue";

/** Dev-only page that shows every Metro component in its states (P9). */
const THEME_MODES = ["light", "dark", "system"];
const BUTTON_STATES = [
  { name: "enabled", disabled: false },
  { name: "disabled", disabled: true },
];
const ICON_NAMES = Object.keys(ICONS);

const settings = useSettingsStore();
const text = ref("");
const password = ref("secret");
const area = ref("");
const toggle = ref(true);
const checked = ref(false);

const isActiveAccent = (color) => settings.primaryColor.text === color.text;
</script>

<style scoped>
/* The document is overflow:hidden, so the page scrolls itself */
.gallery {
  box-sizing: border-box;
  height: 100vh;
  padding: calc(var(--m-unit) * 2);
  overflow: auto;
  background: var(--m-bg);
  color: var(--m-fg);
  font: var(--m-font-body);
}

.gallery__title {
  margin: 0 0 var(--m-unit);
  font: var(--m-font-header);
}

.gallery__section {
  margin-bottom: calc(var(--m-unit) * 2);
}

.gallery__section h2 {
  margin: var(--m-unit) 0 var(--m-subunit);
  font: var(--m-font-subheader);
}

.gallery__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--m-unit);
  margin-bottom: var(--m-unit);
}

.gallery__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--m-unit);
}

.gallery__state {
  width: 70px;
  color: var(--m-fg-secondary);
  font: var(--m-font-caption);
}

.gallery__hint {
  color: var(--m-fg-secondary);
  font: var(--m-font-caption);
}

.gallery__swatch {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 0;
  cursor: pointer;
}

.gallery__swatch--active {
  border-color: var(--m-fg);
}

.gallery__swatch:focus-visible {
  outline: 1px dotted currentColor;
  outline-offset: 2px;
}

.gallery__icons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--m-unit);
}

.gallery__icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90px;
  margin: 0;
  gap: var(--m-subunit);
  font: var(--m-font-caption);
}
</style>
