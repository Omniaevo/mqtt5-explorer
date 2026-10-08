<template>
  <v-dialog v-model="open" max-width="70ch" persistent scrollable>
    <v-card>
      <v-card-title>Notifications and logging</v-card-title>
      <v-card-text class="d-flex flex-column">
        <div class="d-flex align-center mb-4">
          <v-text-field
            v-model="newEntry"
            :variant="variant"
            label="Add condition"
            clear-icon="mdi-close"
            clearable
            density="compact"
            hide-details
            @keyup.enter="addEntry"
          >
            <template #append>
              <div class="d-flex align-center">
                <SearchModeToggle v-model="newEntryMode" />
                <v-btn
                  :disabled="!newEntry"
                  class="ms-2"
                  icon="mdi-plus"
                  size="x-small"
                  variant="text"
                  @click="addEntry"
                />
              </div>
            </template>
          </v-text-field>
          <v-tooltip text="Information about searching" location="bottom">
            <template #activator="{ props: tooltipProps }">
              <v-btn
                v-bind="tooltipProps"
                class="ms-4"
                icon="mdi-information-outline"
                variant="text"
                @click="emit('showInfo')"
              />
            </template>
          </v-tooltip>
        </div>

        <div class="mt-2">
          <div class="d-flex justify-space-between align-center">
            <span>Trigger conditions:</span>
            <v-btn-toggle
              v-model="joinType"
              color="primary"
              density="compact"
              variant="outlined"
              divided
            >
              <v-btn
                v-for="mode in JOIN_MODES"
                :key="mode"
                :value="mode"
                :title="`Join conditions with ${mode.toUpperCase()} operator`"
                size="small"
                @click.stop
              >
                {{ mode }}
              </v-btn>
            </v-btn-toggle>
          </div>

          <v-list density="compact">
            <template v-for="(entry, i) in entries" :key="entry.notifyEntry">
              <v-list-item>
                <template #prepend>
                  <v-icon color="primary" icon="mdi-pin-outline" size="small" />
                </template>
                <v-list-item-title class="entry-title">
                  {{ entry.notifyEntry }}
                </v-list-item-title>
                <template #append>
                  <v-tooltip text="Selected match mode" location="bottom">
                    <template #activator="{ props: tooltipProps }">
                      <v-chip
                        v-bind="tooltipProps"
                        class="me-4"
                        color="primary"
                        variant="outlined"
                        size="small"
                      >
                        <v-icon
                          :icon="searchModeIcon(entry.filterType)"
                          size="small"
                        />
                      </v-chip>
                    </template>
                  </v-tooltip>
                  <v-btn
                    color="error"
                    icon="mdi-delete-outline"
                    size="x-small"
                    variant="text"
                    @click="deleteEntry(entry)"
                  />
                </template>
              </v-list-item>
              <div v-if="i < entries.length - 1" class="d-flex align-center">
                <v-divider />
                <span class="mx-4 text-caption">{{ joinType }}</span>
                <v-divider />
              </div>
            </template>
          </v-list>
        </div>

        <div class="mt-4 d-flex align-center justify-space-between">
          <v-switch
            v-model="notifySwitch"
            label="Enable notifications"
            hide-details
            inset
          />
          <v-switch
            v-model="fileLoggingSwitch"
            label="Enable file logging"
            hide-details
            inset
          />
        </div>

        <v-slide-y-transition>
          <div v-if="fileLoggingSwitch" class="mt-2">
            <v-text-field
              :model-value="logsFolder"
              :variant="variant"
              append-icon="mdi-folder-open-outline"
              label="Logs folder location"
              readonly
              @click:append="emit('openLogsFolder')"
            />
          </div>
        </v-slide-y-transition>
      </v-card-text>
      <v-card-actions>
        <v-btn color="error" variant="text" @click="emit('reset')">Reset</v-btn>
        <v-spacer />
        <v-btn variant="text" @click="open = false">Done</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from "vue";
import SearchEngine from "../../../../shared/SearchEngine";
import { searchModeIcon } from "../../utils/searchModes";
import { JOIN_MODES } from "../../composables/useNotifyAndLogging";
import SearchModeToggle from "./SearchModeToggle.vue";

defineProps({
  logsFolder: { type: String, default: "" },
  variant: { type: String, default: "outlined" },
});

const emit = defineEmits(["showInfo", "openLogsFolder", "reset"]);

const open = defineModel({ type: Boolean, default: false });
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

const newEntry = ref(undefined);
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
  newEntry.value = undefined;
  newEntryMode.value = undefined;
}

function deleteEntry(entry) {
  entries.value = entries.value.filter((e) => e !== entry);
}
</script>

<style scoped>
.entry-title {
  font-size: 1.1em;
}
</style>
