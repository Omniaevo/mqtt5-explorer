<template>
  <AppDialog
    v-model:open="open"
    title="How to search"
    max-width="70ch"
    hide-close
    fullscreen-on-small
  >
    <p>
      <strong>Basic search.</strong> Normally the search will be performed
      on all topics full names or the leaves names (the last portion of a
      topic).
    </p>
    <p>Example: <em>measures/device/sensor</em></p>
    <p>
      <strong>Advanced search.</strong> Use the prefix
      <kbd>{{ SearchEngine.QUERY }}</kbd> to perform a search inside of the
      value object (it is in <em>JSON</em> format), the root fields are
      typically: <strong>payload</strong> and
      <strong>properties</strong> (consult the MQTT protocol specifications
      for more); the next part of the string contains the sequence of keys
      to search in (<em>dot</em> notation) and the value to search, the two
      parts are separated by a <code>=</code>.
    </p>
    <p>
      Example:
      <em>{{ SearchEngine.QUERY }}properties.userProperties.key=value</em>
    </p>
    <span>Search types applicable for all above cases:</span>
    <ul>
      <li v-for="option in MODE_DESCRIPTIONS" :key="option.value">
        <component :is="option.icon" :size="16" class="mode-icon" aria-hidden="true" />: {{ option.text }}
          </li>
        </ul>
    <template #actions>
      <AppButton variant="text" @click="open = false">Got it</AppButton>
    </template>
  </AppDialog>
</template>

<script setup>
import AppButton from "../ui/AppButton.vue";
import AppDialog from "../ui/AppDialog.vue";
import SearchEngine from "../../../../shared/SearchEngine";
import { SEARCH_MODE_OPTIONS } from "../../utils/searchModes";

const MODE_TEXTS = {
  [SearchEngine.modes.CASES]:
    "select this option if the search has to be case sensitive;",
  [SearchEngine.modes.WORDS]:
    "select this option if the searched word has to perfectly match;",
  [SearchEngine.modes.REG_EXP]:
    "select this option to use regular expressions.",
};

const MODE_DESCRIPTIONS = SEARCH_MODE_OPTIONS.map(({ value, icon }) => ({
  value,
  icon,
  text: MODE_TEXTS[value],
}));

const open = defineModel({ type: Boolean, default: false });
</script>

<style scoped>
.mode-icon {
  vertical-align: text-bottom;
}
</style>
