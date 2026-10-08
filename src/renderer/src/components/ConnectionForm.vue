<template>
  <v-card class="conn-form-card" flat>
    <v-card-text style="overflow: hidden; position: relative">
      <div class="pa-4" style="overflow: auto; position: absolute; inset: 0">
        <div row>
          <v-text-field
            v-model="connectionData.name"
            :variant="fieldVariant"
            :rules="ConnectionProperties.rules.name"
            label="Name"
            required
          />
          <v-select
            v-model="connectionData.version"
            :items="VERSIONS"
            :variant="fieldVariant"
            label="Version"
            style="max-width: 14ch"
          />
        </div>
        <div row>
          <v-select
            v-model="connectionData.protocol"
            :items="PROTOCOLS"
            :variant="fieldVariant"
            :rules="ConnectionProperties.rules.protocol"
            label="Protocol"
            style="max-width: 17ch"
            required
          />
          <v-text-field
            v-model="connectionData.host"
            :variant="fieldVariant"
            :rules="ConnectionProperties.rules.host"
            label="Host"
            required
          />
          <v-text-field
            v-model="connectionData.port"
            :variant="fieldVariant"
            :rules="ConnectionProperties.rules.port"
            label="Port"
            style="max-width: 12ch"
            required
          />
        </div>
        <div row>
          <v-text-field
            v-model="connectionData.username"
            :variant="fieldVariant"
            label="Username"
          />
          <v-text-field
            v-model="connectionData.password"
            :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :variant="fieldVariant"
            :type="showPassword ? 'text' : 'password'"
            label="Password"
            @click:append-inner="showPassword = !showPassword"
          />
        </div>

        <v-expansion-panels class="mt-6" style="border: 1px solid grey">
          <v-expansion-panel elevation="0">
            <v-expansion-panel-title>
              <v-icon size="small">mdi-tune-variant</v-icon>
              <span class="ms-4">Advanced connection settings</span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div row>
                <v-switch
                  v-model="connectionData.validateCertificate"
                  label="Validate Certificate"
                  color="primary"
                  inset
                />
                <v-spacer />
                <div
                  :title="connectionData.caCert"
                  class="d-flex align-center cert-selector"
                  @click="selectFile('caCert')"
                >
                  <v-text-field
                    v-model="connectionData.caCert"
                    label="CA cert file"
                    class="cert-selector"
                    readonly
                  />
                  <v-btn
                    icon="mdi-close"
                    variant="text"
                    @click.stop="deselectFile('caCert')"
                  />
                </div>
              </div>
              <div row>
                <div
                  :title="connectionData.clientCert"
                  class="d-flex align-center cert-selector"
                  @click="selectFile('clientCert')"
                >
                  <v-text-field
                    v-model="connectionData.clientCert"
                    label="Client cert file"
                    class="cert-selector"
                    readonly
                  />
                  <v-btn
                    icon="mdi-close"
                    variant="text"
                    @click.stop="deselectFile('clientCert')"
                  />
                </div>
                <div
                  :title="connectionData.clientKey"
                  class="d-flex align-center cert-selector"
                  @click="selectFile('clientKey')"
                >
                  <v-text-field
                    v-model="connectionData.clientKey"
                    label="Client key file"
                    class="cert-selector"
                    readonly
                  />
                  <v-btn
                    icon="mdi-close"
                    variant="text"
                    @click.stop="deselectFile('clientKey')"
                  />
                </div>
              </div>
              <v-divider class="mb-2" />
              <div row>
                <v-text-field
                  :model-value="settings.clientId"
                  :variant="fieldVariant"
                  label="Current client ID"
                  style="max-width: 35%"
                  readonly
                  disabled
                />
                <v-text-field
                  v-model="connectionData.clientId"
                  :variant="fieldVariant"
                  label="Override client ID"
                  clearable
                />
              </div>
              <v-divider class="mb-2" />
              <div row>
                <v-combobox
                  v-model="connectionData.topics"
                  :variant="fieldVariant"
                  menu-icon=""
                  label="Subscriptions"
                  chips
                  closable-chips
                  hide-no-data
                  multiple
                />
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </v-card-text>

    <v-card-actions>
      <v-btn color="error" variant="text" @click="emit('delete')">Delete</v-btn>
      <v-btn
        :disabled="!isValid"
        variant="text"
        @click="emitConnectionData('updated')"
      >
        Save
      </v-btn>
      <v-spacer />
      <v-btn
        :disabled="!isValid"
        class="ms-2"
        color="primary"
        @click="emitConnectionData('connect')"
      >
        Connect
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import ConnectionProperties from "../models/ConnectionProperties";
import { useSettingsStore } from "../stores/settings";

const PROTOCOLS = ["mqtt", "mqtts", "ws", "wss"];
const VERSIONS = [
  { title: "3.1", value: 3 },
  { title: "3.1.1", value: 4 },
  { title: "5.0", value: 5 },
];

const props = defineProps({
  properties: { type: Object, required: true },
});

const emit = defineEmits(["connect", "delete", "updated"]);

const settings = useSettingsStore();
const showPassword = ref(false);

const connectionData = reactive(new ConnectionProperties());
connectionData.init(props.properties);

const fieldVariant = computed(() =>
  settings.outline ? "outlined" : "underlined"
);
const isValid = computed(() => ConnectionProperties.validate(connectionData));

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
.conn-form-card {
  height: 100%;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr min-content;
}

div[row] {
  display: flex;
  flex-direction: row;
  gap: 1.5em;
}

div[row] > * {
  flex-grow: 1;
}

.cert-selector {
  cursor: pointer;
}
</style>
