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
          label="Password"
          type="password"
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

    <v-dialog v-model="settingsDialog" persistent>
      <v-card>
        <v-toolbar flat text>
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                v-bind="attrs"
                v-on="on"
                v-on:click="settingsDialog = false"
                icon
              >
                <v-icon>mdi-arrow-left</v-icon>
              </v-btn>
            </template>
            <span>Back</span>
          </v-tooltip>
          <v-toolbar-title>Connection settings</v-toolbar-title>
        </v-toolbar>
        <v-card-text>
          <div row>
            <v-switch
              v-model="connectionData.validateCertificate"
              class="ma-0"
              label="Validate Certificate"
              inset
            />
          </div>
        </v-card-text>
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
    staticConnectionProperties: ConnectionProperties,
  }),

  beforeMount() {
    this.connectionData.init(this.properties);
    this.connectionData.topics = ["#", "$SYS/#"];
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
      const clone = new ConnectionProperties();
      this.connectionData.name = !this.connectionData.name.trim()
        ? clone.name
        : this.connectionData.name;

      clone.init(this.connectionData);
      this.$emit("updated", clone);
    },
    connectToMqtt() {
      this.$emit("connect");
    },
  },
};
</script>
