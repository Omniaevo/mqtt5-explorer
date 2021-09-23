<template>
  <v-container class="connection-container">
    <v-card>
      <v-toolbar text color="primary" dark>
        <v-toolbar-title>MQTT Connection</v-toolbar-title>
      </v-toolbar>
      <v-card-text>
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
          <v-btn
            v-bind:disabled="!validConnectionData"
            v-on:click="connectToMqtt"
            >Connect</v-btn
          >
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped>
.connection-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.input-container {
  display: flex;
  flex-direction: column;
}

div[row] {
  display: flex;
  flex-direction: row;
  gap: 2em;
}
</style>

<script>
export default {
  name: "Home",

  data: () => ({
    connectionData: {
      name: "new-connection",
      host: undefined,
      port: "1883",
      username: undefined,
      password: undefined,
    },
  }),

  beforeMount() {
    let storedConnectionData = this.$store.getters.getConnectionByIndex(0);
    if (storedConnectionData) this.connectionData = storedConnectionData;
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
    connectToMqtt() {
      this.$store.commit("addNewConnection", this.connectionData);
      this.$router.push({ name: "Viewer" });
    },
  },
};
</script>
