<template>
  <v-card class="conn-form-card" flat>
    <v-card-text style="overflow: hidden; position: relative">
      <div class="pa-4" style="overflow: auto; position: absolute; inset: 0">
        <div row>
          <v-text-field
            v-model="connectionData.name"
            v-bind:outlined="outline"
            v-bind:rules="staticConnectionProperties.rules.name"
            label="Name"
            required
          />
          <v-select
            v-model="connectionData.version"
            v-bind:items="versions"
            v-bind:outlined="outline"
            label="Version"
            style="max-width: 12ch"
          />
        </div>
        <div row>
          <v-select
            v-model="connectionData.protocol"
            v-bind:items="protocols"
            v-bind:outlined="outline"
            v-bind:rules="staticConnectionProperties.rules.protocol"
            label="Protocol"
            style="max-width: 15ch"
            required
          />
          <v-text-field
            v-model="connectionData.host"
            v-bind:outlined="outline"
            v-bind:rules="staticConnectionProperties.rules.host"
            label="Host"
            required
          />
          <v-text-field
            v-model="connectionData.port"
            v-bind:outlined="outline"
            v-bind:rules="staticConnectionProperties.rules.port"
            label="Port"
            style="max-width: 12ch"
            required
          />
        </div>
        <div row>
          <v-text-field
            v-model="connectionData.username"
            v-bind:outlined="outline"
            label="Username"
          />
          <v-text-field
            v-model="connectionData.password"
            v-bind:append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            v-bind:outlined="outline"
            v-bind:type="showPassword ? 'text' : 'password'"
            v-on:click:append="showPassword = !showPassword"
            label="Password"
          />
        </div>

        <v-expansion-panels style="border: 1px solid grey" class="mt-6" flat>
          <v-expansion-panel>
            <v-expansion-panel-header>
              <div>
                <v-icon small>mdi-tune-variant</v-icon>
                <span class="ms-4">Advanced connection settings</span>
              </div>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <div row>
                <v-switch
                  v-model="connectionData.validateCertificate"
                  label="Validate Certificate"
                  inset
                />
                <v-spacer />
                <div
                  v-on:click="selectFile('caCert')"
                  v-bind:title="connectionData.caCert"
                  class="d-flex align-center cert-selector"
                >
                  <v-text-field
                    v-model="connectionData.caCert"
                    label="CA cert file"
                    class="cert-selector"
                    readonly
                  />
                  <v-btn v-on:click.stop="deselectFile('caCert')" icon>
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </div>
              </div>
              <div row>
                <div
                  v-on:click="selectFile('clientCert')"
                  v-bind:title="connectionData.clientCert"
                  class="d-flex align-center cert-selector"
                >
                  <v-text-field
                    v-model="connectionData.clientCert"
                    label="Client cert file"
                    class="cert-selector"
                    readonly
                  />
                  <v-btn v-on:click.stop="deselectFile('clientCert')" icon>
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </div>
                <div
                  v-on:click="selectFile('clientKey')"
                  v-bind:title="connectionData.clientKey"
                  class="d-flex align-center cert-selector"
                >
                  <v-text-field
                    v-model="connectionData.clientKey"
                    label="Client key file"
                    class="cert-selector"
                    readonly
                  />
                  <v-btn v-on:click.stop="deselectFile('clientKey')" icon>
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </div>
              </div>
              <v-divider class="mb-2" />
              <div row>
                <v-text-field
                  v-bind:value="clientId"
                  v-bind:outlined="outline"
                  label="Current client ID"
                  style="max-width: 35%"
                  readonly
                  disabled
                />
                <v-text-field
                  v-model="connectionData.clientId"
                  v-bind:outlined="outline"
                  label="Override client ID"
                  clearable
                />
              </div>
              <v-divider class="mb-2" />
              <div row>
                <v-combobox
                  v-model="connectionData.topics"
                  v-bind:outlined="outline"
                  append-icon=""
                  label="Subscriptions"
                  multiple
                >
                  <template v-slot:selection="{ item, index }">
                    <v-chip
                      v-on:click:close="connectionData.topics.splice(index, 1)"
                      class="my-3"
                      close
                    >
                      <span class="me-2 font-weight-bold">{{ item }}</span>
                    </v-chip>
                  </template>
                </v-combobox>
              </div>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </v-card-text>

    <v-card-actions>
      <v-btn v-on:click="deleteConnection" color="error" text>Delete</v-btn>
      <v-btn
        v-bind:disabled="!validConnectionData"
        v-on:click="saveChanges"
        text
      >
        Save
      </v-btn>
      <v-spacer />
      <v-btn
        v-bind:disabled="!validConnectionData"
        v-on:click="connectToMqtt"
        class="ms-2"
        color="primary"
      >
        Connect
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

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

<script>
import ConnectionProperties from "../models/ConnectionProperties";

export default {
  name: "ConnectionForm",

  props: {
    properties: { type: Object, required: true },
  },

  data: () => ({
    connectionData: new ConnectionProperties(),
    protocols: ["mqtt", "mqtts", "ws", "wss"],
    versions: [
      { text: "3.1", value: 3 },
      { text: "3.1.1", value: 4 },
      { text: "5.0", value: 5 },
    ],
    showPassword: false,
    staticConnectionProperties: ConnectionProperties,
  }),

  beforeMount() {
    this.connectionData.init(this.properties);
  },

  computed: {
    validConnectionData() {
      return ConnectionProperties.validate(this.connectionData);
    },
  },

  methods: {
    deleteConnection() {
      this.$emit("delete");
    },
    saveChanges() {
      this.emitConnectionData("updated");
    },
    connectToMqtt() {
      this.emitConnectionData("connect");
    },
    emitConnectionData(event) {
      const clone = new ConnectionProperties();
      this.connectionData.name = !this.connectionData.name.trim()
        ? clone.name
        : this.connectionData.name;

      clone.init(this.connectionData);
      this.$emit(event, clone);
    },
    selectFile(destination) {
      const fakeInput = document.createElement("input");

      fakeInput.type = "file";
      fakeInput.multiple = false;
      fakeInput.onchange = () => {
        this.connectionData[destination] = fakeInput.files[0].name;
        this.connectionData[`${destination}Path`] = fakeInput.files[0].path;
      };

      fakeInput.click();
    },
    deselectFile(destination) {
      this.connectionData[destination] = undefined;
      this.connectionData[`${destination}Path`] = undefined;
    },
  },
};
</script>
