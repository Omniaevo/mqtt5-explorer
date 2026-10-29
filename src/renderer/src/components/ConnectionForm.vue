<template>
  <form class="conn-form" novalidate @submit.prevent>
    <section class="conn-form__section">
      <h3 class="conn-form__subheader">general</h3>
      <div class="conn-form__row">
        <MTextBox
          v-model="connectionData.name"
          label="Name"
          :error="errorFor('name')"
          @blur="touch('name')"
        />
        <MSelect
          v-model="connectionData.version"
          label="Version"
          :items="VERSIONS"
          class="conn-form__narrow"
        />
      </div>
      <div class="conn-form__row">
        <MSelect
          v-model="connectionData.protocol"
          label="Protocol"
          :items="PROTOCOLS"
          class="conn-form__narrow"
        />
        <MTextBox
          v-model="connectionData.host"
          label="Host"
          :error="errorFor('host')"
          @blur="touch('host')"
        />
        <MTextBox
          v-model="port"
          label="Port"
          class="conn-form__narrow"
          :error="errorFor('port')"
          @blur="touch('port')"
        />
      </div>
    </section>

    <section class="conn-form__section">
      <h3 class="conn-form__subheader">authentication</h3>
      <div class="conn-form__row">
        <MTextBox v-model="connectionData.username" label="Username" />
        <MPasswordBox v-model="connectionData.password" label="Password" />
      </div>
      <div class="conn-form__row">
        <MTextBox
          :model-value="settings.clientId"
          label="Current client ID"
          class="conn-form__narrow"
          readonly
          disabled
        />
        <MTextBox
          v-model="connectionData.clientId"
          label="Override client ID"
          clearable
        />
      </div>
    </section>

    <section v-if="isTlsProtocol" class="conn-form__section">
      <h3 class="conn-form__subheader">tls</h3>
      <MToggleSwitch
        v-model="connectionData.validateCertificate"
        label="Validate certificate"
      />
      <div v-for="file in CERT_FILES" :key="file.key" class="conn-form__file">
        <MTextBox
          :model-value="connectionData[file.key]"
          :label="file.label"
          :title="connectionData[file.key]"
          readonly
          @click="selectFile(file.key)"
        >
          <template #suffix>
            <MButton
              v-if="connectionData[file.key]"
              variant="text"
              icon="dismiss"
              :aria-label="`Clear ${file.label}`"
              @click.stop="deselectFile(file.key)"
            />
          </template>
        </MTextBox>
        <MButton
          icon="folderOpen"
          :aria-label="`Choose ${file.label}`"
          @click="selectFile(file.key)"
        />
      </div>
    </section>

    <section class="conn-form__section">
      <h3 class="conn-form__subheader">subscriptions</h3>
      <MCombobox v-model="connectionData.topics" label="Topics" />
    </section>
  </form>
</template>

<script setup>
import { computed, reactive } from "vue";
import ConnectionProperties from "../models/ConnectionProperties";
import { useSettingsStore } from "../stores/settings";
import MButton from "./metro/MButton.vue";
import MCombobox from "./metro/MCombobox.vue";
import MPasswordBox from "./metro/MPasswordBox.vue";
import MSelect from "./metro/MSelect.vue";
import MTextBox from "./metro/MTextBox.vue";
import MToggleSwitch from "./metro/MToggleSwitch.vue";

const PROTOCOLS = ["mqtt", "mqtts", "ws", "wss"];
const TLS_PROTOCOLS = ["mqtts", "wss"];
const VERSIONS = [
  { title: "3.1", value: 3 },
  { title: "3.1.1", value: 4 },
  { title: "5.0", value: 5 },
];
const CERT_FILES = [
  { key: "caCert", label: "CA cert file" },
  { key: "clientCert", label: "Client cert file" },
  { key: "clientKey", label: "Client key file" },
];

const props = defineProps({
  properties: { type: Object, required: true },
});

const emit = defineEmits(["connect", "updated"]);

const settings = useSettingsStore();

const connectionData = reactive(new ConnectionProperties());
connectionData.init(props.properties);

const touchedFields = reactive(new Set());

const isValid = computed(() => ConnectionProperties.validate(connectionData));
const isTlsProtocol = computed(() =>
  TLS_PROTOCOLS.includes(connectionData.protocol)
);

// MTextBox edits strings; the stored port stays whatever the field emits.
const port = computed({
  get: () => String(connectionData.port ?? ""),
  set: (value) => {
    connectionData.port = value;
  },
});

function touch(field) {
  touchedFields.add(field);
}

/** First failing rule message of a field, shown only after the field was left. */
function errorFor(field) {
  if (!touchedFields.has(field)) return "";

  const failed = ConnectionProperties.rules[field]
    .map((rule) => rule(connectionData[field]))
    .find((result) => result !== true);

  return failed || "";
}

/** Emits a detached copy, so the parent never shares the form's reactive state. */
function submit(event) {
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

defineExpose({ isValid, submit });
</script>

<style scoped>
.conn-form {
  display: flex;
  flex-direction: column;
  gap: calc(var(--m-unit) * 1.5);
}

.conn-form__section {
  display: flex;
  flex-direction: column;
  gap: var(--m-unit);
}

.conn-form__subheader {
  margin: 0;
  font: var(--m-font-subheader);
}

.conn-form__row {
  display: flex;
  gap: var(--m-unit);
}

.conn-form__row > * {
  flex: 1;
  min-width: 0;
}

.conn-form__row > .conn-form__narrow {
  flex: 0 0 14ch;
}

.conn-form__file {
  display: flex;
  align-items: flex-end;
  gap: var(--m-subunit);
}

.conn-form__file > :first-child {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}
</style>
