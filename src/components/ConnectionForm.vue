<template>
  <v-form>
    <div class="input-container">
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
    </div>
    <div class="mt-4" foot>
      <v-btn v-on:click="deleteConnection" color="error" text>Delete</v-btn>
      <v-btn
        v-bind:disabled="!validConnectionData"
        v-on:click="saveChanges"
        text
      >
        Save
      </v-btn>
      <div />
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            v-bind="attrs"
            v-on:click="settingsDialog = true"
            v-on="on"
            fab
            icon
            small
          >
            <v-icon>mdi-tune-variant</v-icon>
          </v-btn>
        </template>
        <span>Advanced settings</span>
      </v-tooltip>
      <v-btn
        v-bind:disabled="!validConnectionData"
        v-on:click="connectToMqtt"
        class="ms-2"
        color="primary"
      >
        Connect
      </v-btn>
    </div>

    <v-dialog v-model="settingsDialog" max-width="75ch" persistent scrollable>
      <v-card>
        <v-toolbar color="primary" dark flat text>
          <v-toolbar-title>Advanced connection settings</v-toolbar-title>
        </v-toolbar>

        <v-card-text class="dialog-text-container pt-4">
          <div row>
            <v-switch
              v-model="connectionData.validateCertificate"
              label="Validate Certificate"
              inset
            />
          </div>
          <div row>
            <div v-on:click="selectFile('caCert')" class="d-flex align-center">
              <v-text-field
                v-model="connectionData.caCert"
                label="CA cert file"
                disabled
              />
              <v-btn v-on:click.stop="deselectFile('caCert')" icon>
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </div>
            <div
              v-on:click="selectFile('clientCert')"
              class="d-flex align-center"
            >
              <v-text-field
                v-model="connectionData.clientCert"
                label="Client cert file"
                disabled
              />
              <v-btn v-on:click.stop="deselectFile('clientCert')" icon>
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </div>
            <div
              v-on:click="selectFile('clientKey')"
              class="d-flex align-center"
            >
              <v-text-field
                v-model="connectionData.clientKey"
                label="Client key file"
                disabled
              />
              <v-btn v-on:click.stop="deselectFile('clientKey')" icon>
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </div>
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
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn v-on:click="settingsDialog = false" text> Done </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-form>
</template>

<style scoped>
.input-container {
  display: flex;
  flex-direction: column;
}

.small-input {
  max-width: 10ch;
}

.dialog-width {
  width: 10ch !important;
}

.dialog-text-container {
  max-height: 40ch;
}

div[row] {
  display: flex;
  flex-direction: row;
  gap: 1.5em;
}

div[foot] {
  display: grid;
  grid-template-columns: min-content min-content 1fr min-content min-content;
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
    settingsDialog: false,
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
