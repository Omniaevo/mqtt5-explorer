<template>
  <div>
    <v-app-bar v-bind:color="darkTheme ? 'gray' : 'white'" app flat>
      <div class="d-flex align-center">
        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              v-on:click="disconnectFromMqtt()"
              v-on="on"
              icon
            >
              <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
          </template>
          <span>Disconnect</span>
        </v-tooltip>

        <div class="ms-4">
          <div class="title">Connected to: {{ connectionProperties.name }}</div>
          <div class="caption grey--text small-line">{{ $connection.url }}</div>
        </div>
      </div>
    </v-app-bar>

    <div class="mx-4 my-2 explorer-grid-container">
      <v-card class="treeview-container" flat>
        <v-treeview
          v-bind:items="treeData"
          dense
          hoverable
          open-on-click
          rounded
        >
          <template slot="label" slot-scope="{ item, leaf }" class="ma-0">
            <div
              v-bind:class="{
                primary: item.blink,
                'white--text': item.blink,
                'px-2': true,
                rounded: true,
              }"
              v-on:click="getProperties(item)"
            >
              {{ item.name }}
              {{ item.value !== undefined ? "=" : "" }}
              <span class="font-weight-black">
                {{ item.value !== undefined ? item.value.payload : "" }}
              </span>
              <span v-if="leaf" class="caption grey--text ms-4">
                ({{ item.size }} elements inside)
              </span>
            </div>
          </template>
        </v-treeview>
      </v-card>

      <v-card class="properties-container">
        <v-card-title>
          Topic: 
          <v-card-subtitle>
            {{ itemSelected ? itemSelected.value.topic : "" }}
          </v-card-subtitle>
        </v-card-title>
      </v-card>
    </div>
  </div>
</template>
<style scoped>
.explorer-grid-container {
  display: grid;
  grid-template-areas: "treeview explorer";
  grid-auto-columns: 1fr 2fr;
  gap: 1em;
}

.treeview-container {
  grid-area: "treeview";
}

.properties-container {
  grid-area: "properties";
}

.small-line {
  line-height: 0.5rem;
}
</style>

<script>
import ConnectionProperties from "../models/ConnectionProperties";

export default {
  name: "MqttViewer",

  data: () => ({
    treeData: [],
    connectionProperties: new ConnectionProperties(),
    itemSelected: undefined,
  }),

  beforeMount() {
    this.connectionProperties.init(
      this.$store.getters.getConnectionByIndex(this.$route.params.index)
    );
    this.$connection.init(
      this.connectionProperties,
      this.add,
      this.merge,
      () => this.treeData.length
    );
  },

  mounted() {
    this.$connection.connect((err) => this.disconnectFromMqtt(err.toString()));
  },

  methods: {
    disconnectFromMqtt(msg = undefined) {
      this.$connection.disconnect(() => {
        this.$router.replace({ name: "Home" });

        if (msg !== undefined) this.$bus.$emit("error", msg);
      });
    },
    getProperties(item) {
      console.log(item);
      item.value ? (this.itemSelected = item) : (this.itemSelected = undefined);
    },
    add(node) {
      this.treeData.push(node);
    },
    merge(index, node) {
      if (this.treeData[index].merge(node)) {
        this.treeData.splice(index, 1);
      }
    },
  },
};
</script>
