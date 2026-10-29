<template>
  <MFlyout v-model:open="open" title="Notifications and logging" size="wide">
    <div class="notify">
      <section class="notify__section">
        <h3 class="notify__subheader">notifications</h3>
        <MToggleSwitch
          v-model="notifySwitch"
          label="Show system notifications"
        />
      </section>

      <section class="notify__section">
        <h3 class="notify__subheader">logging</h3>
        <MToggleSwitch
          v-model="fileLoggingSwitch"
          label="Write messages to files"
        />
        <div v-if="fileLoggingSwitch" class="notify__folder m-entrance">
          <MTextBox
            class="notify__folder-path"
            :model-value="logsFolder"
            label="Logs folder"
            readonly
          />
          <MButton
            variant="standard"
            icon="folderOpen"
            label="Open folder"
            @click="emit('openLogsFolder')"
          />
        </div>
      </section>

      <section class="notify__section">
        <div class="notify__heading">
          <h3 class="notify__subheader">conditions</h3>
          <MTooltip text="Information about searching">
            <MButton
              variant="text"
              icon="info"
              aria-label="Information about searching"
              @click="emit('showInfo')"
            />
          </MTooltip>
        </div>

        <div class="notify__join">
          <span>Trigger when</span>
          <MToggleGroup
            v-model="joinType"
            :options="JOIN_OPTIONS"
            aria-label="Join conditions"
            mandatory
          />
          <span>of these match</span>
        </div>

        <div class="notify__add">
          <MTextBox
            v-model="newEntry"
            class="notify__add-text"
            label="Add condition"
            clearable
            @keyup.enter="addEntry"
          />
          <SearchModeToggle v-model="newEntryMode" />
          <MButton
            variant="standard"
            icon="add"
            label="Add"
            :disabled="!newEntry"
            @click="addEntry"
          />
        </div>

        <ul class="notify__list">
          <template v-for="(entry, i) in entries" :key="entry.notifyEntry">
            <li v-if="i > 0" class="notify__join-label" aria-hidden="true">
              {{ joinType }}
            </li>
            <li class="notify__row m-entrance">
              <MTooltip text="Selected match mode">
                <span class="notify__mode">
                  <MIcon :name="searchModeIcon(entry.filterType)" />
                </span>
              </MTooltip>
              <span class="notify__entry">{{ entry.notifyEntry }}</span>
              <MButton
                variant="round"
                icon="delete"
                :aria-label="`Remove condition ${entry.notifyEntry}`"
                @click="deleteEntry(entry)"
              />
            </li>
          </template>
        </ul>
        <p v-if="!entries.length" class="notify__empty">No conditions yet.</p>
      </section>
    </div>

    <template #footer>
      <MButton
        variant="standard"
        icon="reset"
        label="Reset"
        @click="emit('reset')"
      />
    </template>
  </MFlyout>
</template>

<script setup>
import { ref } from "vue";
import SearchEngine from "../../../../shared/SearchEngine";
import { searchModeIcon } from "../../utils/searchModes";
import { JOIN_MODES } from "../../composables/useNotifyAndLogging";
import MButton from "../metro/MButton.vue";
import MFlyout from "../metro/MFlyout.vue";
import MIcon from "../metro/MIcon.vue";
import MTextBox from "../metro/MTextBox.vue";
import MToggleGroup from "../metro/MToggleGroup.vue";
import MToggleSwitch from "../metro/MToggleSwitch.vue";
import MTooltip from "../metro/MTooltip.vue";
import SearchModeToggle from "./SearchModeToggle.vue";

const JOIN_LABELS = { [JOIN_MODES.OR]: "some", [JOIN_MODES.AND]: "all" };

const JOIN_OPTIONS = Object.values(JOIN_MODES).map((mode) => ({
  value: mode,
  text: JOIN_LABELS[mode],
  ariaLabel: `Join conditions with ${mode.toUpperCase()} operator`,
}));

defineProps({
  logsFolder: { type: String, default: "" },
});

const emit = defineEmits(["showInfo", "openLogsFolder", "reset"]);

const open = defineModel("open", { type: Boolean, default: false });
const entries = defineModel("entries", { type: Array, required: true });
const joinType = defineModel("joinType", { type: String, required: true });
const notifySwitch = defineModel("notifySwitch", {
  type: Boolean,
  default: false,
});
const fileLoggingSwitch = defineModel("fileLoggingSwitch", {
  type: Boolean,
  default: false,
});

const newEntry = ref("");
const newEntryMode = ref(undefined);

/** Adds the condition, or replaces the mode of an existing one. */
function addEntry() {
  if (!newEntry.value) return;

  const entry = {
    notifyEntry: newEntry.value,
    filterType: newEntryMode.value || SearchEngine.modes.ALL,
  };

  const index = entries.value.findIndex(
    (e) => e.notifyEntry === entry.notifyEntry
  );

  entries.value =
    index < 0 ? [...entries.value, entry] : entries.value.with(index, entry);
  newEntry.value = "";
  newEntryMode.value = undefined;
}

function deleteEntry(entry) {
  entries.value = entries.value.filter((e) => e !== entry);
}
</script>

<style scoped>
.notify {
  display: flex;
  flex-direction: column;
  gap: calc(var(--m-unit) * 1.5);
}

.notify__section {
  display: flex;
  flex-direction: column;
  gap: var(--m-unit);
}

.notify__subheader {
  margin: 0;
  font: var(--m-font-subheader);
}

.notify__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.notify__folder,
.notify__add,
.notify__join {
  display: flex;
  align-items: flex-end;
  gap: var(--m-unit);
}

.notify__join {
  align-items: center;
  gap: var(--m-unit);
}

.notify__folder-path,
.notify__add-text {
  flex: 1;
}

.notify__list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}

.notify__row {
  display: flex;
  align-items: center;
  gap: var(--m-unit);
}

.notify__mode {
  display: inline-flex;
  color: var(--m-accent);
}

.notify__entry {
  flex: 1;
  font: var(--m-font-title);
  overflow-wrap: anywhere;
}

.notify__join-label {
  padding-left: var(--m-unit);
  font: var(--m-font-caption);
  text-transform: uppercase;
  opacity: 0.7;
}

.notify__empty {
  margin: 0;
  opacity: 0.7;
}
</style>
