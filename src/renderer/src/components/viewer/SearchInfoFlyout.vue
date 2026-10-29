<template>
  <MFlyout v-model:open="open" title="How to search" size="narrow">
    <div class="search-info">
      <p>
        <strong>Basic search.</strong> Normally the search will be performed on
        all topics full names or the leaves names (the last portion of a topic).
      </p>
      <p>Example: <em>measures/device/sensor</em></p>
      <p>
        <strong>Advanced search.</strong> Use the prefix
        <kbd>{{ SearchEngine.QUERY }}</kbd> to perform a search inside of the
        value object (it is in <em>JSON</em> format), the root fields are
        typically: <strong>payload</strong> and
        <strong>properties</strong> (consult the MQTT protocol specifications
        for more); the next part of the string contains the sequence of keys to
        search in (<em>dot</em> notation) and the value to search, the two parts
        are separated by a <code>=</code>.
      </p>
      <p>
        Example:
        <em>{{ SearchEngine.QUERY }}properties.userProperties.key=value</em>
      </p>
      <span>Search types applicable for all above cases:</span>
      <ul>
        <li v-for="option in MODE_DESCRIPTIONS" :key="option.icon">
          <MIcon :name="option.icon" :size="16" />: {{ option.text }}
        </li>
      </ul>
    </div>
  </MFlyout>
</template>

<script setup>
import MFlyout from "../metro/MFlyout.vue";
import MIcon from "../metro/MIcon.vue";
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
  icon,
  text: MODE_TEXTS[value],
}));

const open = defineModel("open", { type: Boolean, default: false });
</script>

<style scoped>
.search-info p {
  margin: 0 0 var(--m-unit);
}

.search-info ul {
  padding-left: var(--m-unit);
}
</style>
