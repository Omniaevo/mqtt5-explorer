<template>
  <v-form>
    <div class="input-container">
      <v-text-field
        v-model="connectionData.name"
        label="Name"
        required
      ></v-text-field>
      <div row>
        <v-text-field
          v-model="connectionData.host"
          v-bind:rules="[(v) => !!v || 'Host required']"
          label="Host"
          required
        ></v-text-field>
        <v-text-field
          v-model="connectionData.port"
          label="Port"
          required
        ></v-text-field>
      </div>
      <div row>
        <v-text-field
          v-model="connectionData.username"
          v-bind:rules="[(v) => !!v || 'Username required']"
          label="Username"
          required
        ></v-text-field>
        <v-text-field
          v-model="connectionData.password"
          v-bind:rules="[(v) => !!v || 'Password required']"
          type="password"
          label="Password"
          required
        ></v-text-field>
      </div>
    </div>
    <div row>
      <v-btn v-on:click="deleteConnection">Delete</v-btn>
      <v-btn v-on:click="saveChanges" color="pink" dark>Save</v-btn>
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
export default {
  name: "ConnectionForm",

  props: {
    data: { type: Object, required: true },
  },

  data: () => ({
    connectionData: undefined,
  }),

  beforeMount() {
    // Clone the data received
    this.connectionData = { ...this.data };
  },

  computed: {
    validConnectionData() {
      return (
        !!this.connectionData.username &&
        !!this.connectionData.password &&
        !!this.connectionData.host
      );
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
