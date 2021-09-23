<template>
  <v-container class="connection-container">
    <v-card>
      <v-toolbar text color="primary" dark>
        <v-toolbar-title>MQTT Connection</v-toolbar-title>
      </v-toolbar>
      <v-card-text>
        <v-form>
          <div class="input-container">
            <v-text-field v-model="name" label="Name" required></v-text-field>
            <div row>
              <v-text-field v-model="host" label="Host" required></v-text-field>
              <v-text-field v-model="port" label="Port" required></v-text-field>
            </div>
            <div row>
              <v-text-field
                v-model="username"
                label="Username"
                required
              ></v-text-field>
              <v-text-field
                v-model="password"
                label="Password"
                required
              ></v-text-field>
            </div>
          </div>
          <v-btn text v-on:click="connectToMqtt">Connect</v-btn>
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
    name: undefined,
    host: undefined,
    port: undefined,
    username: undefined,
    password: undefined,
  }),

  methods: {
    connectToMqtt() {
      let connection = {
        name: this.name,
        host: this.host,
        port: this.port,
        username: this.username,
        password: this.password,
      };
      this.$store.commit("addNewConnection", connection);
      this.$router.push({ name: "Viewer" });
    },
  },
};
</script>
