<template>
  <AppDialog
    v-model:open="open"
    title="Notifications and logging"
    max-width="70ch"
    persistent
    hide-close
    fullscreen-on-small
  >
    <div class="notifications">
      <div class="notifications__add">
        <AppTextField
          v-model="newEntry"
          label="Add condition"
          @keyup.enter="addEntry"
        >
          <template #append-inner>
            <AppButton
              v-if="newEntry"
              variant="icon"
              size="sm"
              aria-label="Clear condition"
              @click="newEntry = undefined"
            >
              <X :size="16" aria-hidden="true" />
            </AppButton>
          </template>
        </AppTextField>
        <SearchModeToggle v-model="newEntryMode" />
        <AppButton
          variant="icon"
          aria-label="Add condition"
          :disabled="!newEntry"
          @click="addEntry"
        >
          <Plus :size="16" aria-hidden="true" />
        </AppButton>
        <AppTooltip text="Information about searching">
          <AppButton
            variant="icon"
            aria-label="Information about searching"
            @click="emit('showInfo')"
          >
            <Info :size="16" aria-hidden="true" />
          </AppButton>
        </AppTooltip>
      </div>

      <section class="notifications__conditions">
        <div class="notifications__conditions-header">
          <h3 class="notifications__subtitle">Trigger conditions:</h3>
          <AppToggleGroup v-model="joinType" :items="JOIN_ITEMS" />
        </div>

        <ul class="entries">
          <template v-for="(entry, i) in entries" :key="entry.notifyEntry">
            <li class="entries__item">
              <Pin class="entries__pin" :size="14" aria-hidden="true" />
              <span class="entries__title">{{ entry.notifyEntry }}</span>
              <AppTooltip text="Selected match mode">
                <span class="chip" tabindex="0">
                  <component
                    :is="searchModeIcon(entry.filterType)"
                    :size="14"
                    aria-hidden="true"
                  />
                </span>
              </AppTooltip>
              <AppButton
                variant="icon"
                size="sm"
                color="danger"
                aria-label="Delete condition"
                @click="deleteEntry(entry)"
              >
                <Trash2 :size="16" aria-hidden="true" />
              </AppButton>
            </li>
            <li
              v-if="i < entries.length - 1"
              class="entries__join"
              aria-hidden="true"
            >
              <hr />
              <span>{{ joinType }}</span>
              <hr />
            </li>
          </template>
        </ul>
      </section>

      <div class="notifications__switches">
        <AppSwitch v-model="notifySwitch" label="Enable notifications" />
        <AppSwitch v-model="fileLoggingSwitch" label="Enable file logging" />
      </div>

      <Transition name="slide-y">
        <AppTextField
          v-if="fileLoggingSwitch"
          :model-value="logsFolder"
          label="Logs folder location"
          readonly
        >
          <template #append-inner>
            <AppButton
              variant="icon"
              size="sm"
              aria-label="Open logs folder"
              @click="emit('openLogsFolder')"
            >
              <FolderOpen :size="16" aria-hidden="true" />
            </AppButton>
          </template>
        </AppTextField>
      </Transition>
    </div>

    <template #actions>
      <AppButton variant="text" color="danger" @click="emit('reset')">
        Reset
      </AppButton>
      <span class="notifications__spacer" />
      <AppButton variant="text" @click="open = false">Done</AppButton>
    </template>
  </AppDialog>
</template>

<script setup>
import { ref } from "vue";
import { FolderOpen, Info, Pin, Plus, Trash2, X } from "@lucide/vue";
import SearchEngine from "../../../../shared/SearchEngine";
import { searchModeIcon } from "../../utils/searchModes";
import { JOIN_MODES } from "../../composables/useNotifyAndLogging";
import AppButton from "../ui/AppButton.vue";
import AppDialog from "../ui/AppDialog.vue";
import AppSwitch from "../ui/AppSwitch.vue";
import AppTextField from "../ui/AppTextField.vue";
import AppToggleGroup from "../ui/AppToggleGroup.vue";
import AppTooltip from "../ui/AppTooltip.vue";
import SearchModeToggle from "./SearchModeToggle.vue";

defineProps({
  logsFolder: { type: String, default: "" },
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

const JOIN_ITEMS = Object.values(JOIN_MODES).map((mode) => ({
  value: mode,
  label: mode,
  tooltip: `Join conditions with ${mode.toUpperCase()} operator`,
}));

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
.notifications {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.notifications__add {
  display: flex;
  align-items: flex-end;
  gap: var(--space-4);
}

.notifications__add > :first-child {
  flex: 1;
}

.notifications__conditions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.notifications__subtitle {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
}

.notifications__switches {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-4);
}

/* Pushes Done to the end of the actions footer */
.notifications__spacer {
  flex: 1;
}

.entries {
  margin: var(--space-4) 0 0;
  padding: 0;
  list-style: none;
}

.entries__item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  min-block-size: var(--row-height);
  padding-block: var(--space-2);
}

.entries__pin {
  flex: none;
  color: var(--color-primary);
}

.entries__title {
  flex: 1;
  min-inline-size: 0;
  overflow-wrap: anywhere;
  font-size: var(--font-size-lg);
}

.entries__join {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.entries__join hr {
  flex: 1;
  margin: 0;
  border: 0;
  border-block-start: 1px solid var(--color-border);
}

.chip {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-4);
  border: 1px solid var(--color-primary);
  border-radius: 999px;
  color: var(--color-primary);
}

.slide-y-enter-active,
.slide-y-leave-active {
  transition:
    opacity var(--duration-normal) var(--easing),
    transform var(--duration-normal) var(--easing);
}

.slide-y-enter-from,
.slide-y-leave-to {
  opacity: 0;
  transform: translateY(calc(-1 * var(--space-4)));
}

@media (prefers-reduced-motion: reduce) {
  .slide-y-enter-active,
  .slide-y-leave-active {
    transition: none;
  }
}
</style>
