<template>
  <v-form>
    <div class="input-container">
      <v-text-field
        v-model="connectionData.name"
        v-bind:rules="staticConnectionProperties.rules.host.name"
        label="Name"
        required
      ></v-text-field>
      <div row>
        <v-text-field
          v-model="connectionData.host"
          v-bind:rules="staticConnectionProperties.rules.host"
          label="Host"
          required
        ></v-text-field>
        <v-text-field
          v-model="connectionData.port"
          v-bind:rules="staticConnectionProperties.rules.host.port"
          label="Port"
          required
        ></v-text-field>
      </div>
      <div row>
        <v-text-field
          v-model="connectionData.username"
          label="Username"
          required
        ></v-text-field>
        <v-text-field
          v-model="connectionData.password"
          type="password"
          label="Password"
          required
        ></v-text-field>
      </div>
    </div>
    <div row>
      <v-btn v-on:click="deleteConnection" color="error">Delete</v-btn>
      <v-btn v-on:click="saveChanges">Save</v-btn>
      <v-btn
        v-bind:disabled="!validConnectionData"
        v-on:click="connectToMqtt"
        color="primary"
      >
        Connect
      </v-btn>
    </div>
  </v-form>
</template>

<style scoped>
.input-container {
  display: flex;
  flex-direction: column;
}

div[row] {
  display: flex;
  flex-direction: row;
  gap: 1.5em;
}
</style>

<script>
import ConnectionProperties from "../models/ConnectionProperties";

export default {
  name: "ConnectionForm",

  props: {
    properties: { type: ConnectionProperties, required: true },
  },

  data: () => ({
    connectionData: new ConnectionProperties(),
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
      this.$emit("updated", this.connectionData);
    },
    connectToMqtt() {
      this.$emit("connect");
    },
  },
};
</script>
