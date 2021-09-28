<template>
  <v-form>
    <div class="input-container">
      <v-text-field
        v-model="connectionData.name"
        v-bind:rules="staticConnectionProperties.rules.name"
        label="Name"
        required
      />
      <div row>
        <v-select
          v-model="connectionData.protocol"
          v-bind:rules="staticConnectionProperties.rules.protocol"
          v-bind:items="protocols"
          label="Protocol"
          required
        />
        <v-select
          v-model="connectionData.version"
          v-bind:items="versions"
          label="Version"
        />
      </div>
      <div row>
        <v-text-field
          v-model="connectionData.host"
          v-bind:rules="staticConnectionProperties.rules.host"
          label="Host"
          required
        />
        <v-text-field
          v-model="connectionData.port"
          v-bind:rules="staticConnectionProperties.rules.port"
          label="Port"
          required
        />
      </div>
      <div row>
        <v-text-field v-model="connectionData.username" label="Username" />
        <v-text-field
          v-model="connectionData.password"
          v-bind:append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
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
            text
            small
          >
            <v-icon>mdi-cog</v-icon>
          </v-btn>
        </template>
        <span>Connection settings</span>
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
          <v-toolbar-title>Connection settings</v-toolbar-title>
        </v-toolbar>

        <v-card-text class="dialog-text-container">
          <div row>
            <v-switch
              v-model="connectionData.validateCertificate"
              label="Validate Certificate"
              inset
            />
          </div>
          <v-combobox
            v-model="connectionData.topics"
            label="Subscriptions"
            chips
            deletable-chips
            multiple
          />
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
  max-height: 35ch;
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
    versions: [4, 5],
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
      this.$emitConnectionData("updated");
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
  },
};
</script>
