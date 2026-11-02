<template>
  <section class="conn-form">
    <div class="conn-form__scroll">
      <div class="conn-form__row">
        <AppTextField
          v-model="connectionData.name"
          :error="errorOf('name')"
          label="Name"
          required
          @blur="touch('name')"
          @input="touch('name')"
        />
        <AppSelect
          v-model="connectionData.version"
          :items="VERSIONS"
          class="conn-form__version"
          label="Version"
        />
      </div>
      <div class="conn-form__row">
        <AppSelect
          v-model="connectionData.protocol"
          :error="errorOf('protocol')"
          :items="PROTOCOLS"
          class="conn-form__protocol"
          label="Protocol"
        />
        <AppTextField
          v-model="connectionData.host"
          mono
          :error="errorOf('host')"
          label="Host"
          required
          @blur="touch('host')"
          @input="touch('host')"
        />
        <AppTextField
          v-model="connectionData.port"
          mono
          :error="errorOf('port')"
          class="conn-form__port"
          label="Port"
          required
          @blur="touch('port')"
          @input="touch('port')"
        />
      </div>
      <div class="conn-form__row">
        <AppTextField v-model="connectionData.username" label="Username" />
        <AppTextField
          v-model="connectionData.password"
          :type="showPassword ? 'text' : 'password'"
          label="Password"
        >
          <template #append-inner>
            <AppButton
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              :aria-pressed="showPassword"
              size="sm"
              variant="icon"
              @click="showPassword = !showPassword"
            >
              <component :is="showPassword ? Eye : EyeOff" :size="16" aria-hidden="true" />
            </AppButton>
          </template>
        </AppTextField>
      </div>

      <AppAccordion v-model="openPanels" :items="PANELS" class="conn-form__advanced">
        <template #item-advanced>
          <div class="conn-form__row">
            <AppSwitch v-model="connectionData.validateCertificate" label="Validate Certificate" />
            <div
              v-for="file in CA_FILES"
              :key="file.field"
              :title="connectionData[file.field]"
              class="conn-form__cert"
              @click="selectFile(file.field)"
              @keydown.enter="selectFile(file.field)"
            >
              <AppTextField v-model="connectionData[file.field]" mono :label="file.label" readonly />
              <AppButton
                :aria-label="`Clear ${file.label}`"
                variant="icon"
                @click.stop="deselectFile(file.field)"
              >
                <X :size="16" aria-hidden="true" />
              </AppButton>
            </div>
          </div>
          <div class="conn-form__row">
            <div
              v-for="file in CLIENT_FILES"
              :key="file.field"
              :title="connectionData[file.field]"
              class="conn-form__cert"
              @click="selectFile(file.field)"
              @keydown.enter="selectFile(file.field)"
            >
              <AppTextField v-model="connectionData[file.field]" mono :label="file.label" readonly />
              <AppButton
                :aria-label="`Clear ${file.label}`"
                variant="icon"
                @click.stop="deselectFile(file.field)"
              >
                <X :size="16" aria-hidden="true" />
              </AppButton>
            </div>
          </div>
          <hr class="conn-form__divider" />
          <div class="conn-form__row">
            <AppTextField
              :model-value="settings.clientId"
              mono
              class="conn-form__current-client-id"
              label="Current client ID"
              readonly
              disabled
            />
            <AppTextField v-model="connectionData.clientId" mono label="Override client ID">
              <template #append-inner>
                <AppButton
                  v-if="connectionData.clientId"
                  aria-label="Clear client ID"
                  size="sm"
                  variant="icon"
                  @click="connectionData.clientId = undefined"
                >
                  <X :size="16" aria-hidden="true" />
                </AppButton>
              </template>
            </AppTextField>
          </div>
          <hr class="conn-form__divider" />
          <div class="conn-form__topics">
            <label :for="topicsInputId" class="conn-form__topics-label">Subscriptions</label>
            <TagsInputRoot
              v-model="connectionData.topics"
              add-on-blur
              class="conn-form__tags"
            >
              <TagsInputItem
                v-for="topic in connectionData.topics"
                :key="topic"
                :value="topic"
                class="conn-form__tag"
              >
                <TagsInputItemText class="conn-form__tag-text" />
                <TagsInputItemDelete class="conn-form__tag-delete" :aria-label="`Remove ${topic}`">
                  <X :size="12" aria-hidden="true" />
                </TagsInputItemDelete>
              </TagsInputItem>
              <TagsInputInput :id="topicsInputId" class="conn-form__tags-input" />
            </TagsInputRoot>
          </div>
        </template>
      </AppAccordion>
    </div>

    <footer class="conn-form__actions">
      <AppButton color="danger" variant="text" @click="emit('delete')">Delete</AppButton>
      <AppButton variant="text" :disabled="!isValid" @click="emitConnectionData('updated')">
        Save
      </AppButton>
      <AppButton
        class="conn-form__connect"
        color="primary"
        :disabled="!isValid"
        @click="emitConnectionData('connect')"
      >
        Connect
      </AppButton>
    </footer>
  </section>
</template>

<script setup>
import { computed, reactive, ref, useId } from "vue";
import {
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
  TagsInputRoot,
} from "reka-ui";
import { Eye, EyeOff, SlidersHorizontal, X } from "@lucide/vue";
import AppAccordion from "./ui/AppAccordion.vue";
import AppButton from "./ui/AppButton.vue";
import AppSelect from "./ui/AppSelect.vue";
import AppSwitch from "./ui/AppSwitch.vue";
import AppTextField from "./ui/AppTextField.vue";
import ConnectionProperties from "../models/ConnectionProperties";
import { useSettingsStore } from "../stores/settings";

const PROTOCOLS = ["mqtt", "mqtts", "ws", "wss"];
const VERSIONS = [
  { title: "3.1", value: 3 },
  { title: "3.1.1", value: 4 },
  { title: "5.0", value: 5 },
];
const PANELS = [{ value: "advanced", title: "Advanced connection settings", icon: SlidersHorizontal }];
const CA_FILES = [{ field: "caCert", label: "CA cert file" }];
const CLIENT_FILES = [
  { field: "clientCert", label: "Client cert file" },
  { field: "clientKey", label: "Client key file" },
];

const props = defineProps({
  properties: { type: Object, required: true },
});

const emit = defineEmits(["connect", "delete", "updated"]);

const settings = useSettingsStore();
const showPassword = ref(false);
const openPanels = ref([]);
const topicsInputId = useId();

/** Fields the user already edited; errors show only for these. */
const touched = reactive(new Set());

const connectionData = reactive(new ConnectionProperties());
connectionData.init(props.properties);

const isValid = computed(() => ConnectionProperties.validate(connectionData));

function touch(field) {
  touched.add(field);
}

/** First failing rule message of a touched field, or undefined. */
function errorOf(field) {
  if (!touched.has(field)) return undefined;

  const failed = ConnectionProperties.rules[field]
    .map((rule) => rule(connectionData[field]))
    .find((result) => result !== true);

  return failed || undefined;
}

/** Emits a detached copy, so the parent never shares the form's reactive state. */
function emitConnectionData(event) {
  const copy = new ConnectionProperties();

  if (!connectionData.name.trim()) connectionData.name = copy.name;

  copy.init(connectionData);
  emit(event, copy);
}

async function selectFile(destination) {
  const filePath = await window.api.dialog.openFile();

  if (!filePath) return;

  connectionData[destination] = filePath.split(/[\\/]/).pop();
  connectionData[`${destination}Path`] = filePath;
}

function deselectFile(destination) {
  connectionData[destination] = undefined;
  connectionData[`${destination}Path`] = undefined;
}
</script>

<style scoped>
.conn-form {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr min-content;
  block-size: 100%;
}

.conn-form__scroll {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-6);
  overflow: auto;
  min-block-size: 0;
}

.conn-form__row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-7);
}

.conn-form__row > * {
  flex-grow: 1;
}

.conn-form__row + .conn-form__row {
  margin-block-start: var(--space-6);
}

.conn-form__version {
  max-inline-size: 14ch;
}

.conn-form__protocol {
  max-inline-size: 17ch;
}

.conn-form__port {
  max-inline-size: 12ch;
}

.conn-form__current-client-id {
  max-inline-size: 35%;
}

.conn-form__advanced {
  margin-block-start: var(--space-6);
}

.conn-form__cert {
  display: flex;
  align-items: flex-end;
  gap: var(--space-4);
  cursor: pointer;
}

.conn-form__cert :deep(.app-text-field) {
  flex: 1;
  cursor: pointer;
}

.conn-form__cert :deep(.app-text-field__input) {
  cursor: pointer;
}

.conn-form__divider {
  margin-block: var(--space-6);
  border: 0;
  border-block-start: 1px solid var(--color-border);
}

.conn-form__topics {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.conn-form__topics-label {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.conn-form__tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  min-block-size: var(--control-height);
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-raised);
  transition: border-color var(--duration-fast) var(--easing);
}

.conn-form__tags:hover {
  border-color: var(--color-text-muted);
}

.conn-form__tags:focus-within {
  border-color: var(--color-primary);
  outline: 0;
}

.conn-form__tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding-inline: var(--space-4) var(--space-2);
  border-radius: var(--radius-md);
  background: var(--color-primary-subtle);
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
}

.conn-form__tag[data-state="active"] {
  outline: 2px solid var(--color-focus-ring);
}

.conn-form__tag-delete {
  display: inline-flex;
  padding: var(--space-1);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}

.conn-form__tag-delete:hover {
  background: var(--color-hover);
  color: var(--color-text);
}

.conn-form__tags-input {
  font-family: var(--font-mono);
  flex: 1;
  min-inline-size: 8ch;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: var(--font-size-md);
}

.conn-form__actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-6);
  border-block-start: 1px solid var(--color-border);
}

.conn-form__connect {
  margin-inline-start: auto;
}
</style>
