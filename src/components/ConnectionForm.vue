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
        <v-text-field
          v-model="connectionData.username"
          label="Username"
          required
        />
        <v-text-field
          v-model="connectionData.password"
          type="password"
          label="Password"
          required
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
      <v-btn
        v-bind:disabled="!validConnectionData"
        v-on:click="connectToMqtt"
        class="ms-2"
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

div[foot] {
  display: grid;
  grid-template-columns: min-content min-content 1fr min-content;
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
